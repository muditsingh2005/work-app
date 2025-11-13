import {
  getStartupProfile,
  updateStartupProfile,
} from "../controllers/user.crud.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/profile").get(verifyJWT, getStartupProfile);

router.route("/profile/update").put(verifyJWT, updateStartupProfile);

router.route("/profile/:id").get(verifyJWT, getStartupProfile);

export default router;
