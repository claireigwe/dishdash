import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Read and extract data from typescript files cleanly
function loadTsData(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  // Strip TypeScript type annotations and export statements for pure JSON-like JS evaluation
  const cleaned = content
    .replace(/import\s+type\s+[^;]+;/g, "")
    .replace(/export\s+const\s+INGREDIENTS:\s*Ingredient\[\]\s*=/g, "const INGREDIENTS =")
    .replace(/export\s+const\s+INGREDIENT_MAP:\s*Record<string,\s*Ingredient>\s*=/g, "const INGREDIENT_MAP =")
    .replace(/export\s+const\s+MEALS:\s*Meal\[\]\s*=/g, "const MEALS =")
    .replace(/export\s+const\s+MEAL_MAP:\s*Record<string,\s*Meal>\s*=/g, "const MEAL_MAP =");

  return cleaned;
}

const ingredientsCode = loadTsData(path.join(rootDir, "src", "data", "ingredients.ts"));
const mealsCode = loadTsData(path.join(rootDir, "src", "data", "meals.ts"));

// Evaluate in isolated scope
const sandbox = {};
const evalFn = new Function(
  "exports",
  `${ingredientsCode}\n${mealsCode}\nreturn { INGREDIENTS, INGREDIENT_MAP, MEALS, MEAL_MAP };`
);
const { INGREDIENTS, INGREDIENT_MAP, MEALS } = evalFn(sandbox);

function runValidation() {
  console.log("=========================================");
  console.log("   DishDash Data Integrity Validation   ");
  console.log("=========================================");

  let errors = 0;

  // 1. Validate Ingredients
  console.log(`Checking ${INGREDIENTS.length} ingredients...`);
  const ingredientIds = new Set();
  for (const ing of INGREDIENTS) {
    if (!ing.id || typeof ing.id !== "string") {
      console.error(`[ERROR] Ingredient missing valid id:`, ing);
      errors++;
    }
    if (!ing.name || typeof ing.name !== "string") {
      console.error(`[ERROR] Ingredient missing name:`, ing);
      errors++;
    }
    if (!ing.category || typeof ing.category !== "string") {
      console.error(`[ERROR] Ingredient missing category:`, ing);
      errors++;
    }
    if (ingredientIds.has(ing.id)) {
      console.error(`[ERROR] Duplicate ingredient id found: "${ing.id}"`);
      errors++;
    }
    ingredientIds.add(ing.id);
  }

  // 2. Validate Meals
  console.log(`Checking ${MEALS.length} meals...`);
  if (MEALS.length !== 20) {
    console.warn(`[WARN] Expected exactly 20 meals, but found ${MEALS.length}`);
  }

  const mealIds = new Set();
  const validCategories = new Set([
    "Rice dishes",
    "Soups & Stews",
    "Swallows",
    "Beans & Legumes",
    "Yam & Plantain",
    "Pasta & Quick meals",
  ]);

  let quickMealsCount = 0;
  let standardMealsCount = 0;

  for (const meal of MEALS) {
    // Unique ID
    if (!meal.id || typeof meal.id !== "string") {
      console.error(`[ERROR] Meal missing valid id:`, meal);
      errors++;
    }
    if (mealIds.has(meal.id)) {
      console.error(`[ERROR] Duplicate meal id found: "${meal.id}"`);
      errors++;
    }
    mealIds.add(meal.id);

    // Name & description
    if (!meal.name || typeof meal.name !== "string") {
      console.error(`[ERROR] Meal "${meal.id}" missing name`);
      errors++;
    }
    if (!meal.description || typeof meal.description !== "string") {
      console.error(`[ERROR] Meal "${meal.id}" missing description`);
      errors++;
    }

    // Category
    if (!validCategories.has(meal.category)) {
      console.error(`[ERROR] Meal "${meal.id}" has invalid category: "${meal.category}"`);
      errors++;
    }

    // Cooking time & quick flag consistency
    if (typeof meal.cookingTime !== "number" || meal.cookingTime <= 0) {
      console.error(`[ERROR] Meal "${meal.id}" has invalid cookingTime: ${meal.cookingTime}`);
      errors++;
    }
    const expectedQuick = meal.cookingTime <= 30;
    if (meal.isQuick !== expectedQuick) {
      console.error(
        `[ERROR] Meal "${meal.id}" isQuick mismatch: isQuick is ${meal.isQuick}, but cookingTime is ${meal.cookingTime}m (expected isQuick: ${expectedQuick})`
      );
      errors++;
    }

    if (meal.isQuick) {
      quickMealsCount++;
    } else {
      standardMealsCount++;
    }

    // Ingredients
    if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
      console.error(`[ERROR] Meal "${meal.id}" has no ingredients listed`);
      errors++;
    } else {
      for (const ingId of meal.ingredients) {
        if (!ingredientIds.has(ingId)) {
          console.error(`[ERROR] Meal "${meal.id}" references UNKNOWN ingredient id: "${ingId}"`);
          errors++;
        }
      }
    }

    // Instructions
    if (!Array.isArray(meal.instructions) || meal.instructions.length === 0) {
      console.error(`[ERROR] Meal "${meal.id}" has no instructions listed`);
      errors++;
    }
  }

    // Ingredient usage check
    const ingredientUsage = {};
    for (const ing of INGREDIENTS) {
      ingredientUsage[ing.id] = 0;
    }
    for (const meal of MEALS) {
      for (const ingId of meal.ingredients) {
        if (ingredientUsage[ingId] !== undefined) {
          ingredientUsage[ingId]++;
        }
      }
    }
    const unusedIngredients = Object.keys(ingredientUsage).filter(
      (id) => ingredientUsage[id] === 0
    );

    console.log("-----------------------------------------");
    console.log("Ingredient Category Breakdown:");
    const categoryCounts = {};
    for (const ing of INGREDIENTS) {
      categoryCounts[ing.category] = (categoryCounts[ing.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(categoryCounts)) {
      console.log(`   - ${cat}: ${count}`);
    }

    if (unusedIngredients.length > 0) {
      console.warn(`[WARN] ${unusedIngredients.length} unused ingredient(s):`, unusedIngredients);
    } else {
      console.log("   - All ingredients are actively used in at least one recipe.");
    }

    console.log("-----------------------------------------");
    if (errors === 0) {
      console.log("✅ ALL DATA INTEGRITY CHECKS PASSED:");
      console.log(`   - Ingredients: ${INGREDIENTS.length} total (0 duplicates)`);
      console.log(`   - Meals: ${MEALS.length} total (0 duplicates, 100% valid ingredient references)`);
      console.log(`   - Quick meals (<= 30 mins): ${quickMealsCount}`);
      console.log(`   - Standard meals (> 30 mins): ${standardMealsCount}`);
      console.log(`   - 30-min isQuick rule consistency: 100% PASS`);
      console.log("=========================================");
      return true;
    } else {
    console.error(`❌ VALIDATION FAILED with ${errors} error(s).`);
    console.log("=========================================");
    return false;
  }
}

const passed = runValidation();
if (!passed) {
  process.exit(1);
}
