/**
 * Weekly Planner and Grocery list type contracts for DishDash.
 */

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export interface DailySlots {
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snack: string | null;
}

export interface DayPlan {
  dayIndex: number; // 0 to 6 index for the 7-day planning period
  dateStr: string;  // YYYY-MM-DD
  slots: DailySlots;
  mealId?: string | null; // Deprecated legacy field preserved for backwards-compatibility
}

export interface WeeklyPlan {
  weekStartDate: string; // ISO date string representing start of 7-day period
  days: DayPlan[];       // Array of 7 day plans (each containing 4 slots = 28 total slots)
}

export interface GroceryItem {
  ingredientId: string;
  ingredientName: string;
  category: string;
  requiredByMealIds: string[];
  requiredByMealNames?: string[];
  isPurchased: boolean;
}
