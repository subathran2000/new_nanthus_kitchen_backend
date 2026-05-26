import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GalleryItem } from "./entities/gallery-item.entity";
import { GalleryCategory } from "./entities/gallery-category.entity";
import { GalleryService } from "./gallery.service";
import { GalleryController } from "./gallery.controller";
import { UploadModule } from "../upload/upload.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GalleryItem, GalleryCategory]),
    UploadModule,
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
