import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// DATABASE_URL .env'de olmalı
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing in apps/api/.env");
}

// pg pool
const pool = new Pool({ connectionString });

// PrismaClient artık adapter ile oluşturulmalı (Prisma 7)
export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});