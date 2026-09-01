import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[A-Za-z0-9_-]+$/, "Slug may only contain letters, numbers, underscores, and hyphens");

export const linkMutationSchema = z.object({
  title: z.string().trim().min(1).max(180),
  destinationUrl: z.string().trim().url(),
  slug: slugSchema.optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  expiresAt: z.string().datetime().optional().or(z.literal("")).nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  ratingEnabled: z.boolean().default(false),
  minRatingEnabled: z.boolean().default(false),
  minRating: z.coerce.number().int().min(1).max(5).default(3)
});

export const linkQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().optional().default(""),
  filter: z.enum(["all", "active", "inactive", "expired"]).default("all"),
  sort: z.enum(["newest", "oldest", "most_clicks", "least_clicks", "recently_updated"]).default("newest")
});

export const bulkActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1)
});
