import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ProjectModel from "../models/Project.model.js";
import StartupModel from "../models/Startup.model.js";

const createProject = asyncHandler(async (req, res) => {
  // Get startup ID from authenticated user
  const startupId = req.user?._id;

  if (!startupId) {
    throw new ApiError(401, "Unauthorized - Startup ID not found");
  }

  const startup = await StartupModel.findById(startupId);

  if (!startup) {
    throw new ApiError(404, "Startup not found");
  }

  if (startup.role !== "startup") {
    throw new ApiError(403, "Only startups can create projects");
  }

  const { title, description, requiredSkills, stipend, duration, deadline } =
    req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  if (typeof title !== "string") {
    throw new ApiError(400, "Title must be a string");
  }

  if (typeof description !== "string") {
    throw new ApiError(400, "Description must be a string");
  }

  if (title.trim().length === 0) {
    throw new ApiError(400, "Title cannot be empty");
  }

  if (description.trim().length === 0) {
    throw new ApiError(400, "Description cannot be empty");
  }

  if (requiredSkills && !Array.isArray(requiredSkills)) {
    throw new ApiError(400, "Required skills must be an array");
  }

  if (stipend == null) {
    throw new ApiError(400, "Stipend field is required");
  }

  if (duration && typeof duration !== "string") {
    throw new ApiError(400, "Duration must be a string");
  }

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new ApiError(400, "Invalid deadline date format");
    }

    if (deadlineDate < new Date()) {
      throw new ApiError(400, "Deadline must be in the future");
    }
  }

  const projectData = {
    title: title.trim(),
    description: description.trim(),
    startup: startupId,
    requiredSkills: requiredSkills || [],
    stipend: stipend || 0,
  };

  if (duration) {
    projectData.duration = duration.trim();
  }

  if (deadline) {
    projectData.deadline = new Date(deadline);
  }

  const project = await ProjectModel.create(projectData);

  if (!project) {
    throw new ApiError(500, "Failed to create project");
  }

  // Add project to startup's postedProjects array
  await StartupModel.findByIdAndUpdate(
    startupId,
    { $push: { postedProjects: project._id } },
    { new: true }
  );

  const populatedProject = await project.populate(
    "startup",
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedProject, "Project created successfully")
    );
});

const updateProject = asyncHandler(async (req, res) => {
  // Get startup ID from authenticated user
  const startupId = req.user?._id;

  if (!startupId) {
    throw new ApiError(401, "Unauthorized - Startup ID not found");
  }

  const projectId = req.params?.id;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.startup.toString() !== startupId.toString()) {
    throw new ApiError(403, "You are not authorized to update this project");
  }

  const allowedFields = [
    "title",
    "description",
    "requiredSkills",
    "stipend",
    "duration",
    "deadline",
    "status",
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      updateData[field] = req.body[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  if (updateData.title && typeof updateData.title !== "string") {
    throw new ApiError(400, "Title must be a string");
  }

  if (updateData.title && updateData.title.trim().length === 0) {
    throw new ApiError(400, "Title cannot be empty");
  }

  if (updateData.description && typeof updateData.description !== "string") {
    throw new ApiError(400, "Description must be a string");
  }

  if (updateData.description && updateData.description.trim().length === 0) {
    throw new ApiError(400, "Description cannot be empty");
  }

  if (updateData.requiredSkills && !Array.isArray(updateData.requiredSkills)) {
    throw new ApiError(400, "Required skills must be an array");
  }

  if (updateData.stipend !== undefined && updateData.stipend !== null) {
    if (typeof updateData.stipend !== "number") {
      throw new ApiError(400, "Stipend must be a number");
    }

    if (updateData.stipend < 0) {
      throw new ApiError(400, "Stipend cannot be negative");
    }
  }

  if (updateData.duration && typeof updateData.duration !== "string") {
    throw new ApiError(400, "Duration must be a string");
  }

  if (updateData.deadline) {
    const deadlineDate = new Date(updateData.deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new ApiError(400, "Invalid deadline date format");
    }

    if (deadlineDate < new Date()) {
      throw new ApiError(400, "Deadline must be in the future");
    }

    updateData.deadline = deadlineDate;
  }

  if (updateData.status) {
    const validStatuses = ["open", "in-progress", "completed"];
    if (!validStatuses.includes(updateData.status)) {
      throw new ApiError(
        400,
        'Status must be one of: "open", "in-progress", "completed"'
      );
    }
  }

  if (updateData.title) {
    updateData.title = updateData.title.trim();
  }

  if (updateData.description) {
    updateData.description = updateData.description.trim();
  }

  if (updateData.duration) {
    updateData.duration = updateData.duration.trim();
  }

  // Update project in database
  const updatedProject = await ProjectModel.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("startup", "-password -refreshToken");

  if (!updatedProject) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const startupId = req.user?._id;

  if (!startupId) {
    throw new ApiError(401, "Unauthorized - Startup ID not found");
  }

  const projectId = req.params?.id;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.startup.toString() !== startupId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this project");
  }

  await ProjectModel.findByIdAndDelete(projectId);

  await StartupModel.findByIdAndUpdate(
    startupId,
    { $pull: { postedProjects: projectId } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deletedProjectId: projectId,
        deletedProjectTitle: project.title,
        deletedAt: new Date().toISOString(),
      },
      "Project deleted successfully"
    )
  );
});

