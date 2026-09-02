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
 * Calculates a preference affinity score for a meal based on mood/preference.
 */
export function getPreferenceScore(meal: Meal, preference: MealPreference): number {
  switch (preference) {
    case "quick": {
      // Faster/easier meals score higher
      if (meal.cookingTime <= 15) return 40;
      if (meal.cookingTime <= 25) return 30;
      if (meal.cookingTime <= 30) return 20;
      return 0;
    }
    case "spicy": {
      let score = 0;
      if (meal.categoryTags.includes("spicy")) score += 30;
      if (meal.ingredients.includes("scotch_bonnet")) score += 20;
      if (meal.categoryTags.includes("stew-based") || meal.categoryTags.includes("flavor-packed")) {
        score += 10;
      }
      return score;
    }
    case "filling": {
      let score = 0;
      if (meal.category === "Swallows" || meal.category === "Beans & Legumes") score += 30;
      if (meal.category === "Rice dishes" || meal.categoryTags.includes("one-pot")) score += 15;
      if (meal.cookingTime > 30) score += 10;
      return score;
    }
    case "sweet": {
      let score = 0;
      if (meal.ingredients.includes("plantain")) score += 35;
      if (meal.ingredients.includes("coconut_milk")) score += 25;
      return score;
    }
    case "surprise":
    default:
      return 0;
  }
}

/**
 * Pure, deterministic client-side recommendation engine for DishDash.
 * Returns up to 3 ranked meal recommendations based on available ingredients and user preference.
 */
export function getRecommendations(input: RecommendationInput): MealRecommendation[] {
  const {
    selectedIngredientIds = [],
    preference = "quick",
    mealLibrary = MEALS,
  } = input;

  const selectedSet = new Set(selectedIngredientIds);
  const hasSelectedIngredients = selectedSet.size > 0;

  // 1. Case: Zero Ingredients Selected
  if (!hasSelectedIngredients) {
    // Sort all library meals by preference score, preserving dataset order on ties
    const rankedLibrary = [...mealLibrary].sort((a, b) => {
      const scoreA = getPreferenceScore(a, preference);
      const scoreB = getPreferenceScore(b, preference);
      return scoreB - scoreA;
    });

    return rankedLibrary.slice(0, 3).map((meal) => ({
      meal,
      matchedIngredients: [],
      missingIngredients: [...meal.ingredients],
    }));
  }

  // 2. Case: Ingredients Selected - Calculate matches and missing ingredients
  const scoredMeals: { rec: MealRecommendation; totalScore: number }[] = [];

  for (const meal of mealLibrary) {
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
      const prefScore = getPreferenceScore(meal, preference);
      // Primary weight is match count (100 pts each), secondary is preference score
      const totalScore = matched.length * 100 + prefScore;

      scoredMeals.push({
        rec: {
          meal,
          matchedIngredients: matched,
          missingIngredients: missing,
        },
        totalScore,
      });
    }
  }

  // 3. Stable Sort by Total Score (Descending), preserving static dataset order on ties
  scoredMeals.sort((a, b) => b.totalScore - a.totalScore);

  // 4. Return maximum of 3 recommendations
  return scoredMeals.slice(0, 3).map((s) => s.rec);
}
