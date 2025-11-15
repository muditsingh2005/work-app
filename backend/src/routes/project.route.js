import {
  createProject,
  updateProject,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/create").post(verifyJWT, createProject);

router.route("/update/:id").put(verifyJWT, updateProject);

export default router;
