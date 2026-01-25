import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MeasurementType } from "../entities/measurement-type.entity";
import { MenuItemMeasurement } from "../entities/menu-item-measurement.entity";
import {
  CreateMeasurementTypeDto,
  UpdateMeasurementTypeDto,
} from "../dto/category.dto";

@Injectable()
export class MeasurementTypeService {
  constructor(
    @InjectRepository(MeasurementType)
    private readonly measurementTypeRepository: Repository<MeasurementType>,
    @InjectRepository(MenuItemMeasurement)
    private readonly menuItemMeasurementRepository: Repository<MenuItemMeasurement>
  ) {}

  async create(createDto: CreateMeasurementTypeDto): Promise<MeasurementType> {
    const measurementType = this.measurementTypeRepository.create(createDto);
    return this.measurementTypeRepository.save(measurementType);
  }

  async findAll(): Promise<(MeasurementType & { usageCount: number })[]> {
    const measurementTypes = await this.measurementTypeRepository.find({
      order: { name: "ASC" },
    });

    // Get usage counts for each measurement type
    const result = await Promise.all(
      measurementTypes.map(async (type) => {
        const usageCount = await this.menuItemMeasurementRepository.count({
          where: { measurementTypeId: type.id },
        });
        return { ...type, usageCount };
      })
    );

    return result;
  }

  async findOne(id: string): Promise<MeasurementType> {
    const measurementType = await this.measurementTypeRepository.findOne({
      where: { id },
    });

    if (!measurementType) {
      throw new NotFoundException(`Measurement type with ID ${id} not found`);
    }

    return measurementType;
  }

  async update(
    id: string,
    updateDto: UpdateMeasurementTypeDto
  ): Promise<MeasurementType> {
    const measurementType = await this.findOne(id);
    Object.assign(measurementType, updateDto);
    return this.measurementTypeRepository.save(measurementType);
  }

  async remove(id: string): Promise<void> {
    const measurementType = await this.findOne(id);

    // Check if measurement type is in use
    const usageCount = await this.menuItemMeasurementRepository.count({
      where: { measurementTypeId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete measurement type. It is used by ${usageCount} menu item(s).`
      );
    }

    await this.measurementTypeRepository.remove(measurementType);
  }
}
