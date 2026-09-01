import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(180),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["ADMIN", "MASTER"]).default("ADMIN")
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(180),
  email: z.string().email(),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MASTER"])
});
