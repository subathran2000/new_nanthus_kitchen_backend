import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { MenuCategory } from "./menu-category.entity";

@Entity("primary_categories")
export class PrimaryCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "image_url", nullable: true })
  imageUrl: string;

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @OneToMany(() => MenuCategory, (category) => category.primaryCategory)
  categories: MenuCategory[];
}
