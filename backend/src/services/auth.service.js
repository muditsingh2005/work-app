import jwt from "jsonwebtoken";

const generateToken = (user) => {
  if (!user || !user._id) {
    throw new Error("User object with _id is required");
  }

  const payload = {
    _id: user._id,
    role: user.role || "user",
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });

  return token;
};

const verifyToken = (token) => {
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

export { generateToken, verifyToken };
