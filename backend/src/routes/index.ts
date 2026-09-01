import { Router } from "express";
import { requireAuth, requireMaster } from "../middleware/authMiddleware.js";
import { analyticsRoutes } from "./analyticsRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { linkRoutes } from "./linkRoutes.js";
import { ratingRoutes } from "./ratingRoutes.js";
import { userRoutes } from "./userRoutes.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/links", requireAuth, linkRoutes);
apiRoutes.use("/analytics", requireAuth, analyticsRoutes);
apiRoutes.use("/users", requireAuth, requireMaster, userRoutes);
apiRoutes.use("/ratings", ratingRoutes);
