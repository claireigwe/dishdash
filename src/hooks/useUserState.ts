"use client";

import { useState, useEffect, useCallback } from "react";
import { UserState } from "@/types/state";
import { MealPreference } from "@/types/meal";
import { MealSlot } from "@/types/planner";
import { loadUserState, saveUserState, getInitialUserState } from "@/lib/storage";

export function useUserState() {
  const [state, setState] = useState<UserState>(getInitialUserState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state on client mount
  useEffect(() => {
    const loaded = loadUserState();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  // Update helper that saves to localStorage
  const updateState = useCallback((updater: (prev: UserState) => UserState) => {
    setState((prev) => {
      const next = updater(prev);
      saveUserState(next);
      return next;
    });
  }, []);

  // Ingredient toggle
  const toggleIngredient = useCallback(
    (ingredientId: string) => {
      updateState((prev) => {
        const exists = prev.availableIngredientIds.includes(ingredientId);
        const nextIngredients = exists
          ? prev.availableIngredientIds.filter((id) => id !== ingredientId)
          : [...prev.availableIngredientIds, ingredientId];
        return {
          ...prev,
          availableIngredientIds: nextIngredients,
        };
      });
    },
    [updateState]
  );

  // Remove single ingredient
  const removeIngredient = useCallback(
    (ingredientId: string) => {
      updateState((prev) => ({
        ...prev,
        availableIngredientIds: prev.availableIngredientIds.filter(
          (id) => id !== ingredientId
        ),
      }));
    },
    [updateState]
  );

  // Clear all ingredients
  const clearIngredients = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      availableIngredientIds: [],
    }));
  }, [updateState]);

  // Set preference
  const setPreference = useCallback(
    (preference: MealPreference) => {
      updateState((prev) => ({
        ...prev,
        selectedPreference: preference,
      }));
    },
    [updateState]
  );

  // Assign meal to a specific slot (breakfast, lunch, dinner, snack) in the 7-day weekly plan
  const assignMealToSlot = useCallback(
    (dayIndex: number, slot: MealSlot, mealId: string) => {
      updateState((prev) => {
        const currentDays = prev.weeklyPlan?.days ? prev.weeklyPlan.days : [];
        const updatedDays = currentDays.map((day) => {
          if (day.dayIndex !== dayIndex) return day;
          const currentSlots = day.slots || {
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
          };
          const updatedSlots = {
            ...currentSlots,
            [slot]: mealId,
          };
          return {
            ...day,
            slots: updatedSlots,
            // Keep legacy mealId synced to lunch
            mealId: updatedSlots.lunch,
          };
        });
        return {
          ...prev,
          weeklyPlan: {
            ...prev.weeklyPlan,
            days: updatedDays,
          },
        };
      });
    },
    [updateState]
  );

  // Remove meal from a specific slot in the 7-day weekly plan
  const removeMealFromSlot = useCallback(
    (dayIndex: number, slot: MealSlot) => {
      updateState((prev) => {
        const currentDays = prev.weeklyPlan?.days ? prev.weeklyPlan.days : [];
        const updatedDays = currentDays.map((day) => {
          if (day.dayIndex !== dayIndex) return day;
          const currentSlots = day.slots || {
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
          };
          const updatedSlots = {
            ...currentSlots,
            [slot]: null,
          };
          return {
            ...day,
            slots: updatedSlots,
            mealId: updatedSlots.lunch,
          };
        });
        return {
          ...prev,
          weeklyPlan: {
            ...prev.weeklyPlan,
            days: updatedDays,
          },
        };
      });
    },
    [updateState]
  );

  // Legacy helper: Assign meal to a day slot (defaults to "lunch" if slot omitted)
  const assignMealToDay = useCallback(
    (dayIndex: number, mealId: string, slot: MealSlot = "lunch") => {
      assignMealToSlot(dayIndex, slot, mealId);
    },
    [assignMealToSlot]
  );

  // Legacy helper: Remove meal from a day (if slot provided, removes that slot; if omitted, clears all slots for day)
  const removeMealFromDay = useCallback(
    (dayIndex: number, slot?: MealSlot) => {
      if (slot) {
        removeMealFromSlot(dayIndex, slot);
      } else {
        updateState((prev) => {
          const currentDays = prev.weeklyPlan?.days ? prev.weeklyPlan.days : [];
          const updatedDays = currentDays.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            return {
              ...day,
              slots: {
                breakfast: null,
                lunch: null,
                dinner: null,
                snack: null,
              },
              mealId: null,
            };
          });
          return {
            ...prev,
            weeklyPlan: {
              ...prev.weeklyPlan,
              days: updatedDays,
            },
          };
        });
      }
    },
    [removeMealFromSlot, updateState]
  );

  // Toggle purchased state of a grocery item by ingredient ID
  const toggleGroceryItem = useCallback(
    (ingredientId: string) => {
      updateState((prev) => {
        const currentPurchased = Array.isArray(prev.purchasedGroceryItemIds)
          ? prev.purchasedGroceryItemIds
          : [];
        const isPurchased = currentPurchased.includes(ingredientId);
        const nextPurchased = isPurchased
          ? currentPurchased.filter((id) => id !== ingredientId)
          : [...currentPurchased, ingredientId];
        return {
          ...prev,
          purchasedGroceryItemIds: nextPurchased,
        };
      });
    },
    [updateState]
  );

  return {
    state,
    isLoaded,
    availableIngredientIds: state.availableIngredientIds,
    selectedPreference: state.selectedPreference,
    weeklyPlan: state.weeklyPlan,
    purchasedGroceryItemIds: state.purchasedGroceryItemIds,
    toggleIngredient,
    removeIngredient,
    clearIngredients,
    setPreference,
    assignMealToDay,
    removeMealFromDay,
    assignMealToSlot,
    removeMealFromSlot,
    toggleGroceryItem,
  };
}
