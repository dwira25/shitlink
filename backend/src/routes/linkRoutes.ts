import { Router } from "express";
import {
  activateLink,
  bulkActivate,
  bulkDeactivate,
  bulkDelete,
  createLink,
  deactivateLink,
  deleteLink,
  getLink,
  getLinkStats,
  getQr,
  listLinks,
  updateLink
} from "../controllers/linkController.js";
import { listRatings } from "../controllers/ratingController.js";

export const linkRoutes = Router();

linkRoutes.get("/", listLinks);
linkRoutes.post("/", createLink);
linkRoutes.post("/bulk/activate", bulkActivate);
linkRoutes.post("/bulk/deactivate", bulkDeactivate);
linkRoutes.post("/bulk/delete", bulkDelete);
linkRoutes.get("/:id", getLink);
linkRoutes.put("/:id", updateLink);
linkRoutes.delete("/:id", deleteLink);
linkRoutes.post("/:id/activate", activateLink);
linkRoutes.post("/:id/deactivate", deactivateLink);
linkRoutes.get("/:id/qr", getQr);
linkRoutes.get("/:id/stats", getLinkStats);
linkRoutes.get("/:id/ratings", listRatings);
