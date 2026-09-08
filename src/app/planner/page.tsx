"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useUserState } from "@/hooks/useUserState";
import { Meal } from "@/types/meal";
import { MealSlot, MEAL_SLOTS } from "@/types/planner";
import { DaySlotCard, formatPlannerDayLabel } from "@/components/planner/DaySlotCard";
import { MealPickerModal } from "@/components/planner/MealPickerModal";
import { ReplaceConfirmDialog } from "@/components/planner/ReplaceConfirmDialog";

export default function WeeklyPlannerPage() {
  const {
    weeklyPlan,
    assignMealToSlot,
    removeMealFromSlot,
    isLoaded,
  } = useUserState();

  // State for Meal Picker modal
  const [pickerTarget, setPickerTarget] = useState<{
    dayIndex: number;
    slot: MealSlot;
  } | null>(null);

  // State for Replacement confirmation
  const [replaceTarget, setReplaceTarget] = useState<{
    dayIndex: number;
    slot: MealSlot;
    dayLabel: string;
    slotLabel: string;
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
      slots: {
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
      },
      mealId: null,
    }));
  }, [weeklyPlan]);

  const plannedCount = useMemo(() => {
    let count = 0;
    for (const d of days) {
      if (d.slots) {
        for (const s of MEAL_SLOTS) {
          if (d.slots[s]) count++;
        }
      } else if (d.mealId) {
        count++;
      }
    }
    return count;
  }, [days]);

  // Handle click on "Add Meal" or "Replace" from a specific meal slot
  const handleOpenPicker = (dayIndex: number, slot: MealSlot) => {
    setPickerTarget({ dayIndex, slot });
  };

  // Handle meal selected from picker
  const handleSelectMealFromPicker = (selectedMeal: Meal) => {
    if (!pickerTarget) return;

    const { dayIndex, slot } = pickerTarget;
    const targetDay = days.find((d) => d.dayIndex === dayIndex);
    if (!targetDay) return;

    const { dayName } = formatPlannerDayLabel(targetDay);
    const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
    const existingMealId = targetDay.slots
      ? targetDay.slots[slot]
      : slot === "lunch"
      ? targetDay.mealId
      : null;

    if (existingMealId && existingMealId !== selectedMeal.id) {
      // Occupied slot: prompt replacement confirmation for this specific slot
      setReplaceTarget({
        dayIndex,
        slot,
        dayLabel: dayName,
        slotLabel,
        existingMealId,
        newMeal: selectedMeal,
      });
      setPickerTarget(null);
    } else {
      // Empty or re-assigning same meal: assign immediately
      assignMealToSlot(dayIndex, slot, selectedMeal.id);
      setPickerTarget(null);
    }
  };

  // Handle replacement confirmation
  const handleConfirmReplace = () => {
    if (replaceTarget) {
      assignMealToSlot(replaceTarget.dayIndex, replaceTarget.slot, replaceTarget.newMeal.id);
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
    pickerTarget !== null
      ? days.find((d) => d.dayIndex === pickerTarget.dayIndex)
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
            {plannedCount} of 28 Slots Planned
          </span>
        </div>
        <p className="planner-subtitle">
          Plan breakfast, lunch, dinner, and snacks for each day of the week.
        </p>
      </header>

      {/* Empty Planner Banner if 0 days planned */}
      {plannedCount === 0 && (
        <div className="empty-planner-banner card">
          <div className="banner-content">
            <h2 className="banner-title">No meals planned yet</h2>
            <p className="banner-desc">
              Schedule breakfast, lunch, dinner, and snacks for the week below, or discover tailored suggestions based on ingredients you have at home.
            </p>
          </div>
          <Link href="/" className="btn btn-primary btn-sm">
            Find Meals
          </Link>
        </div>
      )}

      {/* 7 Day Slot Cards with 4 Meal Slots each */}
      <div className="planner-slots-grid" role="feed" aria-label="7-day weekly meal slots">
        {days.map((day) => (
          <DaySlotCard
            key={day.dayIndex}
            day={day}
            onAddMeal={handleOpenPicker}
            onReplaceMeal={handleOpenPicker}
            onRemoveMeal={removeMealFromSlot}
          />
        ))}
      </div>

      {/* Meal Picker Modal */}
      {pickerTarget !== null && (
        <MealPickerModal
          isOpen={pickerTarget !== null}
          dayIndex={pickerTarget.dayIndex}
          slot={pickerTarget.slot}
          dayLabel={activePickerDayLabel}
          onSelectMeal={handleSelectMealFromPicker}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* Replacement Confirmation Dialog */}
      {replaceTarget && (
        <ReplaceConfirmDialog
          isOpen={Boolean(replaceTarget)}
          dayLabel={replaceTarget.dayLabel}
          slotName={replaceTarget.slotLabel}
          existingMealId={replaceTarget.existingMealId}
          newMeal={replaceTarget.newMeal}
          onConfirm={handleConfirmReplace}
          onCancel={handleCancelReplace}
        />
      )}
    </div>
  );
}
