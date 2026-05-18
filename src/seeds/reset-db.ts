import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "../../.env") });

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  logging: true,
  entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
});

async function resetDatabase() {
  console.log("🗑️  Resetting database...");

  await AppDataSource.initialize();
  console.log("✅ Database connected");

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Drop all tables
    console.log("🗑️  Dropping all tables...");

    await queryRunner.query(`DROP SCHEMA public CASCADE;`);
    await queryRunner.query(`CREATE SCHEMA public;`);
    const dbUser = process.env.DATABASE_USER || "postgres";
    await queryRunner.query(`GRANT ALL ON SCHEMA public TO "${dbUser}";`);

    console.log("✅ All tables dropped successfully");
    console.log("✅ Database reset complete");
    console.log("🌱 Now run 'pnpm run seed' to populate the database");
  } catch (error) {
    console.error("❌ Reset failed:", error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
