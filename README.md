# DishDash

DishDash is a simple meal decision and weekly planning app for solo cooks. It helps users decide what to cook by combining what they are in the mood for with the ingredients they already have, then turns those decisions into a weekly meal plan and grocery checklist.

## What is DishDash?

DishDash is built around a simple flow:

**Choose a Preference → Select Ingredients → Get Recommendations → View Meal → Plan → Shop**

Users can:

- Choose what they are in the mood for
- Select ingredients they already have
- Get up to three meal recommendations
- See which ingredients they have and which they still need
- View full meal instructions
- Add meals to a seven-day weekly plan
- Replace or remove planned meals
- Generate a grocery checklist from their weekly plan
- Check off grocery items as they shop
- Continue using the core app when offline

The app uses a curated collection of 20 Nigerian meals and 41 ingredients.

## Who is it for?

DishDash is designed for people who cook for themselves and often find themselves asking:

> "What should I cook today?"

It is especially useful for solo cooks who have ingredients at home but need help deciding what to make.

## The Problem

Deciding what to cook is not always as simple as looking at the ingredients available at home.

A person may have ingredients available but still struggle to decide what to make because they are considering other things, such as what they are craving, how much time they have, how much energy they have, or what fits their current mood.

DishDash started with an ingredient-first approach:

> "I have these ingredients. What can I make?"

After speaking with potential users, I realised that this is only one way people approach the decision.

Someone may instead start with:

> "What am I in the mood for?"

The current DishDash experience therefore starts with the user's meal preference before asking what ingredients they have.

## Core Features

### Ingredient Discovery

Users can search and filter ingredients by category, then select the ingredients they want to use for their search.

Available categories include:

- Staples & Grains
- Proteins
- Vegetables & Produce
- Oils & Seasonings

Selected ingredients can be removed individually or cleared at once.

### Meal Recommendations

DishDash now starts the discovery flow by asking what the user is in the mood for.

The available preferences are:

- **Something Spicy**
- **Something Filling**
- **Something Quick**
- **Something Sweet**
- **Surprise Me**

After choosing a preference, the user selects the ingredients they have available.

The recommendation system then uses both pieces of information to determine suitable meals.

This approach treats the user's preference as part of the meal decision rather than as an additional filter applied after ingredient selection.

### Meal Details

Each meal has its own detail page with:

- Meal name
- Description
- Category
- Cooking time
- Ingredients
- Ingredient availability
- Preparation instructions
- Add to Weekly Plan action

When ingredients have been selected during discovery, the meal page separates them into:

- **You have**
- **You need**

### Weekly Planner

Users can plan one meal for each of seven days.

The planner supports:

- Adding meals
- Replacing meals
- Removing meals
- Viewing meal details
- Selecting meals directly from the meal library

Replacing an existing meal requires confirmation.

### Grocery Checklist

The grocery checklist is generated from the user's planned meals.

The process is:

**Planned meals → Required ingredients → Remove available ingredients → Deduplicate**

Ingredients needed by multiple meals appear once and show the meals that require them.

Users can check and uncheck grocery items, and those states are saved locally.

### Offline Support

DishDash is built as an offline-first client-side application.

A service worker caches the main application routes and assets. The core experience can continue to work without an internet connection because recommendations, meal data, planning, and grocery generation do not depend on a backend.

DishDash can also be installed as a PWA on supported devices.

## Technologies and Tools

### Technologies

- Next.js
- React
- TypeScript
- Vanilla CSS
- HTML
- JavaScript

### Browser APIs and Architecture

- `localStorage` for user state persistence
- Service Worker API for offline support
- Web App Manifest for PWA installation

### Development

The application was developed in Antigravity using an AI-assisted development workflow.

The project uses a client-side architecture with curated static data rather than a backend or database.

## Project Structure

```text
src/
├── app/
│   ├── groceries/
│   ├── meals/[id]/
│   ├── planner/
│   ├── recommendations/
│   ├── offline/
│   └── page.tsx
├── components/
│   ├── common/
│   ├── discovery/
│   ├── groceries/
│   ├── planner/
│   └── recommendations/
├── hooks/
├── lib/
└── types/

public/
├── icons/
├── manifest.json
└── sw.js

scripts/
├── validateData.mjs
├── testRecommendationEngine.mjs
├── testPlanAssignment.mjs
├── testGroceryGenerator.mjs
├── testPWA.mjs
└── testEndToEnd.mjs

README.md
journal.md
```

## Important Product Decisions

### Keep the product focused

DishDash was intentionally kept small.

The application does not include accounts, authentication, a backend, AI, nutrition tracking, pricing, budgeting, pantry management, social features, ratings, reviews, or grocery delivery.

These features could be considered in a future version, but they were not necessary for the core experience.

### Use deterministic recommendations

The recommendation engine does not randomly select meals.

Ingredient matches determine the ranking, while equal matches preserve the original dataset order.

This makes the recommendations predictable and easier to test.

### Start with user intent

The original discovery flow started with ingredient selection and placed meal preference afterward.

