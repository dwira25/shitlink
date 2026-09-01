import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

type TokenPayload = {
  sub: string;
  email: string;
  role: "ADMIN" | "MASTER";
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.session;

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role
    };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired session"));
  }
}

export function requireMaster(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "MASTER") {
    return next(new HttpError(403, "Master user access required"));
  }
  return next();
}

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  if (req.path === "/api/auth/login" || req.path === "/api/auth/logout") {
    return next();
  }

  // Anonymous public rating submission (visitors are not logged in).
  if (req.path.startsWith("/api/ratings/")) {
    return next();
  }

  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.header("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new HttpError(403, "Invalid CSRF token"));
  }

  return next();
}
