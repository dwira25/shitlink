import { Router } from "express";
import { loginRateLimit } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { login, logout, me } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/login", loginRateLimit, login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuth, me);