After collecting user feedback, I reconsidered this assumption. The responses showed that people do not always begin the meal decision with what they have available. Cravings, mood, time, energy, budget, and household preferences can also influence the decision.

I therefore changed the discovery flow to ask about the user's preference first:

**Preference → Ingredients → Recommendations**

This makes the user's intent the starting point while still using available ingredients as an important constraint.

### Treat selected ingredients as a search state

Selected ingredients are not treated as permanent pantry inventory.

They describe what the user currently has available for the purpose of finding meals.

This distinction also prevents the grocery checklist from becoming a pantry management system.

### Keep grocery generation honest

The grocery generator only uses information available in the dataset.

No quantities or prices are invented because the dataset does not provide reliable information for them.

### Keep state in one place

User-specific state is managed through the existing `useUserState` hook and persisted through the existing storage layer.

The main state includes:

- `availableIngredientIds`
- `selectedPreference`
- `weeklyPlan`
- `purchasedGroceryItemIds`

This avoids creating separate storage systems for individual features.

### Design for mobile first

The interface was designed around a narrow, mobile-oriented experience.

On larger screens, the application remains intentionally narrow instead of expanding to fill the entire browser window. The goal is for the user to feel like they are using a mobile product even when they are on a laptop.

The visual treatment uses a simple border around the application rather than a realistic phone mockup.

## Challenges and Solutions

### Keeping recommendations explainable

A recommendation system can easily become a black box.

To keep the results understandable, each recommendation shows matched ingredients and missing ingredients. This gives the user a clear reason for why a meal was suggested.

### Handling meals with no ingredient matches

There are situations where the selected ingredients do not match any meal.

Instead of displaying unrelated meals as filler, DishDash shows a dedicated no-match state and gives the user a way to adjust their search.

### Replacing planned meals safely

Replacing an existing meal could accidentally overwrite the user's plan.

The solution was to require explicit confirmation before replacement. Cancelling the confirmation leaves the original meal unchanged.

### Keeping the grocery list accurate

The same ingredient can be required by several planned meals.

The grocery generator deduplicates those ingredients while keeping track of all meals that require them.

### Handling invalid stored state

Because user state is stored in the browser, invalid or corrupted data is possible.

The storage layer validates the stored state and falls back to the default state when the stored data is invalid.

### Supporting offline use

The application does not depend on a backend for its core features, which makes offline use possible.

A service worker caches the core application shell and routes, while `localStorage` preserves the user's state.

## Testing

DishDash includes automated tests for the major pieces of the application.

The final test run covered:

| Test Suite | Result |
|---|---:|
| Data Integrity | 100% PASS |
| Recommendation Engine | 18 / 18 PASS |
| Weekly Planner | 14 / 14 PASS |
| Grocery Generator | 12 / 12 PASS |
| PWA & Offline | 15 / 15 PASS |
| End-to-End Journeys | 15 / 15 PASS |

**Total: 74 automated test assertions passed.**

Additional verification:

- TypeScript check: 0 errors
- Production build: successful
- Responsive checks: 320px to 1440px
- Accessibility checks: completed
- Persistence checks: completed
- Offline checks: completed

## Scope of V1

The following were intentionally excluded from DishDash V1:

- Accounts
- Authentication
- Backend APIs
- Database
- Cloud synchronization
- AI
- Nutrition tracking
- Calorie tracking
- Ingredient quantities
- Ingredient prices
- Budgeting
- Grocery delivery
- Pantry inventory
- Expiration tracking
- Stock levels
- Social features
- Ratings and reviews
- User-submitted recipes
- Calendar synchronization
- Multiple meals per day

## Future Improvements

If DishDash were developed further, possible improvements would include:

- A larger meal and ingredient library
- Ingredient quantities
- More flexible meal scheduling
- Accounts and cloud synchronization
- More advanced grocery planning
- Optional nutrition information
- More sophisticated recommendation logic
- Push notifications
- Background synchronization
- Free-text meal preferences
- Natural-language meal requests

These were left out of V1 so the core product could remain focused.

## Running the Project

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the local development URL shown by Next.js in your browser.

## Validation and Testing Commands

Validate the data:

```bash
npm run validate:data
```

Run the recommendation engine tests:

```bash
npm run test:engine
```

Run the planner tests:

```bash
npm run test:planner
```

Run the grocery generator tests:

```bash
npm run test:grocery
```

Run the PWA tests:

```bash
npm run test:pwa
```

Run the end-to-end tests:

```bash
npm run test:e2e
```

Run all test suites:

```bash
npm test
```

Run the TypeScript check:

```bash
npx tsc --noEmit
```

Create a production build:

```bash
npm run build
```

## Final Status

DishDash V1 is a functional client-side meal decision and weekly planning application.

The current experience is:

**Choose Preference → Select Ingredients → Recommend → View Meal → Plan → Shop**

The project was built with a deliberately constrained scope and verified through automated testing, accessibility checks, responsive checks, persistence checks, and offline/PWA testing.

## Project Documentation

- `README.md` explains the project, product decisions, technologies, challenges, and scope.
- `journal.md` documents the development process and decisions made throughout the project.
