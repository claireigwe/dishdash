/**
 * Weekly Planner and Grocery list type contracts for DishDash.
 */

export interface DayPlan {
  dayIndex: number; // 0 to 6 index for the 7-day planning period
  dateStr: string;  // YYYY-MM-DD
  mealId: string | null;
}

export interface WeeklyPlan {
  weekStartDate: string; // ISO date string representing start of 7-day period
  days: DayPlan[];       // Array of 7 day slots
}

export interface GroceryItem {
  ingredientId: string;
  ingredientName: string;
  category: string;
  requiredByMealIds: string[];
  isPurchased: boolean;
}
