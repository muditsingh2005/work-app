import React from "react";
import "./ProjectFilters.css";

const ProjectFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  allSkills,
  selectedSkills,
  onSkillsChange,
  selectedDifficulty,
  onDifficultyChange,
  deadlineFilter,
  onDeadlineChange,
  onClearFilters,
  totalProjects,
  filteredCount,
}) => {
  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedSkills.length > 0 ||
    selectedDifficulty !== "all" ||
    deadlineFilter !== "all";

  return (
    <div className="filters-sidebar">
      <div className="filters-header">
        <h3>🔍 Filters</h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="clear-all-btn">
            Clear All
          </button>
        )}
      </div>

      <div className="filter-results-count">
        <p>
          {filteredCount} of {totalProjects} projects
        </p>
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <h4>Category</h4>
        <div className="filter-options">
          {categories.map((category) => (
            <label key={category} className="filter-option">
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={(e) => onCategoryChange(e.target.value)}
              />
              <span className="radio-label">
                {category === "all" ? "All Categories" : category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Skills Filter */}
      <div className="filter-group">
        <h4>Required Skills</h4>
        <div className="filter-options skills-filter">
          {allSkills.slice(0, 10).map((skill) => (
            <label key={skill} className="filter-option checkbox">
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill)}
                onChange={() => handleSkillToggle(skill)}
              />
              <span className="checkbox-label">{skill}</span>
            </label>
          ))}
          {allSkills.length > 10 && (
            <p className="more-text">+{allSkills.length - 10} more skills</p>
          )}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="filter-group">
        <h4>Difficulty Level</h4>
        <div className="filter-options">
          <label className="filter-option">
            <input
              type="radio"
              name="difficulty"
              value="all"
              checked={selectedDifficulty === "all"}
              onChange={(e) => onDifficultyChange(e.target.value)}
            />
            <span className="radio-label">All Levels</span>
          </label>
          <label className="filter-option">
            <input
              type="radio"
              name="difficulty"
              value="beginner"
              checked={selectedDifficulty === "beginner"}
              onChange={(e) => onDifficultyChange(e.target.value)}
            />
            <span className="radio-label">
              🟢 Beginner <span className="level-hint">(&lt; ₹5k)</span>
            </span>
          </label>
          <label className="filter-option">
            <input
              type="radio"
              name="difficulty"
              value="intermediate"
              checked={selectedDifficulty === "intermediate"}
              onChange={(e) => onDifficultyChange(e.target.value)}
            />
            <span className="radio-label">
              🟡 Intermediate <span className="level-hint">(₹5k-15k)</span>
            </span>
          </label>
          <label className="filter-option">
            <input
              type="radio"
              name="difficulty"
              value="advanced"
              checked={selectedDifficulty === "advanced"}
              onChange={(e) => onDifficultyChange(e.target.value)}
            />
            <span className="radio-label">
              🔴 Advanced <span className="level-hint">(&gt; ₹15k)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Deadline Filter */}
      <div className="filter-group">
        <h4>Deadline</h4>
        <div className="filter-options">
          <label className="filter-option">
            <input
              type="radio"
              name="deadline"
              value="all"
              checked={deadlineFilter === "all"}
              onChange={(e) => onDeadlineChange(e.target.value)}
            />
            <span className="radio-label">All Deadlines</span>
          </label>
          <label className="filter-option">
            <input
              type="radio"
              name="deadline"
              value="week"
              checked={deadlineFilter === "week"}
              onChange={(e) => onDeadlineChange(e.target.value)}
            />
            <span className="radio-label">⚡ Within a week</span>
          </label>
          <label className="filter-option">
            <input
              type="radio"
              name="deadline"
              value="month"
              checked={deadlineFilter === "month"}
              onChange={(e) => onDeadlineChange(e.target.value)}
            />
            <span className="radio-label">📅 Within a month</span>
          </label>
          <label className="filter-option">
            <input
              type="radio"
              name="deadline"
              value="expired"
              checked={deadlineFilter === "expired"}
              onChange={(e) => onDeadlineChange(e.target.value)}
            />
            <span className="radio-label">🔒 Expired</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;
