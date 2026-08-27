# DishDash — Development Journal

## Project Overview

DishDash is a simple meal decision and weekly planning app designed for solo cooks who already have some ingredients at home but do not know what to cook.

The project was built as part of the Ship Log task. The goal was to take a basic product idea, turn it into a functional application, and document the development process, decisions, challenges, and solutions along the way.

---

# Development Log

## Entry 1 — Defining the Product

### What I worked on

I started by defining what DishDash should actually do and, more importantly, what it should **not** do.

The initial product idea was intentionally simple: help a person decide what to cook based on ingredients they already have.

Rather than turning it into a general recipe platform, I defined the core journey around:

1. Selecting ingredients.
2. Choosing a meal preference.
3. Receiving meal recommendations.
4. Viewing a meal.
5. Adding meals to a weekly plan.
6. Generating a grocery checklist from the plan.

### Key decision

I decided that DishDash should be a **meal decision tool**, not a full meal-management platform.

This meant deliberately leaving out features such as:

- Accounts and authentication
- Backend APIs and databases
- AI-generated recipes
- Nutrition tracking
- Calorie counting
- Prices and budgeting
- Pantry inventory
- Expiration dates
- Social features
- Ratings and reviews
- Grocery delivery
- Calendar synchronization

Keeping these out of scope helped me focus on making the core experience work well.

---

## Entry 2 — Choosing the Technical Direction

### What I worked on

I established the technical structure for the application before building the main flows.

The application uses:

- Next.js
- React
- TypeScript
- Vanilla CSS
- Static TypeScript datasets
- Browser `localStorage`

### Key decision

I chose a client-side architecture for the V1 version.

The meals and ingredients are stored locally as curated static datasets, while user-specific state is persisted in `localStorage`.

This allowed the application to work without:

- A backend
- A database
- Authentication
- API requests

It also made the application suitable for the offline-first direction I wanted to achieve later.

### State model

The main user state became:

- `availableIngredientIds`
- `selectedPreference`
- `weeklyPlan`
- `purchasedGroceryItemIds`

I kept these values together rather than creating separate storage systems for different features.

---

# Phase 1 — Project Foundation

## Entry 3 — Establishing the Initial App Structure

### What I worked on

I created the initial application structure and established the routes that would eventually support the complete DishDash experience.

The main routes were planned around:

- `/` — Discovery
- `/recommendations` — Meal recommendations
- `/meals/[id]` — Meal details
- `/planner` — Weekly planner
- `/groceries` — Grocery checklist

The early implementation included placeholders so that each major route existed before its full functionality was built.

### Decision

I decided to build the application in phases instead of attempting to implement everything at once.

This made it easier to verify each major piece before moving to the next one.

---

# Phase 2 — Data Foundation

## Entry 4 — Creating the Meal and Ingredient Dataset

### What I worked on

I created a curated dataset containing Nigerian meals and their ingredients.

The final data validation covered:

- 41 ingredients
- 20 meals

The application uses IDs internally while resolving those IDs to human-readable names when displaying information to the user.

### Key decision

I wanted the dataset to remain predictable and deterministic.

The application should never invent ingredients, meals, quantities, prices, or other information that does not exist in the curated dataset.

### Validation

A dedicated data validation script was created to verify the integrity of the dataset.

This became an important check that could be run throughout development.

---

# Phase 3 — Recommendation Engine & Discovery

## Entry 5 — Building the Recommendation Engine

### What I worked on

I implemented the recommendation engine as a pure, deterministic client-side function.

The recommendation system supports three preferences:

- Quick & Easy
- Something Different
- No Preference

### Recommendation rules

For **Quick & Easy**, meals must have a cooking time of 30 minutes or less.

For **Something Different**, meals already assigned to the weekly plan are excluded.

For **No Preference**, all meals are eligible.

For all three options, matching selected ingredients influence the ranking.

The engine returns a maximum of three recommendations.

### Important decision

I chose deterministic ranking instead of random recommendations.

If two meals have the same ingredient match count, the application preserves their original dataset order.

This makes the experience predictable and also makes the recommendation engine easier to test.

---

## Entry 6 — Designing the Discovery Experience

