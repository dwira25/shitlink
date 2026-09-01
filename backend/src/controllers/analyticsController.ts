import type { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService.js";
import { asyncHandler, ok } from "../utils/http.js";

const analytics = new AnalyticsService();

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await analytics.summary(req.user!.id));
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await analytics.dashboard(req.user!.id));
});
