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

export { createProject, updateProject };
