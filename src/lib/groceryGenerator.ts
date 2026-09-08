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

  // 1. Collect all valid planned meals across all 7 days and 4 slots
  const plannedMealEntries: { mealId: string; dayIndex: number; slot?: string }[] = [];

  for (const day of weeklyPlan.days) {
    if (day.slots && typeof day.slots === "object") {
      const slots = ["breakfast", "lunch", "dinner", "snack"] as const;
      for (const slot of slots) {
        const id = day.slots[slot];
        if (typeof id === "string" && id.length > 0) {
          plannedMealEntries.push({ mealId: id, dayIndex: day.dayIndex, slot });
        }
      }
    } else if (typeof day.mealId === "string" && day.mealId.length > 0) {
      plannedMealEntries.push({ mealId: day.mealId, dayIndex: day.dayIndex, slot: "lunch" });
    }
  }

  if (plannedMealEntries.length === 0) {
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

  for (const entryItem of plannedMealEntries) {
    const meal = mealLookup[entryItem.mealId];
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
