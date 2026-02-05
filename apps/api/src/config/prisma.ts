import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing (runtime).");
}

const pool = new Pool({ connectionString });

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
