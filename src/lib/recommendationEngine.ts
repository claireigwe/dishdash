import type { Meal, MealPreference, MealRecommendation } from "../types/meal";
import type { WeeklyPlan } from "../types/planner";
import { MEALS } from "../data/meals";

export interface RecommendationInput {
  selectedIngredientIds: string[];
  preference: MealPreference;
  weeklyPlan?: WeeklyPlan;
  mealLibrary?: Meal[];
}

/**
 * Pure, deterministic client-side recommendation engine for DishDash.
 * Returns up to 3 ranked meal recommendations based on available ingredients and user preference.
 */
export function getRecommendations(input: RecommendationInput): MealRecommendation[] {
  const {
    selectedIngredientIds = [],
    preference = "none",
    weeklyPlan,
    mealLibrary = MEALS,
  } = input;

  const selectedSet = new Set(selectedIngredientIds);
  const hasSelectedIngredients = selectedSet.size > 0;

  // 1. Filter by Preference Eligibility
  let eligibleMeals = mealLibrary;

  if (preference === "quick") {
    // Quick & Easy: only meals with cookingTime <= 30 mins
    eligibleMeals = eligibleMeals.filter((meal) => meal.cookingTime <= 30);
  } else if (preference === "different") {
    // Something Different: exclude meals already present anywhere in the weekly plan
    if (weeklyPlan && Array.isArray(weeklyPlan.days)) {
      const plannedMealIds = new Set(
        weeklyPlan.days
          .map((d) => d.mealId)
          .filter((id) => typeof id === "string" && id.length > 0) as string[]
      );

      if (plannedMealIds.size > 0) {
        eligibleMeals = eligibleMeals.filter((meal) => !plannedMealIds.has(meal.id));
      }
    }
  }

  // 2. Case: Zero Ingredients Selected
  if (!hasSelectedIngredients) {
    return eligibleMeals.slice(0, 3).map((meal) => ({
      meal,
      matchedIngredients: [],
      missingIngredients: [...meal.ingredients],
    }));
  }

  // 3. Case: Ingredients Selected - Calculate matches and missing ingredients
  const scoredMeals: MealRecommendation[] = [];

  for (const meal of eligibleMeals) {
    const matched: string[] = [];
    const missing: string[] = [];

    for (const ingredientId of meal.ingredients) {
      if (selectedSet.has(ingredientId)) {
        matched.push(ingredientId);
      } else {
        missing.push(ingredientId);
      }
    }

    // A meal is only recommended if it contains at least ONE selected ingredient
    if (matched.length > 0) {
      scoredMeals.push({
        meal,
        matchedIngredients: matched,
        missingIngredients: missing,
      });
    }
  }

  // 4. Stable Sort by Match Count (Descending), preserving static dataset order on ties
  scoredMeals.sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length);

  // 5. Return maximum of 3 recommendations
  return scoredMeals.slice(0, 3);
}
