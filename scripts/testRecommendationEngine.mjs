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

  // 1. No ingredients + Surprise me -> Returns top 3 meals
  const test1 = getRecommendations({ selectedIngredientIds: [], preference: "surprise" });
  assert(
    test1.length === 3 &&
      test1[0].meal.id === MEALS[0].id &&
      test1[1].meal.id === MEALS[1].id &&
      test1[2].meal.id === MEALS[2].id &&
      test1[0].matchedIngredients.length === 0,
    "1. No ingredients + Surprise me returns first 3 static meals with 0 matches"
  );

  // 2. No ingredients + Something quick -> Prioritizes fast meals (<= 30 mins)
  const test2 = getRecommendations({ selectedIngredientIds: [], preference: "quick" });
  assert(
    test2.length === 3 &&
      test2.every((r) => r.meal.cookingTime <= 30) &&
      test2[0].meal.cookingTime <= test2[1].meal.cookingTime,
    "2. No ingredients + Something quick returns top 3 quick meals"
  );

  // 3. No ingredients + Something spicy -> Prioritizes spicy meals
  const test3 = getRecommendations({ selectedIngredientIds: [], preference: "spicy" });
  assert(
    test3.length === 3 &&
      test3.some((r) => r.meal.categoryTags.includes("spicy") || r.meal.ingredients.includes("scotch_bonnet")),
    "3. No ingredients + Something spicy returns top spicy favorites"
  );

  // 4. No ingredients + Something filling -> Prioritizes hearty swallows & beans
  const test4 = getRecommendations({ selectedIngredientIds: [], preference: "filling" });
  assert(
    test4.length === 3 &&
      test4.some((r) => r.meal.category === "Swallows" || r.meal.category === "Beans & Legumes"),
    "4. No ingredients + Something filling returns top hearty swallows and beans"
  );

  // 5. No ingredients + Something sweet -> Prioritizes sweet plantain & coconut meals
  const test5 = getRecommendations({ selectedIngredientIds: [], preference: "sweet" });
  assert(
    test5.length === 3 &&
      test5.every((r) => r.meal.ingredients.includes("plantain") || r.meal.ingredients.includes("coconut_milk")),
    "5. No ingredients + Something sweet returns plantain and coconut meals"
  );

  // 6. One matching ingredient (e.g. "egusi")
  const test6 = getRecommendations({ selectedIngredientIds: ["egusi"], preference: "surprise" });
  assert(
    test6.length === 1 &&
      test6[0].meal.id === "eba_egusi_soup" &&
      test6[0].matchedIngredients.includes("egusi") &&
      test6[0].missingIngredients.includes("beef"),
    "6. One matching ingredient ('egusi') returns exactly the meal containing egusi with matching & missing details"
  );

  // 7. Multiple matching ingredients (e.g. rice, tomato, onion)
  const test7 = getRecommendations({
    selectedIngredientIds: ["rice", "tomatoes", "onion", "tomato_paste", "bell_pepper"],
    preference: "surprise",
  });
  assert(
    test7.length === 3 &&
      test7[0].matchedIngredients.length >= test7[1].matchedIngredients.length &&
      test7[1].matchedIngredients.length >= test7[2].matchedIngredients.length,
    "7. Multiple matching ingredients correctly ranks meals descending by match count"
  );

  // 8. Preference influence: When Something quick is selected, faster meals rank higher on tied matches
  const test8 = getRecommendations({
    selectedIngredientIds: ["eggs", "tomatoes", "onion"],
    preference: "quick",
  });
  assert(
    test8.length > 0 &&
      test8[0].meal.cookingTime <= 25,
    "8. Something quick preference prioritizes faster meals among matching candidates"
  );

  // 9. Preference influence: When Something sweet is selected, plantain meals rank higher
  const test9 = getRecommendations({
    selectedIngredientIds: ["eggs", "onion", "vegetable_oil"],
    preference: "sweet",
  });
  assert(
    test9.length > 0 &&
      test9[0].meal.ingredients.includes("plantain"),
    "9. Something sweet preference prioritizes plantain meals"
  );

  // 10. Preference influence: When Something spicy is selected, spicy dishes rank higher
  const test10 = getRecommendations({
    selectedIngredientIds: ["palm_oil", "onion", "scotch_bonnet", "crayfish"],
    preference: "spicy",
  });
  assert(
    test10.length > 0 &&
      (test10[0].meal.categoryTags.includes("spicy") || test10[0].meal.ingredients.includes("scotch_bonnet")),
    "10. Something spicy preference prioritizes spicy dishes"
  );

  // 11. No matching meals
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
  const test11 = getRecommendations({
    selectedIngredientIds: ["yam"],
    preference: "surprise",
    mealLibrary: dummyMealLib,
  });
  assert(test11.length === 0, "11. No matching meals returns empty array (triggers NoMatchState)");

  // 12. Only one valid recommendation exists
  const test12 = getRecommendations({
    selectedIngredientIds: ["semovita"],
    preference: "surprise",
  });
  assert(test12.length === 1 && test12[0].meal.id === "semo_vegetable_soup", "12. Only 1 valid recommendation returns array of length 1");

  // 13. Only two valid recommendations exist
  const test13 = getRecommendations({
    selectedIngredientIds: ["spaghetti", "instant_noodles"],
    preference: "surprise",
  });
  assert(
    test13.length === 2 &&
      test13.map((r) => r.meal.id).sort().join(",") === "noodles_egg,spaghetti_jollof",
    "13. Only 2 valid recommendations returns exactly 2 without filler or duplicates"
  );

  // 14. More than three valid recommendations exist -> capped at exactly 3
  const test14 = getRecommendations({
    selectedIngredientIds: ["onion", "salt", "bouillon_cubes", "scotch_bonnet"],
    preference: "surprise",
  });
  assert(test14.length === 3, "14. More than 3 valid recommendations returns capped array of exactly 3");

  // 15. Equal ingredient matches and equal preference score preserve static dataset order
  const tiedMeals = [
    { id: "meal_a", name: "A", description: "D", category: "Yam & Plantain", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["yam"], instructions: [] },
    { id: "meal_b", name: "B", description: "D", category: "Yam & Plantain", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["yam"], instructions: [] },
    { id: "meal_c", name: "C", description: "D", category: "Yam & Plantain", cookingTime: 20, isQuick: true, categoryTags: [], ingredients: ["yam"], instructions: [] },
  ];
  const test15 = getRecommendations({
    selectedIngredientIds: ["yam"],
    preference: "surprise",
    mealLibrary: tiedMeals,
  });
  assert(
    test15[0].meal.id === "meal_a" &&
      test15[1].meal.id === "meal_b" &&
      test15[2].meal.id === "meal_c",
    "15. Equal ingredient matches and equal scores preserve static dataset order"
  );

  // 16. Same input always produces the same result (Determinism)
  const inputSample = {
    selectedIngredientIds: ["plantain", "eggs", "tomatoes"],
    preference: "quick",
  };
  const runA = getRecommendations(inputSample);
  const runB = getRecommendations(inputSample);
  assert(
    JSON.stringify(runA) === JSON.stringify(runB),
    "16. Same inputs produce 100% deterministic identical output"
  );

  // 17. Selected ingredients are correctly partitioned into matching and missing
  const test17 = getRecommendations({
    selectedIngredientIds: ["plantain", "eggs"],
    preference: "surprise",
  });
  const plantainEggMeal = test17.find((r) => r.meal.id === "fried_plantain_egg");
  assert(
    plantainEggMeal &&
      plantainEggMeal.matchedIngredients.includes("plantain") &&
      plantainEggMeal.matchedIngredients.includes("eggs") &&
      plantainEggMeal.missingIngredients.includes("vegetable_oil"),
    "17. Ingredients are correctly partitioned into matching and missing lists"
  );

  // 18. Something filling preference prioritizes hearty swallows on shared ingredients
  const test18 = getRecommendations({
    selectedIngredientIds: ["garri", "palm_oil", "onion", "crayfish"],
    preference: "filling",
  });
  assert(
    test18.length > 0 &&
      test18[0].meal.category === "Swallows",
    "18. Something filling preference prioritizes hearty swallows"
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

