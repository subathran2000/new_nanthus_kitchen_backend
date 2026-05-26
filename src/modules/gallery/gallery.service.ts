import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GalleryItem } from "./entities/gallery-item.entity";
import { GalleryCategory } from "./entities/gallery-category.entity";
import {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
  GalleryItemQueryDto,
  BulkCreateGalleryItemsDto,
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
  GalleryCategoryQueryDto,
} from "./dto/gallery.dto";
import { UploadService } from "../upload/upload.service";
import { PublicWebSocketGateway } from "../websocket/public-websocket.gateway";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryItem)
    private readonly itemRepo: Repository<GalleryItem>,
    @InjectRepository(GalleryCategory)
    private readonly categoryRepo: Repository<GalleryCategory>,
    private readonly uploadService: UploadService,
    private readonly publicWs: PublicWebSocketGateway,
  ) {}

  // ── Category CRUD ─────────────────────────────────────────────────────────

  async createCategory(dto: CreateGalleryCategoryDto): Promise<GalleryCategory> {
    const slug = dto.slug ?? toSlug(dto.name);

    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`A category with slug "${slug}" already exists`);
    }

    const category = this.categoryRepo.create({ ...dto, slug });
    const saved = await this.categoryRepo.save(category);
    this.publicWs.emitGalleryUpdate("created");
    return saved;
  }

  async findAllCategories(query: GalleryCategoryQueryDto): Promise<GalleryCategory[]> {
    const qb = this.categoryRepo
      .createQueryBuilder("cat")
      .orderBy("cat.sortOrder", "ASC")
      .addOrderBy("cat.name", "ASC");

    if (query.isActive !== undefined) {
      qb.andWhere("cat.isActive = :isActive", { isActive: query.isActive });
    }

    return qb.getMany();
  }

  async findOneCategory(id: string): Promise<GalleryCategory> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException(`Gallery category ${id} not found`);
    return cat;
  }

  async updateCategory(
    id: string,
    dto: UpdateGalleryCategoryDto,
  ): Promise<GalleryCategory> {
    const cat = await this.findOneCategory(id);

    if (dto.slug && dto.slug !== cat.slug) {
      const conflict = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (conflict) {
        throw new ConflictException(`A category with slug "${dto.slug}" already exists`);
      }
    }

    Object.assign(cat, dto);
    const saved = await this.categoryRepo.save(cat);
    this.publicWs.emitGalleryUpdate("updated");
    return saved;
  }

  async removeCategory(id: string): Promise<void> {
    const cat = await this.findOneCategory(id);
    await this.categoryRepo.remove(cat);
    this.publicWs.emitGalleryUpdate("deleted");
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────

  async createItem(dto: CreateGalleryItemDto): Promise<GalleryItem> {
    if (dto.categoryId) {
      await this.findOneCategory(dto.categoryId); // validate exists
    }
    const item = this.itemRepo.create(dto);
    const saved = await this.itemRepo.save(item);
    this.publicWs.emitGalleryUpdate("created");
    return this.findOneItem(saved.id);
  }

  async bulkCreateItems(dto: BulkCreateGalleryItemsDto): Promise<GalleryItem[]> {
    // Validate all category IDs upfront
    const categoryIds = [...new Set(dto.items.map((i) => i.categoryId).filter(Boolean))];
    for (const id of categoryIds) {
      await this.findOneCategory(id as string);
    }

    const entities = dto.items.map((itemDto) => this.itemRepo.create(itemDto));
    const saved = await this.itemRepo.save(entities);
    this.publicWs.emitGalleryUpdate("created");

    // Return fully loaded items with category relation
    return Promise.all(saved.map((s) => this.findOneItem(s.id)));
  }

  async findAllItems(query: GalleryItemQueryDto): Promise<GalleryItem[]> {
    const qb = this.itemRepo
      .createQueryBuilder("item")
      .leftJoinAndSelect("item.category", "category")
      .orderBy("item.sortOrder", "ASC")
      .addOrderBy("item.createdAt", "DESC");

    if (query.categoryId) {
      qb.andWhere("item.categoryId = :categoryId", { categoryId: query.categoryId });
    }

    if (query.mediaType) {
      qb.andWhere("item.mediaType = :mediaType", { mediaType: query.mediaType });
    }

    if (query.isActive !== undefined) {
      qb.andWhere("item.isActive = :isActive", { isActive: query.isActive });
    }

    return qb.getMany();
  }

  async findOneItem(id: string): Promise<GalleryItem> {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ["category"],
    });
    if (!item) throw new NotFoundException(`Gallery item ${id} not found`);
    return item;
  }

  async updateItem(id: string, dto: UpdateGalleryItemDto): Promise<GalleryItem> {
    const item = await this.findOneItem(id);

    if (dto.categoryId !== undefined && dto.categoryId) {
      await this.findOneCategory(dto.categoryId); // validate
    }

    // Delete old media file if being replaced
    if (dto.mediaUrl && dto.mediaUrl !== item.mediaUrl) {
      await this.deleteMediaFile(item.mediaUrl);
      if (item.thumbnailUrl && item.thumbnailUrl !== item.mediaUrl) {
        await this.deleteMediaFile(item.thumbnailUrl);
      }
    }

    Object.assign(item, dto);
    await this.itemRepo.save(item);
    this.publicWs.emitGalleryUpdate("updated");
    return this.findOneItem(id);
  }

  async removeItem(id: string): Promise<void> {
    const item = await this.findOneItem(id);
    await this.deleteMediaFile(item.mediaUrl);
    if (item.thumbnailUrl && item.thumbnailUrl !== item.mediaUrl) {
      await this.deleteMediaFile(item.thumbnailUrl);
    }
    await this.itemRepo.remove(item);
    this.publicWs.emitGalleryUpdate("deleted");
  }

  async toggleItemActive(id: string): Promise<GalleryItem> {
    const item = await this.findOneItem(id);
    item.isActive = !item.isActive;
    await this.itemRepo.save(item);
    this.publicWs.emitGalleryUpdate("updated");
    return this.findOneItem(id);
  }

  // ── Public endpoint helpers ───────────────────────────────────────────────

  async findPublicCategories(): Promise<GalleryCategory[]> {
    return this.findAllCategories({ isActive: true });
  }

  async findPublicItems(query: GalleryItemQueryDto): Promise<GalleryItem[]> {
    return this.findAllItems({ ...query, isActive: true });
  }

  // ── Grouped view for public (categories with their items) ─────────────────

  async findPublicGrouped(): Promise<
    Array<{ category: GalleryCategory | null; items: GalleryItem[] }>
  > {
    const [categories, items] = await Promise.all([
      this.findPublicCategories(),
      this.findPublicItems({}),
    ]);

    const grouped: Array<{ category: GalleryCategory | null; items: GalleryItem[] }> = [];

    for (const cat of categories) {
      const catItems = items.filter((i) => i.categoryId === cat.id);
      if (catItems.length > 0) {
        grouped.push({ category: cat, items: catItems });
      }
    }

    // Uncategorised items at the end
    const uncategorised = items.filter((i) => !i.categoryId);
    if (uncategorised.length > 0) {
      grouped.push({ category: null, items: uncategorised });
    }

    return grouped;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async deleteMediaFile(filePath: string): Promise<void> {
    if (!filePath) return;
    try {
      const relative = filePath.replace(/^\/uploads\//, "");
      await this.uploadService.deleteFile(relative);
    } catch {
      // silent — file may already be gone
    }
  }
}
