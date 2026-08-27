# DishDash

DishDash is a simple meal decision and weekly planning tool designed to help solo cooks decide what to make using ingredients they already have.

## What is DishDash?

DishDash is a client-side, offline-first web application focused on reducing the friction of deciding what to cook.

The core experience allows users to:

- Select ingredients they currently have available
- Filter ingredients by category
- Choose a recommendation preference
- Receive up to three meal recommendations
- See which ingredients they have and which they still need
- View complete meal details and preparation instructions
- Add meals to a seven-day weekly plan
- Replace or remove planned meals
- Automatically generate a grocery checklist
- Check off grocery items
- Continue using the core application offline

## Who is it designed for?

DishDash is designed primarily for **solo cooks** who want a simple way to decide what to cook without spending too much time searching through recipes.

It is particularly useful for people who:

- Have a limited set of ingredients available
- Want meal suggestions based on what they already have
- Prefer Nigerian meals
- Want to plan meals for the week
- Want their grocery list generated automatically
- Need a lightweight tool that does not require an account

## The Problem

Deciding what to cook can become surprisingly frustrating. A person may already have several ingredients at home but still struggle to decide what meal they can make with them.

DishDash approaches the problem from the opposite direction:

> Start with what you have, then decide what to cook.

The experience follows a simple flow:

**Available ingredients → Meal recommendations → Meal details → Weekly plan → Grocery checklist**

Rather than overwhelming users with hundreds of recipes, DishDash presents a small number of relevant options.

## Core Features

### Ingredient Discovery

Users can search and select ingredients from a curated ingredient library.

Ingredients are organized into:

- Staples & Grains
- Proteins
- Vegetables & Produce
- Oils & Seasonings

Selected ingredients can be removed individually or cleared entirely.

### Meal Recommendations

DishDash uses a deterministic recommendation engine based on selected ingredients.

Users can choose:

- **Quick & Easy** — meals that take 30 minutes or less
- **Something Different** — excludes meals already assigned to the weekly plan
- **No Preference** — ranks meals primarily by ingredient matches

The system returns a maximum of three recommendations and explains what the user has, what is missing, and why the meal was recommended.

### Meal Details

Each meal page includes:

- Meal name
- Description
- Category
- Cooking time
- Ingredient list
- Available vs. missing ingredients
- Preparation instructions
- Add to Weekly Plan action

### Weekly Meal Planner

Users can plan one meal for each of seven days.

The planner supports adding, replacing, removing, and viewing meals. Changes are persisted locally in the browser.

### Grocery Checklist

DishDash automatically generates a grocery checklist from planned meals.

The generator:

1. Collects ingredients from planned meals
2. Removes ingredients already marked as available
3. Deduplicates shared ingredients
4. Groups ingredients by category
5. Shows which planned meals require each ingredient

### Offline Support

DishDash is designed to work offline. A service worker caches the core application shell and static assets, while recommendations, planning, meal details, and grocery generation operate from static data and local browser storage.

## Technology & Tools

### Technologies

- **Next.js** — Application framework
- **React** — User interface
- **TypeScript** — Type-safe development
- **Vanilla CSS** — Styling and responsive layouts
- **localStorage** — Client-side persistence
- **Service Worker** — Offline functionality and caching
- **Web App Manifest** — Progressive Web App support
- **Geist** — Primary typeface

### Development Tools

- **Figma** — Interface design and visual exploration
- **Antigravity IDE** — Development environment
- **Git & GitHub** — Version control and project hosting

## Architecture

DishDash was intentionally built as a **client-side, offline-first application**.

The application does not use:

- A backend API
- A database
- Authentication
- User accounts
- Cloud synchronization
- AI services

Meal and ingredient data are static datasets stored within the application.

User-specific state is maintained locally and persisted through `localStorage`.

The main user state includes:

- `availableIngredientIds`
- `selectedPreference`
- `weeklyPlan`
- `purchasedGroceryItemIds`

## Important Design & Product Decisions

### 1. Start with ingredients instead of recipes

The primary interaction begins with:

**"What do you have?"**

This directly addresses the problem of deciding what to cook based on existing ingredients.

### 2. Limit recommendations to three meals

Instead of overwhelming users with a large recipe library, DishDash returns a maximum of three recommendations to keep the decision focused.

### 3. Explain recommendations

Recommendations show the ingredients the user has, the ingredients they still need, and the reason the meal was selected.

### 4. Keep recommendations deterministic

Given the same ingredients, preference, and weekly plan, the engine produces the same result. Equal matches preserve the original dataset order rather than using randomization.

### 5. Separate search ingredients from pantry inventory

Selected ingredients represent the user's current search context. They are not treated as permanent pantry inventory.

This keeps V1 focused on meal decision-making rather than household inventory management.

### 6. Derive the grocery list

The grocery checklist is generated from the weekly meal plan rather than requiring users to manually build a shopping list.

**Weekly Plan → Required Ingredients → Grocery Checklist**

### 7. One meal per day

V1 supports exactly one meal per day across seven days. This keeps the planning experience intentionally simple.

### 8. Client-side persistence

User state is stored locally instead of requiring authentication or a database.

### 9. Offline-first architecture

The core functionality uses static data and client-side state, making the application naturally suited to offline use.

## UI & Design Direction

The interface was designed around a **focused, mobile-first experience**.

