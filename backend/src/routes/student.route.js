import {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentProfilePicture,
  deleteStudentAccount,
  uploadResume,
} from "../controllers/user.crud.controller.js";
import { verifyJWT, isStudent } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/profile").get(verifyJWT, isStudent, getStudentProfile);
router.route("/profile/:id").get(verifyJWT, isStudent, getStudentProfile); //didnt tested

router.route("/profile/update").put(verifyJWT, isStudent, updateStudentProfile);

router
  .route("/profile/picture/upload")
  .post(
    verifyJWT,
    isStudent,
    upload.single("profilePicture"),
    uploadStudentProfilePicture
  );

router
  .route("/upload-resume")
  .post(verifyJWT, isStudent, upload.single("resume"), uploadResume);

router
  .route("/profile/delete")
  .delete(verifyJWT, isStudent, deleteStudentAccount);

export default router;
