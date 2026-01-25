import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OpeningHours } from "./entities/opening-hours.entity";
import {
  CreateOpeningHoursDto,
  UpdateOpeningHoursDto,
  BulkUpdateOpeningHoursDto,
  OpeningHoursQueryDto,
} from "./dto/opening-hours.dto";
import { DayOfWeek } from "../../common/enums";
import {
  getCurrentDayInToronto,
  getCurrentTimeHHMMInToronto,
  isTimeBetween,
  formatTimeForDisplay,
} from "../../common";

/**
 * OpeningHoursService
 *
 * All time operations use America/Toronto timezone to ensure
 * accurate open/closed status regardless of server location.
 */
@Injectable()
export class OpeningHoursService {
  constructor(
    @InjectRepository(OpeningHours)
    private readonly openingHoursRepository: Repository<OpeningHours>,
  ) {}

  /**
   * Map timezone day name to DayOfWeek enum
   */
  private getDayOfWeek(): DayOfWeek {
    const dayName = getCurrentDayInToronto();
    return dayName as DayOfWeek;
  }

  async create(createDto: CreateOpeningHoursDto): Promise<OpeningHours> {
    // Check if record already exists for this day and location
    const existing = await this.openingHoursRepository.findOne({
      where: {
        dayOfWeek: createDto.dayOfWeek,
        location: createDto.location || "markham",
      },
    });

    if (existing) {
      // Update existing record instead of creating duplicate
      Object.assign(existing, createDto);
      return this.openingHoursRepository.save(existing);
    }

    const openingHours = this.openingHoursRepository.create(createDto);
    return this.openingHoursRepository.save(openingHours);
  }

