import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { PrimaryCategory } from "./primary-category.entity";
import { MenuItem } from "./menu-item.entity";

@Entity("menu_categories")
export class MenuCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "image_url", nullable: true })
  imageUrl: string;

  @Column({ name: "primary_category_id" })
  primaryCategoryId: string;

  @ManyToOne(
    () => PrimaryCategory,
    (primaryCategory) => primaryCategory.categories,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "primary_category_id" })
  primaryCategory: PrimaryCategory;

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @OneToMany(() => MenuItem, (item) => item.category)
  items: MenuItem[];
}
