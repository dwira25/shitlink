import { z } from "zod";

export const linkRatingSettingsSchema = z.object({
  ratingEnabled: z.boolean().default(false),
  minRatingEnabled: z.boolean().default(false),
  minRating: z.coerce.number().int().min(1).max(5).default(3)
});

export const submitRatingSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal(""))
});
