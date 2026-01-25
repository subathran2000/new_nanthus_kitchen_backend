import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Special } from "./entities/special.entity";
import { SpecialsService } from "./specials.service";
import { SpecialsController } from "./specials.controller";
import { UploadModule } from "../upload/upload.module";

@Module({
  imports: [TypeOrmModule.forFeature([Special]), UploadModule],
  controllers: [SpecialsController],
  providers: [SpecialsService],
  exports: [SpecialsService],
})
export class SpecialsModule {}
