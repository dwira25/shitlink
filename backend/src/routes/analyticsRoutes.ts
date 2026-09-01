import { Router } from "express";
import { getAnalytics, getDashboard } from "../controllers/analyticsController.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/", getAnalytics);
analyticsRoutes.get("/dashboard", getDashboard);
