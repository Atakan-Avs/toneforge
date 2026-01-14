import dotenv from "dotenv";
dotenv.config();

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  JWT_SECRET: mustGet("JWT_SECRET")
};