const getStartupProjects = asyncHandler(async (req, res) => {
  const startupId = req.user?._id;

  if (!startupId) {
    throw new ApiError(401, "Unauthorized - Startup ID not found");
  }

  const startup = await StartupModel.findById(startupId);

  if (!startup) {
    throw new ApiError(404, "Startup not found");
  }

  const projects = await ProjectModel.find({ startup: startupId }).populate(
    "startup",
    "-password -refreshToken"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: projects.length,
        projects: projects,
      },
      "Startup projects fetched successfully"
    )
  );
});

const getAllProjects = asyncHandler(async (req, res) => {
  // Fetch all projects from the database
  const projects = await ProjectModel.find()
    .populate("startup", "name domain email founderName logoUrl")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: projects.length,
        projects: projects,
      },
      "All projects fetched successfully"
    )
  );
});

const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Project ID is required");
  }

  const project = await ProjectModel.findById(id)
    .populate("startup", "name domain email founderName logoUrl")
    .populate("applicants.student", "firstName lastName email")
    .populate("selectedStudents", "firstName lastName email");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const applyToProject = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;

  if (!studentId) {
    throw new ApiError(401, "Unauthorized - Student ID not found");
  }

  const { projectId } = req.params;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Initialize applicants array if it doesn't exist
  if (!project.applicants) {
    project.applicants = [];
  }

  // Check if student has already applied
  const alreadyApplied = project.applicants.some((applicant) => {
    // Handle both new format (applicant.student) and old format (applicant is just ID)
    const applicantId = applicant.student || applicant;
    return applicantId.toString() === studentId.toString();
  });

  if (alreadyApplied) {
    throw new ApiError(400, "You have already applied to this project");
  }

  // Add student to applicants array with pending status
  project.applicants.push({
    student: studentId,
    status: "pending",
  });
  await project.save();

  // Populate and return updated applicants
  const updatedProject = await ProjectModel.findById(projectId).populate(
    "applicants.student",
    "firstName lastName email"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        projectId: updatedProject._id,
        applicants: updatedProject.applicants,
        applicantCount: updatedProject.applicants.length,
      },
      "Successfully applied to project"
    )
  );
});

const getStudentAppliedProjects = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;

  if (!studentId) {
    throw new ApiError(401, "Unauthorized - Student ID not found");
  }

  // Fetch all projects where student ID exists in applicants array
  const projects = await ProjectModel.find({
    "applicants.student": studentId,
  })
    .populate("startup", "name domain email founderName logoUrl")
    .populate("selectedStudents", "firstName lastName email")
    .populate("applicants.student", "firstName lastName email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: projects.length,
        projects: projects,
      },
      "Student applied projects fetched successfully"
    )
  );
});

const getProjectApplicants = asyncHandler(async (req, res) => {
  // Get startup ID from authenticated user
  const startupId = req.user?._id;

  if (!startupId) {
    throw new ApiError(401, "Unauthorized - Startup ID not found");
  }

  // Get project ID from params
  const { projectId } = req.params;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  // Find the project
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Verify that the authenticated startup owns this project
  if (project.startup.toString() !== startupId.toString()) {
    throw new ApiError(403, "Unauthorized - You do not own this project");
  }

  // Populate applicants with student details
  const populatedProject = await ProjectModel.findById(projectId).populate(
    "applicants.student",
    "firstName lastName email skills year semester batch mobileNumber department resumeUrl"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        projectId: project._id,
        projectTitle: project.title,
        applicantCount: populatedProject.applicants.length,
        applicants: populatedProject.applicants,
      },
      "Project applicants fetched successfully"
    )
  );
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const startupId = req.user?._id;

  if (!startupId) {
    throw new ApiError(401, "Unauthorized - Startup ID not found");
  }

  const { projectId, studentId } = req.params;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  if (!studentId) {
    throw new ApiError(400, "Student ID is required");
  }

  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const validStatuses = ["pending", "accepted", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be one of: pending, accepted, rejected"
    );
  }

  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.startup.toString() !== startupId.toString()) {
    throw new ApiError(403, "Unauthorized - You do not own this project");
  }

  let applicantIndex = -1;
  let foundApplicant = null;

  // Check if applicants have proper structure, skip corrupted data
  for (let i = 0; i < project.applicants.length; i++) {
    const applicant = project.applicants[i];

    // Skip corrupted data (has buffer field, no student, no proper status)
    if (applicant.buffer || typeof applicant !== "object") {
      continue;
    }

    const applicantId = applicant.student ? applicant.student : applicant;

    try {
      if (
        applicantId &&
        applicantId.toString &&
        applicantId.toString() === studentId.toString()
      ) {
        applicantIndex = i;
        foundApplicant = applicant;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (applicantIndex === -1) {
    throw new ApiError(
      404,
      "Applicant not found for this project. Please ensure the student has applied to this project."
    );
  }

  if (project.applicants[applicantIndex].student) {
    project.applicants[applicantIndex].status = status;
  } else {
    // Convert old format to new format
    project.applicants[applicantIndex] = {
      student: project.applicants[applicantIndex],
      status: status,
      appliedAt: new Date(),
    };
  }
  await project.save();

  // Populate and return the updated project
  const updatedProject = await ProjectModel.findById(projectId).populate(
    "applicants.student",
    "firstName lastName email skills year semester batch"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        projectId: updatedProject._id,
        projectTitle: updatedProject.title,
        applicants: updatedProject.applicants,
      },
      `Application status updated to ${status}`
    )
  );
});

export {
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
};
