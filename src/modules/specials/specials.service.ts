import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Special } from "./entities/special.entity";
import {
  CreateSpecialDto,
  UpdateSpecialDto,
  SpecialQueryDto,
  ReorderSpecialsDto,
} from "./dto/special.dto";
import { DayOfWeek, SpecialCategory, SpecialType } from "../../common/enums";
import {
  getCurrentDayInToronto,
  getNowInToronto,
} from "../../common/utils/timezone.util";
import { UploadService } from "../upload/upload.service";

/**
 * Specials Service
 *
 * Handles all business logic for restaurant specials.
 * All date/time operations use America/Toronto timezone.
 */
@Injectable()
export class SpecialsService {
  constructor(
    @InjectRepository(Special)
    private readonly specialRepository: Repository<Special>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createDto: CreateSpecialDto): Promise<Special> {
    // Get max sort order
    const maxSortOrder = await this.specialRepository
      .createQueryBuilder("special")
      .select("MAX(special.sortOrder)", "max")
      .getRawOne();

    const special = this.specialRepository.create({
      ...createDto,
      sortOrder: createDto.sortOrder ?? (maxSortOrder?.max ?? -1) + 1,
    });

    return this.specialRepository.save(special);
  }

  async findAll(query: SpecialQueryDto): Promise<Special[]> {
    const queryBuilder = this.specialRepository
      .createQueryBuilder("special")
      .orderBy("special.sortOrder", "ASC");

    if (query.type) {
      queryBuilder.andWhere("special.type = :type", { type: query.type });
    }

    if (query.dayOfWeek) {
      queryBuilder.andWhere("special.dayOfWeek = :dayOfWeek", {
        dayOfWeek: query.dayOfWeek,
      });
    }

    if (query.specialCategory) {
      queryBuilder.andWhere("special.specialCategory = :specialCategory", {
        specialCategory: query.specialCategory,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere("special.isActive = :isActive", {
        isActive: query.isActive,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Special> {
    const special = await this.specialRepository.findOne({ where: { id } });

    if (!special) {
      throw new NotFoundException(`Special with ID ${id} not found`);
    }

    return special;
  }

  /**
   * Get currently active specials for today
   * Uses America/Toronto timezone for all date calculations.
   *
   * Logic:
   * - Daily specials: Show on their designated day (all day)
   * - Late night specials: Show all day (category indicator)
   * - Other specials: Check display date range
   */
  async findCurrent(): Promise<Special[]> {
    const currentDay = getCurrentDayInToronto();
    const todayInToronto = getNowInToronto();
    // Format as YYYY-MM-DD for date comparison
    const todayStr = todayInToronto.toISOString().split("T")[0];

    const queryBuilder = this.specialRepository
      .createQueryBuilder("special")
      .where("special.isActive = :isActive", { isActive: true })
      .andWhere(
        // Daily specials for current day OR non-daily specials
        "(special.type = :dailyType AND special.dayOfWeek = :currentDay) OR special.type != :dailyType",
        { dailyType: SpecialType.DAILY, currentDay },
      )
      .andWhere(
        // Check display date range (or null = always shown)
        "(special.displayStartDate IS NULL OR special.displayStartDate <= :today)",
        { today: todayStr },
      )
      .andWhere(
        "(special.displayEndDate IS NULL OR special.displayEndDate >= :today)",
        { today: todayStr },
      )
      .orderBy("special.type", "ASC")
      .addOrderBy("special.sortOrder", "ASC");

    return queryBuilder.getMany();
  }

  /**
   * Get late night specials (shown all day, filtered by late_night category)
   */
  async findLateNightSpecials(): Promise<Special[]> {
    const todayInToronto = getNowInToronto();
    const todayStr = todayInToronto.toISOString().split("T")[0];

    return this.specialRepository
      .createQueryBuilder("special")
      .where("special.isActive = :isActive", { isActive: true })
      .andWhere("special.specialCategory = :category", {
        category: SpecialCategory.LATE_NIGHT,
      })
      .andWhere(
        "(special.displayStartDate IS NULL OR special.displayStartDate <= :today)",
        { today: todayStr },
      )
      .andWhere(
        "(special.displayEndDate IS NULL OR special.displayEndDate >= :today)",
        { today: todayStr },
      )
      .orderBy("special.sortOrder", "ASC")
      .getMany();
  }

  /**
   * Get daily specials for a specific day
   */
  async findDailySpecialsByDay(day: DayOfWeek): Promise<Special[]> {
    const todayInToronto = getNowInToronto();
    const todayStr = todayInToronto.toISOString().split("T")[0];

    return this.specialRepository
      .createQueryBuilder("special")
      .where("special.isActive = :isActive", { isActive: true })
      .andWhere("special.type = :type", { type: SpecialType.DAILY })
      .andWhere("special.dayOfWeek = :day", { day })
      .andWhere(
        "(special.displayStartDate IS NULL OR special.displayStartDate <= :today)",
        { today: todayStr },
      )
      .andWhere(
        "(special.displayEndDate IS NULL OR special.displayEndDate >= :today)",
        { today: todayStr },
      )
      .orderBy("special.sortOrder", "ASC")
      .getMany();
  }

  async update(id: string, updateDto: UpdateSpecialDto): Promise<Special> {
    const special = await this.findOne(id);

    // Clean up old images if new images are being set
    if (
      updateDto.imageUrls !== undefined &&
      special.imageUrls &&
      special.imageUrls.length > 0
    ) {
      // Find images that are being removed (in old but not in new)
      const newImageUrls = updateDto.imageUrls || [];
      const imagesToDelete = special.imageUrls.filter(
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

    Object.assign(special, updateDto);
    return this.specialRepository.save(special);
  }

  async remove(id: string): Promise<void> {
    const special = await this.findOne(id);

    // Delete associated images from storage
    if (special.imageUrls && special.imageUrls.length > 0) {
      for (const imageUrl of special.imageUrls) {
        try {
          const filePath = imageUrl.replace(/^\/uploads\//, "");
          await this.uploadService.deleteFile(filePath);
        } catch (error) {
          console.warn(`Failed to delete image ${imageUrl}:`, error);
        }
      }
    }

    await this.specialRepository.remove(special);
  }

  async toggleActive(id: string): Promise<Special> {
    const special = await this.findOne(id);
    special.isActive = !special.isActive;
    return this.specialRepository.save(special);
  }

  async reorder(reorderDto: ReorderSpecialsDto): Promise<void> {
    const updates = reorderDto.items.map((item) =>
      this.specialRepository.update(item.id, { sortOrder: item.sortOrder }),
    );

    await Promise.all(updates);
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    byType: { type: string; count: number }[];
  }> {
    const total = await this.specialRepository.count();
    const active = await this.specialRepository.count({
      where: { isActive: true },
    });

    const byType = await this.specialRepository
      .createQueryBuilder("special")
      .select("special.type", "type")
      .addSelect("COUNT(*)", "count")
      .groupBy("special.type")
      .getRawMany();

    return {
      total,
      active,
      byType,
    };
  }

  // Get daily specials organized by day
  async getDailySpecials(): Promise<Record<DayOfWeek, Special[]>> {
    const specials = await this.specialRepository.find({
      where: { type: "daily" as any, isActive: true },
      order: { sortOrder: "ASC" },
    });

    const organized: Record<DayOfWeek, Special[]> = {
      [DayOfWeek.MONDAY]: [],
      [DayOfWeek.TUESDAY]: [],
      [DayOfWeek.WEDNESDAY]: [],
      [DayOfWeek.THURSDAY]: [],
      [DayOfWeek.FRIDAY]: [],
      [DayOfWeek.SATURDAY]: [],
      [DayOfWeek.SUNDAY]: [],
    };

    specials.forEach((special) => {
      if (special.dayOfWeek) {
        organized[special.dayOfWeek].push(special);
      }
    });

    return organized;
  }
}
