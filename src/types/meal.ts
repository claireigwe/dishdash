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

export type Difficulty = "easy" | "medium" | "hard";
export type Spiciness = "none" | "mild" | "medium" | "high";
export type FillingLevel = "light" | "medium" | "heavy";
export type Sweetness = "none" | "mild" | "sweet";
export type MealType = "breakfast" | "main" | "soup" | "street_food" | "side" | "snack";
export type PrimaryProtein =
  | "beef"
  | "chicken"
  | "fish"
  | "seafood"
  | "goat"
  | "egg"
  | "liver"
  | "gizzard"
  | "turkey"
  | "beans"
  | "none";

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
  difficulty: Difficulty;
  spiciness: Spiciness;
  fillingLevel: FillingLevel;
  sweetness: Sweetness;
  mealType: MealType;
  primaryProtein: PrimaryProtein;
}

export type MealPreference =
  | "spicy"
  | "filling"
  | "quick"
  | "sweet"
  | "surprise";

export type RecommendationRole =
  | "best_match"
  | "easiest"
  | "wildcard"
  | "another_good_match"
  | "another_option";

export interface ScoreBreakdown {
  preferenceScore: number;
  coverageScore: number;
  missingScore: number;
  timeEffortScore: number;
  varietyScore: number;
  totalScore: number;
}

export interface MealRecommendation {
  meal: Meal;
  matchedIngredients: string[];
  missingIngredients: string[];
  role?: RecommendationRole;
  explanation?: string;
  scoreBreakdown?: ScoreBreakdown;
}
