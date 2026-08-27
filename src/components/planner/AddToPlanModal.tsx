"use client";

import React, { useState, useEffect } from "react";
import { Meal } from "@/types/meal";
import { WeeklyPlan, DayPlan } from "@/types/planner";
import { MEAL_MAP } from "@/data/meals";
import { ReplaceConfirmDialog } from "./ReplaceConfirmDialog";

interface AddToPlanModalProps {
  isOpen: boolean;
  meal: Meal;
  weeklyPlan?: WeeklyPlan;
  onAssignMeal: (dayIndex: number, mealId: string) => void;
  onClose: () => void;
  onSuccess: (dayName: string) => void;
}

function formatDayLabel(day: DayPlan): { dayName: string; dateFormatted: string } {
  const dayNames = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
  const dayName = dayNames[day.dayIndex] || `Day ${day.dayIndex + 1}`;

  // Parse YYYY-MM-DD safely
  try {
    const [year, month, d] = day.dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, d);
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const monthStr = dateObj.toLocaleDateString("en-US", { month: "short" });
    return {
      dayName: `${dayName} (${weekday})`,
      dateFormatted: `${weekday}, ${d} ${monthStr}`,
    };
  } catch {
    return {
      dayName,
      dateFormatted: day.dateStr,
    };
  }
}

export function AddToPlanModal({
  isOpen,
  meal,
  weeklyPlan,
  onAssignMeal,
  onClose,
  onSuccess,
}: AddToPlanModalProps) {
  const [replacingDay, setReplacingDay] = useState<{
    dayIndex: number;
    dayLabel: string;
    existingMealId: string;
  } | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !replacingDay) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, replacingDay, onClose]);

  if (!isOpen) return null;

  const days: DayPlan[] =
    weeklyPlan && Array.isArray(weeklyPlan.days) && weeklyPlan.days.length === 7
      ? weeklyPlan.days
      : Array.from({ length: 7 }, (_, i) => ({
          dayIndex: i,
          dateStr: "",
          mealId: null,
        }));

  const handleDaySelect = (day: DayPlan) => {
    const { dayName } = formatDayLabel(day);

    if (!day.mealId) {
      // Empty day: Assign immediately
      onAssignMeal(day.dayIndex, meal.id);
      onSuccess(dayName);
      onClose();
    } else if (day.mealId === meal.id) {
      // Already assigned to this day
      onSuccess(dayName);
      onClose();
    } else {
      // Occupied by another meal: Show replacement confirmation
      setReplacingDay({
        dayIndex: day.dayIndex,
        dayLabel: dayName,
        existingMealId: day.mealId,
      });
    }
  };

  const handleConfirmReplace = () => {
    if (replacingDay) {
      onAssignMeal(replacingDay.dayIndex, meal.id);
      onSuccess(replacingDay.dayLabel);
      setReplacingDay(null);
      onClose();
    }
  };

  const handleCancelReplace = () => {
    setReplacingDay(null);
  };

  return (
    <>
      <div
        className="modal-backdrop"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-container add-to-plan-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title"
        >
          {/* Modal Header */}
          <div className="modal-header">
            <div>
              <h2 id="plan-modal-title" className="modal-title">
                Add to Weekly Plan
              </h2>
              <p className="modal-subtitle">
                Select a day to schedule <strong>{meal.name}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close plan selection modal"
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

          {/* 7 Days List */}
          <div className="days-selection-list" role="list" aria-label="Available plan days">
            {days.map((day) => {
              const { dayName, dateFormatted } = formatDayLabel(day);
              const isOccupied = typeof day.mealId === "string" && day.mealId.length > 0;
              const isCurrentMeal = day.mealId === meal.id;
              const occupiedMeal = isOccupied ? MEAL_MAP[day.mealId!] : null;

              return (
                <button
                  key={day.dayIndex}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`day-selection-item ${
                    isCurrentMeal ? "is-current-meal" : isOccupied ? "is-occupied" : "is-empty"
                  }`}
                  role="listitem"
                  aria-label={`${dayName}, ${dateFormatted}. ${
                    isCurrentMeal
                      ? `Already assigned to ${meal.name}`
                      : isOccupied
                      ? `Currently has ${occupiedMeal?.name || "another meal"}. Click to replace.`
                      : "Empty. Click to add meal."
                  }`}
                >
                  <div className="day-info-left">
                    <span className="day-name-heading">{dayName}</span>
                    <span className="day-date-sub">{dateFormatted}</span>
                  </div>

                  <div className="day-status-right">
                    {isCurrentMeal ? (
                      <span className="day-status-badge badge-primary">
                        ✓ Scheduled Here
                      </span>
                    ) : isOccupied ? (
                      <div className="occupied-preview">
                        <span className="occupied-label">Scheduled:</span>
                        <span className="occupied-meal-title">
                          {occupiedMeal?.name || "Meal"}
                        </span>
                      </div>
                    ) : (
                      <span className="day-status-badge badge-empty">
                        + Empty Slot
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Modal Footer */}
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

      {/* Replacement Confirmation Dialog */}
      {replacingDay && (
        <ReplaceConfirmDialog
          isOpen={Boolean(replacingDay)}
          dayLabel={replacingDay.dayLabel}
          existingMealId={replacingDay.existingMealId}
          newMeal={meal}
          onConfirm={handleConfirmReplace}
          onCancel={handleCancelReplace}
        />
      )}
    </>
  );
}
