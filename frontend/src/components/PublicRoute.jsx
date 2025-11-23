import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This component prevents authenticated users from accessing public pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#667eea",
        }}
      >
        Loading...
      </div>
    );
  }

  // If authenticated, redirect to projects page
  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

export default PublicRoute;
