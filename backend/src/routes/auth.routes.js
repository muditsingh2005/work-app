import { Router } from "express";
import {
  registerStudent,
  registerStartup,
  uploadResume,
} from "../controllers/user.register.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Student registration route - JSON only, no file upload
router.route("/register/student").post(registerStudent);

// Startup registration route - can include logo upload
router
  .route("/register/startup")
  .post(upload.fields([{ name: "logo", maxCount: 1 }]), registerStartup);

// Resume upload route - requires authentication
// The studentId is extracted from the authenticated user (req.user)
router
  .route("/upload-resume")
  .post(verifyJWT, upload.single("resume"), uploadResume);

export default router;
