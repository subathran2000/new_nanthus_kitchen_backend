import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { SpecialType, DayOfWeek, SpecialCategory } from "../../../common/enums";

/**
 * Special Entity
 *
 * Represents promotional specials for the restaurant.
 *
 * Special Types:
 * - DAILY: Tied to specific day(s) of the week, shown all day on that day
 * - GAME_TIME: Shown during sporting events
 * - DAY_TIME: Time-based specials (lunch, dinner hours)
 * - CHEF: Chef's special recommendations
 * - SEASONAL: Limited time seasonal offerings
 *
 * Categories:
 * - REGULAR: Standard specials
 * - LATE_NIGHT: Late night menu items (shown all day when applicable)
 *
 * Design Notes:
 * - Daily specials use dayOfWeek to determine when to display
 * - Late night specials (specialCategory = late_night) display all day
 * - displayStartDate/displayEndDate control the overall visibility window
 *   (e.g., for seasonal promotions that run from Dec 1 to Dec 31)
 */
@Entity("specials")
@Index(["type"])
@Index(["dayOfWeek"])
@Index(["isActive"])
@Index(["displayStartDate", "displayEndDate"])
export class Special extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: SpecialType,
    default: SpecialType.DAILY,
  })
  type: SpecialType;

  /**
   * For DAILY type specials, this determines which day(s) the special is shown.
   * The special will be visible all day on the specified day.
   */
  @Column({
    name: "day_of_week",
    type: "enum",
    enum: DayOfWeek,
    nullable: true,
  })
  dayOfWeek: DayOfWeek;

  /**
   * Category of the special:
   * - REGULAR: Standard specials
   * - LATE_NIGHT: Late night menu (displayed all day, indicates late night availability)
   */
  @Column({
    name: "special_category",
    type: "enum",
    enum: SpecialCategory,
    nullable: true,
  })
  specialCategory: SpecialCategory;

  /**
   * Optional: When to start displaying this special (for limited-time promotions).
   * If null, the special is always eligible to display (subject to dayOfWeek).
   * Stored as DATE only (no time component) in America/Toronto timezone.
   */
  @Column({
    name: "display_start_date",
    type: "date",
    nullable: true,
  })
  displayStartDate: Date;

  /**
   * Optional: When to stop displaying this special (for limited-time promotions).
   * If null, the special continues indefinitely (subject to isActive).
   * Stored as DATE only (no time component) in America/Toronto timezone.
   */
  @Column({
    name: "display_end_date",
    type: "date",
    nullable: true,
  })
  displayEndDate: Date;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "image_urls", type: "simple-array", nullable: true })
  imageUrls: string[];

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;
}
