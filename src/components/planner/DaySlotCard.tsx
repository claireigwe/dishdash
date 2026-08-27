"use client";

import React from "react";
import Link from "next/link";
import { DayPlan } from "@/types/planner";
import { MEAL_MAP } from "@/data/meals";

interface DaySlotCardProps {
  day: DayPlan;
  onAddMeal: (dayIndex: number) => void;
  onReplaceMeal: (dayIndex: number) => void;
  onRemoveMeal: (dayIndex: number) => void;
}

export function formatPlannerDayLabel(day: DayPlan): {
  dayName: string;
  dateFormatted: string;
} {
  const dayNames = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
  const baseName = dayNames[day.dayIndex] || `Day ${day.dayIndex + 1}`;

  try {
    const [year, month, d] = day.dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, d);
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const monthStr = dateObj.toLocaleDateString("en-US", { month: "short" });
    return {
      dayName: `${baseName} • ${weekday}`,
      dateFormatted: `${weekday}, ${d} ${monthStr}`,
    };
  } catch {
    return {
      dayName: baseName,
      dateFormatted: day.dateStr,
    };
  }
}

export function DaySlotCard({
  day,
  onAddMeal,
  onReplaceMeal,
  onRemoveMeal,
}: DaySlotCardProps) {
  const { dayName, dateFormatted } = formatPlannerDayLabel(day);
  const isOccupied = typeof day.mealId === "string" && day.mealId.length > 0;
  const meal = isOccupied ? MEAL_MAP[day.mealId!] : null;
  const isInvalidMeal = isOccupied && !meal;

  return (
    <article
      className={`day-slot-card card ${isOccupied ? "slot-occupied" : "slot-empty"}`}
      aria-labelledby={`day-slot-title-${day.dayIndex}`}
    >
      {/* Day Header Row */}
      <div className="slot-header-row">
        <div className="slot-day-info">
          <h2 id={`day-slot-title-${day.dayIndex}`} className="slot-day-title">
            {dayName}
          </h2>
          {dateFormatted && (
            <span className="slot-date-sub">{dateFormatted}</span>
          )}
        </div>

        <div className="slot-status-indicator">
          {isOccupied ? (
            <span className="badge badge-secondary">Scheduled</span>
          ) : (
            <span className="badge badge-empty">Empty</span>
          )}
        </div>
      </div>

      {/* Body: Empty vs Occupied vs Invalid */}
      {!isOccupied ? (
        <div className="slot-empty-content">
          <p className="empty-slot-text">No meal scheduled for this day</p>
          <button
            type="button"
            onClick={() => onAddMeal(day.dayIndex)}
            className="btn btn-add-meal"
            aria-label={`Add meal to ${dayName}`}
          >
            + Add Meal
          </button>
        </div>
      ) : !meal ? (
        <div className="slot-invalid-content">
          <div className="invalid-meal-banner">
            <span>Unavailable meal reference ({day.mealId})</span>
          </div>
          <div className="slot-actions-row">
            <button
              type="button"
              onClick={() => onRemoveMeal(day.dayIndex)}
              className="btn btn-secondary btn-sm"
              aria-label={`Remove unavailable meal from ${dayName}`}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="slot-occupied-content">
          <div className="occupied-meal-meta">
            <h3 className="occupied-meal-name">{meal.name}</h3>
            <div className="occupied-badges">
              <span className="badge badge-secondary">{meal.category}</span>
              <span
                className={`badge ${
                  meal.isQuick ? "badge-primary" : "badge-neutral"
                }`}
              >
                ⏱️ {meal.cookingTime} mins {meal.isQuick ? "• Quick" : ""}
              </span>
            </div>
            <p className="occupied-meal-desc">{meal.description}</p>
          </div>

          {/* Action Row */}
          <div className="slot-actions-row">
            <Link
              href={`/meals/${meal.id}`}
              className="btn btn-primary btn-sm"
              aria-label={`View recipe for ${meal.name} on ${dayName}`}
            >
              View Meal
            </Link>
            <button
              type="button"
              onClick={() => onReplaceMeal(day.dayIndex)}
              className="btn btn-secondary btn-sm"
              aria-label={`Replace meal on ${dayName}`}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onRemoveMeal(day.dayIndex)}
              className="btn btn-secondary btn-sm btn-remove"
              aria-label={`Remove ${meal.name} from ${dayName}`}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
