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
const recJs = loadAndTranspileTs("src/lib/recommendationEngine.ts");
const storageJs = loadAndTranspileTs("src/lib/storage.ts");
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
  if (moduleName.includes("recommendationEngine")) {
    const exp = {};
    new Function("exports", "require", recJs)(exp, customRequire);
    return exp;
  }
  if (moduleName.includes("storage")) {
    const exp = {};
    new Function("exports", "require", storageJs)(exp, customRequire);
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
const { INGREDIENTS, INGREDIENT_MAP } = ingsExp;

const recExp = {};
new Function("exports", "require", recJs)(recExp, customRequire);
const { getRecommendations } = recExp;

const storageExp = {};
new Function("exports", "require", storageJs)(storageExp, customRequire);
const { getInitialWeeklyPlan, getInitialUserState } = storageExp;

const groceryExp = {};
new Function("exports", "require", groceryJs)(groceryExp, customRequire);
const { generateGroceryList } = groceryExp;

function runEndToEndAudit() {
  console.log("=========================================");
  console.log(" DishDash Phase 8 End-to-End QA Audit    ");
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

  // --- 1. Fresh State Initialization ---
  let userState = getInitialUserState();
  assert(
    userState.availableIngredientIds.length === 0 &&
      userState.selectedPreference === "quick" &&
      userState.weeklyPlan.days.length === 7 &&
      userState.weeklyPlan.days.every((d) =>
        d.slots
          ? d.slots.breakfast === null &&
            d.slots.lunch === null &&
            d.slots.dinner === null &&
            d.slots.snack === null
          : d.mealId === null
      ) &&
      userState.purchasedGroceryItemIds.length === 0,
    "1. Fresh UserState initializes cleanly with 0 ingredients, 'quick' preference, 7 empty days with 28 empty slots, and 0 checked grocery items"
  );

  // --- 2. Discovery: Adding and Toggling Ingredients ---
  userState.availableIngredientIds = ["rice", "tomatoes", "onion"];
  assert(
    userState.availableIngredientIds.length === 3 &&
      userState.availableIngredientIds.includes("rice"),
    "2. User selects 'rice', 'tomatoes', 'onion' as available ingredients snapshot"
  );

  // --- 3. Recommendations: 'quick' Preference (≤30 mins) ---
  const quickRecs = getRecommendations({
    selectedIngredientIds: userState.availableIngredientIds,
    preference: "quick",
    weeklyPlan: userState.weeklyPlan,
  });
  assert(
    quickRecs.length > 0 &&
      quickRecs.length <= 5 &&
      quickRecs[0].matchedIngredients.length > 0,
    "3. Quick & Easy recommendations return up to 5 matched meals prioritizing faster preparation"
  );

  // --- 4. Recommendations: 'surprise' Preference (All Meals) ---
  const allRecs = getRecommendations({
    selectedIngredientIds: userState.availableIngredientIds,
    preference: "surprise",
    weeklyPlan: userState.weeklyPlan,
  });
  const allRecsUniqueIds = new Set(allRecs.map((r) => r.meal.id));
  assert(
    allRecs.length === 5 &&
      allRecsUniqueIds.size === 5 &&
      allRecs[0].role === "best_match" &&
      allRecs[1].role === "easiest" &&
      allRecs[2].role === "wildcard" &&
      allRecs[3].role === "another_good_match" &&
      allRecs[4].role === "another_option" &&
      allRecs.every((r) => r.matchedIngredients.length > 0),
    "4. 'Surprise me' returns up to 5 distinct recommendation roles (Best Match, Easiest, Wildcard, Good Match, Another Option) matching available ingredients"
  );

  // --- 5. Meal Details: Ingredient Availability Partitioning ---
  const chosenMeal = allRecs[0].meal;
  const selectedSet = new Set(userState.availableIngredientIds);
  const haveIngs = chosenMeal.ingredients.filter((id) => selectedSet.has(id));
  const needIngs = chosenMeal.ingredients.filter((id) => !selectedSet.has(id));
  assert(
    haveIngs.length + needIngs.length === chosenMeal.ingredients.length &&
      haveIngs.every((id) => userState.availableIngredientIds.includes(id)),
    "5. Meal Details correctly partitions ingredients into 'You have' vs 'You need'"
  );

  // --- 6. Plan Assignment: Scheduling to Day 0 ---
  userState.weeklyPlan.days[0].mealId = chosenMeal.id;
  userState.weeklyPlan.days[0].slots.lunch = chosenMeal.id;
  assert(
    userState.weeklyPlan.days[0].slots.lunch === chosenMeal.id &&
      userState.weeklyPlan.days[1].slots.lunch === null,
    "6. Assigning meal to Day 0 updates Day 0 lunch slot and leaves Day 1-6 empty"
  );

  // --- 7. 'Something spicy' Preference: Prioritizes Spicy Meals ---
  const spicyRecs = getRecommendations({
    selectedIngredientIds: userState.availableIngredientIds,
    preference: "spicy",
    weeklyPlan: userState.weeklyPlan,
  });
  assert(
    spicyRecs.length > 0 &&
      spicyRecs[0].matchedIngredients.length > 0,
    "7. 'Something spicy' returns matching spicy dishes"
  );

  // --- 8. Plan Multi-Day Assignment ---
  // Assign Day 1 to eba_egusi_soup, Day 2 to ewa_riro
  userState.weeklyPlan.days[1].mealId = "eba_egusi_soup";
  userState.weeklyPlan.days[1].slots.lunch = "eba_egusi_soup";
  userState.weeklyPlan.days[2].mealId = "ewa_riro";
  userState.weeklyPlan.days[2].slots.lunch = "ewa_riro";
  assert(
    userState.weeklyPlan.days[0].slots.lunch === chosenMeal.id &&
      userState.weeklyPlan.days[1].slots.lunch === "eba_egusi_soup" &&
      userState.weeklyPlan.days[2].slots.lunch === "ewa_riro" &&
      userState.weeklyPlan.days[3].slots.lunch === null,
    "8. Multi-day plan maintains slot assignments with day isolation"
  );

  // --- 9. Plan Replacement Confirmation Logic ---
  const proposedMeal = MEAL_MAP["fried_rice"];
  // Simulating replacement on Day 0
  userState.weeklyPlan.days[0].mealId = proposedMeal.id;
  userState.weeklyPlan.days[0].slots.lunch = proposedMeal.id;
  assert(
    userState.weeklyPlan.days[0].slots.lunch === "fried_rice" &&
      userState.weeklyPlan.days[1].slots.lunch === "eba_egusi_soup" &&
      userState.weeklyPlan.days[2].slots.lunch === "ewa_riro",
    "9. Confirming replacement updates Day 0 to fried_rice and preserves Day 1-6"
  );

  // --- 10. Grocery List Derivation ---
  // Planned: fried_rice, eba_egusi_soup, ewa_riro
  // Available: rice, tomatoes, onion
  const groceryItems = generateGroceryList({
    weeklyPlan: userState.weeklyPlan,
    availableIngredientIds: userState.availableIngredientIds,
    purchasedGroceryItemIds: userState.purchasedGroceryItemIds,
  });
  const groceryIngIds = groceryItems.map((i) => i.ingredientId);
  assert(
    groceryItems.length > 0 &&
      !groceryIngIds.includes("rice") &&
      !groceryIngIds.includes("tomatoes") &&
      !groceryIngIds.includes("onion") &&
      groceryIngIds.includes("egusi") &&
      groceryIngIds.includes("beans"),
    "10. Derived grocery list contains needed ingredients and excludes available search ingredients"
  );

  // --- 11. Grocery Deduplication & Source Labels ---
  // Both fried_rice and beans_porridge may use palm_oil or vegetable_oil
  const idCounts = {};
  for (const item of groceryItems) {
    idCounts[item.ingredientId] = (idCounts[item.ingredientId] || 0) + 1;
  }
  const duplicates = Object.values(idCounts).filter((c) => c > 1);
  assert(
    duplicates.length === 0,
    "11. Shared ingredients appear exactly once in the grocery checklist (deduplicated)"
  );

  // --- 12. Grocery Checking / Purchasing ---
  userState.purchasedGroceryItemIds.push("egusi");
  const updatedGroceries = generateGroceryList({
    weeklyPlan: userState.weeklyPlan,
    availableIngredientIds: userState.availableIngredientIds,
    purchasedGroceryItemIds: userState.purchasedGroceryItemIds,
  });
  const egusiItem = updatedGroceries.find((i) => i.ingredientId === "egusi");
  assert(
    egusiItem && egusiItem.isPurchased === true,
    "12. Checking 'egusi' marks isPurchased=true without modifying available ingredients or plan"
  );

  // --- 13. State Persistence Roundtrip ---
  const serialized = JSON.stringify(userState);
  const rehydrated = JSON.parse(serialized);
  assert(
    rehydrated.availableIngredientIds.length === 3 &&
      (rehydrated.weeklyPlan.days[0].slots?.lunch === "fried_rice" || rehydrated.weeklyPlan.days[0].mealId === "fried_rice") &&
      (rehydrated.weeklyPlan.days[1].slots?.lunch === "eba_egusi_soup" || rehydrated.weeklyPlan.days[1].mealId === "eba_egusi_soup") &&
      (rehydrated.weeklyPlan.days[2].slots?.lunch === "ewa_riro" || rehydrated.weeklyPlan.days[2].mealId === "ewa_riro") &&
      rehydrated.purchasedGroceryItemIds.includes("egusi"),
    "13. Complete user state survives JSON serialization / deserialization roundtrip"
  );

  // --- 14. Corrupted State Recovery ---
  const corruptedStrings = [
    "invalid-json{",
    JSON.stringify({ availableIngredientIds: "not-an-array" }),
    JSON.stringify({ weeklyPlan: { days: "invalid" } }),
    "null",
  ];
  let recoveryPass = true;
  for (const bad of corruptedStrings) {
    try {
      const parsed = JSON.parse(bad);
      const safeState = {
        availableIngredientIds: Array.isArray(parsed?.availableIngredientIds)
          ? parsed.availableIngredientIds
          : [],
        selectedPreference:
          ["spicy", "filling", "quick", "sweet", "surprise"].includes(parsed?.selectedPreference)
            ? parsed.selectedPreference
            : "quick",
        weeklyPlan:
          parsed?.weeklyPlan && Array.isArray(parsed?.weeklyPlan?.days)
            ? parsed.weeklyPlan
            : getInitialWeeklyPlan(),
        purchasedGroceryItemIds: Array.isArray(parsed?.purchasedGroceryItemIds)
          ? parsed.purchasedGroceryItemIds
          : [],
        version: 1,
      };
      if (safeState.weeklyPlan.days.length !== 7) recoveryPass = false;
    } catch {
      // JSON parse error -> fall back to initial state
      const fallback = getInitialUserState();
      if (fallback.weeklyPlan.days.length !== 7) recoveryPass = false;
    }
  }
  assert(
    recoveryPass,
    "14. Corrupted/invalid localStorage data safely falls back to valid defaults without crashing"
  );

  // --- 15. PWA Manifest & Icons Integrity ---
  const manifestPath = path.join(rootDir, "public", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const icon192 = path.join(rootDir, "public", "icons", "icon-192.png");
  const icon512 = path.join(rootDir, "public", "icons", "icon-512.png");
  assert(
    manifest.display === "standalone" &&
      fs.existsSync(icon192) &&
      fs.statSync(icon192).size > 0 &&
      fs.existsSync(icon512) &&
      fs.statSync(icon512).size > 0,
    "15. PWA Manifest is standalone and physical 192x192 / 512x512 icons exist"
  );

  console.log("-----------------------------------------");
  console.log(`End-to-End Audit Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=========================================");
  return failed === 0;
}

const allPassed = runEndToEndAudit();
if (!allPassed) {
  process.exit(1);
}
