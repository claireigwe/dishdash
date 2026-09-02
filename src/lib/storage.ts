import { UserState } from "../types/state";
import { WeeklyPlan, DayPlan } from "../types/planner";

export const STORAGE_KEY = "dishdash_state_v1";
export const STORAGE_VERSION = 1;

/**
 * Returns ISO date string in YYYY-MM-DD format for local date.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generates an empty 7-day plan starting from the reference date.
 */
export function getInitialWeeklyPlan(referenceDate: Date = new Date()): WeeklyPlan {
  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(referenceDate);
    current.setDate(referenceDate.getDate() + i);
    days.push({
      dayIndex: i,
      dateStr: formatDate(current),
      mealId: null,
    });
  }

  return {
    weekStartDate: formatDate(referenceDate),
    days,
  };
}

const VALID_PREFERENCES = new Set(["spicy", "filling", "quick", "sweet", "surprise"]);

/**
 * Creates a clean default UserState.
 */
export function getInitialUserState(): UserState {
  return {
    availableIngredientIds: [],
    selectedPreference: "quick",
    weeklyPlan: getInitialWeeklyPlan(),
    purchasedGroceryItemIds: [],
    version: STORAGE_VERSION,
  };
}

/**
 * Safely loads user state from localStorage.
 * Returns default initial state if on server, if localStorage is unavailable,
 * or if data is corrupt or invalid.
 */
export function loadUserState(): UserState {
  if (typeof window === "undefined") {
    return getInitialUserState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getInitialUserState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return getInitialUserState();
    }

    // Validate minimum required fields
    return {
      availableIngredientIds: Array.isArray(parsed.availableIngredientIds)
        ? parsed.availableIngredientIds
        : [],
      selectedPreference: VALID_PREFERENCES.has(parsed.selectedPreference)
        ? parsed.selectedPreference
        : "quick",
      weeklyPlan:
        parsed.weeklyPlan && Array.isArray(parsed.weeklyPlan.days)
          ? parsed.weeklyPlan
          : getInitialWeeklyPlan(),
      purchasedGroceryItemIds: Array.isArray(parsed.purchasedGroceryItemIds)
        ? parsed.purchasedGroceryItemIds
        : [],
      version: typeof parsed.version === "number" ? parsed.version : STORAGE_VERSION,
    };
  } catch (error) {
    console.warn("Failed to load user state from localStorage, falling back to default:", error);
    return getInitialUserState();
  }
}

/**
 * Safely saves user state to localStorage.
 * Handles private browsing mode, storage full errors, and SSR gracefully.
 */
export function saveUserState(state: UserState): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn("Failed to save user state to localStorage:", error);
    return false;
  }
}

/**
 * Safely clears user state from localStorage.
 */
export function clearUserState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn("Failed to clear user state from localStorage:", error);
    return false;
  }
}
