import type { Ingredient } from "../types/meal";

export const INGREDIENTS: Ingredient[] = [
  // Staples, Grains & Tubers
  { id: "rice", name: "Rice", category: "Staples & Grains" },
  { id: "ofada_rice", name: "Ofada Rice", category: "Staples & Grains" },
  { id: "beans", name: "Brown / Honey Beans", category: "Staples & Grains" },
  { id: "yam", name: "Yam", category: "Staples & Grains" },
  { id: "plantain", name: "Plantain", category: "Staples & Grains" },
  { id: "spaghetti", name: "Spaghetti", category: "Staples & Grains" },
  { id: "instant_noodles", name: "Instant Noodles", category: "Staples & Grains" },
  { id: "garri", name: "Garri", category: "Staples & Grains" },
  { id: "semovita", name: "Semovita / Semolina", category: "Staples & Grains" },
  { id: "egusi", name: "Ground Egusi (Melon Seeds)", category: "Staples & Grains" },

  // Proteins
  { id: "eggs", name: "Eggs", category: "Proteins" },
  { id: "chicken_gizzards", name: "Chicken Gizzards", category: "Proteins" },
  { id: "beef", name: "Beef", category: "Proteins" },
  { id: "chicken", name: "Chicken", category: "Proteins" },
  { id: "smoked_fish", name: "Smoked Fish", category: "Proteins" },
  { id: "stockfish", name: "Stockfish", category: "Proteins" },
  { id: "crayfish", name: "Ground Crayfish", category: "Proteins" },
  { id: "liver", name: "Beef Liver", category: "Proteins" },

  // Vegetables & Fresh Produce
  { id: "onion", name: "Onion", category: "Vegetables & Produce" },
  { id: "tomatoes", name: "Fresh Tomatoes", category: "Vegetables & Produce" },
  { id: "scotch_bonnet", name: "Scotch Bonnet (Fresh Pepper / Rodo)", category: "Vegetables & Produce" },
  { id: "bell_pepper", name: "Red Bell Pepper (Tatashe)", category: "Vegetables & Produce" },
  { id: "green_bell_pepper", name: "Green Bell Pepper", category: "Vegetables & Produce" },
  { id: "carrots", name: "Carrots", category: "Vegetables & Produce" },
  { id: "green_peas", name: "Green Peas", category: "Vegetables & Produce" },
  { id: "green_beans", name: "Green Beans", category: "Vegetables & Produce" },
  { id: "spinach", name: "Spinach / Green Leaves", category: "Vegetables & Produce" },
  { id: "ugwu", name: "Ugwu Leaves (Fluted Pumpkin)", category: "Vegetables & Produce" },
  { id: "okra", name: "Fresh Okra", category: "Vegetables & Produce" },
  { id: "garden_egg", name: "Garden Egg", category: "Vegetables & Produce" },
  { id: "tomato_paste", name: "Tomato Paste", category: "Vegetables & Produce" },
  { id: "coconut_milk", name: "Coconut Milk", category: "Vegetables & Produce" },

  // Oils, Seasonings & Aromatics
  { id: "palm_oil", name: "Palm Oil", category: "Oils & Seasonings" },
  { id: "vegetable_oil", name: "Vegetable Oil", category: "Oils & Seasonings" },
  { id: "bouillon_cubes", name: "Bouillon / Seasoning Cubes", category: "Oils & Seasonings" },
  { id: "salt", name: "Salt", category: "Oils & Seasonings" },
  { id: "curry_powder", name: "Curry Powder", category: "Oils & Seasonings" },
  { id: "thyme", name: "Dried Thyme", category: "Oils & Seasonings" },
  { id: "iru", name: "Iru (Locust Beans)", category: "Oils & Seasonings" },
  { id: "garlic", name: "Garlic", category: "Oils & Seasonings" },
  { id: "ginger", name: "Ginger", category: "Oils & Seasonings" },
];

/**
 * Pre-indexed map for O(1) ingredient lookups by ID.
 */
export const INGREDIENT_MAP: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing])
);
