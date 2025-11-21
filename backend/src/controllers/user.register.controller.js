import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import StudentModel from "../models/Student.model.js";
import StartupModel from "../models/Startup.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

const registerStudent = asyncHandler(async (req, res) => {
  const { email, password, ...otherDetails } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existedUser = await StudentModel.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // Normalize form-data fields
  const normalizedDetails = { ...otherDetails };
  if (normalizedDetails.year !== undefined) {
    const yearNum = Number(normalizedDetails.year);
    normalizedDetails.year = Number.isNaN(yearNum)
      ? normalizedDetails.year
      : yearNum;
  }
  if (normalizedDetails.skills !== undefined) {
    if (Array.isArray(normalizedDetails.skills)) {
      // keep as-is
    } else if (typeof normalizedDetails.skills === "string") {
      try {
        const parsed = JSON.parse(normalizedDetails.skills);
        normalizedDetails.skills = Array.isArray(parsed)
          ? parsed
          : [normalizedDetails.skills];
      } catch {
        normalizedDetails.skills = [normalizedDetails.skills];
      }
    } else {
      normalizedDetails.skills = [];
    }
  }

  // Validate required fields
  const { name, year, department } = normalizedDetails;
  if (!name || !year || !department) {
    throw new ApiError(
      400,
      "Name, year, and department are required for students"
    );
  }

  const user = await StudentModel.create({
    email,
    password,
    ...normalizedDetails,
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user
  );

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      "Student registered successfully"
    )
  );
});

const registerStartup = asyncHandler(async (req, res) => {
  const { email, password, ...otherDetails } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existedUser = await StartupModel.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // Validate required fields
  const { name, founderName, description } = otherDetails;
  if (!name || !founderName || !description) {
    throw new ApiError(
      400,
      "Name, founderName, and description are required for startups"
    );
  }

  // Handle logo upload if present
  let logoUrl;
  if (req.files?.logo) {
    const { uploadOnCloudinary } = await import("../utils/cloudinary.js");
    const file = Array.isArray(req.files.logo)
      ? req.files.logo[0]
      : req.files.logo;
    if (!file?.path) {
      throw new ApiError(400, "Logo file not received");
    }
    const uploadResponse = await uploadOnCloudinary(file.path, file.mimetype);
    if (!uploadResponse) {
      throw new ApiError(400, "Logo upload failed");
    }
    logoUrl = uploadResponse.secure_url;
  }

  const user = await StartupModel.create({
    email,
    password,
    ...otherDetails,
    ...(logoUrl && { logoUrl }),
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user
  );

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      "Startup registered successfully"
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check in both Student and Startup models
  let user = await StudentModel.findOne({ email }).select("+password");

  if (!user) {
    user = await StartupModel.findOne({ email }).select("+password");
  }

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user
  );

  // Remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      "User logged in successfully"
    )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let UserModel;
  if (userRole === "student") {
    UserModel = StudentModel;
  } else if (userRole === "startup") {
    UserModel = StartupModel;
  } else {
    throw new ApiError(400, "Invalid user role");
  }

  await UserModel.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Refresh token presented by user
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request - no refresh token provided");
  }

  try {
    // Decode the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Check in both Student and Startup models
    let user = await StudentModel.findById(decodedToken?._id);

    if (!user) {
      user = await StartupModel.findById(decodedToken?._id);
    }

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Verify the refresh token matches the one stored
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user);

    // Remove sensitive fields
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
            user: userData,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerStudent,
  registerStartup,
  loginUser,
  logoutUser,
  refreshAccessToken,
};
