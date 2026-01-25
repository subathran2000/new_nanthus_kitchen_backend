import { DataSource } from "typeorm";
import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "../../.env") });

// Environment validation (sensitive values omitted)
console.log("Environment loaded:");
console.log("DATABASE_HOST:", process.env.DATABASE_HOST);
console.log("DATABASE_PORT:", process.env.DATABASE_PORT);
console.log("DATABASE_USER:", process.env.DATABASE_USER);
console.log("DATABASE_NAME:", process.env.DATABASE_NAME);

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true, // For seeding, we use synchronize
  logging: true,
  entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
});

async function seed() {
  console.log("🌱 Starting database seeding...");

  await AppDataSource.initialize();
  console.log("✅ Database connected");

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ==================== Seed Super Admin ====================
    console.log("👤 Creating super admin user...");

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    const adminFirstName = process.env.ADMIN_SEED_FIRST_NAME || "Super";
    const adminLastName = process.env.ADMIN_SEED_LAST_NAME || "Admin";

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "Admin credentials not found in environment variables. Please set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in your .env file",
      );
    }

    const hashedPassword = await hash(adminPassword, 12);
    const superAdminId = uuidv4();

    await queryRunner.query(
      `INSERT INTO users (id, email, password, "first_name", "last_name", role, "is_email_verified", "is_active", "created_at", "updated_at")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [
        superAdminId,
        adminEmail,
        hashedPassword,
        adminFirstName,
        adminLastName,
        "super_admin",
        true,
        true,
      ],
    );
    console.log(`✅ Super admin created with email: ${adminEmail}`);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
