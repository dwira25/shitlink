import argon2 from "argon2";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http.js";

type UserRole = "ADMIN" | "MASTER";

type UserMutation = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
};

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

export class UserService {
  list() {
    return prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "asc" } });
  }

  async get(id: number) {
    const user = await prisma.user.findUnique({ where: { id }, select: publicSelect });
    if (!user) throw new HttpError(404, "User not found");
    return user;
  }

  async create(input: UserMutation) {
    if (!input.password) throw new HttpError(422, "Password is required");
    const password = await argon2.hash(input.password, { type: argon2.argon2id });

    try {
      return await prisma.user.create({
        data: { name: input.name, email: input.email, password, role: input.role },
        select: publicSelect
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new HttpError(409, "Email already exists");
      }
      throw error;
    }
  }

  async update(id: number, input: UserMutation) {
    await this.get(id);

    const data: Record<string, unknown> = {
      name: input.name,
      email: input.email,
      role: input.role
    };
    if (input.password) {
      data.password = await argon2.hash(input.password, { type: argon2.argon2id });
    }

    try {
      return await prisma.user.update({ where: { id }, data, select: publicSelect });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new HttpError(409, "Email already exists");
      }
      throw error;
    }
  }

  async setActive(id: number, actingUserId: number, isActive: boolean) {
    if (id === actingUserId && !isActive) {
      throw new HttpError(422, "You cannot deactivate your own account");
    }
    await this.get(id);
    return prisma.user.update({ where: { id }, data: { isActive }, select: publicSelect });
  }

  async delete(id: number, actingUserId: number) {
    if (id === actingUserId) {
      throw new HttpError(422, "You cannot delete your own account");
    }
    await this.get(id);
    await prisma.user.delete({ where: { id } });
  }

  private isUniqueConstraintError(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
  }
}
