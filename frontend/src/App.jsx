import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Landing
import { LandingPage } from "./components/landing";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RoleSelection from "./pages/auth/RoleSelection";

// Projects
import ProjectListingPage from "./pages/projects/ProjectListingPage";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import ProjectApplicantsPage from "./pages/projects/ProjectApplicantsPage";
import CreateProject from "./pages/projects/CreateProject";

// Dashboard Layout
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardRouter from "./pages/dashboard/DashboardRouter";

import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes - Redirect to /projects if authenticated */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RoleSelection />
                </PublicRoute>
              }
            />
            <Route
              path="/register/:role"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Projects Page - Main page after login */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectListingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Project Details Page */}
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Project Applicants Page */}
            <Route
              path="/projects/:projectId/applicants"
              element={
                <ProtectedRoute>
                  <ProjectApplicantsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Create Project Page */}
            <Route
              path="/startup/create-project"
              element={
                <ProtectedRoute>
                  <CreateProject />
                </ProtectedRoute>
              }
            />

            {/* Protected Dashboard with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardRouter />} />
            </Route>

            {/* Legacy Routes - Redirect to /dashboard */}
            <Route
              path="/student/dashboard"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/startup/dashboard"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* Catch all - redirect based on auth status */}
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
