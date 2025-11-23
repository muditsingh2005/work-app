import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../services/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./ProjectDetailsPage.css";

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const id = projectId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/api/v4/project/${id}`);

      if (response.data && response.data.data) {
        const projectData = response.data.data;
        setProject(projectData);

        // Check if current user has already applied
        if (user && user.role === "student") {
          const applied = projectData.applicants?.some(
            (applicant) =>
              applicant.student?._id === user.id ||
              applicant.student === user.id
          );
          setHasApplied(applied);
        }
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.response?.data?.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || user.role !== "student") {
      return;
    }

    try {
      setApplying(true);
      await axiosInstance.post(`/api/v4/project/apply/${id}`);

      setHasApplied(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Error applying:", err);
      alert(err.response?.data?.message || "Failed to apply to project");
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="project-details-page">
        <div className="error-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-content"
          >
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/projects")} className="btn-back">
              ← Back to Projects
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details-page">
        <div className="error-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-content"
          >
            <h2>Project Not Found</h2>
            <p>
              The project you're looking for doesn't exist or has been removed.
            </p>
            <button onClick={() => navigate("/projects")} className="btn-back">
              ← Back to Projects
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-details-page">
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="success-toast"
        >
          ✓ Successfully applied to project!
        </motion.div>
      )}

      <div className="details-container">
        <button onClick={() => navigate("/projects")} className="back-button">
          ← Back to Projects
        </button>

        {/* Contact Section - At the Top */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="contact-card"
        >
          <h3>About the Company</h3>
          <p className="contact-name">{project.startup?.name}</p>
          <p className="contact-detail">{project.startup?.domain}</p>
          {project.startup?.founderName && (
            <p className="contact-detail">
              Founder: {project.startup.founderName}
            </p>
          )}
          {project.startup?.email && (
            <p className="contact-email">{project.startup.email}</p>
          )}
        </motion.div>

        <div className="project-details-container">
          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="project-main"
          >
            {/* Hero Section */}
            <div className="hero-section">
              <div className="company-info">
                {project.startup?.logoUrl && (
                  <img
                    src={project.startup.logoUrl}
                    alt={project.startup?.name}
                    className="company-logo"
                  />
                )}
                <div>
                  <h1 className="project-title">{project.title}</h1>
                  <p className="company-name">
                    {project.startup?.name || "Startup"} •{" "}
                    {project.startup?.domain || "Technology"}
                  </p>
                </div>
              </div>

              {/* Skills Tags */}
              {project.requiredSkills && project.requiredSkills.length > 0 && (
                <div className="skills-tags">
                  {project.requiredSkills.map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="skill-tag"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              )}
            </div>

            {/* Description Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="section"
            >
              <h2 className="section-title">About the Project</h2>
              <p className="section-content">{project.description}</p>
            </motion.section>

            {/* Required Skills Section */}
            {project.requiredSkills && project.requiredSkills.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="section"
              >
                <h2 className="section-title">Required Skills</h2>
                <ul className="skills-list">
                  {project.requiredSkills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </motion.section>
            )}
          </motion.main>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="project-sidebar"
          >
            {/* Apply Button - Only for Students */}
            {user && user.role === "student" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                disabled={applying || hasApplied}
                className={`btn-apply ${hasApplied ? "applied" : ""}`}
              >
                {applying
                  ? "Applying..."
                  : hasApplied
                  ? "✓ Applied"
                  : "Apply Now"}
              </motion.button>
            )}

            {/* Project Info Cards */}
            <div className="info-cards">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="info-card"
              >
                <span className="info-icon">💰</span>
                <div>
                  <p className="info-label">Stipend</p>
                  <p className="info-value">
                    {project.stipend
                      ? `₹${project.stipend.toLocaleString()}`
                      : "Unpaid"}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="info-card"
              >
                <span className="info-icon">⏱️</span>
                <div>
                  <p className="info-label">Duration</p>
                  <p className="info-value">{project.duration || "Flexible"}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="info-card"
              >
                <span className="info-icon">📅</span>
                <div>
                  <p className="info-label">Deadline</p>
                  <p className="info-value">{formatDate(project.deadline)}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="info-card"
              >
                <span className="info-icon">👥</span>
                <div>
                  <p className="info-label">Applicants</p>
                  <p className="info-value">
                    {project.applicants?.length || 0}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="info-card"
              >
                <span className="info-icon">📊</span>
                <div>
                  <p className="info-label">Status</p>
                  <p className="info-value status-badge">
                    {project.status || "Open"}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="info-card"
              >
                <span className="info-icon">📝</span>
                <div>
                  <p className="info-label">Posted</p>
                  <p className="info-value">{formatDate(project.createdAt)}</p>
                </div>
              </motion.div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <div className="project-details-page">
      <div className="details-container">
        <div className="skeleton-back"></div>
        <div className="project-details-container">
          <div className="project-main">
            <div className="skeleton-hero">
              <div className="skeleton-logo"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-company"></div>
            </div>
            <div className="skeleton-tags">
              <div className="skeleton-tag"></div>
              <div className="skeleton-tag"></div>
              <div className="skeleton-tag"></div>
            </div>
            <div className="skeleton-section"></div>
            <div className="skeleton-section"></div>
          </div>
          <div className="project-sidebar">
            <div className="skeleton-button"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
