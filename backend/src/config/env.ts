import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),
  JWT_SECRET: z.string().min(32),
  // NOTE: z.coerce.boolean() turns the string "false" into `true` (Boolean("false")
  // is truthy), which would force Secure cookies everywhere. Parse explicitly.
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // "none" untuk deploy BE & FE di domain berbeda (butuh COOKIE_SECURE=true).
  COOKIE_SAMESITE: z.enum(["lax", "none"]).default("lax"),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7)
});

export const env = envSchema.parse(process.env);