Although DishDash is a web application, the main application interface maintains a narrow, phone-like content area on larger screens. The intention is to make the experience feel like using a focused mobile product rather than a traditional wide desktop dashboard.

The visual direction emphasizes:

- Minimalism
- Clear hierarchy
- Generous spacing
- Smooth typography
- Restrained use of color
- Simple borders and surfaces
- Focused interactions
- A narrow application frame

The application uses **Geist** as its primary typeface.

A simple white outer border frames the application on larger screens without turning the interface into a literal phone mockup.

## Challenges & How They Were Solved

### Recommendation Logic

A useful recommendation system was needed without AI or a backend. A deterministic recommendation engine was built to evaluate ingredient matches and apply the selected preference.

### Different Recommendation Preferences

Each preference has its own eligibility rules. Quick & Easy excludes meals over 30 minutes, Something Different excludes planned meals, and No Preference considers all meals.

### Grocery List Deduplication

Multiple meals can require the same ingredient. The grocery generator deduplicates shared ingredients while retaining the names of all meals that require them.

### State Persistence

Because there is no backend, a centralized user state hook coordinates application state and persists it through `localStorage`.

The storage layer also handles malformed or invalid data safely.

### Offline Support

A service worker was introduced to cache the core application shell, static assets, and important routes. Navigation uses network-first behavior with cached fallbacks and an offline page.

### Accessibility

The final QA process covered semantic HTML, keyboard navigation, accessible modal interactions, ARIA states, focus indicators, screen-reader announcements, accessible naming, and keyboard dismissal of dialogs.

## Testing & Verification

DishDash includes automated tests covering the major application systems.

The final test suite contains **74 automated test assertions**, all of which passed.

| Test Suite | Result |
|---|---:|
| Data Integrity | 100% PASS |
| Recommendation Engine | 18 / 18 PASS |
| Weekly Planner | 14 / 14 PASS |
| Grocery Generator | 12 / 12 PASS |
| PWA & Offline | 15 / 15 PASS |
| End-to-End User Journeys | 15 / 15 PASS |
| **Total** | **74 / 74 PASS** |

Additional verification:

- TypeScript compilation: **0 errors**
- Production build: **Successful**
- Responsive verification: **320px – 1440px**
- Local state persistence: **Verified**
- Corrupt storage recovery: **Verified**
- Offline core flows: **Verified**

## Project Scope

DishDash V1 intentionally focuses on a small, defined problem.

The following were intentionally excluded:

- Authentication
- User accounts
- Backend APIs
- Databases
- Cloud synchronization
- AI recommendations
- Nutrition tracking
- Calorie tracking
- Ingredient quantities
- Ingredient pricing
- Budgeting
- Grocery delivery
- Pantry inventory management
- Expiration tracking
- Stock levels
- Ratings and reviews
- Social features
- User-submitted recipes
- Calendar synchronization
- Multiple meal slots per day
- Push notifications
- Background synchronization

These exclusions were deliberate decisions to keep V1 focused on the core meal decision and planning experience.

## Project Structure

```text
dishdash/
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
│
├── scripts/
│   ├── generateIcons.mjs
│   ├── testEndToEnd.mjs
│   ├── testGroceryGenerator.mjs
│   ├── testPlanAssignment.mjs
│   ├── testPWA.mjs
│   ├── testRecommendationEngine.mjs
│   └── validateData.mjs
│
├── src/
│   ├── app/
│   │   ├── groceries/
│   │   ├── meals/
│   │   ├── planner/
│   │   ├── recommendations/
│   │   ├── offline/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── discovery/
│   │   ├── groceries/
│   │   ├── planner/
│   │   └── recommendations/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── data/
│
├── package.json
├── README.md
└── journal.md
```

## Development Process

DishDash was developed incrementally through defined implementation phases.

### Phase 1 — Foundation

Established the application structure, static datasets, shared state model, and initial routes.

### Phase 2 — Core Data & Application Foundations

Established the data validation and architectural foundations required by the rest of the application.

### Phase 3 — Recommendation Engine & Discovery

Built the ingredient discovery interface and deterministic recommendation engine.

### Phase 4 — Meal Details & Plan Assignment

Added meal detail pages and the ability to assign meals to specific days.

### Phase 5 — Weekly Planner

Built the complete seven-day planner with add, replace, remove, and view actions.

### Phase 6 — Grocery Checklist

Added automatic grocery list generation from the weekly plan.

### Phase 7 — PWA & Offline Support

Added the web app manifest, icons, service worker, offline fallback, and installation support.

### Phase 8 — Accessibility & QA

Completed accessibility verification, responsive checks, persistence testing, offline verification, and end-to-end testing.

## Current Status

**DishDash V1 is complete.**

The application has been implemented, tested, and verified across its core user journeys.

It is:

- Functional
- Responsive
- Accessible
- Offline-ready
- Installable as a PWA
- Covered by automated tests

## Future Improvements

Potential future versions could explore:

- User accounts and cloud synchronization
- Larger meal libraries
- Personalized recommendations
- Ingredient quantities
- More detailed grocery planning
- Nutrition information
- Multiple meals per day
- Meal history
- Saved favorite meals
- Calendar integration
- Push notifications

These features are intentionally outside the scope of the current V1.

## License

This project was created as part of a development and product-building assignment.
