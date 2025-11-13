import {
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/user.crud.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/profile").get(verifyJWT, getStudentProfile);

router.route("/profile/update").put(verifyJWT, updateStudentProfile);

router.route("/profile/:id").get(verifyJWT, getStudentProfile); //didnt tested

export default router;
