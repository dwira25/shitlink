import type { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";
import { userCreateSchema, userUpdateSchema } from "../validators/userValidators.js";

const users = new UserService();

function idParam(req: Request) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(422, "Invalid user id");
  return id;
}

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await users.list());
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await users.get(idParam(req)));
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const input = userCreateSchema.parse(req.body);
  return ok(res.status(201), await users.create(input));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const input = userUpdateSchema.parse(req.body);
  return ok(res, await users.update(idParam(req), input));
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await users.setActive(idParam(req), req.user!.id, true));
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await users.setActive(idParam(req), req.user!.id, false));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await users.delete(idParam(req), req.user!.id);
  return ok(res, { deleted: true });
});
