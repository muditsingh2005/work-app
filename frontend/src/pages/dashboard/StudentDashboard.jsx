import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { studentDashboardAPI } from "../../services/dashboardService";
import { DashboardSkeleton } from "../../components/common/SkeletonLoader";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { userProfile } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [stats, setLocalStats] = useState({
    totalApplications: 0,
    acceptedApplications: 0,
    pendingApplications: 0,
  });
  const [myApplications, setMyApplications] = useState([]);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

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
            Welcome back, {userProfile?.name?.split(" ")[0] || "Student"}! 🎓
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
        </div>
        <div className="profile-content">
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Roll No:</span>
              <span className="detail-value">
                {userProfile?.rollNo || "N/A"}
              </span>
            </div>
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
                  <button className="view-button">View Details</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