### What I worked on

I built the main discovery page where users select ingredients.

The interface includes:

- Ingredient search
- Category filtering
- Ingredient selection
- Selected ingredient chips
- Individual chip removal
- Clear-all functionality
- Preference selection
- Dynamic Find Meals button

The five ingredient categories are:

- All
- Staples & Grains
- Proteins
- Vegetables & Produce
- Oils & Seasonings

### Challenge

I needed the ingredient selection to feel like a temporary search rather than a permanent pantry inventory.

### Solution

I treated `availableIngredientIds` as an **active search snapshot**.

Selecting an ingredient does not create pantry inventory. It only describes what the user currently wants to search with.

This distinction became important later when generating the grocery checklist.

---

## Entry 7 — Testing the Recommendation Logic

### What I worked on

I created automated tests for the recommendation engine.

The test suite covered:

- No ingredients selected
- Quick & Easy with no ingredients
- Something Different with no planned meals
- Single ingredient matches
- Multiple ingredient matches
- No matches
- One result
- Two results
- More than three results
- Quick meal filtering
- Planned meal exclusion
- Empty weekly plan
- Tie handling
- Determinism
- Matched/missing ingredient partitioning
- Changing search inputs

### Result

The recommendation engine reached:

**18 passed, 0 failed**

The tests were useful for confirming that the recommendation logic behaved consistently before building later features on top of it.

---

# Phase 4 — Meal Details & Plan Assignment

## Entry 8 — Building Meal Details

### What I worked on

I created the dynamic meal details route:

`/meals/[id]`

The page displays:

- Meal name
- Description
- Category
- Cooking time
- Ingredients
- Ingredient availability
- Preparation steps
- Add to Weekly Plan action

### Key decision

The ingredient display changes depending on the user's current search ingredients.

Ingredients are separated into:

- **You have**
- **You need**

If the user has not selected any ingredients, the page simply shows the complete ingredient list rather than suggesting that the user has none.

This avoids misleading the user.

---

## Entry 9 — Adding Meals to the Weekly Plan

### What I worked on

I implemented the Add to Plan interaction.

The user can select one of seven days.

If the day is empty, the meal is added immediately.

If the day already contains a meal, a replacement confirmation dialog appears.

### Challenge

I wanted to prevent accidental replacement of a meal that the user had already planned.

### Solution

I introduced a separate replacement confirmation dialog.

The user must explicitly confirm the replacement before the existing meal is changed.

Cancelling the dialog leaves the original plan untouched.

### Testing

The planner assignment tests verified:

- Meal ID resolution
- Ingredient mapping
- Empty day assignment
- Occupied day detection
- Replacement confirmation
- Replacement cancellation
- Multi-day isolation
- Persistence

Result:

**14 planner tests passed, 0 failed**

---

# Phase 5 — Weekly Meal Planner

## Entry 10 — Building the Weekly Planner

### What I worked on

I replaced the planner placeholder with a complete seven-day planner.

The planner contains:

- Day 1 through Day 7
- Planned meal information
- View Meal action
- Replace action
- Remove action
- Add Meal action for empty slots
- Meal picker modal
- Replacement confirmation

### Key decision

Each day is structurally limited to one meal.

The weekly plan therefore contains exactly seven slots, with each slot containing either:

- A meal ID
- `null`

This kept the data model simple and aligned with the intended V1 experience.

### Challenge

Users should be able to add meals directly from the planner without having to return to the discovery flow.

### Solution

I added a Meal Picker modal containing the curated meal library and a search field.

This provides a second path for adding meals while keeping the main discovery experience focused.

---

## Entry 11 — Handling Planner Edge Cases

I added handling for invalid meal references.

If a stored meal ID no longer exists in the curated dataset, the planner does not crash.

Instead, it displays an unavailable meal reference and provides a Remove action.

This was particularly important because user state is stored in `localStorage` and should be resilient to unexpected or stale data.

---

# Phase 6 — Grocery Checklist

## Entry 12 — Deriving the Grocery List

### What I worked on

I implemented a deterministic grocery generator.

The grocery list is derived from:

**Planned meals → their ingredients → subtract ingredients already available → deduplicate**

