import React from "react";
import "./SearchBar.css";

const SearchBar = ({ searchQuery, onSearchChange, placeholder }) => {
  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder || "Search..."}
          className="search-input"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="clear-search-btn"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
