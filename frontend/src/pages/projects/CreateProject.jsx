import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { startupDashboardAPI } from "../../services/dashboardService";
import "./CreateProject.css";

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: [],
    stipend: "",
    duration: "",
    deadline: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    // Stipend validation
    if (formData.stipend === "" || formData.stipend === null) {
      newErrors.stipend = "Stipend is required";
    } else if (isNaN(formData.stipend) || Number(formData.stipend) < 0) {
      newErrors.stipend = "Stipend must be a positive number";
    }

    // Deadline validation (if provided)
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !formData.requiredSkills.includes(trimmedSkill)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmedSkill],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    try {
      setLoading(true);

      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredSkills: formData.requiredSkills,
        stipend: Number(formData.stipend),
      };

      // Add optional fields if provided
      if (formData.duration.trim()) {
        projectData.duration = formData.duration.trim();
      }

      if (formData.deadline) {
        projectData.deadline = new Date(formData.deadline).toISOString();
      }

      const response = await startupDashboardAPI.createProject(projectData);

      if (response.success) {
        showToast("Project created successfully", "success");

        // Store the new project in localStorage to trigger dashboard refresh
        if (response.data) {
          localStorage.setItem("newProject", JSON.stringify(response.data));
        }

        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating project:", err);
      showToast(
        err.response?.data?.message || "Failed to create project",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Set to tomorrow
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="create-project-page">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`create-project-toast ${toast.type}`}
          >
            <span className="toast-icon">
              {toast.type === "success" ? "✓" : "✕"}
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="create-project-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="create-project-header">
          <h1>Create New Project</h1>
          <p>Fill in the details to post a new project opportunity</p>
        </div>

        <form onSubmit={handleSubmit} className="create-project-form">
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="title">
              Project Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Full-Stack Web Application Development"
              className={errors.title ? "error" : ""}
              disabled={loading}
            />
            {errors.title && (
              <span className="error-message">{errors.title}</span>
            )}
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="description">
              Project Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the project, its goals, and what you're looking for..."
              rows="6"
              className={errors.description ? "error" : ""}
              disabled={loading}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
          </div>

          {/* Two Column Layout for Stipend and Duration */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stipend">
                Stipend (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="stipend"
                name="stipend"
                value={formData.stipend}
                onChange={handleInputChange}
                placeholder="e.g., 15000"
                min="0"
                className={errors.stipend ? "error" : ""}
                disabled={loading}
              />
              {errors.stipend && (
                <span className="error-message">{errors.stipend}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 3 months"
                disabled={loading}
              />
            </div>
          </div>

          {/* Deadline Field */}
          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              min={getTodayDate()}
              className={errors.deadline ? "error" : ""}
              disabled={loading}
            />
            {errors.deadline && (
              <span className="error-message">{errors.deadline}</span>
            )}
          </div>

          {/* Required Skills Field */}
          <div className="form-group">
            <label htmlFor="skills">Required Skills</label>
            <div className="skills-input-wrapper">
              <input
                type="text"
                id="skills"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a skill and press Enter or click Add"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="add-skill-btn"
                disabled={loading || !skillInput.trim()}
              >
                Add
              </button>
            </div>

            {formData.requiredSkills.length > 0 && (
              <div className="skills-tags">
                {formData.requiredSkills.map((skill, index) => (
                  <motion.span
                    key={index}
                    className="skill-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="remove-skill-btn"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">✓</span>
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProject;
