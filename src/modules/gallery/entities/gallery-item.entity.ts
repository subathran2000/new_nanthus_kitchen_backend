import { Entity, Column, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { GalleryCategory } from "./gallery-category.entity";

export enum GalleryMediaType {
  IMAGE = "image",
  VIDEO = "video",
}

@Entity("gallery_items")
@Index(["isActive"])
@Index(["sortOrder"])
export class GalleryItem extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "category_id", nullable: true })
  categoryId: string;

  @ManyToOne(() => GalleryCategory, (cat) => cat.items, {
    nullable: true,
    onDelete: "SET NULL",
    eager: false,
  })
  @JoinColumn({ name: "category_id" })
  category: GalleryCategory;

  @Column({
    name: "media_type",
    type: "enum",
    enum: GalleryMediaType,
    default: GalleryMediaType.IMAGE,
  })
  mediaType: GalleryMediaType;

  @Column({ name: "media_url" })
  mediaUrl: string;

  @Column({ name: "thumbnail_url", nullable: true })
  thumbnailUrl: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;
}
