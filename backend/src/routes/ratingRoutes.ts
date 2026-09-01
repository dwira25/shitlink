import { Router } from "express";
import { getRatingPage, submitRating } from "../controllers/ratingController.js";

export const ratingRoutes = Router();

ratingRoutes.get("/:slug", getRatingPage);
ratingRoutes.post("/:slug", submitRating);
