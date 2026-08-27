"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useUserState } from "@/hooks/useUserState";
import { Meal } from "@/types/meal";
import { DaySlotCard, formatPlannerDayLabel } from "@/components/planner/DaySlotCard";
import { MealPickerModal } from "@/components/planner/MealPickerModal";
import { ReplaceConfirmDialog } from "@/components/planner/ReplaceConfirmDialog";

export default function WeeklyPlannerPage() {
  const {
    weeklyPlan,
    assignMealToDay,
    removeMealFromDay,
    isLoaded,
  } = useUserState();

  // State for Meal Picker modal
  const [pickerTargetDayIndex, setPickerTargetDayIndex] = useState<number | null>(null);

  // State for Replacement confirmation
  const [replaceTarget, setReplaceTarget] = useState<{
    dayIndex: number;
    dayLabel: string;
    existingMealId: string;
    newMeal: Meal;
  } | null>(null);

  const days = useMemo(() => {
    if (weeklyPlan && Array.isArray(weeklyPlan.days) && weeklyPlan.days.length === 7) {
      return weeklyPlan.days;
    }
    return Array.from({ length: 7 }, (_, i) => ({
      dayIndex: i,
      dateStr: "",
      mealId: null,
    }));
  }, [weeklyPlan]);

  const plannedCount = useMemo(() => {
    return days.filter((d) => typeof d.mealId === "string" && d.mealId.length > 0).length;
  }, [days]);

  // Handle click on "Add Meal" or "Replace" from a Day Slot
  const handleOpenPicker = (dayIndex: number) => {
    setPickerTargetDayIndex(dayIndex);
  };

  // Handle meal selected from picker
  const handleSelectMealFromPicker = (selectedMeal: Meal) => {
    if (pickerTargetDayIndex === null) return;

    const targetDay = days.find((d) => d.dayIndex === pickerTargetDayIndex);
    if (!targetDay) return;

    const { dayName } = formatPlannerDayLabel(targetDay);

    if (targetDay.mealId && targetDay.mealId !== selectedMeal.id) {
      // Occupied by another meal: prompt confirmation
      setReplaceTarget({
        dayIndex: targetDay.dayIndex,
        dayLabel: dayName,
        existingMealId: targetDay.mealId,
        newMeal: selectedMeal,
      });
      setPickerTargetDayIndex(null);
    } else {
      // Empty or re-assigning same meal: assign immediately
      assignMealToDay(targetDay.dayIndex, selectedMeal.id);
      setPickerTargetDayIndex(null);
    }
  };

  // Handle replacement confirmation
  const handleConfirmReplace = () => {
    if (replaceTarget) {
      assignMealToDay(replaceTarget.dayIndex, replaceTarget.newMeal.id);
      setReplaceTarget(null);
    }
  };

  const handleCancelReplace = () => {
    setReplaceTarget(null);
  };

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <p>Loading weekly plan...</p>
      </div>
    );
  }

  const activePickerDay =
    pickerTargetDayIndex !== null
      ? days.find((d) => d.dayIndex === pickerTargetDayIndex)
      : null;

  const activePickerDayLabel = activePickerDay
    ? formatPlannerDayLabel(activePickerDay).dayName
    : "";

  return (
    <div className="planner-container">
      {/* Planner Header */}
      <header className="planner-header">
        <div className="planner-header-top">
          <h1 className="planner-title">Your Week</h1>
          <span className="results-count-badge">
            {plannedCount} of 7 Days Planned
          </span>
        </div>
        <p className="planner-subtitle">
          Plan one meal for each day of the week.
        </p>
      </header>

      {/* Empty Planner Banner if 0 days planned */}
      {plannedCount === 0 && (
        <div className="empty-planner-banner card">
          <div className="banner-content">
            <h2 className="banner-title">No meals planned yet</h2>
            <p className="banner-desc">
              Schedule meals for the week day-by-day below, or discover tailored suggestions based on ingredients you have at home.
            </p>
          </div>
          <Link href="/" className="btn btn-primary btn-sm">
            Find Meals
          </Link>
        </div>
      )}

      {/* 7 Day Slot Cards */}
      <div className="planner-slots-grid" role="feed" aria-label="7-day weekly meal slots">
        {days.map((day) => (
          <DaySlotCard
            key={day.dayIndex}
            day={day}
            onAddMeal={handleOpenPicker}
            onReplaceMeal={handleOpenPicker}
            onRemoveMeal={removeMealFromDay}
          />
        ))}
      </div>

      {/* Meal Picker Modal */}
      {pickerTargetDayIndex !== null && (
        <MealPickerModal
          isOpen={pickerTargetDayIndex !== null}
          dayIndex={pickerTargetDayIndex}
          dayLabel={activePickerDayLabel}
          onSelectMeal={handleSelectMealFromPicker}
          onClose={() => setPickerTargetDayIndex(null)}
        />
      )}

      {/* Replacement Confirmation Dialog */}
      {replaceTarget && (
        <ReplaceConfirmDialog
          isOpen={Boolean(replaceTarget)}
          dayLabel={replaceTarget.dayLabel}
          existingMealId={replaceTarget.existingMealId}
          newMeal={replaceTarget.newMeal}
          onConfirm={handleConfirmReplace}
          onCancel={handleCancelReplace}
        />
      )}
    </div>
  );
}
