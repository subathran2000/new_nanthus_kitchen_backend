import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { EventType } from "../../../common/enums";

@Entity("events")
@Index(["isActive"])
@Index(["displayStartDate", "displayEndDate"])
@Index(["eventStartDate", "eventEndDate"])
@Index(["type"])
export class Event extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: EventType,
    default: EventType.SPECIAL_EVENT,
  })
  type: EventType;

  @Column({ name: "display_start_date", type: "timestamp with time zone" })
  displayStartDate: Date;

  @Column({ name: "display_end_date", type: "timestamp with time zone" })
  displayEndDate: Date;

  @Column({ name: "event_start_date", type: "timestamp with time zone" })
  eventStartDate: Date;

  @Column({ name: "event_end_date", type: "timestamp with time zone" })
  eventEndDate: Date;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "image_urls", type: "simple-array", nullable: true })
  imageUrls: string[];

  @Column({ type: "varchar", name: "ticket_link", nullable: true })
  ticketLink: string;

  @Column({ type: "varchar", nullable: true })
  location: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ name: "registration_required", default: false })
  registrationRequired: boolean;
}
