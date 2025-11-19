import {
  getStartupProfile,
  updateStartupProfile,
  deleteStartupAccount,
} from "../controllers/user.crud.controller.js";
import { verifyJWT, isStartup } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/profile").get(verifyJWT, isStartup, getStartupProfile);

router.route("/profile/update").put(verifyJWT, isStartup, updateStartupProfile);

router
  .route("/profile/delete")
  .delete(verifyJWT, isStartup, deleteStartupAccount);

router.route("/profile/:id").get(verifyJWT, isStartup, getStartupProfile);

export default router;
