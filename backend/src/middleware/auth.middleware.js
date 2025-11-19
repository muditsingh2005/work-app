import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import StudentModel from "../models/Student.model.js";
import StartupModel from "../models/Startup.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new ApiError(500, "ACCESS_TOKEN_SECRET is not configured");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw new ApiError(401, "Token has expired");
      } else if (jwtError.name === "JsonWebTokenError") {
        throw new ApiError(401, "Invalid token signature");
      } else {
        throw new ApiError(
          401,
          `Token verification failed: ${jwtError.message}`
        );
      }
    }

    const { _id, role } = decodedToken;

    if (!_id || !role) {
      throw new ApiError(401, "Token missing required fields");
    }

    let UserModel;
    switch (role) {
      case "student":
        UserModel = StudentModel;
        break;
      case "startup":
        UserModel = StartupModel;
        break;
      default:
        throw new ApiError(401, "Invalid role in token");
    }

    const user = await UserModel.findById(_id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export const isStudent = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized - User not found");
  }

  if (req.user.role !== "student") {
    throw new ApiError(
      403,
      "Access denied - Only students can access this resource"
    );
  }

  next();
});

export const isStartup = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized - User not found");
  }

  if (req.user.role !== "startup") {
    throw new ApiError(
      403,
      "Access denied - Only startups can access this resource"
    );
  }

  next();
});
