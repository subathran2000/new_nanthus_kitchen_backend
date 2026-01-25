import { Entity, Column, Unique } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { DayOfWeek } from "../../../common/enums";

/**
 * Opening Hours Entity
 *
 * This entity stores opening hours for each location on each day of the week.
 * Each record represents ONE day at ONE location.
 *
 * Structure:
 * - Location: "markham" or "scarborough"
 * - Day: monday, tuesday, wednesday, thursday, friday, saturday, sunday
 * - Times: Stored as PostgreSQL TIME type (HH:MM:SS format)
 *
 * Time Period Support:
 * - Regular hours: openTime to closeTime
 * - Overnight hours: When closeTime < openTime (e.g., 22:00-02:00 crosses midnight)
 * - Special hours: Can mark days as "special" with custom notes
 * - Closed days: Set isClosed = true
 *
 * Example:
 * - Markham, Monday, 11:00-22:00 (regular hours)
 * - Markham, Friday, 22:00-02:00 (overnight hours - closes at 2 AM next day)
 * - Scarborough, Sunday, Closed
 *
 * All time comparisons use America/Toronto timezone via timezone utilities.
 */
@Entity("opening_hours")
@Unique(["dayOfWeek", "location"])
export class OpeningHours extends BaseEntity {
  @Column({
    type: "enum",
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @Column({ type: "time", nullable: true })
  openTime: string | null;

  @Column({ type: "time", nullable: true })
  closeTime: string | null;

  @Column({ default: false })
  isClosed: boolean;

  @Column({ default: false })
  isSpecialHours: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  specialNote: string | null;

  @Column({
    type: "enum",
    enum: ["markham", "scarborough"],
    default: "markham",
  })
  location: "markham" | "scarborough";
}
