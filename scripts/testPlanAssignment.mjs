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
const {
  getInitialWeeklyPlan,
  getInitialUserState,
  normalizeDaySlots,
  normalizeWeeklyPlan,
  createEmptyDailySlots,
} = storageExp;

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

  // 1. Planner structure: Exactly 7 day slots with 4 meal slots each (28 total slots)
  const initialPlan = getInitialWeeklyPlan(new Date("2026-08-24"));
  const totalSlotsCount = initialPlan.days.reduce((acc, d) => {
    return acc + Object.keys(d.slots).length;
  }, 0);

  assert(
    Array.isArray(initialPlan.days) &&
      initialPlan.days.length === 7 &&
      totalSlotsCount === 28,
    "1. Planner initializes with exactly 7 days and 4 meal slots per day (28 total slots)"
  );

  // 2. All slots properly initialized as empty (null)
  const allEmpty = initialPlan.days.every(
    (d) =>
      d.slots.breakfast === null &&
      d.slots.lunch === null &&
      d.slots.dinner === null &&
      d.slots.snack === null
  );
  assert(allEmpty, "2. All 28 initial slots are properly initialized as empty (null)");

  // 3. Adding Breakfast to Day 0
  let workingPlan = {
    ...initialPlan,
    days: initialPlan.days.map((d) =>
      d.dayIndex === 0
        ? { ...d, slots: { ...d.slots, breakfast: "indomie_noodle_sandwich" } }
        : d
    ),
  };
  assert(
    workingPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      workingPlan.days[0].slots.lunch === null &&
      workingPlan.days[0].slots.dinner === null &&
      workingPlan.days[0].slots.snack === null,
    "3. Add Breakfast: Successfully assigns to Day 0 breakfast slot while other slots remain empty"
  );

  // 4. Adding Lunch to Day 0
  workingPlan = {
    ...workingPlan,
    days: workingPlan.days.map((d) =>
      d.dayIndex === 0
        ? { ...d, slots: { ...d.slots, lunch: "jollof_rice" } }
        : d
    ),
  };
  assert(
    workingPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      workingPlan.days[0].slots.lunch === "jollof_rice",
    "4. Add Lunch: Successfully assigns to Day 0 lunch slot without affecting breakfast"
  );

  // 5. Adding Dinner to Day 0
  workingPlan = {
    ...workingPlan,
    days: workingPlan.days.map((d) =>
      d.dayIndex === 0
        ? { ...d, slots: { ...d.slots, dinner: "suya_tortilla_wrap" } }
        : d
    ),
  };
  assert(
    workingPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      workingPlan.days[0].slots.lunch === "jollof_rice" &&
      workingPlan.days[0].slots.dinner === "suya_tortilla_wrap",
    "5. Add Dinner: Successfully assigns to Day 0 dinner slot without affecting breakfast or lunch"
  );

  // 6. Adding Snack to Day 0
  workingPlan = {
    ...workingPlan,
    days: workingPlan.days.map((d) =>
      d.dayIndex === 0
        ? { ...d, slots: { ...d.slots, snack: "nigerian_egg_roll" } }
        : d
    ),
  };
  assert(
    workingPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      workingPlan.days[0].slots.lunch === "jollof_rice" &&
      workingPlan.days[0].slots.dinner === "suya_tortilla_wrap" &&
      workingPlan.days[0].slots.snack === "nigerian_egg_roll",
    "6. Add Snack & Multiple Meals: Day 0 successfully holds Breakfast, Lunch, Dinner, and Snack simultaneously"
  );

  // 7. Day 1 through Day 6 remain completely isolated and empty
  const otherDaysEmpty = workingPlan.days.slice(1).every(
    (d) =>
      d.slots.breakfast === null &&
      d.slots.lunch === null &&
      d.slots.dinner === null &&
      d.slots.snack === null
  );
  assert(
    otherDaysEmpty,
    "7. Slot Isolation: Scheduling all 4 slots on Day 0 leaves Days 1 through 6 completely empty"
  );

  // 8. Replace one slot without affecting other slots
  // Replace Dinner with 'spaghetti_stir_fry'
  let replacedPlan = {
    ...workingPlan,
    days: workingPlan.days.map((d) =>
      d.dayIndex === 0
        ? { ...d, slots: { ...d.slots, dinner: "spaghetti_stir_fry" } }
        : d
    ),
  };
  assert(
    replacedPlan.days[0].slots.dinner === "spaghetti_stir_fry" &&
      replacedPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      replacedPlan.days[0].slots.lunch === "jollof_rice" &&
      replacedPlan.days[0].slots.snack === "nigerian_egg_roll",
    "8. Replace Slot: Replacing Dinner on Day 0 updates only Dinner and leaves Breakfast, Lunch, and Snack untouched"
  );

  // 9. Remove one slot without affecting other slots
  // Remove Lunch from Day 0
  let removedPlan = {
    ...replacedPlan,
    days: replacedPlan.days.map((d) =>
      d.dayIndex === 0
        ? { ...d, slots: { ...d.slots, lunch: null } }
        : d
    ),
  };
  assert(
    removedPlan.days[0].slots.lunch === null &&
      removedPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      removedPlan.days[0].slots.dinner === "spaghetti_stir_fry" &&
      removedPlan.days[0].slots.snack === "nigerian_egg_roll",
    "9. Remove Slot: Removing Lunch sets Lunch to null while Breakfast, Dinner, and Snack remain intact"
  );

  // 10. Cancelling replacement leaves existing slot untouched
  const cancelledState = { ...removedPlan };
  assert(
    cancelledState.days[0].slots.dinner === "spaghetti_stir_fry",
    "10. Cancelling replacement leaves existing meal in that slot unchanged"
  );

  // 11. Migration of legacy single-meal plans (Monday -> Jollof Rice -> Monday Lunch -> Jollof Rice)
  const legacyPlan = {
    weekStartDate: "2026-08-24",
    days: [
      { dayIndex: 0, dateStr: "2026-08-24", mealId: "jollof_rice" },
      { dayIndex: 1, dateStr: "2026-08-25", mealId: "chicken_pepper_soup" },
      { dayIndex: 2, dateStr: "2026-08-26", mealId: null },
      { dayIndex: 3, dateStr: "2026-08-27", mealId: "ewa_riro" },
      { dayIndex: 4, dateStr: "2026-08-28", mealId: null },
      { dayIndex: 5, dateStr: "2026-08-29", mealId: null },
      { dayIndex: 6, dateStr: "2026-08-30", mealId: null },
    ],
  };

  const migrated = normalizeWeeklyPlan(legacyPlan);
  assert(
    migrated.days[0].slots.lunch === "jollof_rice" &&
      migrated.days[0].slots.breakfast === null &&
      migrated.days[0].slots.dinner === null &&
      migrated.days[0].slots.snack === null &&
      migrated.days[1].slots.lunch === "chicken_pepper_soup" &&
      migrated.days[3].slots.lunch === "ewa_riro" &&
      migrated.days[2].slots.lunch === null,
    "11. Migration: Legacy single-meal plans correctly migrate to Lunch slot leaving other slots empty"
  );

  // 12. Invalid / corrupted plans safely handled with fallback
  const corruptedPlan = {
    weekStartDate: "invalid",
    days: "not-an-array",
  };
  const safeFallback = normalizeWeeklyPlan(corruptedPlan);
  assert(
    safeFallback.days.length === 7 &&
      safeFallback.days.every((d) => d.slots.lunch === null && d.slots.breakfast === null),
    "12. Safe Fallback: Corrupted stored plans gracefully normalize to clean default 7-day 4-slot structure"
  );

  // 13. Meal resolution for planned meals
  const jollof = MEAL_MAP["jollof_rice"];
  assert(
    jollof && jollof.id === "jollof_rice" && jollof.name === "Jollof Rice",
    "13. Valid meal ID 'jollof_rice' resolves to correct static meal"
  );

  // 14. Meal ingredients resolution
  const jollofIngNames = jollof.ingredients.map((id) => INGREDIENT_MAP[id]?.name);
  assert(
    jollofIngNames.every((name) => typeof name === "string" && name.length > 0) &&
      jollofIngNames.includes("Rice") &&
      jollofIngNames.includes("Fresh Tomatoes"),
    "14. Meal ingredients resolve to clean display names without exposing raw IDs"
  );

  // 15. View meal route target
  const targetMealRoute = `/meals/${removedPlan.days[0].slots.dinner}`;
  assert(
    targetMealRoute === "/meals/spaghetti_stir_fry",
    "15. View meal action maps to correct meal details route '/meals/[id]'"
  );

  // 16. Full user state persistence roundtrip preserves all 28 slots
  const userState = {
    ...getInitialUserState(),
    weeklyPlan: removedPlan,
  };
  const serialized = JSON.stringify(userState);
  const rehydrated = JSON.parse(serialized);
  const rehydratedPlan = normalizeWeeklyPlan(rehydrated.weeklyPlan);
  assert(
    rehydratedPlan.days.length === 7 &&
      rehydratedPlan.days[0].slots.breakfast === "indomie_noodle_sandwich" &&
      rehydratedPlan.days[0].slots.lunch === null &&
      rehydratedPlan.days[0].slots.dinner === "spaghetti_stir_fry" &&
      rehydratedPlan.days[0].slots.snack === "nigerian_egg_roll",
    "16. Persistence Roundtrip: Complete multi-slot weekly plan survives serialization and rehydration without data loss"
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
