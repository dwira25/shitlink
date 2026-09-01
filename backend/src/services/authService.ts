import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, "Invalid email or password");

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new HttpError(401, "Invalid email or password");

    if (!user.isActive) throw new HttpError(403, "This account has been deactivated");

    const session = jwt.sign(
      { email: user.email, role: user.role },
      env.JWT_SECRET,
      { subject: String(user.id), expiresIn: env.SESSION_TTL_SECONDS }
    );
    const csrfToken = randomBytes(32).toString("hex");

    return {
      session,
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
    if (!user) throw new HttpError(404, "User not found");
    return user;
  }
}
