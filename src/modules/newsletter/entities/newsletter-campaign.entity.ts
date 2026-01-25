import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { User } from "../../users/entities/user.entity";

export enum NewsletterStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

@Entity("newsletter_campaigns")
export class NewsletterCampaign extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  subject: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", nullable: true })
  previewText: string | null;

  @Column({
    type: "enum",
    enum: NewsletterStatus,
    default: NewsletterStatus.DRAFT,
  })
  status: NewsletterStatus;

  @Column({ type: "timestamp", nullable: true })
  scheduledAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  sentAt: Date | null;

  @Column({
    type: "enum",
    enum: ["markham", "scarborough", "both"],
    default: "both",
  })
  targetLocation: "markham" | "scarborough" | "both";

  @Column({ type: "int", default: 0 })
  totalRecipients: number;

  @Column({ type: "int", default: 0 })
  successfulSends: number;

  @Column({ type: "int", default: 0 })
  failedSends: number;

  @Column({ type: "int", default: 0 })
  openCount: number;

  @Column({ type: "int", default: 0 })
  clickCount: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by_id" })
  createdBy: User;

  @Column({ type: "uuid", nullable: true })
  createdById: string;
}
