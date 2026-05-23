import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository, Like, ILike } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { NewsletterSubscriber } from "./entities/newsletter-subscriber.entity";
import {
  NewsletterCampaign,
  NewsletterStatus,
} from "./entities/newsletter-campaign.entity";
import {
  SubscribeDto,
  UnsubscribeDto,
  UpdateSubscriberDto,
  SubscriberQueryDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
  AdminCreateSubscriberDto,
} from "./dto/newsletter.dto";
import { EmailService } from "../email/email.service";
import { sanitizeHtml, sanitizeString } from "../../common/utils/sanitize";
import { AdminWebSocketGateway } from "../websocket/websocket.gateway";

@Injectable()
export class NewsletterService {
  private readonly frontendUrl: string;
  private readonly logoUrl: string;

  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepository: Repository<NewsletterSubscriber>,
    @InjectRepository(NewsletterCampaign)
    private readonly campaignRepository: Repository<NewsletterCampaign>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly wsGateway: AdminWebSocketGateway,
  ) {
    this.frontendUrl = this.configService.get<string>("FRONTEND_URL")!;
    this.logoUrl = this.configService.get<string>("LOGO_URL") ||
      `${this.frontendUrl}/new_nanthus_kitchen_logo.png`;
  }

  // ==================== Subscriber Methods ====================

  async subscribe(subscribeDto: SubscribeDto): Promise<NewsletterSubscriber> {
    const existingSubscriber = await this.subscriberRepository.findOne({
      where: { email: subscribeDto.email.toLowerCase() },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        throw new ConflictException("Email is already subscribed");
      }
      // Reactivate subscription
      existingSubscriber.isActive = true;
      existingSubscriber.unsubscribedAt = null;
      existingSubscriber.isVerified = true;
      existingSubscriber.verifiedAt = new Date();

      const savedSubscriber =
        await this.subscriberRepository.save(existingSubscriber);

      // Send welcome/confirmation email
      await this.sendConfirmationEmail(savedSubscriber);
      this.wsGateway.emitNewsletterUpdate("subscriber", "created", savedSubscriber as unknown as Record<string, unknown>);
      return savedSubscriber;
    }

    const subscriber = this.subscriberRepository.create({
      ...subscribeDto,
      email: subscribeDto.email.toLowerCase(),
      isVerified: true, // Auto-verify - no double opt-in required
      verifiedAt: new Date(),
      unsubscribeToken: uuidv4(),
    });

    const savedSubscriber = await this.subscriberRepository.save(subscriber);

    // Send confirmation email with unsubscribe link
    await this.sendConfirmationEmail(savedSubscriber);
    this.wsGateway.emitNewsletterUpdate("subscriber", "created", savedSubscriber as unknown as Record<string, unknown>);
    return savedSubscriber;
  }

  async verifySubscription(token: string): Promise<NewsletterSubscriber> {
    // Keep for backwards compatibility but subscription is auto-verified now
    const subscriber = await this.subscriberRepository.findOne({
      where: { verificationToken: token },
    });

    if (!subscriber) {
      throw new NotFoundException("Invalid verification token");
    }

    subscriber.isVerified = true;
    subscriber.verifiedAt = new Date();
    subscriber.verificationToken = null;

    return this.subscriberRepository.save(subscriber);
  }

  // Admin creates a subscriber (sends confirmation email)
  async adminCreateSubscriber(
    createDto: AdminCreateSubscriberDto,
  ): Promise<NewsletterSubscriber> {
    const existingSubscriber = await this.subscriberRepository.findOne({
      where: { email: createDto.email.toLowerCase() },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        throw new ConflictException("Email is already subscribed");
      }
      // Reactivate subscription
      existingSubscriber.isActive = true;
      existingSubscriber.isVerified = true;
      existingSubscriber.unsubscribedAt = null;
      existingSubscriber.verifiedAt = new Date();

      const savedSubscriber =
        await this.subscriberRepository.save(existingSubscriber);

      // Send confirmation email
      await this.sendConfirmationEmail(savedSubscriber);

      return savedSubscriber;
    }

    const subscriber = this.subscriberRepository.create({
      email: createDto.email.toLowerCase(),
      isVerified: true,
      verifiedAt: new Date(),
      unsubscribeToken: uuidv4(),
    });

    const savedSubscriber = await this.subscriberRepository.save(subscriber);

    // Send confirmation email
    await this.sendConfirmationEmail(savedSubscriber);

    return savedSubscriber;
  }

  async unsubscribe(unsubscribeDto: UnsubscribeDto): Promise<void> {
    const whereClause: { email: string; unsubscribeToken?: string } = {
      email: unsubscribeDto.email.toLowerCase(),
    };

    if (unsubscribeDto.token) {
      whereClause.unsubscribeToken = unsubscribeDto.token;
    }

    const subscriber = await this.subscriberRepository.findOne({
      where: whereClause,
    });

    if (!subscriber) {
      throw new NotFoundException("Subscriber not found");
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();

    const saved = await this.subscriberRepository.save(subscriber);
    this.wsGateway.emitNewsletterUpdate("subscriber", "updated", saved as unknown as Record<string, unknown>);
  }

  async findAllSubscribers(query: SubscriberQueryDto): Promise<{
    data: NewsletterSubscriber[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.subscriberRepository
      .createQueryBuilder("subscriber")
      .orderBy("subscriber.createdAt", "DESC");

    if (query.isActive !== undefined) {
      queryBuilder.andWhere("subscriber.isActive = :isActive", {
        isActive: query.isActive,
      });
    }

    if (query.isVerified !== undefined) {
      queryBuilder.andWhere("subscriber.isVerified = :isVerified", {
        isVerified: query.isVerified,
      });
    }

    if (query.preferredLocation) {
      queryBuilder.andWhere(
        "(subscriber.preferredLocation = :location OR subscriber.preferredLocation = :both)",
        { location: query.preferredLocation, both: "both" },
      );
    }

    if (query.search) {
      queryBuilder.andWhere(
        "(subscriber.email ILIKE :search OR subscriber.firstName ILIKE :search OR subscriber.lastName ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findSubscriberById(id: string): Promise<NewsletterSubscriber> {
    const subscriber = await this.subscriberRepository.findOne({
      where: { id },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }

    return subscriber;
  }

  async updateSubscriber(
    id: string,
    updateDto: UpdateSubscriberDto,
  ): Promise<NewsletterSubscriber> {
    const subscriber = await this.findSubscriberById(id);
    Object.assign(subscriber, updateDto);
    return this.subscriberRepository.save(subscriber);
  }

  async deleteSubscriber(id: string): Promise<void> {
    const subscriber = await this.findSubscriberById(id);
    await this.subscriberRepository.remove(subscriber);
  }

  async getSubscriberStatistics(): Promise<{
    total: number;
    active: number;
    verified: number;
    byLocation: { location: string; count: number }[];
  }> {
    const total = await this.subscriberRepository.count();
    const active = await this.subscriberRepository.count({
      where: { isActive: true },
    });
    const verified = await this.subscriberRepository.count({
      where: { isVerified: true },
    });

    const byLocation = await this.subscriberRepository
      .createQueryBuilder("subscriber")
      .select("subscriber.preferredLocation", "location")
      .addSelect("COUNT(*)", "count")
      .where("subscriber.isActive = :isActive", { isActive: true })
      .groupBy("subscriber.preferredLocation")
      .getRawMany();

    return { total, active, verified, byLocation };
  }

  private async sendConfirmationEmail(
    subscriber: NewsletterSubscriber,
  ): Promise<void> {
    const unsubscribeUrl = `${this.frontendUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}`;
    const logoUrl = this.logoUrl;

    await this.emailService.sendMail({
      to: subscriber.email,
      subject: "Welcome to Nanthu's Kitchen Newsletter!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${logoUrl}" alt="Nanthu's Kitchen" style="max-height: 80px; width: auto;" />
          </div>
          
          <h2 style="color: #F7921E; text-align: center;">Welcome to Our Newsletter!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for subscribing to the Nanthu's Kitchen newsletter!
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            You'll be the first to hear about our latest specials, new menu items, 
            upcoming events, and exclusive offers.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We're excited to share our culinary journey with you!
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Warm regards,<br/>
            <strong style="color: #F7921E;">The Nanthu's Kitchen Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            If you didn't subscribe or wish to unsubscribe, 
            <a href="${unsubscribeUrl}" style="color: #F7921E;">click here</a>.
          </p>
        </div>
      `,
    });
  }

  // ==================== Campaign Methods ====================

  async createCampaign(
    createDto: CreateCampaignDto,
    userId: string,
  ): Promise<NewsletterCampaign> {
    // Sanitize HTML content to prevent XSS
    const sanitizedContent = sanitizeHtml(createDto.content);
    const sanitizedSubject = sanitizeString(createDto.subject);

    const campaign = this.campaignRepository.create({
      ...createDto,
      subject: sanitizedSubject,
      content: sanitizedContent,
      createdById: userId,
      scheduledAt: createDto.scheduledAt
        ? new Date(createDto.scheduledAt)
        : null,
      status: createDto.scheduledAt
        ? NewsletterStatus.SCHEDULED
        : NewsletterStatus.DRAFT,
    });

    const saved = await this.campaignRepository.save(campaign);
    this.wsGateway.emitNewsletterUpdate("campaign", "created", saved as unknown as Record<string, unknown>);
    return saved;
  }

  async findAllCampaigns(query: CampaignQueryDto): Promise<{
    data: NewsletterCampaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.campaignRepository
      .createQueryBuilder("campaign")
      .leftJoinAndSelect("campaign.createdBy", "createdBy")
      .orderBy("campaign.createdAt", "DESC");

    if (query.status) {
      queryBuilder.andWhere("campaign.status = :status", {
        status: query.status,
      });
    }

    if (query.targetLocation) {
      queryBuilder.andWhere(
        "(campaign.targetLocation = :location OR campaign.targetLocation = :both)",
        { location: query.targetLocation, both: "both" },
      );
    }

    if (query.search) {
      queryBuilder.andWhere("campaign.subject ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findCampaignById(id: string): Promise<NewsletterCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ["createdBy"],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async updateCampaign(
    id: string,
    updateDto: UpdateCampaignDto,
  ): Promise<NewsletterCampaign> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status === NewsletterStatus.SENT) {
      throw new BadRequestException("Cannot update a sent campaign");
    }

    // Sanitize content if being updated
    const sanitizedData = {
      ...updateDto,
      ...(updateDto.content && { content: sanitizeHtml(updateDto.content) }),
      ...(updateDto.subject && { subject: sanitizeString(updateDto.subject) }),
      scheduledAt: updateDto.scheduledAt
        ? new Date(updateDto.scheduledAt)
        : campaign.scheduledAt,
    };

    Object.assign(campaign, sanitizedData);

    const saved = await this.campaignRepository.save(campaign);
    this.wsGateway.emitNewsletterUpdate("campaign", "updated", saved as unknown as Record<string, unknown>);
    return saved;
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status === NewsletterStatus.SENT) {
      throw new BadRequestException(
        "Cannot delete a campaign that has already been sent to subscribers. " +
          "Sent campaigns are preserved for record-keeping purposes.",
      );
    }

    if (campaign.status === NewsletterStatus.SENDING) {
      throw new BadRequestException(
        "Cannot delete a campaign that is currently being sent. " +
          "Please wait for the sending process to complete or contact support if it's stuck.",
      );
    }

    await this.campaignRepository.remove(campaign);
    this.wsGateway.emitNewsletterUpdate("campaign", "deleted", { id });
  }

  async sendTestEmail(campaignId: string, testEmail: string): Promise<void> {
    const campaign = await this.findCampaignById(campaignId);

    await this.emailService.sendMail({
      to: testEmail,
      subject: `[TEST] ${campaign.subject}`,
      html: campaign.content,
    });
  }

  async sendCampaign(id: string): Promise<NewsletterCampaign> {
    const campaign = await this.findCampaignById(id);

    if (campaign.status === NewsletterStatus.SENT) {
      throw new BadRequestException("Campaign has already been sent");
    }

    if (campaign.status === NewsletterStatus.SENDING) {
      throw new BadRequestException("Campaign is currently being sent");
    }

    // Allow resending failed campaigns by resetting counters
    const isResend = campaign.status === NewsletterStatus.FAILED;
    if (isResend) {
      campaign.successfulSends = 0;
      campaign.failedSends = 0;
      campaign.sentAt = null;
    }

    // Get active subscribers based on target location
    const subscriberQuery = this.subscriberRepository
      .createQueryBuilder("subscriber")
      .where("subscriber.isActive = :isActive", { isActive: true });

    if (campaign.targetLocation !== "both") {
      subscriberQuery.andWhere(
        "(subscriber.preferredLocation = :location OR subscriber.preferredLocation = :both)",
        { location: campaign.targetLocation, both: "both" },
      );
    }

    const subscribers = await subscriberQuery.getMany();

    campaign.status = NewsletterStatus.SENDING;
    campaign.totalRecipients = subscribers.length;
    await this.campaignRepository.save(campaign);

    // Send emails (in production, this should be done via a queue)
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const emailSent = await this.emailService.sendMail({
        to: subscriber.email,
        subject: campaign.subject,
        html: this.addUnsubscribeLink(campaign.content, subscriber),
      });

      if (emailSent) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Set status based on send results
    if (successCount > 0) {
      campaign.status = NewsletterStatus.SENT;
      campaign.sentAt = new Date();
    } else {
      campaign.status = NewsletterStatus.FAILED;
    }

    campaign.successfulSends = successCount;
    campaign.failedSends = failCount;

    const result = await this.campaignRepository.save(campaign);
    this.wsGateway.emitNewsletterUpdate("campaign", "sent", result as unknown as Record<string, unknown>);
    return result;
  }

  private addUnsubscribeLink(
    content: string,
    subscriber: NewsletterSubscriber,
  ): string {
    const unsubscribeUrl = `${this.frontendUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}`;
    const logoUrl = this.logoUrl;

    // Add logo header and replace placeholder
    const contentWithLogo = content.replace("{{LOGO_URL}}", logoUrl);

    // If content doesn't have logo placeholder, add it at the start
    const finalContent = content.includes("{{LOGO_URL}}")
      ? contentWithLogo
      : `<div style="text-align: center; padding: 20px 0;"><img src="${logoUrl}" alt="Nanthu's Kitchen" style="max-height: 80px; width: auto;" /></div>${contentWithLogo}`;

    return `${finalContent}
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="font-size: 12px; color: #666; text-align: center;">
        You're receiving this email because you subscribed to our newsletter.<br/>
        <a href="${unsubscribeUrl}" style="color: #F7921E;">Unsubscribe</a>
      </p>
    `;
  }

  async getCampaignStatistics(): Promise<{
    total: number;
    draft: number;
    scheduled: number;
    sent: number;
    totalRecipients: number;
    avgOpenRate: number;
  }> {
    const total = await this.campaignRepository.count();
    const draft = await this.campaignRepository.count({
      where: { status: NewsletterStatus.DRAFT },
    });
    const scheduled = await this.campaignRepository.count({
      where: { status: NewsletterStatus.SCHEDULED },
    });
    const sent = await this.campaignRepository.count({
      where: { status: NewsletterStatus.SENT },
    });

    const sentCampaigns = await this.campaignRepository.find({
      where: { status: NewsletterStatus.SENT },
    });

    const totalRecipients = sentCampaigns.reduce(
      (sum, c) => sum + c.totalRecipients,
      0,
    );

    const totalOpens = sentCampaigns.reduce((sum, c) => sum + c.openCount, 0);

    const avgOpenRate =
      totalRecipients > 0
        ? Math.round((totalOpens / totalRecipients) * 100)
        : 0;

    return {
      total,
      draft,
      scheduled,
      sent,
      totalRecipients,
      avgOpenRate,
    };
  }
}
