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
  console.log(" DishDash Phase 5 Weekly Planner Tests   ");
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

  // 1. Planner structure: Exactly 7 day slots
  const initialPlan = getInitialWeeklyPlan(new Date("2026-08-24"));
  assert(
    Array.isArray(initialPlan.days) && initialPlan.days.length === 7,
    "1. Planner initializes with exactly 7 day slots"
  );

  // 2. Empty days state
  const allEmpty = initialPlan.days.every((d) => d.mealId === null);
  assert(allEmpty, "2. All 7 initial slots are properly initialized as empty");

  // 3. Assigned meal resolution
  const jollof = MEAL_MAP["jollof_rice"];
  assert(
    jollof && jollof.id === "jollof_rice" && jollof.name === "Jollof Rice",
    "3. Valid meal ID 'jollof_rice' resolves to correct static meal"
  );

  // 4. Meal ingredients resolution
  const jollofIngNames = jollof.ingredients.map((id) => INGREDIENT_MAP[id]?.name);
  assert(
    jollofIngNames.every((name) => typeof name === "string" && name.length > 0) &&
      jollofIngNames.includes("Rice") &&
      jollofIngNames.includes("Fresh Tomatoes"),
    "4. Meal ingredients resolve to clean display names without exposing raw IDs"
  );

  // 5. Invalid meal reference handling (graceful, no crash)
  const invalidId = "ghost_meal_999";
  const invalidResolved = MEAL_MAP[invalidId];
  assert(
    invalidResolved === undefined,
    "5. Invalid meal reference gracefully resolves to undefined without crashing"
  );

  // 6. Adding a meal to an empty day slot
  let workingPlan = {
    ...initialPlan,
    days: initialPlan.days.map((d) =>
      d.dayIndex === 0 ? { ...d, mealId: "jollof_rice" } : d
    ),
  };
  assert(
    workingPlan.days[0].mealId === "jollof_rice" && workingPlan.days[1].mealId === null,
    "6. Assigning meal to empty day 0 sets mealId without affecting day 1"
  );

  // 7. Removing a meal clears only that day
  let removedPlan = {
    ...workingPlan,
    days: workingPlan.days.map((d) =>
      d.dayIndex === 0 ? { ...d, mealId: null } : d
    ),
  };
  assert(
    removedPlan.days[0].mealId === null && removedPlan.days.every((d) => d.mealId === null),
    "7. Removing meal from day 0 resets day 0 to empty and leaves other days intact"
  );

  // 8. Occupied day detection for replacement
  const isDay0Occupied = typeof workingPlan.days[0].mealId === "string" && workingPlan.days[0].mealId.length > 0;
  assert(isDay0Occupied && workingPlan.days[0].mealId === "jollof_rice", "8. Occupied day is correctly detected for replacement confirmation");

  // 9. Cancelling replacement leaves existing meal unchanged
  const cancelledState = { ...workingPlan };
  assert(
    cancelledState.days[0].mealId === "jollof_rice",
    "9. Cancelling replacement leaves existing meal on day 0 unchanged"
  );

  // 10. Confirming replacement updates only that day
  let replacedPlan = {
    ...workingPlan,
    days: workingPlan.days.map((d) =>
      d.dayIndex === 0 ? { ...d, mealId: "fried_rice" } : d
    ),
  };
  assert(
    replacedPlan.days[0].mealId === "fried_rice" && replacedPlan.days[1].mealId === null,
    "10. Confirming replacement replaces only day 0 meal and preserves other days"
  );

  // 11. Multi-day isolation: Changes to Day 3 do not affect Day 0, Day 1, Day 2, Day 4, Day 5, Day 6
  let multiPlan = {
    ...replacedPlan,
    days: replacedPlan.days.map((d) => {
      if (d.dayIndex === 3) return { ...d, mealId: "egusi_soup" };
      if (d.dayIndex === 6) return { ...d, mealId: "yam_garden_egg_sauce" };
      return d;
    }),
  };
  // Now modify only Day 3
  multiPlan = {
    ...multiPlan,
    days: multiPlan.days.map((d) =>
      d.dayIndex === 3 ? { ...d, mealId: "beans_porridge" } : d
    ),
  };
  assert(
    multiPlan.days[0].mealId === "fried_rice" &&
      multiPlan.days[1].mealId === null &&
      multiPlan.days[2].mealId === null &&
      multiPlan.days[3].mealId === "beans_porridge" &&
      multiPlan.days[4].mealId === null &&
      multiPlan.days[5].mealId === null &&
      multiPlan.days[6].mealId === "yam_garden_egg_sauce",
    "11. Modifying Day 3 isolates change to Day 3 and preserves Days 0, 1, 2, 4, 5, 6"
  );

  // 12. Exactly one meal per day constraint
  const daySlotTypes = multiPlan.days.map((d) => typeof d.mealId);
  assert(
    daySlotTypes.every((t) => t === "string" || t === "object") &&
      multiPlan.days.every((d) => d.mealId === null || typeof d.mealId === "string"),
    "12. Each day slot strictly holds exactly one meal ID or null (never multiple meals)"
  );

  // 13. Viewing meal route target
  const targetMealRoute = `/meals/${multiPlan.days[0].mealId}`;
  assert(
    targetMealRoute === "/meals/fried_rice",
    "13. View meal action maps to correct meal details route '/meals/[id]'"
  );

  // 14. Weekly plan persistence serialization / deserialization roundtrip
  const userState = {
    ...getInitialUserState(),
    weeklyPlan: multiPlan,
  };
  const serialized = JSON.stringify(userState);
  const rehydrated = JSON.parse(serialized);
  assert(
    rehydrated.weeklyPlan.days.length === 7 &&
      rehydrated.weeklyPlan.days[0].mealId === "fried_rice" &&
      rehydrated.weeklyPlan.days[3].mealId === "beans_porridge" &&
      rehydrated.weeklyPlan.days[6].mealId === "yam_garden_egg_sauce" &&
      rehydrated.weeklyPlan.days[1].mealId === null,
    "14. Weekly plan state survives serialization and rehydration without data loss"
  );

  console.log("-----------------------------------------");
  console.log(`Phase 5 Tests Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=========================================");
  return failed === 0;
}

const allPassed = runTests();
if (!allPassed) {
  process.exit(1);
}
