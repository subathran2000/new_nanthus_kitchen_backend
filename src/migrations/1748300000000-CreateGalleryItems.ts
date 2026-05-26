import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGalleryItems1748300000000 implements MigrationInterface {
  name = "CreateGalleryItems1748300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── gallery_categories ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "gallery_categories" (
        "id"          uuid                NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        "name"        character varying   NOT NULL,
        "slug"        character varying   NOT NULL,
        "description" text,
        "is_active"   boolean             NOT NULL DEFAULT true,
        "sort_order"  integer             NOT NULL DEFAULT 0,
        CONSTRAINT "PK_gallery_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_gallery_categories_slug"  UNIQUE ("slug")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_categories_is_active"  ON "gallery_categories" ("is_active")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_categories_sort_order" ON "gallery_categories" ("sort_order")`
    );

    // ── gallery_items ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."gallery_items_media_type_enum" AS ENUM ('image', 'video')
    `);

    await queryRunner.query(`
      CREATE TABLE "gallery_items" (
        "id"            uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"    TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP         NOT NULL DEFAULT now(),
        "title"         character varying NOT NULL,
        "description"   text,
        "category_id"   uuid,
        "media_type"    "public"."gallery_items_media_type_enum" NOT NULL DEFAULT 'image',
        "media_url"     character varying NOT NULL,
        "thumbnail_url" character varying,
        "is_active"     boolean           NOT NULL DEFAULT true,
        "sort_order"    integer           NOT NULL DEFAULT 0,
        CONSTRAINT "PK_gallery_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_gallery_items_category"
          FOREIGN KEY ("category_id")
          REFERENCES "gallery_categories" ("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_items_is_active"  ON "gallery_items" ("is_active")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_items_sort_order" ON "gallery_items" ("sort_order")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_items_category_id" ON "gallery_items" ("category_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_gallery_items_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_gallery_items_sort_order"`);
    await queryRunner.query(`DROP INDEX "IDX_gallery_items_is_active"`);
    await queryRunner.query(`DROP TABLE "gallery_items"`);
    await queryRunner.query(`DROP TYPE "public"."gallery_items_media_type_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_gallery_categories_sort_order"`);
    await queryRunner.query(`DROP INDEX "IDX_gallery_categories_is_active"`);
    await queryRunner.query(`DROP TABLE "gallery_categories"`);
  }
}
