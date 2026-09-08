import type {
  Meal,
  MealPreference,
  MealRecommendation,
  RecommendationRole,
  ScoreBreakdown,
} from "../types/meal";
import type { WeeklyPlan } from "../types/planner";
import { MEALS } from "../data/meals";

export interface RecommendationInput {
  selectedIngredientIds: string[];
  preference: MealPreference;
  weeklyPlan?: WeeklyPlan;
  mealLibrary?: Meal[];
}

// Tunable Scoring Weights
export const PREFERENCE_WEIGHT = 0.35;
export const INGREDIENT_COVERAGE_WEIGHT = 0.30;
export const MISSING_INGREDIENTS_WEIGHT = 0.15;
export const TIME_EFFORT_WEIGHT = 0.10;
export const VARIETY_WEIGHT = 0.10;

/**
 * Calculates preference fit score (0 - 100).
 */
export function calculatePreferenceScore(meal: Meal, preference: MealPreference): number {
  switch (preference) {
    case "quick": {
      if (meal.cookingTime <= 20) return 100;
      if (meal.cookingTime <= 30) return 85;
      if (meal.cookingTime <= 45) return 50;
      return 15;
    }
    case "spicy": {
      if (meal.spiciness === "high") return 100;
      if (meal.spiciness === "medium") return 75;
      if (meal.spiciness === "mild") return 35;
      return 0;
    }
    case "filling": {
      if (meal.fillingLevel === "heavy") return 100;
      if (meal.fillingLevel === "medium") return 70;
      return 30;
    }
    case "sweet": {
      if (meal.sweetness === "sweet") return 100;
      if (meal.sweetness === "mild") return 60;
      return 10;
    }
    case "surprise": {
      // Base favorable score for variety
      return 85;
    }
    default:
      return 50;
  }
}

/**
 * Calculates proportional ingredient coverage score (0 - 100).
 */
export function calculateCoverageScore(
  matchedCount: number,
  totalRequired: number,
  hasSelectedIngredients: boolean
): number {
  if (!hasSelectedIngredients) {
    return 50; // Neutral baseline when user hasn't selected any ingredients
  }
  if (totalRequired === 0) return 0;
  return (matchedCount / totalRequired) * 100;
}

/**
 * Calculates missing ingredients score (0 - 100). Fewer missing items = higher score.
 */
export function calculateMissingScore(
  missingCount: number,
  hasSelectedIngredients: boolean
): number {
  if (!hasSelectedIngredients) {
    return 50; // Neutral baseline
  }
  return Math.max(0, 100 - missingCount * 12);
}

/**
 * Calculates cooking time and effort practicality score (0 - 100).
 */
export function calculateTimeEffortScore(meal: Meal): number {
  const timeScore = Math.max(0, 100 - meal.cookingTime * 1.2);
  const difficultyScore =
    meal.difficulty === "easy" ? 100 : meal.difficulty === "medium" ? 70 : 40;

  return Math.round(timeScore * 0.6 + difficultyScore * 0.4);
}

/**
 * Collects all planned meal IDs across all days and meal slots (breakfast, lunch, dinner, snack).
 */
export function getAllPlannedMealIds(weeklyPlan?: WeeklyPlan): string[] {
  if (!weeklyPlan || !Array.isArray(weeklyPlan.days)) return [];
  const mealIds: string[] = [];
  for (const day of weeklyPlan.days) {
    if (day.slots && typeof day.slots === "object") {
      const slots = ["breakfast", "lunch", "dinner", "snack"] as const;
      for (const slot of slots) {
        const id = day.slots[slot];
        if (typeof id === "string" && id.length > 0) {
          mealIds.push(id);
        }
      }
    } else if (typeof day.mealId === "string" && day.mealId.length > 0) {
      mealIds.push(day.mealId);
    }
  }
  return mealIds;
}

/**
 * Calculates weekly variety score (0 - 100) by penalizing repetition in the weekly plan.
 * Checks all planned meals across all 7 days × 4 meal slots.
 */
export function calculateVarietyScore(meal: Meal, weeklyPlan?: WeeklyPlan): number {
  if (!weeklyPlan || !weeklyPlan.days) return 100;

  const plannedMealIds = getAllPlannedMealIds(weeklyPlan);

  if (plannedMealIds.length === 0) return 100;

  let penalty = 0;

  // Exact duplicate penalty
  if (plannedMealIds.includes(meal.id)) {
    penalty += 80;
  }

  // Same primary protein penalty (if applicable)
  if (meal.primaryProtein && meal.primaryProtein !== "none") {
    // Count how many planned meals share the same protein (lookup in MEALS)
    const sameProteinCount = plannedMealIds.filter((id) => {
      const plannedMeal = MEALS.find((m) => m.id === id);
      return plannedMeal && plannedMeal.primaryProtein === meal.primaryProtein;
    }).length;
    penalty += Math.min(40, sameProteinCount * 20);
  }

  // Same category penalty
  const sameCategoryCount = plannedMealIds.filter((id) => {
    const plannedMeal = MEALS.find((m) => m.id === id);
    return plannedMeal && plannedMeal.category === meal.category;
  }).length;
  penalty += Math.min(30, sameCategoryCount * 15);

  return Math.max(0, 100 - penalty);
}

