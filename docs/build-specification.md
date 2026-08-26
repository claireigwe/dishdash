# DishDash Build Specification

## 1. Product Overview

### Product Name
DishDash

### Product Type
Mobile-first Progressive Web App (PWA).

### Product Purpose
DishDash helps people who live alone decide what to cook when they do not know what to make.

The MVP focuses on reducing the mental effort of choosing a meal.

It does this by letting users select ingredients they currently have at home, choose what kind of meal they want, and receive a small set of relevant Nigerian meal suggestions.

Users can then add meals to a 7-day weekly plan and generate a simple grocery list from that plan.

---

## 2. Core MVP Principle

DishDash is a **meal decision tool**, not a general recipe platform, pantry inventory system, or nutrition app.

The main user problem is:

> "What should I cook today?" (I have to figure out what to cook again, and I keep falling back on the same meals.)

Every feature in V1 must directly support one of these outcomes:

1. Help the user decide what to cook with less mental effort.
2. Help the user avoid repeatedly making the same decision every day.
3. Help the user prepare for the meals they selected.

Features that do not support these outcomes are strictly excluded from V1.

---

## 3. Target User

The MVP targets people who:

- Live alone.
- Regularly prepare their own meals.
- Have basic cooking ability.
- Are familiar with Nigerian food.
- Get tired of eating the same meals.
- Sometimes have ingredients at home but do not know what to cook.
- Want to spend less mental effort deciding what to eat.

---

## 4. Core User Flow

```text
Open DishDash
      ↓
Select Available Ingredients (or skip)
      ↓
Select Preference (Quick & easy / Something different / No preference)
      ↓
Get Up to 3 Meal Suggestions
      ↓
View Meal Details
      ↓
Add Meal to Weekly Plan
      ↓
Generate Grocery List
```

---

## 5. Application Structure & Screens

The MVP contains the following screens:

### 5.1 Home / Discovery Screen (`/`)
- Allows the user to select ingredients they currently have at home.
- Allows selection of 1 of 3 preferences: *Quick & easy*, *Something different*, or *No preference*.
- Primary action: "Find Meals".
- Quick navigation to Weekly Plan and Grocery List.

### 5.2 Recommendation Results Screen (`/recommendations`)
- Returns **up to 3 meal suggestions**.
- Shows explainable match information (e.g., "Uses 3 of your ingredients", "Needs 2 more", "Ready in 25 mins").
- Displays a clear, actionable no-match state when no selected ingredients match any recipes.

### 5.3 Meal Details Screen (`/meals/[id]`)
- Displays meal name, short description, category, cooking time, and preparation instructions.
- Displays required ingredients with clear tags indicating which the user currently has vs. which are needed.
- Action: "Add to Plan" (opens day-picker modal).

### 5.4 Weekly Meal Plan Screen (`/planner`)
- 7-day planner showing 1 meal slot per day.
- Allows adding, replacing (with confirmation dialog for occupied days), and removing meals.
- Persists locally on the device.

### 5.5 Grocery List Screen (`/groceries`)
- Automatically derived from meals currently in the weekly plan.
- Excludes ingredients the user currently has marked as available.
- Combines duplicates into a single checklist.
- Allows items to be checked off as obtained.

---

## 6. Curated Nigerian Meal Dataset

The MVP dataset contains **approximately 20 curated Nigerian meals** and ~40–50 standardized ingredients.

Every meal record contains:
- `id` (string)
- `name` (string)
- `description` (string)
- `category` (string, e.g., "Rice dishes", "Soups & Stews", "Swallows", "Beans & Legumes", "Yam & Plantain", "Pasta & Quick meals")
- `cookingTime` (number, in minutes)
- `isQuick` (boolean, cookingTime <= 30)
- `categoryTags` (string[])
- `ingredients` (array of valid Ingredient IDs)
- `instructions` (array of step strings)

Every ingredient record contains:
- `id` (string)
- `name` (string)
- `category` (string, e.g., "Staples", "Proteins", "Vegetables", "Spices", "Oils")

---

## 7. Recommendation Rules

The recommendation engine uses simple, deterministic, client-side rules without numerical scoring gimmicks or AI.

### 7.1 Quick & Easy
1. Prefer meals with a cooking time of 30 minutes or less.
2. Among eligible meals, prefer meals matching more of the user's available ingredients.
3. Return up to 3 meals.

### 7.2 Something Different
1. Prefer meals that are not already present in the user's current 7-day weekly plan.
2. Among eligible meals, prefer meals matching more of the user's available ingredients.
3. If the weekly plan is empty, all meals are eligible.
4. Return up to 3 meals.

### 7.3 No Preference
1. Prefer meals matching more of the user's available ingredients.
2. Return up to 3 meals.

### 7.4 Explainability
Every recommendation card must clearly explain why it appeared:
- "Uses X of your ingredients"
- "Needs Y more ingredients"
- "Ready in Z minutes"
- "Not in your weekly plan"

---

## 8. Available Ingredients vs. Pantry

- **Available Ingredients** are defined as: *Ingredients the user currently has at home and wants DishDash to consider when deciding what to cook.*
- They are a transient search snapshot, **NOT** a persistent pantry inventory.
- DishDash does **NOT** track quantities, expiration dates, stock levels, or purchase dates.
- There is **no Pantry screen**, no Pantry navigation tab, and no pantry management feature.

---

## 9. Grocery List Behaviour

The grocery list is derived dynamically:
1. Scan all meals in the 7-day weekly plan.
2. Collect all required ingredient IDs.
3. Remove ingredients currently marked in the user's available ingredient selection.
4. Deduplicate remaining ingredients.
5. Display as an interactive checklist with local check-off state.

---

## 10. Weekly Planner Behaviour

- Exactly 7 days.
- Maximum 1 planned meal per day.
- Adding a meal to an occupied day triggers a replacement confirmation prompt.
- Meals can be removed at any time.
- State persists in `localStorage`.

---

## 11. Local Persistence

- Uses `localStorage` only.
- Persists:
  - `availableIngredientIds`: array of selected ingredient IDs.
  - `weeklyPlan`: 7-day array of `{ dayIndex, dateStr, mealId }`.
  - `purchasedGroceryItemIds`: array of checked grocery ingredient IDs.
- Error handling: Gracefully catches storage disabled or corrupt JSON errors, falling back to a clean in-memory state without crashing.

---

## 12. PWA & Offline Support

- Installable PWA with web app manifest and icons.
- Cache-first service worker caching HTML, CSS, JavaScript, and the static meal dataset.
- Core meal discovery, planning, and grocery checklist work fully offline once cached.
- No background sync, no push notifications, no server requirements.

---

## 13. Responsive Design

- Mobile-first layout using Vanilla CSS.
- Responsive scaling: adapts cleanly to tablet and desktop viewports with comfortable reading widths and responsive card grids.
- Does not hard-code the app to a fixed 480px frame.

---

## 14. Explicit Out of Scope

The following are strictly **OUT OF SCOPE** for V1:
- AI / Machine Learning / Semantic search
- Backend services / Databases / APIs
- Accounts / Authentication / User profiles
- Food pricing / Cost calculations / Budgeting
- Calorie / Macro / Nutrition tracking
- Medical or dietary claims
- Social features / Sharing
- User-generated recipes / Recipe submission
- Notifications / Reminders
- Pantry management / Inventory systems
- Grocery delivery / Online store integrations
