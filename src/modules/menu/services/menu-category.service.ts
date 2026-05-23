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
import { AdminWebSocketGateway } from "../../websocket/websocket.gateway";
import { PublicWebSocketGateway } from "../../websocket/public-websocket.gateway";

@Injectable()
export class MenuCategoryService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
    private readonly wsGateway: AdminWebSocketGateway,
    private readonly publicWsGateway: PublicWebSocketGateway,
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

    const saved = await this.menuCategoryRepository.save(category);
    this.wsGateway.emitMenuUpdate("category", "created", saved as unknown as Record<string, unknown>);
    this.publicWsGateway.emitMenuUpdate("category", "created");
    return saved;
  }

  async findAll(primaryCategoryId?: string, location?: string): Promise<MenuCategory[]> {
    const queryBuilder = this.menuCategoryRepository
      .createQueryBuilder("category")
      .leftJoinAndSelect("category.primaryCategory", "primaryCategory")
      .orderBy("category.sortOrder", "ASC");

    if (location) {
      queryBuilder.leftJoinAndSelect(
        "category.items",
        "items",
        "items.locationAvailability IN ('both', :location) AND items.isAvailable = true",
        { location },
      );
    } else {
      queryBuilder.leftJoinAndSelect("category.items", "items");
    }

    if (primaryCategoryId) {
      queryBuilder.where("category.primaryCategoryId = :primaryCategoryId", {
        primaryCategoryId,
      });
    }

    const categories = await queryBuilder.getMany();

    // When filtering by location, drop empty categories
    if (location) {
      return categories.filter((c) => c.items && c.items.length > 0);
    }

    return categories;
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
    const saved = await this.menuCategoryRepository.save(category);
    this.wsGateway.emitMenuUpdate("category", "updated", saved as unknown as Record<string, unknown>);
    this.publicWsGateway.emitMenuUpdate("category", "updated");
    return saved;
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
    this.wsGateway.emitMenuUpdate("category", "deleted", { id });
    this.publicWsGateway.emitMenuUpdate("category", "deleted");
  }

  async reorder(reorderDto: ReorderDto): Promise<void> {
    const updates = reorderDto.items.map((item) =>
      this.menuCategoryRepository.update(item.id, {
        sortOrder: item.sortOrder,
      }),
    );

    await Promise.all(updates);
    this.wsGateway.emitMenuUpdate("category", "updated", {});
    this.publicWsGateway.emitMenuUpdate("category", "updated");
  }

  async toggleActive(id: string): Promise<MenuCategory> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    const saved = await this.menuCategoryRepository.save(category);
    this.wsGateway.emitMenuUpdate("category", "updated", saved as unknown as Record<string, unknown>);
    this.publicWsGateway.emitMenuUpdate("category", "updated");
    return saved;
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
