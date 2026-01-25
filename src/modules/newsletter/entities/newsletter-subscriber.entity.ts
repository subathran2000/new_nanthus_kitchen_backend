import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";

@Entity("newsletter_subscribers")
export class NewsletterSubscriber extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  firstName: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  lastName: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  verificationToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  verifiedAt: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  unsubscribeToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  unsubscribedAt: Date | null;

  @Column({
    type: "enum",
    enum: ["markham", "scarborough", "both"],
    default: "both",
  })
  preferredLocation: "markham" | "scarborough" | "both";

  @Column({ type: "simple-array", nullable: true })
  interests: string[];

  @Column({ type: "varchar", length: 100, nullable: true })
  source: string | null;
}
