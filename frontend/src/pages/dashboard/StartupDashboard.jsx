import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { startupDashboardAPI } from "../../services/dashboardService";
import { DashboardSkeleton } from "../../components/common/SkeletonLoader";
import "./StartupDashboard.css";

const StartupDashboard = () => {
  const { userProfile } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setLocalStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalApplicants: 0,
    hiredStudents: 0,
  });
  const [myProjects, setMyProjects] = useState([]);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const projectsRes = await startupDashboardAPI.getMyProjects();
      const projects = projectsRes.data?.projects || [];

      const statsData = {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === "open").length,
        totalApplicants: projects.reduce(
          (sum, p) => sum + (p.applicants?.length || 0),
          0
        ),
        hiredStudents: projects.reduce(
          (sum, p) =>
            sum +
            (p.applicants?.filter((a) => a.status === "accepted").length || 0),
          0
        ),
      };

      setLocalStats(statsData);
      setMyProjects(projects);
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [hasFetched]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getProjectStatusClass = (status) => {
    const statusMap = {
      open: "status-open",
      closed: "status-closed",
      completed: "status-completed",
    };
    return statusMap[status] || "status-default";
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
      <div className="startup-dashboard">
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
    <div className="startup-dashboard">
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <h1>Welcome back, {userProfile?.name || "Startup"}! 🚀</h1>
          <p>Manage your projects and connect with talented students</p>
        </div>
      </motion.div>

      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon projects">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">🔥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.activeProjects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon applicants">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalApplicants}</div>
            <div className="stat-label">Total Applicants</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon hired">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.hiredStudents}</div>
            <div className="stat-label">Hired Students</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="company-overview-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="card-header">
          <h2>Company Profile</h2>
        </div>
        <div className="company-content">
          <div className="company-details">
            <div className="detail-row">
              <span className="detail-label">Founder:</span>
              <span className="detail-value">
                {userProfile?.founderName || "N/A"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">
                {userProfile?.email || "N/A"}
              </span>
            </div>
            {userProfile?.website && (
              <div className="detail-row">
                <span className="detail-label">Website:</span>
                <a
                  href={userProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  {userProfile.website}
                </a>
              </div>
            )}
            {userProfile?.description && (
              <div className="detail-row full-width">
                <span className="detail-label">About:</span>
                <span className="detail-value">{userProfile.description}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="section-header">
          <h2>📋 Your Projects</h2>
          <button className="create-button">+ Create Project</button>
        </div>

        {myProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No projects yet</h3>
            <p>Create your first project to start hiring talented students</p>
            <button className="create-project-btn">Create First Project</button>
          </div>
        ) : (
          <div className="projects-list">
            {myProjects.map((project) => (
              <motion.div
                key={project._id}
                className="startup-project-card"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="project-main">
                  <div className="project-info">
                    <div className="project-title-row">
                      <h3>{project.title}</h3>
                      <span
                        className={`project-status ${getProjectStatusClass(
                          project.status
                        )}`}
                      >
                        {project.status?.charAt(0).toUpperCase() +
                          project.status?.slice(1)}
                      </span>
                    </div>
                    <p className="project-desc">
                      {project.description?.substring(0, 150)}
                      {project.description?.length > 150 ? "..." : ""}
                    </p>

                    <div className="project-meta-row">
                      <span className="meta-badge stipend">
                        💰 ₹{project.stipend?.toLocaleString() || 0}
                      </span>
                      <span className="meta-badge duration">
                        ⏱️ {project.duration || "Flexible"}
                      </span>
                      <span className="meta-badge applicants">
                        👥 {project.applicants?.length || 0} Applicants
                      </span>
                    </div>

                    {project.requiredSkills &&
                      project.requiredSkills.length > 0 && (
                        <div className="project-skills-row">
                          {project.requiredSkills
                            .slice(0, 4)
                            .map((skill, index) => (
                              <span key={index} className="skill-chip">
                                {skill}
                              </span>
                            ))}
                          {project.requiredSkills.length > 4 && (
                            <span className="skill-chip">
                              +{project.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                  </div>

                  <div className="project-actions">
                    <button
                      className="action-btn view"
                      onClick={() =>
                        navigate(`/projects/${project._id}/applicants`)
                      }
                    >
                      View Applicants
                    </button>
                    <button className="action-btn edit">Edit</button>
                    <button className="action-btn delete">Delete</button>
                  </div>
                </div>

                <div className="project-footer-info">
                  <span className="footer-text">
                    Created: {formatDate(project.createdAt)}
                  </span>
                  <span className="footer-text">
                    Deadline: {formatDate(project.deadline)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StartupDashboard;
