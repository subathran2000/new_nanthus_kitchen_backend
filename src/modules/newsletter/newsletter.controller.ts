import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { NewsletterService } from "./newsletter.service";
import {
  SubscribeDto,
  UnsubscribeDto,
  UpdateSubscriberDto,
  SubscriberQueryDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
  SendTestEmailDto,
  AdminCreateSubscriberDto,
} from "./dto/newsletter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../common/enums";
import { User } from "../users/entities/user.entity";

@ApiTags("Newsletter")
@Controller("newsletter")
@UseGuards(JwtAuthGuard)
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ==================== Public Subscriber Endpoints ====================

  @Post("subscribe")
  @Public()
  @ApiOperation({ summary: "Subscribe to newsletter" })
  @ApiResponse({ status: 201, description: "Successfully subscribed" })
  @ApiResponse({ status: 409, description: "Email already subscribed" })
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Get("verify/:token")
  @Public()
  @ApiOperation({ summary: "Verify subscription" })
  @ApiResponse({ status: 200, description: "Subscription verified" })
  @ApiResponse({ status: 404, description: "Invalid verification token" })
  verifySubscription(@Param("token") token: string) {
    return this.newsletterService.verifySubscription(token);
  }

  @Post("unsubscribe")
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Unsubscribe from newsletter" })
  @ApiResponse({ status: 204, description: "Successfully unsubscribed" })
  @ApiResponse({ status: 404, description: "Subscriber not found" })
  unsubscribe(@Body() unsubscribeDto: UnsubscribeDto) {
    return this.newsletterService.unsubscribe(unsubscribeDto);
  }

  // ==================== Admin Subscriber Endpoints ====================

  @Post("subscribers")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin creates a subscriber (pre-verified)" })
  @ApiResponse({ status: 201, description: "Subscriber created" })
  @ApiResponse({ status: 409, description: "Email already subscribed" })
  adminCreateSubscriber(@Body() createDto: AdminCreateSubscriberDto) {
    return this.newsletterService.adminCreateSubscriber(createDto);
  }

  @Get("subscribers")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all subscribers" })
  @ApiResponse({ status: 200, description: "List of subscribers" })
  findAllSubscribers(@Query() query: SubscriberQueryDto) {
    return this.newsletterService.findAllSubscribers(query);
  }

  @Get("subscribers/statistics")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subscriber statistics" })
  @ApiResponse({ status: 200, description: "Subscriber statistics" })
  getSubscriberStatistics() {
    return this.newsletterService.getSubscriberStatistics();
  }

  @Get("subscribers/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subscriber by ID" })
  @ApiResponse({ status: 200, description: "Subscriber details" })
  @ApiResponse({ status: 404, description: "Subscriber not found" })
  findSubscriberById(@Param("id", ParseUUIDPipe) id: string) {
    return this.newsletterService.findSubscriberById(id);
  }

  @Patch("subscribers/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update subscriber" })
  @ApiResponse({ status: 200, description: "Subscriber updated" })
  @ApiResponse({ status: 404, description: "Subscriber not found" })
  updateSubscriber(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubscriberDto,
  ) {
    return this.newsletterService.updateSubscriber(id, updateDto);
  }

  @Delete("subscribers/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete subscriber" })
  @ApiResponse({ status: 204, description: "Subscriber deleted" })
  @ApiResponse({ status: 404, description: "Subscriber not found" })
  deleteSubscriber(@Param("id", ParseUUIDPipe) id: string) {
    return this.newsletterService.deleteSubscriber(id);
  }

  // ==================== Campaign Endpoints ====================

  @Post("campaigns")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a campaign" })
  @ApiResponse({ status: 201, description: "Campaign created" })
  createCampaign(
    @Body() createDto: CreateCampaignDto,
    @CurrentUser() user: User,
  ) {
    return this.newsletterService.createCampaign(createDto, user.id);
  }

  @Get("campaigns")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all campaigns" })
  @ApiResponse({ status: 200, description: "List of campaigns" })
  findAllCampaigns(@Query() query: CampaignQueryDto) {
    return this.newsletterService.findAllCampaigns(query);
  }

  @Get("campaigns/statistics")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get campaign statistics" })
  @ApiResponse({ status: 200, description: "Campaign statistics" })
  getCampaignStatistics() {
    return this.newsletterService.getCampaignStatistics();
  }

  @Get("campaigns/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get campaign by ID" })
  @ApiResponse({ status: 200, description: "Campaign details" })
  @ApiResponse({ status: 404, description: "Campaign not found" })
  findCampaignById(@Param("id", ParseUUIDPipe) id: string) {
    return this.newsletterService.findCampaignById(id);
  }

  @Patch("campaigns/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update campaign" })
  @ApiResponse({ status: 200, description: "Campaign updated" })
  @ApiResponse({ status: 404, description: "Campaign not found" })
  @ApiResponse({ status: 400, description: "Cannot update sent campaign" })
  updateCampaign(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCampaignDto,
  ) {
    return this.newsletterService.updateCampaign(id, updateDto);
  }

  @Delete("campaigns/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete campaign" })
  @ApiResponse({ status: 204, description: "Campaign deleted" })
  @ApiResponse({ status: 404, description: "Campaign not found" })
  @ApiResponse({
    status: 400,
    description: "Cannot delete sent/sending campaign",
  })
  deleteCampaign(@Param("id", ParseUUIDPipe) id: string) {
    return this.newsletterService.deleteCampaign(id);
  }

  @Post("campaigns/test")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Send test email" })
  @ApiResponse({ status: 204, description: "Test email sent" })
  sendTestEmail(@Body() dto: SendTestEmailDto) {
    return this.newsletterService.sendTestEmail(dto.campaignId, dto.testEmail);
  }

  @Post("campaigns/:id/send")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send campaign to subscribers" })
  @ApiResponse({ status: 200, description: "Campaign sent" })
  @ApiResponse({ status: 404, description: "Campaign not found" })
  @ApiResponse({ status: 400, description: "Campaign already sent or sending" })
  sendCampaign(@Param("id", ParseUUIDPipe) id: string) {
    return this.newsletterService.sendCampaign(id);
  }
}
