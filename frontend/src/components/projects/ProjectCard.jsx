import React from "react";
import { motion } from "framer-motion";
import "./ProjectCard.css";

const ProjectCard = ({ project, onClick, index }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { text: "Expired", class: "expired" };
    if (daysUntil <= 3) return { text: `${daysUntil}d left`, class: "urgent" };
    if (daysUntil <= 7) return { text: `${daysUntil}d left`, class: "soon" };
    return { text: formatDate(deadline), class: "normal" };
  };

  const deadlineStatus = getDeadlineStatus(project.deadline);

  return (
    <motion.div
      className="project-card"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" }}
    >
      {/* Startup Logo & Name */}
      <div className="card-header">
        <div className="company-info">
          {project.startup?.logoUrl ? (
            <img
              src={project.startup.logoUrl}
              alt={project.startup.name}
              className="company-logo"
            />
          ) : (
            <div className="company-logo-placeholder">
              {project.startup?.name?.charAt(0) || "S"}
            </div>
          )}
          <div className="company-details">
            <h4>{project.startup?.name || "Startup"}</h4>
            {project.startup?.domain && (
              <span className="company-domain">{project.startup.domain}</span>
            )}
          </div>
        </div>
        {deadlineStatus && (
          <span className={`deadline-badge ${deadlineStatus.class}`}>
            {deadlineStatus.text}
          </span>
        )}
      </div>

      {/* Project Title */}
      <h3 className="project-title">{project.title}</h3>

      {/* Project Description */}
      <p className="project-description">
        {project.description?.substring(0, 120)}
        {project.description?.length > 120 ? "..." : ""}
      </p>

      {/* Skills */}
      {project.requiredSkills && project.requiredSkills.length > 0 && (
        <div className="project-skills">
          {project.requiredSkills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
            </span>
          ))}
          {project.requiredSkills.length > 3 && (
            <span className="skill-tag more">
              +{project.requiredSkills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer - Stipend & Duration */}
      <div className="card-footer">
        <div className="footer-item stipend">
          <span className="icon">💰</span>
          <span className="value">
            ₹{project.stipend?.toLocaleString() || "0"}/month
          </span>
        </div>
        <div className="footer-item duration">
          <span className="icon">⏱️</span>
          <span className="value">{project.duration || "Flexible"}</span>
        </div>
      </div>

      {/* Applicants Count (if available) */}
      {project.applicants && project.applicants.length > 0 && (
        <div className="applicants-count">
          <span className="icon">👥</span>
          <span>{project.applicants.length} applicants</span>
        </div>
      )}

      {/* Status Badge */}
      <div className={`status-badge status-${project.status || "open"}`}>
        {project.status === "open" ? "🟢 Open" : "🔴 Closed"}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
