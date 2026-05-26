import { Entity, Column, Index, OneToMany } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { GalleryItem } from "./gallery-item.entity";

@Entity("gallery_categories")
@Index(["isActive"])
@Index(["sortOrder"])
export class GalleryCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;

  @OneToMany(() => GalleryItem, (item) => item.category)
  items: GalleryItem[];
}
