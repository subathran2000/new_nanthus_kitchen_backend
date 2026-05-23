import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { MenuCategory } from "./menu-category.entity";
import { MenuItemMeasurement } from "./menu-item-measurement.entity";
import { DietaryInfo, Allergen } from "../../../common/enums";

@Entity("menu_items")
@Index(["categoryId"])
@Index(["isAvailable"])
@Index(["sortOrder"])
export class MenuItem extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: "simple-array", nullable: true })
  allergens: Allergen[];

  @Column({ name: "dietary_info", type: "simple-array", nullable: true })
  dietaryInfo: DietaryInfo[];

  @Column({ name: "is_available", default: true })
  isAvailable: boolean;

  @Column({ name: "image_urls", type: "simple-array", nullable: true })
  imageUrls: string[];

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;

  @Column({ name: "category_id" })
  categoryId: string;

  @ManyToOne(() => MenuCategory, (category) => category.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category: MenuCategory;

  @Column({ name: "has_measurements", default: false })
  hasMeasurements: boolean;

  @Column({ name: "location_availability", default: "both" })
  locationAvailability: string; // 'both' | 'scarborough' | 'markham'

  @Column({ name: "price_scarborough", type: "decimal", precision: 10, scale: 2, nullable: true })
  priceScarborough: number | null;

  @Column({ name: "price_markham", type: "decimal", precision: 10, scale: 2, nullable: true })
  priceMarkham: number | null;

  @OneToMany(() => MenuItemMeasurement, (measurement) => measurement.menuItem, {
    cascade: true,
  })
  measurements: MenuItemMeasurement[];
}
