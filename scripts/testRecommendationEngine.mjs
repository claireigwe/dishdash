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

// Create isolated CommonJS environment for test execution
const ingJs = loadAndTranspileTs("src/data/ingredients.ts");
const mealJs = loadAndTranspileTs("src/data/meals.ts");
const engineJs = loadAndTranspileTs("src/lib/recommendationEngine.ts");

const moduleExports = {};
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
  return {};
};

const engineExp = {};
new Function("exports", "require", engineJs)(engineExp, customRequire);
const { getRecommendations } = engineExp;

const mealsExp = {};
new Function("exports", "require", mealJs)(mealsExp, customRequire);
const { MEALS } = mealsExp;

function runTests() {
  console.log("=========================================");
  console.log(" DishDash Recommendation Engine Unit Tests");
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

  // 1. No ingredients + No Preference -> Top 3 static meals
  const test1 = getRecommendations({ selectedIngredientIds: [], preference: "none" });
  assert(
    test1.length === 3 &&
      test1[0].meal.id === MEALS[0].id &&
      test1[1].meal.id === MEALS[1].id &&
      test1[2].meal.id === MEALS[2].id &&
      test1[0].matchedIngredients.length === 0,
    "1. No ingredients + No Preference returns first 3 static meals with 0 matches"
  );

  // 2. No ingredients + Quick & Easy -> Top 3 quick meals in static order
  const test2 = getRecommendations({ selectedIngredientIds: [], preference: "quick" });
  const allQuick = MEALS.filter((m) => m.cookingTime <= 30);
  assert(
    test2.length === 3 &&
      test2.every((r) => r.meal.cookingTime <= 30) &&
      test2[0].meal.id === allQuick[0].id &&
      test2[1].meal.id === allQuick[1].id,
    "2. No ingredients + Quick & Easy returns first 3 quick meals (cookingTime <= 30)"
  );

  // 3. No ingredients + Something Different -> All eligible if plan is empty
  const test3 = getRecommendations({ selectedIngredientIds: [], preference: "different", weeklyPlan: { weekStartDate: "2026-08-24", days: [] } });
  assert(
    test3.length === 3 && test3[0].meal.id === MEALS[0].id,
    "3. No ingredients + Something Different (empty plan) returns first 3 static meals"
  );

  // 4. One matching ingredient (e.g. "egusi")
  const test4 = getRecommendations({ selectedIngredientIds: ["egusi"], preference: "none" });
  assert(
    test4.length === 1 &&
      test4[0].meal.id === "eba_egusi_soup" &&
      test4[0].matchedIngredients.includes("egusi") &&
      test4[0].missingIngredients.includes("beef"),
    "4. One matching ingredient ('egusi') returns exactly the meal containing egusi with matching & missing details"
  );

  // 5. Multiple matching ingredients (e.g. rice, tomato, onion)
  const test5 = getRecommendations({
    selectedIngredientIds: ["rice", "tomatoes", "onion", "tomato_paste", "bell_pepper"],
    preference: "none",
  });
  assert(
    test5.length === 3 &&
      test5[0].matchedIngredients.length >= test5[1].matchedIngredients.length &&
      test5[1].matchedIngredients.length >= test5[2].matchedIngredients.length,
    "5. Multiple matching ingredients correctly ranks meals descending by match count"
  );

  // 6. No matching meals (e.g. impossible / empty intersection)
  const dummyMealLib = [
    {
      id: "m1",
      name: "M1",
      description: "D",
      category: "Rice dishes",
      cookingTime: 20,
      isQuick: true,
      categoryTags: [],
      ingredients: ["rice", "onion"],
      instructions: ["Step 1"],
    },
  ];
  const test6 = getRecommendations({
    selectedIngredientIds: ["yam"],
    preference: "none",
    mealLibrary: dummyMealLib,
  });
  assert(test6.length === 0, "6. No matching meals returns empty array (triggers NoMatchState)");

  // 7. Only one valid recommendation exists
  const test7 = getRecommendations({
    selectedIngredientIds: ["semovita"],
    preference: "none",
  });
  assert(test7.length === 1 && test7[0].meal.id === "semo_vegetable_soup", "7. Only 1 valid recommendation returns array of length 1");

  // 8. Only two valid recommendations exist
  const test8 = getRecommendations({
    selectedIngredientIds: ["spaghetti", "instant_noodles"],
    preference: "none",
  });
  assert(
    test8.length === 2 &&
      test8.map((r) => r.meal.id).sort().join(",") === "noodles_egg,spaghetti_jollof",
    "8. Only 2 valid recommendations returns exactly 2 without filler or duplicates"
  );

  // 9. More than three valid recommendations exist -> capped at exactly 3
  const test9 = getRecommendations({
    selectedIngredientIds: ["onion", "salt", "bouillon_cubes", "scotch_bonnet"],
    preference: "none",
  });
  assert(test9.length === 3, "9. More than 3 valid recommendations returns capped array of exactly 3");

  // 10. Quick & Easy excludes meals over 30 minutes
  const test10 = getRecommendations({
    selectedIngredientIds: ["beans", "palm_oil", "onion", "scotch_bonnet", "crayfish"],
    preference: "quick",
  });
  assert(
    test10.every((r) => r.meal.cookingTime <= 30) &&
      !test10.some((r) => r.meal.id === "beans_porridge"), // beans_porridge is 50 mins
    "10. Quick & Easy strictly excludes meals over 30 minutes (e.g. beans_porridge excluded)"
  );

  // 11. Something Different excludes meals already in the weekly plan
  const samplePlan = {
    weekStartDate: "2026-08-24",
    days: [
      { dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" },
      { dayIndex: 1, dateStr: "2026-08-25", mealId: "fried_rice" },
    ],
  };
  const test11 = getRecommendations({
    selectedIngredientIds: ["rice", "onion", "curry_powder", "thyme"],
    preference: "different",
    weeklyPlan: samplePlan,
  });
  assert(
    !test11.some((r) => r.meal.id === "jollof_rice" || r.meal.id === "fried_rice"),
    "11. Something Different excludes planned meals (jollof_rice and fried_rice excluded)"
  );

  // 12. Empty weekly plan allows all meals for Something Different
  const test12 = getRecommendations({
    selectedIngredientIds: ["rice", "tomatoes", "onion"],
    preference: "different",
    weeklyPlan: { weekStartDate: "2026-08-24", days: [] },
  });
  assert(
    test12.some((r) => r.meal.id === "jollof_rice"),
    "12. Empty weekly plan allows all meals for Something Different"
  );

  // 13. Equal ingredient matches preserve static dataset order
  const tiedMeals = [
    { id: "meal_a", name: "A", description: "D", category: "Yam & Plantain", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["yam"], instructions: [] },
    { id: "meal_b", name: "B", description: "D", category: "Yam & Plantain", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["yam"], instructions: [] },
    { id: "meal_c", name: "C", description: "D", category: "Yam & Plantain", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["yam"], instructions: [] },
  ];
  const test13 = getRecommendations({
    selectedIngredientIds: ["yam"],
    preference: "none",
    mealLibrary: tiedMeals,
  });
  assert(
    test13[0].meal.id === "meal_a" &&
      test13[1].meal.id === "meal_b" &&
      test13[2].meal.id === "meal_c",
    "13. Equal ingredient matches preserve static dataset order"
  );

  // 14. Same input always produces the same result (Determinism)
  const inputSample = {
    selectedIngredientIds: ["plantain", "eggs", "tomatoes"],
    preference: "quick",
  };
  const runA = getRecommendations(inputSample);
  const runB = getRecommendations(inputSample);
  assert(
    JSON.stringify(runA) === JSON.stringify(runB),
    "14. Same inputs produce 100% deterministic identical output"
  );

  // 15. Selected ingredients are correctly shown as matching and missing
  const test15 = getRecommendations({
    selectedIngredientIds: ["plantain", "eggs"],
    preference: "none",
  });
  const plantainEggMeal = test15.find((r) => r.meal.id === "fried_plantain_egg");
  assert(
    plantainEggMeal &&
      plantainEggMeal.matchedIngredients.includes("plantain") &&
      plantainEggMeal.matchedIngredients.includes("eggs") &&
      plantainEggMeal.missingIngredients.includes("vegetable_oil"),
    "15. Ingredients are correctly partitioned into matching and missing lists"
  );

  // 17. Selected ingredients match meals, but none qualify for Quick & Easy
  const test17 = getRecommendations({
    selectedIngredientIds: ["liver"], // liver is only in fried_rice (40 mins)
    preference: "quick",
  });
  assert(
    test17.length === 0,
    "17. Selected ingredients matching only non-quick meals return empty array when Quick preference is active"
  );

  // 18. Selected ingredients match meals, but all matching meals are in the weekly plan (Something Different)
  const test18 = getRecommendations({
    selectedIngredientIds: ["semovita"], // only in semo_vegetable_soup
    preference: "different",
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "semo_vegetable_soup" }],
    },
  });
  assert(
    test18.length === 0,
    "18. Selected ingredients matching only planned meals return empty array when Something Different is active"
  );

  // 19. Zero ingredients selected, but all library meals are in the weekly plan (Something Different)
  const smallLibrary = [
    { id: "m1", name: "M1", description: "D", category: "Rice dishes", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["rice"], instructions: [] },
  ];
  const test19 = getRecommendations({
    selectedIngredientIds: [],
    preference: "different",
    weeklyPlan: {
      weekStartDate: "2026-08-24",
      days: [{ dayIndex: 0, dateStr: "2026-08-24", mealId: "m1" }],
    },
    mealLibrary: smallLibrary,
  });
  assert(
    test19.length === 0,
    "19. Zero ingredients selected with Something Different returns empty array when all library meals are planned"
  );

  console.log("-----------------------------------------");
  console.log(`Unit Tests Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=========================================");
  return failed === 0;
}

const allPassed = runTests();
if (!allPassed) {
  process.exit(1);
}
