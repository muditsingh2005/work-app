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

export { createProject };
