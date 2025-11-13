import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import StudentModel from "../models/Student.model.js";

const getStudentProfile = asyncHandler(async (req, res) => {
  const studentId = req.user?._id || req.params?.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required");
  }

  const student = await StudentModel.findById(studentId).select(
    "-password -refreshToken"
  );

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, student, "Student profile fetched successfully")
    );
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  // Get student ID from authenticated user
  const studentId = req.user?._id;

  if (!studentId) {
    throw new ApiError(401, "Unauthorized - Student ID not found");
  }

  // Allowed fields to update
  const allowedFields = [
    "name",
    "skills",
    "about",
    "education",
    "department",
    "year",
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

  if (updateData.name && typeof updateData.name !== "string") {
    throw new ApiError(400, "Name must be a string");
  }

  if (updateData.name && updateData.name.trim().length === 0) {
    throw new ApiError(400, "Name cannot be empty");
  }

  if (updateData.skills && !Array.isArray(updateData.skills)) {
    throw new ApiError(400, "Skills must be an array");
  }

  if (updateData.about && typeof updateData.about !== "string") {
    throw new ApiError(400, "About must be a string");
  }

  if (updateData.education && !Array.isArray(updateData.education)) {
    throw new ApiError(400, "Education must be an array");
  }

  if (updateData.department && typeof updateData.department !== "string") {
    throw new ApiError(400, "Department must be a string");
  }

  if (updateData.year && !Number.isInteger(updateData.year)) {
    throw new ApiError(400, "Year must be an integer");
  }

  if (updateData.year && ![1, 2, 3, 4].includes(updateData.year)) {
    throw new ApiError(400, "Year must be between 1 and 4");
  }

  const updatedStudent = await StudentModel.findByIdAndUpdate(
    studentId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedStudent) {
    throw new ApiError(404, "Student not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedStudent,
        "Student profile updated successfully"
      )
    );
});

export { getStudentProfile, updateStudentProfile };
