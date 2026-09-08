"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Meal } from "@/types/meal";
import { MEALS } from "@/data/meals";

import { MealSlot } from "@/types/planner";

interface MealPickerModalProps {
  isOpen: boolean;
  dayIndex: number;
  slot?: MealSlot;
  dayLabel: string;
  onSelectMeal: (meal: Meal) => void;
  onClose: () => void;
}

export function MealPickerModal({
  isOpen,
  slot = "lunch",
  dayLabel,
  onSelectMeal,
  onClose,
}: MealPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredMeals = useMemo(() => {
    let list = MEALS;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = MEALS.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term) ||
          m.mealType.toLowerCase().includes(term)
      );
    }

    // Sort to surface slot-appropriate meals prominently if no search term active
    if (!searchTerm.trim()) {
      return [...list].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (slot === "breakfast") {
          if (a.mealType === "breakfast") scoreA += 50;
          if (b.mealType === "breakfast") scoreB += 50;
          if (a.isQuick) scoreA += 10;
          if (b.isQuick) scoreB += 10;
        } else if (slot === "snack") {
          if (a.mealType === "snack" || a.mealType === "street_food") scoreA += 50;
          if (b.mealType === "snack" || b.mealType === "street_food") scoreB += 50;
        } else {
          // lunch or dinner
          if (a.mealType === "main" || a.mealType === "soup") scoreA += 20;
          if (b.mealType === "main" || b.mealType === "soup") scoreB += 20;
        }

        return scoreB - scoreA;
      });
    }

    return list;
  }, [searchTerm, slot]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-container meal-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-picker-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 id="meal-picker-title" className="modal-title">
              Choose a Meal
            </h2>
            <p className="modal-subtitle">
              For <strong>{dayLabel}</strong> • <span style={{ textTransform: "capitalize" }}>{slot}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close meal selection dialog"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

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
            placeholder="Search meal library (e.g. Jollof, Egusi, Yam)..."
            className="search-input"
            aria-label="Filter meals by name or category"
            autoFocus
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="search-clear-btn"
              aria-label="Clear search"
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

        {/* Meals List */}
        <div
          className="meal-picker-list"
          role="list"
          aria-label="Available Nigerian meals"
        >
          {filteredMeals.length === 0 ? (
            <div className="empty-search-message">
              <p>No meals match "{searchTerm}"</p>
            </div>
          ) : (
            filteredMeals.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => onSelectMeal(meal)}
                className="meal-picker-item"
                role="listitem"
                aria-label={`Select ${meal.name}, ${meal.category}, ${meal.cookingTime} minutes`}
              >
                <div className="picker-item-info">
                  <span className="picker-meal-name">{meal.name}</span>
                  <div className="picker-meal-badges">
                    <span className="badge badge-secondary">{meal.category}</span>
                    <span
                      className={`badge ${
                        meal.isQuick ? "badge-primary" : "badge-neutral"
                      }`}
                    >
                      ⏱️ {meal.cookingTime} mins
                    </span>
                  </div>
                </div>

                <div className="picker-item-action" aria-hidden="true">
                  <span className="btn-select-text">Select</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-block"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