/**
 * Computes the composite recommendation score and breakdown for a meal.
 */
export function scoreMeal(
  meal: Meal,
  matchedCount: number,
  missingCount: number,
  preference: MealPreference,
  hasSelectedIngredients: boolean,
  weeklyPlan?: WeeklyPlan
): ScoreBreakdown {
  const preferenceScore = calculatePreferenceScore(meal, preference);
  const coverageScore = calculateCoverageScore(
    matchedCount,
    meal.ingredients.length,
    hasSelectedIngredients
  );
  const missingScore = calculateMissingScore(missingCount, hasSelectedIngredients);
  const timeEffortScore = calculateTimeEffortScore(meal);
  const varietyScore = calculateVarietyScore(meal, weeklyPlan);

  const totalScore = Number(
    (
      preferenceScore * PREFERENCE_WEIGHT +
      coverageScore * INGREDIENT_COVERAGE_WEIGHT +
      missingScore * MISSING_INGREDIENTS_WEIGHT +
      timeEffortScore * TIME_EFFORT_WEIGHT +
      varietyScore * VARIETY_WEIGHT
    ).toFixed(2)
  );

  return {
    preferenceScore,
    coverageScore,
    missingScore,
    timeEffortScore,
    varietyScore,
    totalScore,
  };
}

/**
 * Generates an informative, truthful plain-English explanation grounded in actual factors.
 */
export function generateExplanation(
  meal: Meal,
  role: RecommendationRole,
  matchedCount: number,
  missingCount: number,
  totalIngredients: number,
  preference: MealPreference,
  hasSelectedIngredients: boolean
): string {
  if (hasSelectedIngredients) {
    if (role === "best_match") {
      if (missingCount === 0) {
        return `Best match • You have all ${totalIngredients} ingredients, ready in ${meal.cookingTime} mins`;
      }
      return `Best match • Uses ${matchedCount} of ${totalIngredients} ingredients, ready in ${meal.cookingTime} mins`;
    }
    if (role === "easiest") {
      if (missingCount === 0) {
        return `Easiest option • You have everything needed, ready in ${meal.cookingTime} mins`;
      }
      return `Easiest option • Only needs ${missingCount} more ingredient${
        missingCount === 1 ? "" : "s"
      } (${meal.cookingTime} mins)`;
    }
    if (role === "wildcard") {
      const spiceText = meal.spiciness !== "none" ? `${meal.spiciness} spice` : "";
      const fillText = `${meal.fillingLevel} meal`;
      const tag = [spiceText, fillText].filter(Boolean).join(", ");
      return `Wildcard choice • ${tag} using ${matchedCount} of your ingredients for variety`;
    }
    if (role === "another_good_match") {
      if (missingCount === 0) {
        return `Good match • You have all ${totalIngredients} ingredients, ready in ${meal.cookingTime} mins`;
      }
      return `Good match • Uses ${matchedCount} of ${totalIngredients} ingredients (${meal.cookingTime} mins)`;
    }
    // another_option
    if (missingCount === 0) {
      return `Another option • You have everything needed (${meal.cookingTime} mins)`;
    }
    return `Another option • Uses ${matchedCount} of your ingredients (${meal.cookingTime} mins)`;
  }

  // Zero ingredients selected flow
  if (role === "best_match") {
    return `Top match • Fits your ${preference} mood perfectly in ${meal.cookingTime} mins`;
  }
  if (role === "easiest") {
    return `Easiest option • Quick ${meal.cookingTime}-min prep with simple steps`;
  }
  if (role === "wildcard") {
    return `Wildcard choice • A delicious ${meal.category.toLowerCase()} suggestion for variety`;
  }
  if (role === "another_good_match") {
    return `Good match • Great ${meal.category.toLowerCase()} choice for your ${preference} mood`;
  }
  return `Another option • A delicious ${meal.category.toLowerCase()} dish ready in ${meal.cookingTime} mins`;
}

interface ScoredCandidate {
  meal: Meal;
  matchedIngredients: string[];
  missingIngredients: string[];
  scoreBreakdown: ScoreBreakdown;
  originalIndex: number;
}

/**
 * Pure, deterministic Recommendation Engine V2 for DishDash.
 * Returns up to 5 distinct, ranked recommendations:
 * 1. Best Match
 * 2. Easiest Option
 * 3. Wildcard Choice
 * 4. Another Good Match
 * 5. Another Option
 */
