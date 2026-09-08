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
const {
  getRecommendations,
  calculatePreferenceScore,
  calculateCoverageScore,
  calculateMissingScore,
  calculateTimeEffortScore,
  calculateVarietyScore,
  scoreMeal,
  PREFERENCE_WEIGHT,
  INGREDIENT_COVERAGE_WEIGHT,
  MISSING_INGREDIENTS_WEIGHT,
  TIME_EFFORT_WEIGHT,
  VARIETY_WEIGHT,
} = engineExp;

const mealsExp = {};
new Function("exports", "require", mealJs)(mealsExp, customRequire);
const { MEALS, MEAL_MAP } = mealsExp;

function runTests() {
  console.log("=================================================");
  console.log(" DishDash Recommendation Engine V2 Unit Tests     ");
  console.log("=================================================");

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

  // -------------------------------------------------------------
  // Test 1: Tunable Weights verification
  // -------------------------------------------------------------
  const weightSum =
    PREFERENCE_WEIGHT +
    INGREDIENT_COVERAGE_WEIGHT +
    MISSING_INGREDIENTS_WEIGHT +
    TIME_EFFORT_WEIGHT +
    VARIETY_WEIGHT;
  assert(
    Math.abs(weightSum - 1.0) < 0.001 &&
      PREFERENCE_WEIGHT === 0.35 &&
      INGREDIENT_COVERAGE_WEIGHT === 0.30 &&
      MISSING_INGREDIENTS_WEIGHT === 0.15 &&
      TIME_EFFORT_WEIGHT === 0.10 &&
      VARIETY_WEIGHT === 0.10,
    "1. Tunable weights exist and sum exactly to 1.0 (35% / 30% / 15% / 10% / 10%)"
  );

  // -------------------------------------------------------------
  // Test 2: Ingredient Coverage in Isolation (Proportional)
  // Meal A: 4/5 (80% coverage) vs Meal B: 5/10 (50% coverage)
  // -------------------------------------------------------------
  const coverageA = calculateCoverageScore(4, 5, true);
  const coverageB = calculateCoverageScore(5, 10, true);
  assert(
    coverageA === 80 && coverageB === 50 && coverageA > coverageB,
    "2. Proportional ingredient coverage in isolation: 4/5 (80%) scores higher than 5/10 (50%)"
  );

  // -------------------------------------------------------------
  // Test 3: Missing Ingredients Score in Isolation
  // When coverage is equal, fewer missing ingredients receives higher score
  // -------------------------------------------------------------
  const missingScoreFew = calculateMissingScore(1, true);
  const missingScoreMany = calculateMissingScore(5, true);
  assert(
    missingScoreFew > missingScoreMany && missingScoreFew === 88 && missingScoreMany === 40,
    "3. Missing ingredients score in isolation: 1 missing (88) scores higher than 5 missing (40)"
  );

  // -------------------------------------------------------------
  // Test 4: End-to-end Isolation with Synthetic Library
  // When all other factors are identical, higher proportional coverage yields higher total score
  // -------------------------------------------------------------
  const baseMealMock = {
    category: "Rice dishes",
    cookingTime: 30,
    isQuick: true,
    categoryTags: [],
    instructions: [],
    difficulty: "easy",
    spiciness: "mild",
    fillingLevel: "medium",
    sweetness: "none",
    mealType: "main",
    primaryProtein: "none",
  };

  const syntheticMealA = {
    ...baseMealMock,
    id: "meal_a_high_cov",
    name: "Meal A High Coverage",
    description: "4 of 5 ingredients",
    ingredients: ["i1", "i2", "i3", "i4", "extra1"],
  };

  const syntheticMealB = {
    ...baseMealMock,
    id: "meal_b_low_cov",
    name: "Meal B Low Coverage",
    description: "5 of 10 ingredients",
    ingredients: ["i1", "i2", "i3", "i4", "i5", "m1", "m2", "m3", "m4", "m5"],
  };

  const userSelected = ["i1", "i2", "i3", "i4", "i5"];
  const syntheticRecs = getRecommendations({
    selectedIngredientIds: userSelected,
    preference: "quick",
    mealLibrary: [syntheticMealB, syntheticMealA],
  });

  assert(
    syntheticRecs.length === 2 &&
      syntheticRecs[0].meal.id === "meal_a_high_cov" &&
      syntheticRecs[0].scoreBreakdown.coverageScore === 80 &&
      syntheticRecs[1].scoreBreakdown.coverageScore === 50,
    "4. End-to-end: Meal with higher proportional coverage (80%) outranks lower coverage (50%)"
  );

  // -------------------------------------------------------------
  // Test 5: Preference Fit across all 5 Moods in Isolation
  // -------------------------------------------------------------
  const spicyMeal = { ...baseMealMock, id: "spicy_m", name: "S", spiciness: "high" };
  const mildMeal = { ...baseMealMock, id: "mild_m", name: "M", spiciness: "none" };
  assert(
    calculatePreferenceScore(spicyMeal, "spicy") === 100 &&
      calculatePreferenceScore(mildMeal, "spicy") === 0,
    "5a. 'Something spicy' preference gives highest score to high spiciness"
  );

  const quickMeal = { ...baseMealMock, id: "q_m", name: "Q", cookingTime: 15 };
  const slowMeal = { ...baseMealMock, id: "s_m", name: "S", cookingTime: 55 };
  assert(
    calculatePreferenceScore(quickMeal, "quick") === 100 &&
      calculatePreferenceScore(slowMeal, "quick") === 15,
    "5b. 'Something quick' preference gives highest score to <=20m meals and penalizes >45m"
  );

  const heavyMeal = { ...baseMealMock, id: "h_m", name: "H", fillingLevel: "heavy" };
  const lightMeal = { ...baseMealMock, id: "l_m", name: "L", fillingLevel: "light" };
  assert(
    calculatePreferenceScore(heavyMeal, "filling") === 100 &&
      calculatePreferenceScore(lightMeal, "filling") === 30,
    "5c. 'Something filling' preference prioritizes heavy meals"
  );

  const sweetMeal = { ...baseMealMock, id: "sw_m", name: "SW", sweetness: "sweet" };
  const nonSweetMeal = { ...baseMealMock, id: "nsw_m", name: "NSW", sweetness: "none" };
  assert(
    calculatePreferenceScore(sweetMeal, "sweet") === 100 &&
      calculatePreferenceScore(nonSweetMeal, "sweet") === 10,
    "5d. 'Something sweet' preference prioritizes sweet meals"
  );

  // -------------------------------------------------------------
  // Test 6: Cooking Time & Difficulty (Practicality) in Isolation
  // -------------------------------------------------------------
  const easyFast = { ...baseMealMock, id: "ef", name: "EF", cookingTime: 15, difficulty: "easy" };
  const hardSlow = { ...baseMealMock, id: "hs", name: "HS", cookingTime: 55, difficulty: "hard" };
  const practicalScoreFast = calculateTimeEffortScore(easyFast);
  const practicalScoreSlow = calculateTimeEffortScore(hardSlow);
  assert(
    practicalScoreFast > practicalScoreSlow && practicalScoreFast >= 85 && practicalScoreSlow <= 45,
    "6. Practicality effort score rewards fast, easy meals over long, hard meals"
  );

  // -------------------------------------------------------------
  // Test 7: Weekly Variety Penalty in Isolation (Single & Multi-slot)
  // -------------------------------------------------------------
  const samplePlan = {
    days: [
      { dayIndex: 0, mealId: "jollof_rice" },
      { dayIndex: 1, mealId: "chicken_pepper_soup" },
    ],
  };

  const duplicateMeal = MEAL_MAP["jollof_rice"];
  const sameProteinMeal = MEAL_MAP["curry_chicken_rice"]; // shares 'chicken' and 'Rice dishes'
  const freshMeal = MEAL_MAP["ewa_riro"]; // 'Beans & Legumes' + 'beans' (completely fresh)

  const varScoreDup = calculateVarietyScore(duplicateMeal, samplePlan);
  const varScoreSameProt = calculateVarietyScore(sameProteinMeal, samplePlan);
  const varScoreFresh = calculateVarietyScore(freshMeal, samplePlan);

  // Multi-slot plan variety test: Dinner has 'jollof_rice', Breakfast has 'curry_chicken_rice'
  const multiSlotPlan = {
    days: [
      {
        dayIndex: 0,
        slots: {
          breakfast: "indomie_noodle_sandwich",
          lunch: "ewa_riro",
          dinner: "jollof_rice",
          snack: "nigerian_egg_roll",
        },
      },
    ],
  };
  const multiVarDup = calculateVarietyScore(duplicateMeal, multiSlotPlan);

  assert(
    varScoreDup <= 20 &&
      multiVarDup <= 20 &&
      varScoreSameProt < varScoreFresh &&
      varScoreFresh === 100,
    "7. Weekly variety properly penalizes exact duplicates and same protein across all 4 daily meal slots while rewarding fresh dishes"
  );

  // -------------------------------------------------------------
  // Test 8: Five Distinct Roles Generated (Best Match, Easiest Option, Wildcard, Good Match, Another Option)
  // -------------------------------------------------------------
  const test8 = getRecommendations({
    selectedIngredientIds: ["rice", "tomatoes", "onion", "vegetable_oil", "scotch_bonnet"],
    preference: "quick",
  });

  const uniqueMealIds = new Set(test8.map((r) => r.meal.id));

  assert(
    test8.length === 5 &&
      uniqueMealIds.size === 5 &&
      test8[0].role === "best_match" &&
      test8[1].role === "easiest" &&
      test8[2].role === "wildcard" &&
      test8[3].role === "another_good_match" &&
      test8[4].role === "another_option",
    "8. Recommendations assign up to 5 distinct roles with 0 duplicates (best_match, easiest, wildcard, another_good_match, another_option)"
  );

  // -------------------------------------------------------------
  // Test 9: Wildcard & Diversity Guarantee across Recommendations
  // Wildcard is a genuine match satisfying intent while providing category/protein diversity
  // -------------------------------------------------------------
  const bestMatchMeal = test8[0].meal;
  const easiestMeal = test8[1].meal;
  const wildcardMeal = test8[2].meal;

  assert(
    test8[2].matchedIngredients.length > 0 &&
      test8[2].scoreBreakdown.preferenceScore >= 40 &&
      (wildcardMeal.category !== bestMatchMeal.category ||
        wildcardMeal.primaryProtein !== bestMatchMeal.primaryProtein),
    "9. Wildcard is relevant (matched ingredients, good preference fit) while providing category/protein variety"
  );

  // -------------------------------------------------------------
  // Test 10: Zero Selected Ingredients Handles Gracefully (returns up to 5)
  // -------------------------------------------------------------
  const test10 = getRecommendations({
    selectedIngredientIds: [],
    preference: "quick",
  });

  const zeroSet = new Set(test10.map((r) => r.meal.id));

  assert(
    test10.length === 5 &&
      zeroSet.size === 5 &&
      test10[0].matchedIngredients.length === 0 &&
      test10.every((r) => r.meal.cookingTime <= 30) &&
      test10[0].explanation.includes("Top match • Fits your quick mood"),
    "10. Zero selected ingredients recommends 5 top preference-matched meals without claiming false matches"
  );

  // -------------------------------------------------------------
  // Test 11: No Matching Meals returns empty list
  // -------------------------------------------------------------
  const test11 = getRecommendations({
    selectedIngredientIds: ["yam"],
    preference: "quick",
    mealLibrary: [
      {
        ...baseMealMock,
        id: "rice_only",
        name: "Rice Only",
        description: "",
        ingredients: ["rice", "tomatoes"],
      },
    ],
  });

  assert(test11.length === 0, "11. No matching meals returns empty array (triggers NoMatchState)");

  // -------------------------------------------------------------
  // Test 12: Determinism Guarantee
  // -------------------------------------------------------------
  const inputForDet = {
    selectedIngredientIds: ["plantain", "eggs", "tomatoes", "onion"],
    preference: "sweet",
  };
  const run1 = getRecommendations(inputForDet);
  const run2 = getRecommendations(inputForDet);
  assert(
    JSON.stringify(run1) === JSON.stringify(run2),
    "12. Engine is 100% deterministic (identical inputs produce identical outputs)"
  );

  // -------------------------------------------------------------
  // Test 13: Truthful Explanations reflect actual metrics
  // -------------------------------------------------------------
  const test13 = getRecommendations({
    selectedIngredientIds: ["spaghetti", "tomatoes", "bell_pepper", "scotch_bonnet", "onion"],
    preference: "quick",
  });

  const topRec = test13[0];
  assert(
    topRec.explanation.includes(`Uses ${topRec.matchedIngredients.length} of ${topRec.meal.ingredients.length} ingredients`) &&
      topRec.explanation.includes(`${topRec.meal.cookingTime} mins`),
    "13. Recommendation explanations truthfully state exact ingredient counts and cooking time"
  );

  // -------------------------------------------------------------
  // Test 14: Single Valid Match returns 1 result
  // -------------------------------------------------------------
  const test14 = getRecommendations({
    selectedIngredientIds: ["corned_beef"],
    preference: "surprise",
  });
  assert(
    test14.length === 1 && test14[0].meal.id === "corned_beef_spaghetti" && test14[0].role === "best_match",
    "14. Single valid match returns exactly 1 result with 'best_match' role"
  );

  // -------------------------------------------------------------
  // Test 15: Exactly 2 Valid Matches returns 2 results
  // -------------------------------------------------------------
  const test15 = getRecommendations({
    selectedIngredientIds: ["banga_extract"],
    preference: "surprise",
  });
  assert(
    test15.length === 2 &&
      test15[0].role === "best_match" &&
      test15[1].role === "easiest",
    "15. Exactly 2 valid matches returns 2 results with 'best_match' and 'easiest' roles"
  );

  // -------------------------------------------------------------
  // Test 16: Synthetic 4-candidate Library returns exactly 4 results
  // -------------------------------------------------------------
  const test16 = getRecommendations({
    selectedIngredientIds: ["i1"],
    preference: "quick",
    mealLibrary: [
      { ...baseMealMock, id: "m1", name: "M1", ingredients: ["i1"] },
      { ...baseMealMock, id: "m2", name: "M2", ingredients: ["i1"] },
      { ...baseMealMock, id: "m3", name: "M3", ingredients: ["i1"] },
      { ...baseMealMock, id: "m4", name: "M4", ingredients: ["i1"] },
    ],
  });
  assert(
    test16.length === 4 &&
      test16[0].role === "best_match" &&
      test16[1].role === "easiest" &&
      test16[2].role === "wildcard" &&
      test16[3].role === "another_good_match",
    "16. Insufficient candidates (4) returns exactly 4 recommendations with appropriate roles"
  );

  console.log("-------------------------------------------------");
  console.log(`Unit Tests Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=================================================");
  return failed === 0;
}

const allPassed = runTests();
if (!allPassed) {
  process.exit(1);
}
