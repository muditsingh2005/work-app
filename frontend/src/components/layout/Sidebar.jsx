import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  studentDashboardAPI,
  startupDashboardAPI,
} from "../../services/dashboardService";
import "./Sidebar.css";

const Sidebar = ({
  user,
  loading,
  onLogout,
  isOpen,
  onClose,
  onProfileUpdate,
}) => {
  const location = useLocation();
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [{ path: "/dashboard", label: "Dashboard", icon: "📊" }];

    if (user?.role === "student") {
      return [
        ...baseItems,
        { path: "/dashboard/projects", label: "Browse Projects", icon: "🔍" },
        // {
        //   path: "/dashboard/applications",
        //   label: "My Applications",
        //   icon: "📝",
        // },
        { path: "/dashboard/profile", label: "Profile", icon: "👤" },
      ];
    } else if (user?.role === "startup") {
      return [
        ...baseItems,
        { path: "/startup/create-project", label: "Post Project", icon: "➕" },
        {
          path: "/dashboard/hired-students",
          label: "Hired Students",
          icon: "👥",
        },
        { path: "/dashboard/profile", label: "Profile", icon: "👤" },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const handleEditPictureClick = () => {
    if (user?.role !== "student" && user?.role !== "startup") return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingPicture(true);

      const formData = new FormData();
      let response;

      if (user?.role === "student") {
        formData.append("profilePicture", file);
        response = await studentDashboardAPI.uploadProfilePicture(formData);

        if (response.data?.profilePictureUrl) {
          // Trigger profile refresh in parent
          if (onProfileUpdate) {
            await onProfileUpdate();
          }
          alert("Profile picture updated successfully!");
        }
      } else if (user?.role === "startup") {
        formData.append("logo", file);
        response = await startupDashboardAPI.uploadLogo(formData);

        if (response.data?.logoUrl) {
          // Trigger profile refresh in parent
          if (onProfileUpdate) {
            await onProfileUpdate();
          }
          alert("Logo updated successfully!");
        }
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      const imageType = user?.role === "startup" ? "logo" : "profile picture";
      alert(err.response?.data?.message || `Failed to upload ${imageType}`);
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <Motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Motion.aside
        className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Campus Freelance Hub</h2>
          <button className="sidebar-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* User Profile Section */}
        <div className="sidebar-profile">
          {loading ? (
            <div className="profile-skeleton">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-text"></div>
            </div>
          ) : (
            <>
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                  {user?.profilePicture || user?.logoUrl ? (
                    <img
                      src={user?.profilePicture || user?.logoUrl}
                      alt={user?.name}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                {(user?.role === "student" || user?.role === "startup") && (
                  <>
                    <button
                      className="edit-avatar-btn"
                      onClick={handleEditPictureClick}
                      disabled={uploadingPicture}
                      title={
                        user?.role === "startup"
                          ? "Change logo"
                          : "Change profile picture"
                      }
                    >
                      {uploadingPicture ? "⏳" : "✏️"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </>
                )}
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{user?.name || "User"}</h3>
                <span className="profile-role">
                  {user?.role === "student" ? "🎓 Student" : "🚀 Startup"}
                </span>
                {user?.department && (
                  <p className="profile-meta">{user.department}</p>
                )}
                {user?.founderName && (
                  <p className="profile-meta">Founder: {user.founderName}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "nav-item-active" : ""
              }`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </Motion.aside>
    </>
  );
};

export default Sidebar;
