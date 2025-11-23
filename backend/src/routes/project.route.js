import {
  createProject,
  updateProject,
  deleteProject,
  getStartupProjects,
  getAllProjects,
  getProjectById,
  applyToProject,
  getStudentAppliedProjects,
  getProjectApplicants,
  updateApplicationStatus,
} from "../controllers/project.controller.js";
import {
  verifyJWT,
  isStudent,
  isStartup,
} from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

// Specific routes MUST come before parameterized routes
router.route("/all-projects").get(getAllProjects);

router.route("/create").post(verifyJWT, isStartup, createProject);

router.route("/my-projects").get(verifyJWT, isStartup, getStartupProjects);

router.route("/apply/:projectId").post(verifyJWT, isStudent, applyToProject);

router
  .route("/applied-projects")
  .get(verifyJWT, isStudent, getStudentAppliedProjects);

router
  .route("/applicants/:projectId")
  .get(verifyJWT, isStartup, getProjectApplicants);

router
  .route("/applicants/:projectId/:studentId")
  .put(verifyJWT, isStartup, updateApplicationStatus);

router.route("/update/:id").put(verifyJWT, isStartup, updateProject);

router.route("/delete/:id").delete(verifyJWT, isStartup, deleteProject);

router.route("/:id").get(getProjectById);

export default router;
