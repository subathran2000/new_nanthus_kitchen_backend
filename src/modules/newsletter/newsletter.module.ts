import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewsletterSubscriber } from "./entities/newsletter-subscriber.entity";
import { NewsletterCampaign } from "./entities/newsletter-campaign.entity";
import { NewsletterService } from "./newsletter.service";
import { NewsletterController } from "./newsletter.controller";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsletterSubscriber, NewsletterCampaign]),
    EmailModule,
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
