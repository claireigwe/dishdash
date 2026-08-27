"use client";

import { useState, useEffect, useCallback } from "react";
import { UserState } from "@/types/state";
import { MealPreference } from "@/types/meal";
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

  // Assign meal to a specific day slot in the 7-day weekly plan
  const assignMealToDay = useCallback(
    (dayIndex: number, mealId: string) => {
      updateState((prev) => {
        const currentDays = prev.weeklyPlan?.days ? prev.weeklyPlan.days : [];
        const updatedDays = currentDays.map((day) =>
          day.dayIndex === dayIndex ? { ...day, mealId } : day
        );
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

  return {
    state,
    isLoaded,
    availableIngredientIds: state.availableIngredientIds,
    selectedPreference: state.selectedPreference,
    weeklyPlan: state.weeklyPlan,
    toggleIngredient,
    removeIngredient,
    clearIngredients,
    setPreference,
    assignMealToDay,
  };
}
