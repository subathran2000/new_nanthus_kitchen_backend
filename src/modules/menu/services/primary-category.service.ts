import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PrimaryCategory } from "../entities/primary-category.entity";
import {
  CreatePrimaryCategoryDto,
  UpdatePrimaryCategoryDto,
  ReorderDto,
} from "../dto/category.dto";

@Injectable()
export class PrimaryCategoryService {
  constructor(
    @InjectRepository(PrimaryCategory)
    private readonly primaryCategoryRepository: Repository<PrimaryCategory>
  ) {}

  async create(createDto: CreatePrimaryCategoryDto): Promise<PrimaryCategory> {
    // Get max sort order
    const maxSortOrder = await this.primaryCategoryRepository
      .createQueryBuilder("pc")
      .select("MAX(pc.sortOrder)", "max")
      .getRawOne();

    const category = this.primaryCategoryRepository.create({
      ...createDto,
      sortOrder: createDto.sortOrder ?? (maxSortOrder?.max ?? -1) + 1,
    });

    return this.primaryCategoryRepository.save(category);
  }

  async findAll(): Promise<PrimaryCategory[]> {
    return this.primaryCategoryRepository.find({
      relations: ["categories"],
      order: { sortOrder: "ASC" },
    });
  }

  async findOne(id: string): Promise<PrimaryCategory> {
    const category = await this.primaryCategoryRepository.findOne({
      where: { id },
      relations: ["categories", "categories.items"],
    });

    if (!category) {
      throw new NotFoundException(`Primary category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateDto: UpdatePrimaryCategoryDto
  ): Promise<PrimaryCategory> {
    const category = await this.findOne(id);
    Object.assign(category, updateDto);
    return this.primaryCategoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.primaryCategoryRepository.findOne({
      where: { id },
      relations: ["categories"],
    });

    if (!category) {
      throw new NotFoundException(`Primary category with ID ${id} not found`);
    }

    if (category.categories && category.categories.length > 0) {
      throw new BadRequestException(
        "Cannot delete primary category with associated categories. Please delete or reassign categories first."
      );
    }

    await this.primaryCategoryRepository.remove(category);
  }

  async reorder(reorderDto: ReorderDto): Promise<void> {
    const updates = reorderDto.items.map((item) =>
      this.primaryCategoryRepository.update(item.id, {
        sortOrder: item.sortOrder,
      })
    );

    await Promise.all(updates);
  }

  async toggleActive(id: string): Promise<PrimaryCategory> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    return this.primaryCategoryRepository.save(category);
  }
}
