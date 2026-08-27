import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function loadAndTranspileTs(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  const source = fs.readFileSync(fullPath, "utf-8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return result.outputText;
}

const ingJs = loadAndTranspileTs("src/data/ingredients.ts");
const mealJs = loadAndTranspileTs("src/data/meals.ts");
const groceryJs = loadAndTranspileTs("src/lib/groceryGenerator.ts");

const customRequire = (moduleName) => {
  if (moduleName.includes("ingredients")) {
    const exp = {};
    new Function("exports", "require", ingJs)(exp, customRequire);
    return exp;
  }
  if (moduleName.includes("meals")) {
    const exp = {};
    new Function("exports", "require", mealJs)(exp, customRequire);
    return exp;
  }
  if (moduleName.includes("groceryGenerator")) {
    const exp = {};
    new Function("exports", "require", groceryJs)(exp, customRequire);
    return exp;
  }
  return {};
};

const mealsExp = {};
new Function("exports", "require", mealJs)(mealsExp, customRequire);
const { MEALS, MEAL_MAP } = mealsExp;

const ingsExp = {};
new Function("exports", "require", ingJs)(ingsExp, customRequire);
const { INGREDIENT_MAP, INGREDIENTS } = ingsExp;

const groceryExp = {};
new Function("exports", "require", groceryJs)(groceryExp, customRequire);
const { generateGroceryList } = groceryExp;

function runTests() {
  console.log("=========================================");
  console.log(" DishDash Phase 6 Grocery Generator Tests");
  console.log("=========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Empty weekly plan returns an empty grocery list
  const test1 = generateGroceryList({
    weeklyPlan: { weekStartDate: "2026-08-24", days: [] },
    availableIngredientIds: [],
  });
  assert(
    Array.isArray(test1) && test1.length === 0,
    "1. Empty weekly plan returns an empty grocery list"
  );

  // 2. One planned meal produces its required ingredients
  const jollofMeal = MEAL_MAP["jollof_rice"];
  const test2 = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
    availableIngredientIds: [],
  });
  assert(
    test2.length === jollofMeal.ingredients.length &&
      test2.every((item) => jollofMeal.ingredients.includes(item.ingredientId)),
    "2. One planned meal produces all of its required ingredients"
  );

  // 3. Available ingredients are excluded
  const test3 = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
    availableIngredientIds: ["rice", "tomatoes", "onion"],
  });
  const test3Ids = test3.map((i) => i.ingredientId);
  assert(
    !test3Ids.includes("rice") &&
      !test3Ids.includes("tomatoes") &&
      !test3Ids.includes("onion") &&
      test3.length === jollofMeal.ingredients.length - 3,
    "3. Available search ingredients are properly excluded from the grocery list"
  );

  // 4. Duplicate ingredients across multiple meals appear only once
  // Both jollof_rice and fried_rice use rice, onion, vegetable_oil, etc.
  const test4 = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [
        { dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" },
        { dayIndex: 1, dateStr: "2026-08-25", mealId: "fried_rice" },
      ],
    },
    availableIngredientIds: [],
  });
  const idCounts = {};
  for (const item of test4) {
    idCounts[item.ingredientId] = (idCounts[item.ingredientId] || 0) + 1;
  }
  const hasDuplicates = Object.values(idCounts).some((c) => c > 1);
  assert(
    !hasDuplicates && idCounts["rice"] === 1 && idCounts["onion"] === 1,
    "4. Duplicate ingredients across multiple meals appear only once (deduplicated)"
  );

  // 5. Multiple planned meals combine correctly
  const combinedMealIngs = new Set([
    ...MEAL_MAP["jollof_rice"].ingredients,
    ...MEAL_MAP["fried_rice"].ingredients,
  ]);
  assert(
    test4.length === combinedMealIngs.size,
    "5. Multiple planned meals combine correctly into unique total set"
  );

  // 6. Removing a planned meal removes ingredients no longer required
  const test6Before = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [
        { dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" },
        { dayIndex: 1, dateStr: "2026-08-25", mealId: "eba_egusi_soup" },
      ],
    },
    availableIngredientIds: [],
  });
  const test6After = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [
        { dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" },
        { dayIndex: 1, dateStr: "2026-08-25", mealId: null },
      ],
    },
    availableIngredientIds: [],
  });
  assert(
    test6Before.some((i) => i.ingredientId === "egusi") &&
      !test6After.some((i) => i.ingredientId === "egusi"),
    "6. Removing eba_egusi_soup removes 'egusi' which is no longer needed"
  );

  // 7. Invalid meal IDs do not crash the generator
  const test7 = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [
        { dayIndex: 0, dateStr: "2026-08-24", mealId: "invalid_meal_xyz" },
        { dayIndex: 1, dateStr: "2026-08-25", mealId: "jollof_rice" },
      ],
    },
    availableIngredientIds: [],
  });
  assert(
    test7.length === jollofMeal.ingredients.length,
    "7. Invalid meal IDs in the weekly plan are gracefully ignored without crashing"
  );

  // 8. Grocery item IDs are deterministic
  const runA = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
  });
  const runB = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
  });
  assert(
    JSON.stringify(runA) === JSON.stringify(runB),
    "8. Grocery item IDs and structures are 100% deterministic"
  );

  // 9. Source meal names are correctly associated with ingredients
  const jollofAndFried = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [
        { dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" },
        { dayIndex: 1, dateStr: "2026-08-25", mealId: "fried_rice" },
      ],
    },
    availableIngredientIds: [],
  });
  const riceItem = jollofAndFried.find((i) => i.ingredientId === "rice");
  assert(
    riceItem &&
      riceItem.requiredByMealNames.includes("Jollof Rice") &&
      riceItem.requiredByMealNames.includes("Fried Rice"),
    "9. Shared ingredients correctly list all source meal names"
  );

  // 10. Checked/purchased state does not alter the derived grocery list items
  const withPurchased = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
    purchasedGroceryItemIds: ["rice"],
  });
  const purchasedRice = withPurchased.find((i) => i.ingredientId === "rice");
  const unpurchasedOnion = withPurchased.find((i) => i.ingredientId === "onion");
  assert(
    withPurchased.length === jollofMeal.ingredients.length &&
      purchasedRice?.isPurchased === true &&
      unpurchasedOnion?.isPurchased === false,
    "10. Checked state correctly marks isPurchased without removing or altering items"
  );

  // 11. Stale purchased IDs do not create visible grocery items
  const staleCheck = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
    purchasedGroceryItemIds: ["egusi", "semovita", "yam"], // these are not in jollof_rice
  });
  assert(
    staleCheck.length === jollofMeal.ingredients.length &&
      !staleCheck.some((i) => i.ingredientId === "egusi"),
    "11. Stale purchased IDs do not appear in the derived grocery list"
  );

  // 12. Changing availableIngredientIds changes the derived list correctly
  const dynamicA = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
    availableIngredientIds: ["rice"],
  });
  const dynamicB = generateGroceryList({
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" }],
    },
    availableIngredientIds: ["rice", "tomatoes", "onion", "vegetable_oil", "chicken", "salt", "bouillon_cubes", "curry_powder", "thyme", "tomato_paste", "bell_pepper", "scotch_bonnet"],
  });
  assert(
    dynamicA.length === jollofMeal.ingredients.length - 1 &&
      dynamicB.length === 0,
    "12. Adding all ingredients to available list dynamically drops grocery items to 0"
  );

  console.log("-----------------------------------------");
  console.log(`Phase 6 Tests Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=========================================");
  return failed === 0;
}

const allPassed = runTests();
if (!allPassed) {
  process.exit(1);
}
