import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../email/email.service";
import { CreateContactDto } from "./dto/create-contact.dto";

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async submitEnquiry(dto: CreateContactDto): Promise<{ success: boolean }> {
    const adminEmail = this.configService.get<string>(
      "CONTACT_ADMIN_EMAIL",
      this.configService.get<string>("SMTP_USER", "info@nanthuskitchen.com"),
    );

    const html = `
      <h2 style="color: #F5A623;">New Website Enquiry</h2>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px 0; color:#666; width:100px;"><strong>Name</strong></td><td style="padding:8px 0;">${this.escape(dto.name)}</td></tr>
        <tr><td style="padding:8px 0; color:#666;"><strong>Email</strong></td><td style="padding:8px 0;"><a href="mailto:${this.escape(dto.email)}">${this.escape(dto.email)}</a></td></tr>
        ${dto.phone ? `<tr><td style="padding:8px 0; color:#666;"><strong>Phone</strong></td><td style="padding:8px 0;">${this.escape(dto.phone)}</td></tr>` : ""}
        <tr><td style="padding:8px 0; color:#666;"><strong>Subject</strong></td><td style="padding:8px 0;">${this.escape(dto.subject)}</td></tr>
      </table>
      <div style="margin-top:20px; padding:16px; background:#f9f9f9; border-left:4px solid #F5A623; border-radius:4px;">
        <p style="margin:0; white-space:pre-wrap;">${this.escape(dto.message)}</p>
      </div>
    `;

    const sent = await this.emailService.sendEmail(
      adminEmail,
      `Website Enquiry: ${dto.subject}`,
      html,
    );

    if (sent) {
      // Send auto-reply to the visitor
      const replyHtml = `
        <h2 style="color: #F5A623;">Thank you for reaching out!</h2>
        <p>Hi ${this.escape(dto.name)},</p>
        <p>We've received your message and will get back to you as soon as possible, typically within 24 hours.</p>
        <p style="color:#666; font-size:14px;">Your message: <em>${this.escape(dto.subject)}</em></p>
      `;
      await this.emailService.sendEmail(dto.email, "We received your message — New Nanthus Kitchen", replyHtml);
    }

    return { success: sent };
  }

  private escape(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
