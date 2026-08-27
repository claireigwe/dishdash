"use client";

import React, { useState, useMemo } from "react";
import { INGREDIENTS } from "@/data/ingredients";

interface IngredientSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const CATEGORIES = [
  "All",
  "Staples & Grains",
  "Proteins",
  "Vegetables & Produce",
  "Oils & Seasonings",
] as const;

export function IngredientSelector({
  selectedIds,
  onToggle,
}: IngredientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredIngredients = useMemo(() => {
    return INGREDIENTS.filter((ingredient) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesCategory =
        activeCategory === "All" || ingredient.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="ingredient-selector">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search ingredients (e.g. Rice, Yam, Eggs)..."
          className="search-input"
          aria-label="Search available ingredients"
        />
        {searchTerm.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="search-clear-btn"
            aria-label="Clear ingredient search"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div
        className="category-filter-list"
        role="tablist"
        aria-label="Ingredient category filter"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat)}
              className={`category-pill ${isActive ? "active" : ""}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Ingredient Chip Grid */}
      <div
        className="ingredient-grid"
        role="group"
        aria-label="Ingredients selection"
      >
        {filteredIngredients.length === 0 ? (
          <div className="empty-search-message">
            <p>No ingredients match "{searchTerm}"</p>
          </div>
        ) : (
          filteredIngredients.map((ingredient) => {
            const isSelected = selectedSet.has(ingredient.id);
            return (
              <button
                key={ingredient.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(ingredient.id)}
                className={`ingredient-chip ${isSelected ? "selected" : ""}`}
              >
                <span
                  className={`chip-checkbox ${isSelected ? "checked" : ""}`}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="ingredient-name">{ingredient.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
