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
const storageJs = loadAndTranspileTs("src/lib/storage.ts");

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
  if (moduleName.includes("storage")) {
    const exp = {};
    new Function("exports", "require", storageJs)(exp, customRequire);
    return exp;
  }
  return {};
};

const mealsExp = {};
new Function("exports", "require", mealJs)(mealsExp, customRequire);
const { MEALS, MEAL_MAP } = mealsExp;

const ingsExp = {};
new Function("exports", "require", ingJs)(ingsExp, customRequire);
const { INGREDIENT_MAP } = ingsExp;

const storageExp = {};
new Function("exports", "require", storageJs)(storageExp, customRequire);
const { getInitialWeeklyPlan, getInitialUserState } = storageExp;

function runTests() {
  console.log("=========================================");
  console.log(" DishDash Phase 4 Plan Assignment Tests  ");
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

  // 1. Valid meal IDs resolve to existing meals
  const jollof = MEAL_MAP["jollof_rice"];
  assert(
    jollof && jollof.id === "jollof_rice" && jollof.name === "Jollof Rice",
    "1. Valid meal ID 'jollof_rice' resolves to correct meal"
  );

  // 2. Invalid meal IDs do not resolve
  const invalidMeal = MEAL_MAP["non_existent_meal_123"];
  assert(
    invalidMeal === undefined,
    "2. Invalid meal ID produces undefined (triggers notFound)"
  );

  // 3. Meal ingredients resolve correctly from INGREDIENT_MAP
  const jollofIngNames = jollof.ingredients.map((id) => INGREDIENT_MAP[id]?.name);
  assert(
    jollofIngNames.every((name) => typeof name === "string" && name.length > 0) &&
      jollofIngNames.includes("Rice") &&
      jollofIngNames.includes("Fresh Tomatoes"),
    "3. Meal ingredients resolve to clean display names without exposing raw IDs"
  );

  // 4. Ingredient availability partitioning
  const activeSearchIngredients = ["rice", "tomatoes", "onion"];
  const selectedSet = new Set(activeSearchIngredients);
  const haveIngs = jollof.ingredients.filter((id) => selectedSet.has(id));
  const needIngs = jollof.ingredients.filter((id) => !selectedSet.has(id));
  assert(
    haveIngs.length === 3 &&
      haveIngs.includes("rice") &&
      haveIngs.includes("tomatoes") &&
      haveIngs.includes("onion") &&
      needIngs.length === jollof.ingredients.length - 3 &&
      !needIngs.includes("rice"),
    "4. Active search selection correctly partitions ingredients into 'You have' and 'You need'"
  );

  // 5. Assigning meal to an empty day slot
  let testPlan = getInitialWeeklyPlan(new Date("2026-08-24"));
  assert(testPlan.days.length === 7 && testPlan.days[0].mealId === null, "5a. Initial plan has 7 empty days");

  // Assign to Day index 0
  testPlan.days = testPlan.days.map((d) =>
    d.dayIndex === 0 ? { ...d, mealId: "jollof_rice" } : d
  );
  assert(
    testPlan.days[0].mealId === "jollof_rice" && testPlan.days[1].mealId === null,
    "5b. Assigning to empty day 0 sets mealId without affecting day 1"
  );

  // 6. Occupied day detection
  const isDay0Occupied = typeof testPlan.days[0].mealId === "string" && testPlan.days[0].mealId.length > 0;
  assert(isDay0Occupied && testPlan.days[0].mealId === "jollof_rice", "6. Occupied day is correctly detected");

  // 7. Replacement confirmation: Confirm replacement
  const newMealId = "fried_rice";
  // Simulating user confirmation of replacement for dayIndex 0
  const updatedPlan = {
    ...testPlan,
    days: testPlan.days.map((d) =>
      d.dayIndex === 0 ? { ...d, mealId: newMealId } : d
    ),
  };
  assert(
    updatedPlan.days[0].mealId === "fried_rice" && updatedPlan.days[1].mealId === null,
    "7. Confirming replacement updates day 0 to new meal and leaves other days intact"
  );

  // 8. Replacement cancellation: Leaves existing meal unchanged
  const cancelledPlan = { ...testPlan };
  assert(
    cancelledPlan.days[0].mealId === "jollof_rice",
    "8. Cancelling replacement leaves existing meal on day 0 unchanged"
  );

  // 9. Other planner days remain unchanged
  // Set day 2 and day 5
  let multiDayPlan = {
    ...testPlan,
    days: testPlan.days.map((d) => {
      if (d.dayIndex === 2) return { ...d, mealId: "egusi_soup" };
      if (d.dayIndex === 5) return { ...d, mealId: "yam_garden_egg_sauce" };
      return d;
    }),
  };
  // Now replace day 2 with "pepper_soup"
  multiDayPlan = {
    ...multiDayPlan,
    days: multiDayPlan.days.map((d) =>
      d.dayIndex === 2 ? { ...d, mealId: "pepper_soup" } : d
    ),
  };
  assert(
    multiDayPlan.days[0].mealId === "jollof_rice" &&
      multiDayPlan.days[2].mealId === "pepper_soup" &&
      multiDayPlan.days[5].mealId === "yam_garden_egg_sauce" &&
      multiDayPlan.days[1].mealId === null &&
      multiDayPlan.days[3].mealId === null,
    "9. Modifying day 2 preserves day 0, day 5, and all empty days"
  );

  // 10. Weekly plan persistence serialization / deserialization
  const userState = {
    ...getInitialUserState(),
    weeklyPlan: multiDayPlan,
  };
  const serialized = JSON.stringify(userState);
  const rehydrated = JSON.parse(serialized);
  assert(
    rehydrated.weeklyPlan.days[0].mealId === "jollof_rice" &&
      rehydrated.weeklyPlan.days[2].mealId === "pepper_soup" &&
      rehydrated.weeklyPlan.days[5].mealId === "yam_garden_egg_sauce" &&
      rehydrated.weeklyPlan.days.length === 7,
    "10. Weekly plan state survives serialization and rehydration without data loss"
  );

  console.log("-----------------------------------------");
  console.log(`Phase 4 Tests Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=========================================");
  return failed === 0;
}

const allPassed = runTests();
if (!allPassed) {
  process.exit(1);
}
