/**
 * Core Ingredient and Meal type contracts for DishDash.
 */

export interface Ingredient {
  id: string;
  name: string;
  category: string;
}

export type MealCategory =
  | "Rice dishes"
  | "Soups & Stews"
  | "Swallows"
  | "Beans & Legumes"
  | "Yam & Plantain"
  | "Pasta & Quick meals";

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: MealCategory;
  cookingTime: number;
  isQuick: boolean;
  categoryTags: string[];
  ingredients: string[]; // Array of valid Ingredient IDs
  instructions: string[];
}

export type MealPreference =
  | "spicy"
  | "filling"
  | "quick"
  | "sweet"
  | "surprise";

export interface MealRecommendation {
  meal: Meal;
  matchedIngredients: string[];
  missingIngredients: string[];
}