The final checklist contains only ingredients the user needs to buy.

### Key decision

I did not add quantities or prices.

The project specification did not provide reliable quantities or pricing data, so generating them would have meant inventing information.

Instead, the grocery list focuses on identifying the ingredients required by the user's weekly plan.

---

## Entry 13 — Deduplicating Grocery Items

### What I worked on

I handled ingredients shared by multiple meals.

For example, if two planned meals require the same ingredient, the ingredient appears only once in the grocery list.

The item also records the meals that require it.

The interface can therefore show information such as:

`Needed for: Jollof Rice, Fried Rice`

### Challenge

Removing duplicates while still explaining why an ingredient is needed required keeping the source meal information separately from the final grocery item.

### Solution

The grocery generator deduplicates ingredient IDs while collecting the names of all meals that require each ingredient.

---

## Entry 14 — Grocery Checklist Interaction

### What I worked on

I added interactive checklist behavior.

Users can check and uncheck grocery items.

Checked items:

- Display a check indicator
- Become visually subdued
- Receive a strikethrough
- Remain in the list

### Key decision

Checking an item must not modify the user's available ingredients.

A purchased grocery item and an ingredient already available at home represent two different concepts.

Therefore:

`purchasedGroceryItemIds`

is stored separately from:

`availableIngredientIds`

This prevents the grocery checklist from accidentally turning into a pantry management system.

### Testing

The grocery generator test suite reached:

**12 passed, 0 failed**

---

# Phase 7 — PWA & Offline Support

## Entry 15 — Making DishDash Installable

### What I worked on

I added PWA support with:

- Web app manifest
- 192px icon
- 512px icon
- Maskable icon
- SVG icon
- Service worker
- Offline fallback page
- Service worker registration

The application uses a standalone display mode.

### Key decision

The PWA implementation remained deliberately lightweight.

I did not add push notifications, background synchronization, accounts, or cloud synchronization because they were outside the V1 requirements.

---

## Entry 16 — Designing the Offline Strategy

### What I worked on

I implemented service-worker caching for the core application routes and assets.

The main strategy was:

- Precache important application routes and shell assets.
- Use network-first behavior for navigation.
- Fall back to cached content when the network is unavailable.
- Cache static assets using stale-while-revalidate behavior.

### Why this worked for DishDash

The application already uses static meal/ingredient data and `localStorage`.

Recommendations, planning, meal details, and grocery generation do not require a backend request.

This made DishDash a good fit for an offline-first client architecture.

### Testing

The PWA test suite reached:

**15 passed, 0 failed**

---

# Phase 8 — Accessibility, Responsive QA & End-to-End Verification

## Entry 17 — Accessibility Review

### What I worked on

I reviewed the application's interactive elements for accessibility.

This included:

- Semantic HTML
- Accessible labels
- Keyboard navigation
- Focus states
- Dialog semantics
- Checkbox states
- Radio states
- Tab states
- Screen-reader announcements

### Challenge

Several interactions were visually clear but needed explicit accessible states and naming.

### Solution

I added attributes such as:

- `aria-label`
- `aria-labelledby`
- `aria-describedby`
- `aria-selected`
- `aria-checked`
- `aria-pressed`

I also ensured important states were not communicated through color alone.

---

## Entry 18 — Modal and Keyboard Interaction QA

### What I worked on

I reviewed the application's modals:

- Add to Plan
- Replace confirmation
- Meal Picker

The modals were tested for:

- Escape-key dismissal
- Keyboard navigation
- Focus behavior
- Backdrop interaction
- Nested confirmation behavior

### Important decision

The replacement confirmation uses `role="alertdialog"` and focuses the Cancel action to reduce the possibility of accidental meal replacement.

---

## Entry 19 — Responsive Design Review

### What I worked on

I checked the application across a range of viewport sizes:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px

The application was checked for:

- Horizontal overflow
- Bottom navigation overlap
- Modal behavior
- Reading width
- Grid behavior
- Mobile spacing

### Result

The core layouts remain usable from small mobile screens through desktop widths.

---

# UI Refinement

## Entry 20 — Reconsidering the Visual Direction

### What I worked on

