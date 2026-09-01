import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AuthService } from "../services/authService.js";
import { asyncHandler, ok } from "../utils/http.js";
import { loginSchema } from "../validators/authValidators.js";

const auth = new AuthService();

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  maxAge: env.SESSION_TTL_SECONDS * 1000
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await auth.login(input.email, input.password);

  res.cookie("session", result.session, cookieOptions);
  res.cookie("csrf_token", result.csrfToken, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: env.SESSION_TTL_SECONDS * 1000
  });

  return ok(res, { user: result.user, csrfToken: result.csrfToken });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("session");
  res.clearCookie("csrf_token");
  return ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await auth.me(req.user!.id));
});
