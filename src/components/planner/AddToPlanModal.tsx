"use client";

import React, { useState, useEffect } from "react";
import { Meal } from "@/types/meal";
import { WeeklyPlan, DayPlan } from "@/types/planner";
import { MEAL_MAP } from "@/data/meals";
import { ReplaceConfirmDialog } from "./ReplaceConfirmDialog";

import { MealSlot, MEAL_SLOTS } from "@/types/planner";

interface AddToPlanModalProps {
  isOpen: boolean;
  meal: Meal;
  weeklyPlan?: WeeklyPlan;
  onAssignMeal: (dayIndex: number, mealId: string, slot?: MealSlot) => void;
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
  // Determine default slot based on meal metadata
  const defaultSlot: MealSlot =
    meal.mealType === "breakfast"
      ? "breakfast"
      : meal.mealType === "snack" || meal.mealType === "street_food"
      ? "snack"
      : "lunch";

  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(defaultSlot);

  const [replacingDay, setReplacingDay] = useState<{
    dayIndex: number;
    dayLabel: string;
    slotLabel: string;
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
          slots: {
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
          },
          mealId: null,
        }));

  const slotLabel = selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1);

  const handleDaySelect = (day: DayPlan) => {
    const { dayName } = formatDayLabel(day);
    const existingMealId = day.slots
      ? day.slots[selectedSlot]
      : selectedSlot === "lunch"
      ? day.mealId
      : null;

    if (!existingMealId) {
      // Empty slot: Assign immediately
      onAssignMeal(day.dayIndex, meal.id, selectedSlot);
      onSuccess(`${dayName} • ${slotLabel}`);
      onClose();
    } else if (existingMealId === meal.id) {
      // Already assigned to this slot
      onSuccess(`${dayName} • ${slotLabel}`);
      onClose();
    } else {
      // Occupied by another meal: Show replacement confirmation for this slot
      setReplacingDay({
        dayIndex: day.dayIndex,
        dayLabel: dayName,
        slotLabel,
        existingMealId,
      });
    }
  };

  const handleConfirmReplace = () => {
    if (replacingDay) {
      onAssignMeal(replacingDay.dayIndex, meal.id, selectedSlot);
      onSuccess(`${replacingDay.dayLabel} • ${replacingDay.slotLabel}`);
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

          {/* Slot Selector Tabs */}
          <div className="slot-picker-tab-row" role="tablist" aria-label="Select meal slot">
            {MEAL_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              const label = slot.charAt(0).toUpperCase() + slot.slice(1);
              const icon =
                slot === "breakfast"
                  ? "☀️"
                  : slot === "lunch"
                  ? "🍲"
                  : slot === "dinner"
                  ? "🌙"
                  : "🥪";
              return (
                <button
                  key={slot}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedSlot(slot)}
                  className={`slot-tab-btn ${isSelected ? "slot-tab-active" : ""}`}
                >
                  <span aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* 7 Days List */}
          <div className="days-selection-list" role="list" aria-label="Available plan days">
            {days.map((day) => {
              const { dayName, dateFormatted } = formatDayLabel(day);
              const slotMealId = day.slots
                ? day.slots[selectedSlot]
                : selectedSlot === "lunch"
                ? day.mealId
                : null;
              const isOccupied = typeof slotMealId === "string" && slotMealId.length > 0;
              const isCurrentMeal = slotMealId === meal.id;
              const occupiedMeal = isOccupied ? MEAL_MAP[slotMealId!] : null;

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
                      ? `Already assigned to ${meal.name} for ${slotLabel}`
                      : isOccupied
                      ? `${slotLabel} currently has ${occupiedMeal?.name || "another meal"}. Click to replace.`
                      : `Empty ${slotLabel}. Click to schedule.`
                  }`}
                >
                  <div className="day-info-left">
                    <span className="day-name-heading">{dayName}</span>
                    <span className="day-date-sub">{dateFormatted}</span>
                  </div>

                  <div className="day-status-right">
                    {isCurrentMeal ? (
                      <span className="day-status-badge badge-primary">
                        ✓ {slotLabel} Scheduled
                      </span>
                    ) : isOccupied ? (
                      <div className="occupied-preview">
                        <span className="occupied-label">{slotLabel}:</span>
                        <span className="occupied-meal-title">
                          {occupiedMeal?.name || "Meal"}
                        </span>
                      </div>
                    ) : (
                      <span className="day-status-badge badge-empty">
                        + {slotLabel} Empty
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
          slotName={replacingDay.slotLabel}
          existingMealId={replacingDay.existingMealId}
          newMeal={meal}
          onConfirm={handleConfirmReplace}
          onCancel={handleCancelReplace}
        />
      )}
    </>
  );
}
