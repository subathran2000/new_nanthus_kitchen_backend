import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from "typeorm";
import { Event } from "./entities/event.entity";
import { CreateEventDto, UpdateEventDto, EventQueryDto } from "./dto/event.dto";
import { UploadService } from "../upload/upload.service";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(createDto);
    return this.eventRepository.save(event);
  }

  async findAll(query: EventQueryDto): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder("event")
      .orderBy("event.eventStartDate", "ASC");

    if (query.type) {
      queryBuilder.andWhere("event.type = :type", { type: query.type });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere("event.isActive = :isActive", {
        isActive: query.isActive,
      });
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere(
        "event.eventStartDate BETWEEN :startDate AND :endDate",
        {
          startDate: new Date(query.startDate),
          endDate: new Date(query.endDate),
        },
      );
    } else if (query.startDate) {
      queryBuilder.andWhere("event.eventStartDate >= :startDate", {
        startDate: new Date(query.startDate),
      });
    } else if (query.endDate) {
      queryBuilder.andWhere("event.eventStartDate <= :endDate", {
        endDate: new Date(query.endDate),
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findUpcoming(limit = 10): Promise<Event[]> {
    const now = new Date();

    return this.eventRepository.find({
      where: {
        isActive: true,
        displayStartDate: LessThanOrEqual(now),
        displayEndDate: MoreThanOrEqual(now),
        eventStartDate: MoreThanOrEqual(now),
      },
      order: { eventStartDate: "ASC" },
      take: limit,
    });
  }

  async update(id: string, updateDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    // Clean up old images if new images are being set
    if (
      updateDto.imageUrls !== undefined &&
      event.imageUrls &&
      event.imageUrls.length > 0
    ) {
      // Find images that are being removed (in old but not in new)
      const newImageUrls = updateDto.imageUrls || [];
      const imagesToDelete = event.imageUrls.filter(
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

    Object.assign(event, updateDto);
    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);

    // Delete associated images from storage
    if (event.imageUrls && event.imageUrls.length > 0) {
      for (const imageUrl of event.imageUrls) {
        try {
          // Convert URL to file path (remove /uploads/ prefix if present)
          const filePath = imageUrl.replace(/^\/uploads\//, "");
          await this.uploadService.deleteFile(filePath);
        } catch (error) {
          // Log but don't fail if image deletion fails
          console.warn(`Failed to delete image ${imageUrl}:`, error);
        }
      }
    }

    await this.eventRepository.remove(event);
  }

  async toggleActive(id: string): Promise<Event> {
    const event = await this.findOne(id);
    event.isActive = !event.isActive;
    return this.eventRepository.save(event);
  }

  async getStatistics(): Promise<{
    total: number;
    upcoming: number;
    past: number;
    byType: { type: string; count: number }[];
  }> {
    const now = new Date();

    const total = await this.eventRepository.count();
    const upcoming = await this.eventRepository.count({
      where: {
        eventStartDate: MoreThanOrEqual(now),
        isActive: true,
      },
    });

    const byType = await this.eventRepository
      .createQueryBuilder("event")
      .select("event.type", "type")
      .addSelect("COUNT(*)", "count")
      .groupBy("event.type")
      .getRawMany();

    return {
      total,
      upcoming,
      past: total - upcoming,
      byType,
    };
  }

  // For calendar view
  async findByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return this.eventRepository.find({
      where: {
        eventStartDate: Between(startDate, endDate),
      },
      order: { eventStartDate: "ASC" },
    });
  }
}