  async findAll(query: OpeningHoursQueryDto): Promise<OpeningHours[]> {
    const queryBuilder = this.openingHoursRepository
      .createQueryBuilder("oh")
      .orderBy(
        `CASE oh.dayOfWeek 
          WHEN 'monday' THEN 1 
          WHEN 'tuesday' THEN 2 
          WHEN 'wednesday' THEN 3 
          WHEN 'thursday' THEN 4 
          WHEN 'friday' THEN 5 
          WHEN 'saturday' THEN 6 
          WHEN 'sunday' THEN 7 
        END`,
      );

    if (query.location) {
      queryBuilder.where("oh.location = :location", {
        location: query.location,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<OpeningHours> {
    const openingHours = await this.openingHoursRepository.findOne({
      where: { id },
    });

    if (!openingHours) {
      throw new NotFoundException(`Opening hours with ID ${id} not found`);
    }

    return openingHours;
  }

  async findByLocation(
    location: "markham" | "scarborough",
  ): Promise<OpeningHours[]> {
    return this.openingHoursRepository.find({
      where: { location },
      order: { dayOfWeek: "ASC" },
    });
  }

  /**
   * Get today's hours for a location using Toronto timezone
   */
  async getToday(
    location: "markham" | "scarborough",
  ): Promise<OpeningHours | null> {
    const currentDay = this.getDayOfWeek();

    return this.openingHoursRepository.findOne({
      where: {
        location,
        dayOfWeek: currentDay,
      },
    });
  }

  /**
   * Check if a location is currently open
   * Uses America/Toronto timezone for accurate time comparison
   * Supports overnight hours (when closeTime < openTime, it means closing next day)
   */
  async isCurrentlyOpen(location: "markham" | "scarborough"): Promise<{
    isOpen: boolean;
    currentHours: OpeningHours | null;
    message: string;
  }> {
    const todayHours = await this.getToday(location);

    if (!todayHours || todayHours.isClosed) {
      return {
        isOpen: false,
        currentHours: todayHours,
        message: "Closed today",
      };
    }

    const currentTime = getCurrentTimeHHMMInToronto();

    // Check hours (supports overnight hours)
    if (todayHours.openTime && todayHours.closeTime) {
      if (
        isTimeBetween(currentTime, todayHours.openTime, todayHours.closeTime)
      ) {
        return {
          isOpen: true,
          currentHours: todayHours,
          message: `Open until ${formatTimeForDisplay(todayHours.closeTime)}`,
        };
      }
    }

    // Determine next opening time message
    let nextOpen = "Closed";
    if (todayHours.openTime && currentTime < todayHours.openTime) {
      nextOpen = `Opens at ${formatTimeForDisplay(todayHours.openTime)}`;
    }

    return {
      isOpen: false,
      currentHours: todayHours,
      message: nextOpen,
    };
  }

  async update(
    id: string,
    updateDto: UpdateOpeningHoursDto,
  ): Promise<OpeningHours> {
    const openingHours = await this.findOne(id);
    Object.assign(openingHours, updateDto);
    return this.openingHoursRepository.save(openingHours);
  }

  async bulkUpdate(
    bulkDto: BulkUpdateOpeningHoursDto,
  ): Promise<OpeningHours[]> {
    const updates = bulkDto.items.map(async (item) => {
      const { id, ...updateData } = item;
      const openingHours = await this.findOne(id);
      Object.assign(openingHours, updateData);
      return this.openingHoursRepository.save(openingHours);
    });

    return Promise.all(updates);
  }

  async remove(id: string): Promise<void> {
    const openingHours = await this.findOne(id);
    await this.openingHoursRepository.remove(openingHours);
  }

  // Initialize default hours for a location
  async initializeDefault(
    location: "markham" | "scarborough",
  ): Promise<OpeningHours[]> {
    const defaultHours = [
      { dayOfWeek: DayOfWeek.MONDAY, openTime: "11:00", closeTime: "21:00" },
      { dayOfWeek: DayOfWeek.TUESDAY, openTime: "11:00", closeTime: "21:00" },
      { dayOfWeek: DayOfWeek.WEDNESDAY, openTime: "11:00", closeTime: "21:00" },
      { dayOfWeek: DayOfWeek.THURSDAY, openTime: "11:00", closeTime: "21:00" },
      { dayOfWeek: DayOfWeek.FRIDAY, openTime: "11:00", closeTime: "21:00" },
      { dayOfWeek: DayOfWeek.SATURDAY, openTime: "11:00", closeTime: "21:00" },
      { dayOfWeek: DayOfWeek.SUNDAY, openTime: "11:00", closeTime: "21:00" },
    ];

    const hours = defaultHours.map((h) =>
      this.openingHoursRepository.create({ ...h, location }),
    );

    return this.openingHoursRepository.save(hours);
  }

  // Get formatted hours string for display
  // Supports overnight hours (when closeTime < openTime, it means hours cross midnight)
  getFormattedHours(hours: OpeningHours): string {
    if (hours.isClosed) {
      return "Closed";
    }

    let formatted = "";
    if (hours.openTime && hours.closeTime) {
      formatted = `${hours.openTime} - ${hours.closeTime}`;
      if (hours.closeTime < hours.openTime) {
        formatted += " (next day)";
      }
    }

    if (hours.isSpecialHours && hours.specialNote) {
      formatted += ` (${hours.specialNote})`;
    }

    return formatted;
  }

  /**
   * Clean up duplicate records - keeps only the most recent record for each (dayOfWeek, location)
   * Should be called before adding unique constraint
   */
  async cleanupDuplicates(): Promise<{
    totalBefore: number;
    totalAfter: number;
    duplicatesRemoved: number;
  }> {
    const allRecords = await this.openingHoursRepository.find({
      order: { createdAt: "DESC" },
    });

    const totalBefore = allRecords.length;
    const uniqueMap = new Map<string, OpeningHours>();
    const duplicateIds: string[] = [];

    for (const record of allRecords) {
      const key = `${record.dayOfWeek}-${record.location}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, record);
      } else {
        duplicateIds.push(record.id);
      }
    }

    if (duplicateIds.length > 0) {
      await this.openingHoursRepository.delete(duplicateIds);
    }

    const totalAfter = await this.openingHoursRepository.count();

    return {
      totalBefore,
      totalAfter,
      duplicatesRemoved: duplicateIds.length,
    };
  }
}
