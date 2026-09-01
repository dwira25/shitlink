import { Router } from "express";
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser
} from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.get("/", listUsers);
userRoutes.post("/", createUser);
userRoutes.get("/:id", getUser);
userRoutes.put("/:id", updateUser);
userRoutes.delete("/:id", deleteUser);
userRoutes.post("/:id/activate", activateUser);
userRoutes.post("/:id/deactivate", deactivateUser);
