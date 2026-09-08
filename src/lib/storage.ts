import { UserState } from "../types/state";
import { WeeklyPlan, DayPlan, DailySlots } from "../types/planner";

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
 * Creates empty daily slots for breakfast, lunch, dinner, and snack.
 */
export function createEmptyDailySlots(): DailySlots {
  return {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };
}

/**
 * Normalizes daily slots with backward compatibility.
 * Migration decision: Existing single-meal-per-day plans default to the "lunch" slot,
 * preserving the meal while leaving breakfast, dinner, and snack open for scheduling.
 */
export function normalizeDaySlots(rawDay: any): DailySlots {
  const empty = createEmptyDailySlots();
  if (!rawDay || typeof rawDay !== "object") {
    return empty;
  }

  // Case 1: Already has a slots object
  if (rawDay.slots && typeof rawDay.slots === "object") {
    return {
      breakfast: typeof rawDay.slots.breakfast === "string" && rawDay.slots.breakfast.length > 0
        ? rawDay.slots.breakfast
        : null,
      lunch: typeof rawDay.slots.lunch === "string" && rawDay.slots.lunch.length > 0
        ? rawDay.slots.lunch
        : null,
      dinner: typeof rawDay.slots.dinner === "string" && rawDay.slots.dinner.length > 0
        ? rawDay.slots.dinner
        : null,
      snack: typeof rawDay.slots.snack === "string" && rawDay.slots.snack.length > 0
        ? rawDay.slots.snack
        : null,
    };
  }

  // Case 2: Legacy single meal plan with mealId -> migrate to lunch slot
  if (typeof rawDay.mealId === "string" && rawDay.mealId.length > 0) {
    return {
      breakfast: null,
      lunch: rawDay.mealId,
      dinner: null,
      snack: null,
    };
  }

  return empty;
}

/**
 * Normalizes or migrates a weekly plan ensuring exactly 7 days with 4 valid slots each.
 */
export function normalizeWeeklyPlan(rawPlan: any, referenceDate: Date = new Date()): WeeklyPlan {
  const initial = getInitialWeeklyPlan(referenceDate);
  if (!rawPlan || typeof rawPlan !== "object" || !Array.isArray(rawPlan.days)) {
    return initial;
  }

  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const rawDay = rawPlan.days.find((d: any) => d?.dayIndex === i) || rawPlan.days[i];
    const initialDay = initial.days[i];
    const slots = normalizeDaySlots(rawDay);

    days.push({
      dayIndex: i,
      dateStr: typeof rawDay?.dateStr === "string" && rawDay.dateStr.length > 0
        ? rawDay.dateStr
        : initialDay.dateStr,
      slots,
      // Keep legacy mealId synced to lunch for any legacy consumers
      mealId: slots.lunch,
    });
  }

  return {
    weekStartDate: typeof rawPlan.weekStartDate === "string" && rawPlan.weekStartDate.length > 0
      ? rawPlan.weekStartDate
      : initial.weekStartDate,
    days,
  };
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
      slots: createEmptyDailySlots(),
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

    // Validate minimum required fields and normalize weekly plan
    return {
      availableIngredientIds: Array.isArray(parsed.availableIngredientIds)
        ? parsed.availableIngredientIds
        : [],
      selectedPreference: VALID_PREFERENCES.has(parsed.selectedPreference)
        ? parsed.selectedPreference
        : "quick",
      weeklyPlan: normalizeWeeklyPlan(parsed.weeklyPlan),
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
