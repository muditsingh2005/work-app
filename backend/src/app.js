import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.route.js";
import startupRoutes from "./routes/startup.route.js";
import projectRoutes from "./routes/project.route.js";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/user", authRoutes);
app.use("/api/v2/student", studentRoutes);
app.use("/api/v3/startup", startupRoutes);
app.use("/api/v4/project", projectRoutes);

export { app };
