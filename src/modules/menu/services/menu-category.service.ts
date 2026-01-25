import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MenuCategory } from "../entities/menu-category.entity";
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  ReorderDto,
} from "../dto/category.dto";

@Injectable()
export class MenuCategoryService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
  ) {}

  async create(createDto: CreateMenuCategoryDto): Promise<MenuCategory> {
    // Get max sort order within the same primary category
    const maxSortOrder = await this.menuCategoryRepository
      .createQueryBuilder("mc")
      .select("MAX(mc.sortOrder)", "max")
      .where("mc.primaryCategoryId = :primaryCategoryId", {
        primaryCategoryId: createDto.primaryCategoryId,
      })
      .getRawOne();

    const category = this.menuCategoryRepository.create({
      ...createDto,
      sortOrder: createDto.sortOrder ?? (maxSortOrder?.max ?? -1) + 1,
    });

    return this.menuCategoryRepository.save(category);
  }

  async findAll(primaryCategoryId?: string): Promise<MenuCategory[]> {
    const queryBuilder = this.menuCategoryRepository
      .createQueryBuilder("category")
      .leftJoinAndSelect("category.primaryCategory", "primaryCategory")
      .leftJoinAndSelect("category.items", "items")
      .orderBy("category.sortOrder", "ASC");

    if (primaryCategoryId) {
      queryBuilder.where("category.primaryCategoryId = :primaryCategoryId", {
        primaryCategoryId,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<MenuCategory> {
    const category = await this.menuCategoryRepository.findOne({
      where: { id },
      relations: ["primaryCategory", "items"],
    });

    if (!category) {
      throw new NotFoundException(`Menu category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateDto: UpdateMenuCategoryDto,
  ): Promise<MenuCategory> {
    const category = await this.findOne(id);
    Object.assign(category, updateDto);
    return this.menuCategoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.menuCategoryRepository.findOne({
      where: { id },
      relations: ["items"],
    });

    if (!category) {
      throw new NotFoundException(`Menu category with ID ${id} not found`);
    }

    if (category.items && category.items.length > 0) {
      throw new BadRequestException(
        "Cannot delete category with associated menu items. Please delete or reassign items first.",
      );
    }

    await this.menuCategoryRepository.remove(category);
  }

  async reorder(reorderDto: ReorderDto): Promise<void> {
    const updates = reorderDto.items.map((item) =>
      this.menuCategoryRepository.update(item.id, {
        sortOrder: item.sortOrder,
      }),
    );

    await Promise.all(updates);
  }

  async toggleActive(id: string): Promise<MenuCategory> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    return this.menuCategoryRepository.save(category);
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const total = await this.menuCategoryRepository.count();
    const active = await this.menuCategoryRepository.count({
      where: { isActive: true },
    });

    return {
      total,
      active,
      inactive: total - active,
    };
  }
}
