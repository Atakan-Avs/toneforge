import "dotenv/config";
import { defineConfig } from "prisma/config";

// Build sırasında DATABASE_URL olmayabilir. Generate için boş geçiyoruz.
// Migrate/deploy sırasında gerçek DATABASE_URL compose env ile gelecek.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/db",
  },
});