export function getRecommendations(input: RecommendationInput): MealRecommendation[] {
  const {
    selectedIngredientIds = [],
    preference = "quick",
    weeklyPlan,
    mealLibrary = MEALS,
  } = input;

  const selectedSet = new Set(selectedIngredientIds);
  const hasSelectedIngredients = selectedSet.size > 0;

  // 1. Score all eligible library meals
  const candidates: ScoredCandidate[] = [];

  mealLibrary.forEach((meal, index) => {
    const matched: string[] = [];
    const missing: string[] = [];

    for (const ingredientId of meal.ingredients) {
      if (selectedSet.has(ingredientId)) {
        matched.push(ingredientId);
      } else {
        missing.push(ingredientId);
      }
    }

    // A meal is eligible if no ingredients are selected OR it matches at least one selected ingredient
    const isEligible = !hasSelectedIngredients || matched.length > 0;

    if (isEligible) {
      const scoreBreakdown = scoreMeal(
        meal,
        matched.length,
        missing.length,
        preference,
        hasSelectedIngredients,
        weeklyPlan
      );

      candidates.push({
        meal,
        matchedIngredients: matched,
        missingIngredients: missing,
        scoreBreakdown,
        originalIndex: index,
      });
    }
  });

  // If no eligible candidates, return empty list (triggers NoMatchState)
  if (candidates.length === 0) {
    return [];
  }

  // Sort candidates by totalScore (descending), tie-breaking deterministically by original dataset order
  candidates.sort((a, b) => {
    if (b.scoreBreakdown.totalScore !== a.scoreBreakdown.totalScore) {
      return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    }
    return a.originalIndex - b.originalIndex;
  });

  // Handle case with 1 candidate
  if (candidates.length === 1) {
    const best = candidates[0];
    return [
      {
        meal: best.meal,
        matchedIngredients: best.matchedIngredients,
        missingIngredients: best.missingIngredients,
        role: "best_match",
        scoreBreakdown: best.scoreBreakdown,
        explanation: generateExplanation(
          best.meal,
          "best_match",
          best.matchedIngredients.length,
          best.missingIngredients.length,
          best.meal.ingredients.length,
          preference,
          hasSelectedIngredients
        ),
      },
    ];
  }

  // Handle case with 2 candidates
  if (candidates.length === 2) {
    const best = candidates[0];
    const second = candidates[1];
    return [
      {
        meal: best.meal,
        matchedIngredients: best.matchedIngredients,
        missingIngredients: best.missingIngredients,
        role: "best_match",
        scoreBreakdown: best.scoreBreakdown,
        explanation: generateExplanation(
          best.meal,
          "best_match",
          best.matchedIngredients.length,
          best.missingIngredients.length,
          best.meal.ingredients.length,
          preference,
          hasSelectedIngredients
        ),
      },
      {
        meal: second.meal,
        matchedIngredients: second.matchedIngredients,
        missingIngredients: second.missingIngredients,
        role: "easiest",
        scoreBreakdown: second.scoreBreakdown,
        explanation: generateExplanation(
          second.meal,
          "easiest",
          second.matchedIngredients.length,
          second.missingIngredients.length,
          second.meal.ingredients.length,
          preference,
          hasSelectedIngredients
        ),
      },
    ];
  }

  // 3+ Candidates: Incrementally select up to 5 distinct, purposeful roles
  // Role 1: Best Match (highest total composite score)
  const bestCandidate = candidates[0];

  // Role 2: Easiest Option (prioritizes minimal missing items and preparation ease)
  const remainingAfterBest = candidates.slice(1);

  const scoredForEasiest = remainingAfterBest.map((c) => {
    const easeMetric =
      c.scoreBreakdown.missingScore * 0.45 +
      c.scoreBreakdown.timeEffortScore * 0.35 +
      c.scoreBreakdown.coverageScore * 0.20;
    return { candidate: c, easeMetric };
  });

  scoredForEasiest.sort((a, b) => {
    if (b.easeMetric !== a.easeMetric) {
      return b.easeMetric - a.easeMetric;
    }
    return b.candidate.scoreBreakdown.totalScore - a.candidate.scoreBreakdown.totalScore;
  });

  const easiestCandidate = scoredForEasiest[0].candidate;

  // Role 3: Wildcard (relevant candidate providing variety from best and easiest)
  const remainingAfterEasiest = candidates.filter(
    (c) => c.meal.id !== bestCandidate.meal.id && c.meal.id !== easiestCandidate.meal.id
  );

  const scoredForWildcard = remainingAfterEasiest.map((c) => {
    const diffCategory =
      c.meal.category !== bestCandidate.meal.category &&
      c.meal.category !== easiestCandidate.meal.category;
    const diffProtein =
      c.meal.primaryProtein !== "none" &&
      c.meal.primaryProtein !== bestCandidate.meal.primaryProtein &&
      c.meal.primaryProtein !== easiestCandidate.meal.primaryProtein;

    // Wildcard boost encourages category and protein divergence while keeping totalScore high
    const diversityBoost = (diffCategory ? 20 : 0) + (diffProtein ? 20 : 0);
    const wildcardMetric = c.scoreBreakdown.totalScore + diversityBoost;

    return { candidate: c, wildcardMetric };
  });

  scoredForWildcard.sort((a, b) => {
    if (b.wildcardMetric !== a.wildcardMetric) {
      return b.wildcardMetric - a.wildcardMetric;
    }
    return b.candidate.scoreBreakdown.totalScore - a.candidate.scoreBreakdown.totalScore;
  });

  const wildcardCandidate = scoredForWildcard[0].candidate;

  const chosenSoFar: { candidate: ScoredCandidate; role: RecommendationRole }[] = [
    { candidate: bestCandidate, role: "best_match" },
    { candidate: easiestCandidate, role: "easiest" },
    { candidate: wildcardCandidate, role: "wildcard" },
  ];

  // Role 4: Another Good Match (if 4th candidate exists)
  const remainingAfterWildcard = candidates.filter(
    (c) => !chosenSoFar.some((chosen) => chosen.candidate.meal.id === c.meal.id)
  );

  if (remainingAfterWildcard.length > 0) {
    const existingCategories = new Set(chosenSoFar.map((x) => x.candidate.meal.category));
    const existingProteins = new Set(chosenSoFar.map((x) => x.candidate.meal.primaryProtein));

    const scoredForMatch4 = remainingAfterWildcard.map((c) => {
      const isFreshCategory = !existingCategories.has(c.meal.category);
      const isFreshProtein =
        c.meal.primaryProtein !== "none" && !existingProteins.has(c.meal.primaryProtein);

      // Mild diversity boost prevents identical duplicates while preserving high totalScore
      const diversityBoost = (isFreshCategory ? 12 : 0) + (isFreshProtein ? 8 : 0);
      const score4 = c.scoreBreakdown.totalScore + diversityBoost;

      return { candidate: c, score4 };
    });

    scoredForMatch4.sort((a, b) => {
      if (b.score4 !== a.score4) {
        return b.score4 - a.score4;
      }
      if (b.candidate.scoreBreakdown.totalScore !== a.candidate.scoreBreakdown.totalScore) {
        return b.candidate.scoreBreakdown.totalScore - a.candidate.scoreBreakdown.totalScore;
      }
      return a.candidate.originalIndex - b.candidate.originalIndex;
    });

    const match4Candidate = scoredForMatch4[0].candidate;
    chosenSoFar.push({ candidate: match4Candidate, role: "another_good_match" });

    // Role 5: Another Option (if 5th candidate exists)
    const remainingAfterMatch4 = candidates.filter(
      (c) => !chosenSoFar.some((chosen) => chosen.candidate.meal.id === c.meal.id)
    );

    if (remainingAfterMatch4.length > 0) {
      const updatedCategories = new Set(chosenSoFar.map((x) => x.candidate.meal.category));
      const updatedProteins = new Set(chosenSoFar.map((x) => x.candidate.meal.primaryProtein));

      const scoredForOption5 = remainingAfterMatch4.map((c) => {
        const isFreshCategory = !updatedCategories.has(c.meal.category);
        const isFreshProtein =
          c.meal.primaryProtein !== "none" && !updatedProteins.has(c.meal.primaryProtein);

        const diversityBoost = (isFreshCategory ? 12 : 0) + (isFreshProtein ? 8 : 0);
        const score5 = c.scoreBreakdown.totalScore + diversityBoost;

        return { candidate: c, score5 };
      });

      scoredForOption5.sort((a, b) => {
        if (b.score5 !== a.score5) {
          return b.score5 - a.score5;
        }
        if (b.candidate.scoreBreakdown.totalScore !== a.candidate.scoreBreakdown.totalScore) {
          return b.candidate.scoreBreakdown.totalScore - a.candidate.scoreBreakdown.totalScore;
        }
        return a.candidate.originalIndex - b.candidate.originalIndex;
      });

      const option5Candidate = scoredForOption5[0].candidate;
      chosenSoFar.push({ candidate: option5Candidate, role: "another_option" });
    }
  }

  return chosenSoFar.map(({ candidate, role }) => ({
    meal: candidate.meal,
    matchedIngredients: candidate.matchedIngredients,
    missingIngredients: candidate.missingIngredients,
    role,
    scoreBreakdown: candidate.scoreBreakdown,
    explanation: generateExplanation(
      candidate.meal,
      role,
      candidate.matchedIngredients.length,
      candidate.missingIngredients.length,
      candidate.meal.ingredients.length,
      preference,
      hasSelectedIngredients
    ),
  }));
}
