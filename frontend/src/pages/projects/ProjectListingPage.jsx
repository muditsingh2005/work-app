import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { projectAPI } from "../../services/dashboardService";
import ProjectCard from "../../components/projects/ProjectCard";
import ProjectFilters from "../../components/projects/ProjectFilters";
import SearchBar from "../../components/projects/SearchBar";
import Pagination from "../../components/projects/Pagination";
import { CardSkeleton } from "../../components/common/SkeletonLoader";
import "./ProjectListingPage.css";

const ProjectListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedSkills, setSelectedSkills] = useState(
    searchParams.get("skills")?.split(",").filter(Boolean) || []
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    searchParams.get("difficulty") || "all"
  );
  const [deadlineFilter, setDeadlineFilter] = useState(
    searchParams.get("deadline") || "all"
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [projectsPerPage] = useState(12);

  // Fetch projects from backend
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await projectAPI.getAllProjects();
      const projectsData = response.data?.projects || [];

      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Apply filters and search
  useEffect(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (project) =>
          project.title?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.startup?.name?.toLowerCase().includes(query)
      );
    }

    // Category filter (based on startup domain)
    if (selectedCategory !== "all") {
      result = result.filter(
        (project) =>
          project.startup?.domain?.toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter((project) =>
        selectedSkills.some((skill) =>
          project.requiredSkills?.some(
            (reqSkill) => reqSkill.toLowerCase() === skill.toLowerCase()
          )
        )
      );
    }

    // Difficulty filter (based on stipend ranges)
    if (selectedDifficulty !== "all") {
      result = result.filter((project) => {
        const stipend = project.stipend || 0;
        switch (selectedDifficulty) {
          case "beginner":
            return stipend < 5000;
          case "intermediate":
            return stipend >= 5000 && stipend < 15000;
          case "advanced":
            return stipend >= 15000;
          default:
            return true;
        }
      });
    }

    // Deadline filter
    if (deadlineFilter !== "all") {
      const now = new Date();
      result = result.filter((project) => {
        if (!project.deadline) return false;
        const deadline = new Date(project.deadline);
        const daysUntilDeadline = Math.ceil(
          (deadline - now) / (1000 * 60 * 60 * 24)
        );

        switch (deadlineFilter) {
          case "week":
            return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
          case "month":
            return daysUntilDeadline <= 30 && daysUntilDeadline > 0;
          case "expired":
            return daysUntilDeadline < 0;
          default:
            return true;
        }
      });
    }

    setFilteredProjects(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    searchQuery,
    selectedCategory,
    selectedSkills,
    selectedDifficulty,
    deadlineFilter,
    projects,
  ]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedSkills.length > 0)
      params.set("skills", selectedSkills.join(","));
    if (selectedDifficulty !== "all")
      params.set("difficulty", selectedDifficulty);
    if (deadlineFilter !== "all") params.set("deadline", deadlineFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedCategory,
    selectedSkills,
    selectedDifficulty,
    deadlineFilter,
    currentPage,
    setSearchParams,
  ]);

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSkills([]);
    setSelectedDifficulty("all");
    setDeadlineFilter("all");
    setCurrentPage(1);
  };

  // Extract unique categories from projects
  const categories = [
    "all",
    ...new Set(projects.map((p) => p.startup?.domain).filter(Boolean)),
  ];

  // Extract unique skills from projects
  const allSkills = [
    ...new Set(projects.flatMap((p) => p.requiredSkills || [])),
  ];

  if (loading) {
    return (
      <div className="project-listing-page">
        <div className="listing-header">
          <h1>Explore Projects</h1>
          <p>Loading amazing opportunities...</p>
        </div>
        <div className="listing-content">
          <div className="filters-sidebar">
            <div className="skeleton-filter"></div>
          </div>
          <div className="projects-section">
            <div className="projects-grid">
              {[...Array(6)].map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-listing-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Unable to load projects</h2>
          <p>{error}</p>
          <button onClick={fetchProjects} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-listing-page">
      <motion.div
        className="listing-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>🚀 Explore Projects</h1>
        <p>
          Discover {filteredProjects.length} amazing opportunities from top
          startups
        </p>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search projects by title, description, or company..."
        />
      </motion.div>

      <div className="listing-content">
        <ProjectFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          allSkills={allSkills}
          selectedSkills={selectedSkills}
          onSkillsChange={setSelectedSkills}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          deadlineFilter={deadlineFilter}
          onDeadlineChange={setDeadlineFilter}
          onClearFilters={handleClearFilters}
          totalProjects={projects.length}
          filteredCount={filteredProjects.length}
        />

        <div className="projects-section">
          {currentProjects.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="empty-icon">🔍</div>
              <h3>No projects found</h3>
              <p>
                Try adjusting your filters or search query to find what you're
                looking for
              </p>
              <button
                onClick={handleClearFilters}
                className="clear-filters-btn"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <>
              <div className="results-info">
                <p>
                  Showing {indexOfFirstProject + 1}-
                  {Math.min(indexOfLastProject, filteredProjects.length)} of{" "}
                  {filteredProjects.length} projects
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  className="projects-grid"
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentProjects.map((project, index) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onClick={() => handleProjectClick(project._id)}
                      index={index}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectListingPage;
