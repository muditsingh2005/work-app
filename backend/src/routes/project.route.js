import { createProject } from "../controllers/project.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/create").post(verifyJWT, createProject);

export default router;
