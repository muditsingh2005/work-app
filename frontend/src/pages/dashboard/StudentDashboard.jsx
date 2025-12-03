import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { studentDashboardAPI } from "../../services/dashboardService";
import { DashboardSkeleton } from "../../components/common/SkeletonLoader";
import EditProfileModal from "../../components/student/EditProfileModal";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { userProfile, refreshProfile } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setLocalStats] = useState({
    totalApplications: 0,
    acceptedApplications: 0,
    pendingApplications: 0,
  });
  const [myApplications, setMyApplications] = useState([]);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [resumeUrl, setResumeUrl] = useState(userProfile?.resumeUrl || null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const applicationsRes = await studentDashboardAPI.getAppliedProjects();

      const appliedProjects = applicationsRes.data?.projects || [];

      // For applications, we need to extract the application status for each project
      const applications = appliedProjects.map((project) => {
        const studentApplication = project.applicants?.find(
          (app) =>
            app.student?._id === userProfile?._id ||
            app.student === userProfile?._id
        );
        return {
          ...project,
          applicationStatus: studentApplication?.status || "pending",
          appliedAt: studentApplication?.appliedAt,
        };
      });

      const statsData = {
        totalApplications: applications.length,
        acceptedApplications: applications.filter(
          (app) => app.applicationStatus === "accepted"
        ).length,
        pendingApplications: applications.filter(
          (app) => app.applicationStatus === "pending"
        ).length,
      };

      setLocalStats(statsData);
      setMyApplications(applications.slice(0, 5));
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [hasFetched, userProfile?._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (userProfile?.resumeUrl) {
      setResumeUrl(userProfile.resumeUrl);
    }
  }, [userProfile]);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "badge-warning",
      accepted: "badge-success",
      rejected: "badge-danger",
    };
    return statusMap[status] || "badge-default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleProfileUpdateSuccess = async (updatedProfile) => {
    // Refresh the profile to update across dashboard
    if (refreshProfile) {
      await refreshProfile();
    }
    showToast("Profile updated successfully", "success");
    setIsEditModalOpen(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      showToast("Please select a PDF file", "error");
      e.target.value = "";
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size must be less than 10MB", "error");
      e.target.value = "";
      return;
    }

    try {
      setUploadingResume(true);

      const formData = new FormData();
      formData.append("resume", file);

      const response = await studentDashboardAPI.uploadResume(formData);

      if (response.data?.resumeUrl) {
        setResumeUrl(response.data.resumeUrl);
        // Refresh the profile to update across dashboard
        if (refreshProfile) {
          await refreshProfile();
        }
        showToast(
          resumeUrl
            ? "Resume updated successfully"
            : "Resume uploaded successfully",
          "success"
        );
      }
    } catch (err) {
      console.error("Error uploading resume:", err);
      showToast(
        err.response?.data?.message || "Failed to upload resume",
        "error"
      );
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  const handleViewResume = () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-state">
        <div className="error-icon">⚠️</div>
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <h1>
            Welcome back, {userProfile?.name?.split(" ")[0] || "Student"}!{" "}
            <span className="emoji">🎓</span>
          </h1>
          <p>Here's what's happening with your projects today</p>
        </div>
      </motion.div>

      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon applications">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalApplications}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accepted">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.acceptedApplications}</div>
            <div className="stat-label">Accepted</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingApplications}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="profile-overview-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="card-header">
          <h2>Your Profile</h2>
          <button className="edit-profile-btn" onClick={handleEditProfile}>
            <span className="edit-icon">✏️</span>
            Edit Profile
          </button>
        </div>
        <div className="profile-content">
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Department:</span>
              <span className="detail-value">
                {userProfile?.department || "N/A"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Year:</span>
              <span className="detail-value">{userProfile?.year || "N/A"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">
                {userProfile?.email || "N/A"}
              </span>
            </div>
          </div>

          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div className="skills-showcase">
              <h3>Your Skills</h3>
              <div className="skills-grid">
                {userProfile.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Resume Upload Section */}
      <motion.div
        className="resume-upload-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="card-header">
          <h2>📄 Your Resume</h2>
        </div>
        <div className="resume-upload-content">
          <div className="resume-upload-wrapper">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,application/pdf"
              onChange={handleResumeUpload}
              disabled={uploadingResume}
              style={{ display: "none" }}
            />
            <label
              htmlFor="resume-upload"
              className={`resume-upload-btn ${
                uploadingResume ? "uploading" : ""
              }`}
            >
              {uploadingResume ? (
                <>
                  <span className="upload-spinner">⏳</span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span className="upload-icon">📤</span>
                  <span>{resumeUrl ? "Update Resume" : "Upload Resume"}</span>
                  <span className="upload-hint">PDF only, max 10MB</span>
                </>
              )}
            </label>

            {resumeUrl && (
              <motion.div
                className="resume-display"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  className="resume-view-btn"
                  onClick={handleViewResume}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    className="resume-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span>View Resume</span>
                </motion.button>
                <p className="resume-status">✓ Resume uploaded</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="section-header">
          <h2>📝 My Applications</h2>
        </div>

        {myApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📬</div>
            <h3>No applications yet</h3>
            <p>Start applying to projects to see them here</p>
          </div>
        ) : (
          <div className="applications-list">
            {myApplications.map((application) => (
              <motion.div
                key={application._id}
                className="application-card"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="application-content">
                  <div className="application-info">
                    <h3>{application.title}</h3>
                    <p className="application-company">
                      {application.startup?.name || "Company"}
                    </p>
                  </div>

                  <div className="application-meta">
                    <span className="application-date">
                      Applied: {formatDate(application.appliedAt)}
                    </span>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        application.applicationStatus
                      )}`}
                    >
                      {application.applicationStatus?.charAt(0).toUpperCase() +
                        application.applicationStatus?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="application-actions">
                  <button
                    className="view-button"
                    onClick={() => navigate(`/projects/${application._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`dashboard-toast ${toast.type}`}
          >
            <span className="toast-icon">
              {toast.type === "success" ? "✓" : "✕"}
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={userProfile}
        onSuccess={handleProfileUpdateSuccess}
      />
    </div>
  );
};

export default StudentDashboard;
