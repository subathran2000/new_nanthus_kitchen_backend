import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In } from "typeorm";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemMeasurement } from "../entities/menu-item-measurement.entity";
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemQueryDto,
} from "../dto/menu-item.dto";
import { ReorderDto } from "../dto/category.dto";
import { AdminWebSocketGateway } from "../../websocket/websocket.gateway";
import { UploadService } from "../../upload/upload.service";

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(MenuItemMeasurement)
    private readonly measurementRepository: Repository<MenuItemMeasurement>,
    private readonly wsGateway: AdminWebSocketGateway,
    private readonly uploadService: UploadService,
  ) {}

  async create(createDto: CreateMenuItemDto): Promise<MenuItem> {
    const { measurements, ...itemData } = createDto;

    // Get max sort order within the same category
    const maxSortOrder = await this.menuItemRepository
      .createQueryBuilder("mi")
      .select("MAX(mi.sortOrder)", "max")
      .where("mi.categoryId = :categoryId", {
        categoryId: createDto.categoryId,
      })
      .getRawOne();

    const menuItem = this.menuItemRepository.create({
      ...itemData,
      sortOrder: itemData.sortOrder ?? (maxSortOrder?.max ?? -1) + 1,
    });

    const savedItem = await this.menuItemRepository.save(menuItem);

    // Create measurements if provided
    if (measurements && measurements.length > 0) {
      const measurementEntities = measurements.map((m) =>
        this.measurementRepository.create({
          ...m,
          menuItemId: savedItem.id,
        }),
      );
      await this.measurementRepository.save(measurementEntities);
    }

    const result = await this.findOne(savedItem.id);

    // Emit WebSocket event
    this.wsGateway.emitMenuUpdate(
      "item",
      "created",
      result as unknown as Record<string, unknown>,
    );

    return result;
  }

  async findAll(query: MenuItemQueryDto): Promise<MenuItem[]> {
    const queryBuilder = this.menuItemRepository
      .createQueryBuilder("item")
      .leftJoinAndSelect("item.category", "category")
      .leftJoinAndSelect("category.primaryCategory", "primaryCategory")
      .leftJoinAndSelect("item.measurements", "measurements")
      .leftJoinAndSelect("measurements.measurementType", "measurementType")
      .orderBy("item.sortOrder", "ASC");

    if (query.categoryId) {
      queryBuilder.andWhere("item.categoryId = :categoryId", {
        categoryId: query.categoryId,
      });
    }

    if (query.isAvailable !== undefined) {
      queryBuilder.andWhere("item.isAvailable = :isAvailable", {
        isAvailable: query.isAvailable,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        "(LOWER(item.name) LIKE LOWER(:search) OR LOWER(item.description) LIKE LOWER(:search))",
        { search: `%${query.search}%` },
      );
    }

    if (query.dietaryInfo) {
      queryBuilder.andWhere("item.dietaryInfo LIKE :dietaryInfo", {
        dietaryInfo: `%${query.dietaryInfo}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
      relations: [
        "category",
        "category.primaryCategory",
        "measurements",
        "measurements.measurementType",
      ],
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return item;
  }

  async update(id: string, updateDto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.findOne(id);
    const { measurements, ...itemData } = updateDto;

    // Clean up old images if new images are being set
    if (
      itemData.imageUrls !== undefined &&
      item.imageUrls &&
      item.imageUrls.length > 0
    ) {
      // Find images that are being removed (in old but not in new)
      const newImageUrls = itemData.imageUrls || [];
      const imagesToDelete = item.imageUrls.filter(
        (oldUrl) => !newImageUrls.includes(oldUrl),
      );

      for (const imageUrl of imagesToDelete) {
        try {
          const filePath = imageUrl.replace(/^\/uploads\//, "");
          await this.uploadService.deleteFile(filePath);
        } catch (error) {
          console.warn(`Failed to delete old image ${imageUrl}:`, error);
        }
      }
    }

    Object.assign(item, itemData);
    await this.menuItemRepository.save(item);

    // Update measurements if provided
    if (measurements !== undefined) {
      // Remove existing measurements
      await this.measurementRepository.delete({ menuItemId: id });

      // Create new measurements
      if (measurements.length > 0) {
        const measurementEntities = measurements.map((m) =>
          this.measurementRepository.create({
            ...m,
            menuItemId: id,
          }),
        );
        await this.measurementRepository.save(measurementEntities);
      }
    }

    const result = await this.findOne(id);

    // Emit WebSocket event
    this.wsGateway.emitMenuUpdate(
      "item",
      "updated",
      result as unknown as Record<string, unknown>,
    );

    return result;
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);

    // Delete associated images from storage
    if (item.imageUrls && item.imageUrls.length > 0) {
      for (const imageUrl of item.imageUrls) {
        try {
          const filePath = imageUrl.replace(/^\/uploads\//, "");
          await this.uploadService.deleteFile(filePath);
        } catch (error) {
          console.warn(`Failed to delete image ${imageUrl}:`, error);
        }
      }
    }

    // Emit WebSocket event before removal
    this.wsGateway.emitMenuUpdate("item", "deleted", { id, name: item.name });

    await this.menuItemRepository.remove(item);
  }

  async toggleAvailability(
    id: string,
    isAvailable: boolean,
  ): Promise<MenuItem> {
    const item = await this.findOne(id);
    item.isAvailable = isAvailable;
    await this.menuItemRepository.save(item);
    return this.findOne(id);
  }

  async reorder(reorderDto: ReorderDto): Promise<void> {
    const updates = reorderDto.items.map((item) =>
      this.menuItemRepository.update(item.id, { sortOrder: item.sortOrder }),
    );

    await Promise.all(updates);
  }

  async duplicate(id: string): Promise<MenuItem> {
    const original = await this.findOne(id);

    // Create a copy of the item
    const { id: _, createdAt, updatedAt, measurements, ...itemData } = original;

    const newItem = this.menuItemRepository.create({
      ...itemData,
      name: `${original.name} (Copy)`,
      sortOrder: original.sortOrder + 1,
    });

    const savedItem = await this.menuItemRepository.save(newItem);

    // Copy measurements
    if (measurements && measurements.length > 0) {
      const measurementEntities = measurements.map((m) =>
        this.measurementRepository.create({
          menuItemId: savedItem.id,
          measurementTypeId: m.measurementTypeId,
          price: m.price,
        }),
      );
      await this.measurementRepository.save(measurementEntities);
    }

    return this.findOne(savedItem.id);
  }

  async bulkToggleAvailability(
    ids: string[],
    isAvailable: boolean,
  ): Promise<void> {
    await this.menuItemRepository.update({ id: In(ids) }, { isAvailable });
  }

  async getStatistics(): Promise<{
    total: number;
    available: number;
    unavailable: number;
    byCategory: { categoryId: string; categoryName: string; count: number }[];
  }> {
    const total = await this.menuItemRepository.count();
    const available = await this.menuItemRepository.count({
      where: { isAvailable: true },
    });

    const byCategory = await this.menuItemRepository
      .createQueryBuilder("item")
      .select("item.categoryId", "categoryId")
      .addSelect("category.name", "categoryName")
      .addSelect("COUNT(*)", "count")
      .leftJoin("item.category", "category")
      .groupBy("item.categoryId")
      .addGroupBy("category.name")
      .getRawMany();

    return {
      total,
      available,
      unavailable: total - available,
      byCategory,
    };
  }
}
