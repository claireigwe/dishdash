"use client";

import React from "react";
import Link from "next/link";
import { DayPlan, MealSlot, MEAL_SLOTS } from "@/types/planner";
import { MEAL_MAP } from "@/data/meals";

interface DaySlotCardProps {
  day: DayPlan;
  onAddMeal: (dayIndex: number, slot: MealSlot) => void;
  onReplaceMeal: (dayIndex: number, slot: MealSlot) => void;
  onRemoveMeal: (dayIndex: number, slot: MealSlot) => void;
}

const SLOT_CONFIG: Record<
  MealSlot,
  { label: string; icon: string; addLabel: string }
> = {
  breakfast: { label: "Breakfast", icon: "☀️", addLabel: "+ Add meal" },
  lunch: { label: "Lunch", icon: "🍲", addLabel: "+ Add meal" },
  dinner: { label: "Dinner", icon: "🌙", addLabel: "+ Add meal" },
  snack: { label: "Snack", icon: "🥪", addLabel: "+ Add snack" },
};

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

  // Safely extract slots with fallback to legacy mealId (migrated to lunch)
  const slots = day.slots || {
    breakfast: null,
    lunch: day.mealId || null,
    dinner: null,
    snack: null,
  };

  const plannedSlotCount = MEAL_SLOTS.filter((s) => Boolean(slots[s])).length;

  return (
    <article
      className="day-slot-card card"
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
          {plannedSlotCount > 0 ? (
            <span className="badge badge-secondary">
              {plannedSlotCount} of 4 Planned
            </span>
          ) : (
            <span className="badge badge-empty">Empty</span>
          )}
        </div>
      </div>

      {/* 4 Daily Meal Slots: Breakfast, Lunch, Dinner, Snack */}
      <div className="day-slots-list" role="group" aria-label={`Meal slots for ${dayName}`}>
        {MEAL_SLOTS.map((slot) => {
          const cfg = SLOT_CONFIG[slot];
          const mealId = slots[slot];
          const isOccupied = typeof mealId === "string" && mealId.length > 0;
          const meal = isOccupied ? MEAL_MAP[mealId!] : null;

          if (!isOccupied) {
            return (
              <div
                key={slot}
                className={`slot-row-item slot-row-empty slot-${slot}`}
              >
                <div className="slot-label-group">
                  <span className="slot-icon" aria-hidden="true">
                    {cfg.icon}
                  </span>
                  <span className="slot-name-label">{cfg.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onAddMeal(day.dayIndex, slot)}
                  className="btn-add-slot-meal"
                  aria-label={`Add ${cfg.label} for ${dayName}`}
                >
                  {cfg.addLabel}
                </button>
              </div>
            );
          }

          if (!meal) {
            return (
              <div
                key={slot}
                className={`slot-row-item slot-row-occupied slot-${slot}`}
              >
                <div className="slot-top-bar">
                  <div className="slot-label-badge">
                    <span className="slot-icon" aria-hidden="true">
                      {cfg.icon}
                    </span>
                    <span className="slot-name-label">{cfg.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveMeal(day.dayIndex, slot)}
                    className="btn btn-secondary btn-sm"
                    aria-label={`Remove unavailable meal from ${dayName} ${cfg.label}`}
                  >
                    Remove
                  </button>
                </div>
                <div className="slot-invalid-content">
                  <span className="invalid-meal-text">Unavailable meal ({mealId})</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={slot}
              className={`slot-row-item slot-row-occupied slot-${slot}`}
            >
              {/* Slot Header: Badge on Left, Action Links on Right */}
              <div className="slot-top-bar">
                <div className="slot-label-badge">
                  <span className="slot-icon" aria-hidden="true">
                    {cfg.icon}
                  </span>
                  <span className="slot-name-label">{cfg.label}</span>
                </div>

                <div className="slot-actions-group">
                  <Link
                    href={`/meals/${meal.id}`}
                    className="btn-slot-link"
                    aria-label={`View recipe for ${meal.name}`}
                  >
                    View
                  </Link>
                  <span className="action-divider" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onReplaceMeal(day.dayIndex, slot)}
                    className="btn-slot-action"
                    aria-label={`Replace ${cfg.label} on ${dayName}`}
                  >
                    Replace
                  </button>
                  <span className="action-divider" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onRemoveMeal(day.dayIndex, slot)}
                    className="btn-slot-action btn-slot-remove"
                    aria-label={`Remove ${meal.name} from ${dayName} ${cfg.label}`}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Meal Main Content: Full-width Title & Meta Badges */}
              <div className="slot-meal-main">
                <Link
                  href={`/meals/${meal.id}`}
                  className="slot-meal-name"
                  title={meal.name}
                >
                  {meal.name}
                </Link>
                <div className="slot-meal-meta-tags">
                  <span className="badge badge-secondary badge-xs">
                    {meal.category}
                  </span>
                  <span className="badge badge-neutral badge-xs">
                    ⏱️ {meal.cookingTime}m
                  </span>
                  {meal.isQuick && (
                    <span className="badge badge-primary badge-xs">⚡ Quick</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
