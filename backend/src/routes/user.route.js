import {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentProfilePicture,
  deleteStudentAccount,
} from "../controllers/user.crud.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/profile").get(verifyJWT, getStudentProfile);

router.route("/profile/update").put(verifyJWT, updateStudentProfile);

router
  .route("/profile/picture/upload")
  .post(
    verifyJWT,
    upload.single("profilePicture"),
    uploadStudentProfilePicture
  );

router.route("/profile/delete").delete(verifyJWT, deleteStudentAccount);

router.route("/profile/:id").get(verifyJWT, getStudentProfile); //didnt tested

export default router;
