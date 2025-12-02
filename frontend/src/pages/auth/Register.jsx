import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import FormError from "../../components/common/FormError";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const { registerStudent, registerStartup } = useAuth();

  const [formData, setFormData] = useState({
    // Common fields
    email: "",
    password: "",
    confirmPassword: "",
    // Student fields
    name: "",
    year: "",
    department: "",
    skills: "",
    // Startup fields
    founderName: "",
    description: "",
    logo: null,
    website: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if no role selected
  useEffect(() => {
    if (!role || (role !== "student" && role !== "startup")) {
      navigate("/register");
    }
  }, [role, navigate]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear API error
    if (apiError) {
      setApiError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Role-specific validations
    if (role === "student") {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }

      if (!formData.year) {
        newErrors.year = "Year is required";
      } else if (
        isNaN(formData.year) ||
        formData.year < 1 ||
        formData.year > 5
      ) {
        newErrors.year = "Year must be between 1 and 5";
      }

      if (!formData.department.trim()) {
        newErrors.department = "Department is required";
      }
    } else if (role === "startup") {
      if (!formData.name.trim()) {
        newErrors.name = "Startup name is required";
      }

      if (!formData.founderName.trim()) {
        newErrors.founderName = "Founder name is required";
      }

      if (!formData.website.trim()) {
        newErrors.website = "Website is required";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formData.description.length < 20) {
        newErrors.description = "Description must be at least 20 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let result;

      if (role === "student") {
        // Prepare student data
        const studentData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          year: parseInt(formData.year),
          department: formData.department,
          skills: formData.skills
            ? formData.skills
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s)
            : [],
        };

        result = await registerStudent(studentData);
      } else {
        // Prepare startup data as FormData
        const startupFormData = new FormData();
        startupFormData.append("email", formData.email);
        startupFormData.append("password", formData.password);
        startupFormData.append("name", formData.name);
        startupFormData.append("founderName", formData.founderName);
        startupFormData.append("description", formData.description);
        startupFormData.append("website", formData.website);

        if (formData.logo) {
          startupFormData.append("logo", formData.logo);
        }

        result = await registerStartup(startupFormData);
      }

      if (result.success) {
        // Redirect to projects page after successful registration
        navigate("/projects", { replace: true });
      } else {
        setApiError(result.message);
      }
    } catch (error) {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card register-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="auth-header">
          <motion.div
            className="auth-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {role === "student" ? "🎓" : "🚀"}
          </motion.div>
          <h1 className="auth-title">
            {role === "student"
              ? "Student Registration"
              : "Startup Registration"}
          </h1>
          <p className="auth-subtitle">
            {role === "student"
              ? "Create your student account to start freelancing"
              : "Create your startup account to hire talented students"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <FormError message={apiError} />

          {/* Common Fields */}
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
            icon="📧"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="At least 6 characters"
            icon="🔒"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Re-enter your password"
            icon="🔒"
            required
          />

          {/* Role-specific Fields */}
          {role === "student" ? (
            <>
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="John Doe"
                icon="👤"
                required
              />

              <Input
                label="Year"
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                error={errors.year}
                placeholder="1-5"
                icon="📅"
                required
              />

              <Input
                label="Department"
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                error={errors.department}
                placeholder="Computer Science"
                icon="🏢"
                required
              />

              <Input
                label="Skills (comma-separated)"
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                error={errors.skills}
                placeholder="React, Node.js, Python"
                icon="⚡"
              />
            </>
          ) : (
            <>
              <Input
                label="Startup Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="My Awesome Startup"
                icon="🏢"
                required
              />

              <Input
                label="Founder Name"
                type="text"
                name="founderName"
                value={formData.founderName}
                onChange={handleChange}
                error={errors.founderName}
                placeholder="John Doe"
                icon="👤"
                required
              />
              <Input
                label="Website"
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                error={errors.website}
                placeholder="https://www.example.com"
                icon="🌐"
                required
              />

              <div className="input-wrapper">
                <label htmlFor="description" className="input-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your startup..."
                  className={`input-field textarea-field ${
                    errors.description ? "input-error" : ""
                  }`}
                  rows="4"
                  required
                />
                {errors.description && (
                  <span className="error-message">{errors.description}</span>
                )}
              </div>

              <div className="input-wrapper">
                <label htmlFor="logo" className="input-label">
                  Logo (optional)
                </label>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  onChange={handleChange}
                  accept="image/*"
                  className="file-input"
                />
                {formData.logo && (
                  <span className="file-name">{formData.logo.name}</span>
                )}
              </div>
            </>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link-bold">
              Login
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Background decoration */}
      <div className="auth-bg-decoration">
        <div className="auth-bg-circle circle-1"></div>
        <div className="auth-bg-circle circle-2"></div>
        <div className="auth-bg-circle circle-3"></div>
      </div>
    </div>
  );
};

export default Register;
