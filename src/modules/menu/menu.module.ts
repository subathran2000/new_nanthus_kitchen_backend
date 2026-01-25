import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import {
  PrimaryCategory,
  MenuCategory,
  MeasurementType,
  MenuItem,
  MenuItemMeasurement,
} from "./entities";

// Services
import {
  PrimaryCategoryService,
  MenuCategoryService,
  MeasurementTypeService,
  MenuItemService,
} from "./services";

// Controllers
import {
  PrimaryCategoryController,
  MenuCategoryController,
  MeasurementTypeController,
  MenuItemController,
} from "./controllers";

import { UploadModule } from "../upload/upload.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrimaryCategory,
      MenuCategory,
      MeasurementType,
      MenuItem,
      MenuItemMeasurement,
    ]),
    UploadModule,
  ],
  controllers: [
    PrimaryCategoryController,
    MenuCategoryController,
    MeasurementTypeController,
    MenuItemController,
  ],
  providers: [
    PrimaryCategoryService,
    MenuCategoryService,
    MeasurementTypeService,
    MenuItemService,
  ],
  exports: [
    PrimaryCategoryService,
    MenuCategoryService,
    MeasurementTypeService,
    MenuItemService,
  ],
})
export class MenuModule {}
