import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./RoleBasedRoute.css";

/**
 * RoleBasedRoute - Protects routes and restricts access based on user roles
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route (e.g., ['student', 'startup'])
 * @param {string} redirectTo - Optional custom redirect path for unauthorized users
 */
const RoleBasedRoute = ({ children, allowedRoles = [], redirectTo = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // No role restrictions - allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(user?.role);

  if (!hasRequiredRole) {
    // Use custom redirect or default to role-based dashboard
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Default role-based redirects
    const defaultRedirects = {
      student: "/student/dashboard",
      startup: "/startup/dashboard",
    };

    const redirectPath = defaultRedirects[user?.role] || "/";

    return <Navigate to={redirectPath} replace />;
  }

  // User has required role - render children
  return children;
};

export default RoleBasedRoute;
