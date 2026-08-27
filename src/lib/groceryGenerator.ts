import type { WeeklyPlan, GroceryItem } from "../types/planner";
import type { Meal, Ingredient } from "../types/meal";
import { MEAL_MAP, MEALS } from "../data/meals";
import { INGREDIENT_MAP, INGREDIENTS } from "../data/ingredients";

export interface GroceryGeneratorInput {
  weeklyPlan?: WeeklyPlan;
  availableIngredientIds?: string[];
  purchasedGroceryItemIds?: string[];
  mealLibrary?: Meal[];
  ingredientMap?: Record<string, Ingredient>;
}

/**
 * Pure, deterministic function to derive a smart grocery checklist for DishDash.
 * Calculation: Planned Meal Ingredients - Available Search Ingredients -> Deduplicate -> Grocery Checklist.
 */
export function generateGroceryList(input: GroceryGeneratorInput): GroceryItem[] {
  const {
    weeklyPlan,
    availableIngredientIds = [],
    purchasedGroceryItemIds = [],
    mealLibrary = MEALS,
    ingredientMap = INGREDIENT_MAP,
  } = input;

  if (!weeklyPlan || !Array.isArray(weeklyPlan.days)) {
    return [];
  }

  // 1. Collect all valid planned meal IDs
  const plannedMealIds = weeklyPlan.days
    .map((day) => day.mealId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (plannedMealIds.length === 0) {
    return [];
  }

  // Build a lookup map for the meal library (supports custom test libraries)
  const mealLookup: Record<string, Meal> =
    mealLibrary === MEALS
      ? MEAL_MAP
      : Object.fromEntries(mealLibrary.map((m) => [m.id, m]));

  // 2. Track which meals require which ingredients
  const ingredientToMealsMap = new Map<
    string,
    { mealIds: Set<string>; mealNames: Set<string> }
  >();

  for (const mealId of plannedMealIds) {
    const meal = mealLookup[mealId];
    // Gracefully ignore non-existent / invalid meal references
    if (!meal || !Array.isArray(meal.ingredients)) {
      continue;
    }

    for (const ingId of meal.ingredients) {
      if (!ingredientToMealsMap.has(ingId)) {
        ingredientToMealsMap.set(ingId, {
          mealIds: new Set(),
          mealNames: new Set(),
        });
      }
      const entry = ingredientToMealsMap.get(ingId)!;
      entry.mealIds.add(meal.id);
      entry.mealNames.add(meal.name);
    }
  }

  // 3. Exclude available search ingredients
  const availableSet = new Set(availableIngredientIds);
  const purchasedSet = new Set(purchasedGroceryItemIds);

  const groceryItems: GroceryItem[] = [];

  for (const [ingId, sources] of ingredientToMealsMap.entries()) {
    // If the user already has this ingredient in their search selection, exclude it
    if (availableSet.has(ingId)) {
      continue;
    }

    const ingredient = ingredientMap[ingId];
    const ingredientName = ingredient ? ingredient.name : ingId;
    const category = ingredient ? ingredient.category : "Oils & Seasonings";

    groceryItems.push({
      ingredientId: ingId,
      ingredientName,
      category,
      requiredByMealIds: Array.from(sources.mealIds),
      requiredByMealNames: Array.from(sources.mealNames),
      isPurchased: purchasedSet.has(ingId),
    });
  }

  // 4. Stable sort: Preserve order of static INGREDIENTS dataset
  const ingredientOrderMap = new Map(INGREDIENTS.map((ing, i) => [ing.id, i]));
  groceryItems.sort((a, b) => {
    const orderA = ingredientOrderMap.get(a.ingredientId) ?? 999;
    const orderB = ingredientOrderMap.get(b.ingredientId) ?? 999;
    return orderA - orderB;
  });

  return groceryItems;
}
