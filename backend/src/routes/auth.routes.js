import { Router } from "express";
import {
  registerStudent,
  registerStartup,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/user.register.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register/student").post(registerStudent);

router
  .route("/register/startup")
  .post(upload.fields([{ name: "logo", maxCount: 1 }]), registerStartup);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

export default router;
