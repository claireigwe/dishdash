import { MealPreference } from "./meal";
import { WeeklyPlan } from "./planner";

/**
 * Client-persisted user state contract for DishDash.
 */
export interface UserState {
  availableIngredientIds: string[];
  selectedPreference: MealPreference;
  weeklyPlan: WeeklyPlan;
  purchasedGroceryItemIds: string[];
  version: number;
}
