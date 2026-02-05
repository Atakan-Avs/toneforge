"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
// DATABASE_URL .env'de olmalı
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is missing in apps/api/.env");
}
// pg pool
const pool = new pg_1.Pool({ connectionString });
// PrismaClient artık adapter ile oluşturulmalı (Prisma 7)
exports.prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(pool),
});
//# sourceMappingURL=prisma.js.map