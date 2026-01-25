import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config({ path: ".env" });

// Validate required environment variables
if (!process.env.DATABASE_PASSWORD) {
  throw new Error("DATABASE_PASSWORD environment variable is required");
}

export default new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || "nanthus_kitchen",
  entities: [join(__dirname, "**/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "migrations/*{.ts,.js}")],
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
});
