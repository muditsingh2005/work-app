import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../services/axiosInstance";
import "./ProjectApplicantsPage.css";

const ProjectApplicantsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/v4/project/applicants/${projectId}`
      );

      if (response.data && response.data.data) {
        const data = response.data.data;
        console.log("API Response Data:", data);
        console.log("Applicants:", data.applicants);
        setProject({ _id: data.projectId, title: data.projectTitle });
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error("Error fetching applicants:", err);
      setError(
        err.response?.data?.message || "Failed to load applicant details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (studentId, newStatus) => {
    try {
      setProcessingId(studentId);

      await axiosInstance.put(
        `/api/v4/project/applicants/${projectId}/${studentId}`,
        { status: newStatus }
      );

      // Update local state
      setApplicants((prev) =>
        prev.map((applicant) => {
          const applicantStudentId = applicant?.student?._id || applicant?._id;
          return applicantStudentId === studentId
            ? { ...applicant, status: newStatus }
            : applicant;
        })
      );

      // Show success toast
      showToast(
        `Application ${newStatus === "accepted" ? "accepted" : "rejected"}`,
        "success"
      );
    } catch (err) {
      console.error("Error updating status:", err);
      showToast(
        err.response?.data?.message || "Failed to update application status",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "status-pending",
      accepted: "status-accepted",
      rejected: "status-rejected",
    };
    return statusMap[status] || "status-default";
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="applicants-page">
        <div className="error-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-content"
          >
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Applicants</h2>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="btn-back">
              ← Go Back
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="applicants-page">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`toast ${toast.type}`}
          >
            <span className="toast-icon">
              {toast.type === "success" ? "✓" : "✕"}
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="applicants-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
          <div className="header-content">
            <h1>{project?.title}</h1>
            <p className="project-subtitle">
              {applicants.length} Applicant{applicants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>

        {/* Applicants List */}
        {applicants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="empty-state"
          >
            <div className="empty-icon">📭</div>
            <h3>No Applicants Yet</h3>
            <p>Check back later when students start applying to this project</p>
          </motion.div>
        ) : (
          <div className="applicants-grid">
            {applicants.map((applicant, index) => {
              // Safe access to student data
              const student = applicant?.student || {};
              const studentId = student._id || applicant._id;

              return (
                <motion.div
                  key={studentId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="applicant-card"
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="applicant-info">
                      <div className="avatar">
                        {student.firstName?.[0] || "S"}
                        {student.lastName?.[0] || ""}
                      </div>
                      <div className="name-section">
                        <h3>
                          {student.firstName || "Student"}{" "}
                          {student.lastName || ""}
                        </h3>
                        <p className="email">{student.email || "N/A"}</p>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        applicant.status
                      )}`}
                    >
                      {applicant.status?.charAt(0).toUpperCase() +
                        applicant.status?.slice(1)}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    {/* Department/Branch */}
                    {student.department && (
                      <div className="info-row">
                        <span className="info-icon">🎓</span>
                        <span className="info-label">Department:</span>
                        <span className="info-value">{student.department}</span>
                      </div>
                    )}

                    {/* Skills */}
                    {student.skills && student.skills.length > 0 && (
                      <div className="skills-section">
                        <span className="info-icon">💼</span>
                        <span className="info-label">Skills:</span>
                        <div className="skills-tags">
                          {student.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                          {student.skills.length > 5 && (
                            <span className="skill-tag">
                              +{student.skills.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resume Link */}
                    {student.resumeUrl && (
                      <div className="info-row">
                        <span className="info-icon">📄</span>
                        <a
                          href={student.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resume-link"
                        >
                          View Resume
                        </a>
                      </div>
                    )}

                    {/* Applied Date */}
                    <div className="info-row">
                      <span className="info-icon">📅</span>
                      <span className="info-label">Applied:</span>
                      <span className="info-value">
                        {formatDate(applicant.appliedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="card-footer">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusUpdate(studentId, "accepted")}
                      disabled={
                        applicant.status !== "pending" ||
                        processingId === studentId
                      }
                      className={`action-btn accept ${
                        applicant.status === "accepted" ? "selected" : ""
                      }`}
                    >
                      {processingId === studentId
                        ? "Processing..."
                        : applicant.status === "accepted"
                        ? "✓ Accepted"
                        : "Accept"}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusUpdate(studentId, "rejected")}
                      disabled={
                        applicant.status !== "pending" ||
                        processingId === studentId
                      }
                      className={`action-btn reject ${
                        applicant.status === "rejected" ? "selected" : ""
                      }`}
                    >
                      {processingId === studentId
                        ? "Processing..."
                        : applicant.status === "rejected"
                        ? "✕ Rejected"
                        : "Reject"}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="applicants-page">
      <div className="applicants-container">
        <div className="skeleton-header">
          <div className="skeleton-back"></div>
          <div className="skeleton-title"></div>
        </div>
        <div className="applicants-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-name"></div>
              <div className="skeleton-info"></div>
              <div className="skeleton-buttons"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectApplicantsPage;