After the functional build was complete, I reviewed the interface visually rather than treating the first working design as final.

I realized that the initial layout looked too much like a conventional responsive web application when viewed on a laptop.

That did not fit the visual direction I wanted for DishDash.

### New direction

I wanted the application to feel like a **mobile product presented inside a desktop browser**, without looking like a bulky phone mockup.

The inspiration came from a Dribbble reference with a compact, editorial, product-focused presentation.

---

## Entry 21 — Creating a Narrower Mobile-First Frame

### What I changed

I introduced a narrower central application frame on larger screens.

The intention was to make the user feel as though they were interacting with a phone-sized product even when using a laptop.

However, I deliberately avoided:

- A realistic phone frame
- A phone bezel
- Device buttons
- Camera cutouts
- Decorative mockup elements
- Heavy shadows that make it look like a physical phone

### Design decision

The frame should feel like a **simple border around the application**, not a phone mockup.

The border uses white because I liked the clean contrast it created around the application.

The goal is subtle product framing rather than visual decoration.

---

## Entry 22 — Changing the Typography

### What I worked on

I reconsidered the original typography because I wanted something smoother and more refined.

### Decision

I chose **Geist** as the primary typeface.

The decision was based on the visual qualities I wanted:

- Clean
- Modern
- Smooth
- Minimal
- Easy to read
- Suitable for a product interface

The typography change was intended to make the interface feel more polished without introducing unnecessary visual complexity.

---

## Entry 23 — Refining the Visual Language

### What I worked on

I continued refining the interface around the new direction.

The goal was not to redesign the entire product into a decorative marketing website.

Instead, I wanted the UI to feel:

- Focused
- Calm
- Compact
- Editorial
- Mobile-first
- Product-oriented

The existing functionality remained the foundation while the visual presentation was refined.

### Key principle

I wanted the design to communicate the product's simplicity.

DishDash is fundamentally about answering one question:

**"What should I cook?"**

The interface should therefore make that decision feel quick and uncomplicated.

---

# Final Verification

## Entry 24 — Running the Full Test Suite

### What I worked on

After the major implementation phases and UI refinements, I ran the complete automated test suite.

The final verification covered:

- Data integrity
- Recommendation engine
- Weekly planner
- Grocery generator
- PWA functionality
- End-to-end user journeys

### Final results

**74 automated test assertions passed.**

Breakdown:

| Test Suite | Result |
|---|---:|
| Data Integrity | 100% PASS |
| Recommendation Engine | 18 / 18 PASS |
| Weekly Planner | 14 / 14 PASS |
| Grocery Generator | 12 / 12 PASS |
| PWA & Offline | 15 / 15 PASS |
| End-to-End Journeys | 15 / 15 PASS |

### Additional verification

TypeScript validation:

**0 errors**

Production build:

**Successful**

---

# Final Reflection

## What I learned

The biggest lesson from building DishDash was that a simple product still requires careful decisions.

The application itself is intentionally small, but there were many details that could easily have made the experience inconsistent:

- What happens when no ingredients are selected?
- What happens when nothing matches?
- What happens when a planned meal is replaced?
- What happens when stored data becomes invalid?
- What happens when the user goes offline?
- What happens when the same grocery item is required by multiple meals?
- What happens when a user navigates with a keyboard?

Thinking through these cases helped me move beyond simply making screens and toward building a more complete product experience.

## What I would improve in a future version

If DishDash were taken beyond V1, I would consider:

- More meals and a larger ingredient library
- Ingredient quantities
- More flexible meal scheduling
- Persistent accounts and cloud synchronization
- Better grocery planning
- Optional nutrition information
- More sophisticated recommendations
- Push notifications for meal planning
- Background synchronization

These were intentionally excluded from V1 so that the core product could remain simple and focused.

---

# Final Project Status

DishDash V1 is a functional client-side meal decision and weekly planning application.

The completed experience covers:

**Discover → Recommend → View Meal → Plan → Shop**

The project was built with a deliberately constrained scope, tested throughout development, refined visually after the core functionality was complete, and verified through automated tests, accessibility checks, responsive checks, persistence checks, and offline/PWA verification.

