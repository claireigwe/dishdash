# DishDash Development Journal

## Project Overview

DishDash is a simple meal decision and planning app built around a straightforward problem: deciding what to cook can be difficult when you already have ingredients available but do not know what meal to make.

The project was built as a Ship Log task. The goal was to take a basic product idea, turn it into a functional application, and document the development process, decisions, challenges, and solutions along the way.

---

## Phase 1: Project Setup and Data Foundation

I started by setting up the DishDash project and establishing the foundation for the application.

The initial focus was on keeping the project simple and aligned with the assignment. I decided that the first version should not depend on a backend, authentication, AI, or a database. The application could provide the required experience using a curated static dataset and local browser storage.

### Decisions

- Use Next.js with TypeScript.
- Use a static dataset for meals and ingredients.
- Keep user state in localStorage.
- Keep the recommendation logic deterministic.
- Avoid unnecessary backend infrastructure for the first version.
- Use vanilla CSS rather than introducing a utility CSS framework.

### Challenge

The main challenge was deciding how much functionality belonged in the first version. It would have been easy to keep adding features such as accounts, nutrition information, pricing, or AI recommendations.

### Solution

I kept the scope focused on the core experience:

**Choose ingredients → Get meal recommendations → View a meal → Add it to a weekly plan → Generate a grocery checklist.**

---

## Phase 2: Discovery Flow

I worked on the main discovery experience where users select ingredients they already have.

The interface was designed around ingredient search, category filtering, selected ingredient chips, and a preference selector.

The five ingredient categories were:

- All
- Staples & Grains
- Proteins
- Vegetables & Produce
- Oils & Seasonings

Users can search for ingredients, select multiple ingredients, remove individual selections, or clear all selections.

### Decisions

I wanted ingredient selection to represent the user's current search rather than becoming a permanent pantry inventory system.

This distinction was important because DishDash is intended to help a user make a meal decision. It is not intended to track household inventory.

### Challenge

I needed to make the selection state useful across the recommendation and grocery flows without introducing unnecessary application state.

### Solution

The selected ingredient IDs are stored in the shared user state and reused by the recommendation and grocery generation logic.

---

## Phase 3: Recommendation Engine

I implemented the recommendation engine as a pure, deterministic client-side function.

The engine supports three preferences:

- Quick & Easy
- Something Different
- No Preference

### Recommendation Rules

**Quick & Easy**

Only meals that take 30 minutes or less are eligible. Eligible meals are ranked by the number of selected ingredients they match.

**Something Different**

Meals already assigned to the weekly plan are excluded. The remaining meals are ranked according to ingredient matches.

**No Preference**

All meals are eligible and are ranked according to the number of selected ingredient matches.

The engine returns a maximum of three recommendations.

### Important Decision

I deliberately avoided random recommendations or artificial weighting.

When two meals have the same match count, their original position in the curated dataset determines their order. This keeps the recommendation system predictable and easy to test.

### Challenge

The recommendation system needed to handle situations where the user selected no ingredients or where no meals matched.

### Solution

I added explicit handling for both cases.

With zero selected ingredients, the system still returns eligible meals according to the selected preference without pretending that any ingredients matched.

When no meals match, the interface shows a dedicated no-match state instead of inventing results.

---

## Phase 4: Meal Details

I built the meal details experience using a dynamic `/meals/[id]` route.

Each meal displays:

- Meal name
- Description
- Category
- Cooking time
- Ingredients
- Ingredient availability
- Preparation steps
- Add to Weekly Plan action

### Decision

When a user arrives at a meal from the discovery flow, the application can show which ingredients they already selected and which ingredients they still need.

This makes the recommendation useful beyond simply telling the user what to cook.

### Challenge

I needed to make sure the interface did not incorrectly claim that the user had ingredients when they had not selected any.

### Solution

The meal page uses the active ingredient selection to partition ingredients only when there is an active selection. If there are no selected ingredients, it displays the normal ingredient list instead.

---

## Phase 5: Weekly Planner

I implemented the seven-day weekly planner.

Each day can contain one meal or remain empty.

Users can:

- Add a meal
- Replace a meal
- Remove a meal
- View meal details

### Decision

I kept the planner intentionally simple. Each day has one meal slot because multiple meals per day were outside the scope of the first version.

### Challenge

Replacing a planned meal could accidentally overwrite an existing selection.

### Solution

I added a replacement confirmation dialog. The user must explicitly confirm before an existing meal is replaced.

I also made the state update specific to the selected day so that changing one day cannot unintentionally modify the other six days.

---

## Phase 6: Grocery Checklist

I built the grocery checklist as a derived view of the weekly plan.

The grocery list is generated from the ingredients required by planned meals. Ingredients that are already present in the user's active ingredient selection are removed from the shopping list.

Shared ingredients are deduplicated so that the same ingredient does not appear multiple times.

The checklist also shows which planned meals require each ingredient.

### Decision

I chose to derive the grocery list instead of storing a separate permanent grocery list.

This means the grocery list always reflects the current weekly plan.

### Challenge

The grocery list needed to update when meals were added, removed, or replaced.

### Solution

The list is generated dynamically from the current weekly plan and available ingredients.

Checking an item only changes its purchased state. It does not modify the user's available ingredients or weekly plan.

---

## Phase 7: PWA and Offline Support

I added PWA support so the core DishDash experience could work offline.

The implementation included:

- Web app manifest
- Application icons
- Service worker
- Offline fallback page
- Client-side service worker registration

### Decision

Since the application does not depend on a backend for its core flows, offline support was a natural fit.

The meals and ingredients are static, while user state is stored locally in the browser.

### Challenge

Offline functionality needed to work without interfering with the normal application experience.

### Solution

The service worker uses cached application routes and assets, with network-first handling for navigation and cache fallback when the network is unavailable.

---

## Phase 8: UI Refinement

After the functional implementation was complete, I reviewed the interface visually and decided that the original presentation needed refinement.

One of the main changes was moving away from a typical desktop web application appearance.

### Design Direction

I wanted DishDash to feel more like a focused mobile product, even when accessed from a laptop.

Instead of creating a bulky phone mockup, I chose a simple narrow application frame with a white border. The goal was to suggest a phone-like interface without making the website look like a literal device mockup.

I also changed the typography to **Geist** because it has a smoother, cleaner appearance that better suited the direction I wanted for the product.

### Design Reference

I used a Dribbble design as visual inspiration for the overall concept and presentation. The goal was not to copy the design, but to use the reference to guide the visual treatment of the application.

### Challenge

The application already had working functionality, so the challenge was improving the visual presentation without changing the core product behavior.

### Solution

I focused the refinement on:

- Typography
- Content width
- Application framing
- Spacing
- Visual hierarchy
- Mobile-first presentation
- Simplifying the frame instead of using a decorative phone mockup

The result keeps the application functional while giving it a more intentional product identity.

---

## Phase 9: Accessibility and QA

I completed a final accessibility and quality review across the application.

### Accessibility Checks

I verified:

- Semantic HTML
- Keyboard navigation
- Accessible modal behavior
- Escape key handling
- Accessible labels
- Focus indicators
- Screen reader status announcements
- Non-color indicators for interactive states

Interactive elements such as ingredient selections and grocery checklist items use accessible state attributes and visual indicators.

### Responsive Checks

I reviewed the application across mobile, tablet, and desktop widths.

The layout was tested from approximately 320px through 1440px to check for:

- Horizontal overflow
- Navigation overlap
- Modal layout issues
- Content width problems
- Responsive spacing

### State Persistence

I also tested localStorage persistence and recovery from invalid or corrupted stored data.

The application falls back to a valid initial state instead of crashing when stored data cannot be used.

---

## Testing Summary

The final implementation included automated tests for:

- Data integrity
- Recommendation logic
- Weekly planner operations
- Grocery generation
- PWA functionality
- End-to-end user journeys

The final test run contained **74 automated test assertions**, all of which passed.

### Results

- Data Integrity: Passed
- Recommendation Engine: 18/18 passed
- Weekly Planner: 14/14 passed
- Grocery Generator: 12/12 passed
- PWA & Offline: 15/15 passed
- End-to-End: 15/15 passed

TypeScript compilation also completed without errors, and the production build completed successfully.

---

## Final Reflection

The biggest lesson from building DishDash was that a simple product does not need a complicated technical architecture.

The core experience could be built with a curated dataset, deterministic client-side logic, and local persistence. Keeping the scope controlled made it possible to spend more time refining the actual user experience instead of building infrastructure that the product did not need.

Another important lesson was the value of separating product decisions from implementation decisions. For example, deciding that DishDash is not a pantry management system helped prevent features such as stock counts, expiration dates, and inventory tracking from gradually changing the product into something different.

The final product focuses on one clear journey:

**Help a user decide what to cook, plan it for the week, and know what they need to buy.**

That simplicity was intentional.


# Week 4 — Testing the DishDash Assumption

## What I Worked On

After completing the first version of DishDash, I wanted to test some of the assumptions behind the product rather than immediately continuing to add features.

The original DishDash experience was designed around helping people decide what to cook based on the ingredients they already have.

This week, I collected responses from seven people about how they actually decide what to cook, what makes the decision difficult, and what they do when they cannot decide.

## What I Learned

The responses showed that deciding what to cook is influenced by more than just the ingredients available at home.

People mentioned several factors, including:

- What ingredients they already have
- What they are currently craving
- Their mood
- Their budget
- How much time they have
- How much energy they have to cook
- The preferences of other people in their household
- Whether they already have a meal plan

One thing that stood out to me was that having ingredients available does not necessarily mean someone will cook.

Some respondents described situations where they had food at home but still decided to order food, eat out, or prepare something else because they were tired or did not feel like eating what they had.

I also found that some people already use systems to make the decision easier, such as meal timetables or written plans.

## What Changed in My Thinking

When I first started DishDash, I was primarily thinking about the problem as:

> "I have ingredients. What can I make with them?"

The conversations made me realise that this is only one way people approach the meal decision.

Someone might instead start with:

> "What do I feel like eating?"

Or:

> "What can I make without spending much?"

Or:

> "What can I make quickly because I am tired?"

This means I need to be more careful about assuming that ingredients are always the user's starting point.

## What I Chose

I chose to investigate the meal-decision problem further before adding more features to DishDash.

Rather than immediately adding things such as budgeting, pantry management, ingredient pricing, or AI recommendations, I want to understand which part of the problem is most valuable for DishDash to solve first.

## What I Parked

For now, I am parking:

- Budget tracking
- Ingredient price tracking
- Pantry inventory
- Nutrition tracking
- AI-based recommendations
- Grocery delivery

These are possible directions, but the research so far is not enough for me to justify adding them to the product.

## Next Step

The next step is to use what I learned from the conversations to reconsider the DishDash experience and determine whether the current ingredient-first approach still makes sense.

Any changes I make should be based on what I have learned rather than simply adding more functionality.

# DishDash Project Journal

A chronological record of the decisions, experiments, changes, and lessons from building DishDash.

---

# Week 4 — Testing the DishDash Assumption

## What I Worked On

After completing the first version of DishDash, I wanted to test some of the assumptions behind the product rather than immediately continuing to add features.

The original DishDash experience was designed around helping people decide what to cook based on the ingredients they already have.

This week, I collected responses from seven people about how they actually decide what to cook, what makes the decision difficult, and what they do when they cannot decide.

## What I Learned

The responses showed that deciding what to cook is influenced by more than just the ingredients available at home.

People mentioned several factors, including:

- What ingredients they already have
- What they are currently craving
- Their mood
- Their budget
- How much time they have
- How much energy they have to cook
- The preferences of other people in their household
- Whether they already have a meal plan

One thing that stood out to me was that having ingredients available does not necessarily mean someone will cook.

Some respondents described situations where they had food at home but still decided to order food, eat out, or prepare something else because they were tired or did not feel like eating what they had.

I also found that some people already use systems to make the decision easier, such as meal timetables or written plans.

## What Changed in My Thinking

When I first started DishDash, I was primarily thinking about the problem as:

> "I have ingredients. What can I make with them?"

The conversations made me realise that this is only one way people approach the meal decision.

Someone might instead start with:

> "What do I feel like eating?"

Or:

> "What can I make without spending much?"

Or:

> "What can I make quickly because I am tired?"

This means I need to be more careful about assuming that ingredients are always the user's starting point.

## What I Chose

I chose to investigate the meal-decision problem further before adding more features to DishDash.

Rather than immediately adding things such as budgeting, pantry management, ingredient pricing, or AI recommendations, I want to understand which part of the problem is most valuable for DishDash to solve first.

## What I Parked

For now, I am parking:

- Budget tracking
- Ingredient price tracking
- Pantry inventory
- Nutrition tracking
- AI-based recommendations
- Grocery delivery

These are possible directions, but the research so far is not enough for me to justify adding them to the product.

## Next Step

The next step is to use what I learned from the conversations to reconsider the DishDash experience and determine whether the current ingredient-first approach still makes sense.

Any changes I make should be based on what I have learned rather than simply adding more functionality.

---

# Reworking the Meal Decision Flow

## What I Worked On

Based on the customer responses, I revisited the first step of the DishDash experience.

The original flow asked users to select the ingredients they had at home first and then choose a meal preference.

The research made me question whether ingredients should always be the starting point.

I decided to test a different approach where the user first describes what they are in the mood for and then selects the ingredients they have available.

## The Change

The new flow starts with:

**1. What are you in the mood for?**

Users can choose from:

- Something spicy
- Something filling
- Something quick
- Something sweet
- Surprise me

The user can then continue to:

**2. What ingredients do you have?**

This keeps ingredients as an important part of the recommendation, while recognising that the user's motivation for cooking can come from somewhere else.

## Why I Made This Change

The questionnaire showed that people do not always begin the meal decision with their available ingredients.

Some people start with a craving, while others consider their mood, budget, available time, or energy.

The new flow allows DishDash to capture that intention before asking about ingredients.

I also noticed a usability issue with the previous design.

The meal preference was already available on the homepage, but it appeared after the ingredient selection. Because of its position, users could easily focus on the ingredients and forget that they had selected a preference.

Moving the preference to the beginning makes it a more visible part of the decision-making process.

## What I Chose Not to Change

I am not introducing free-text meal requests or AI recommendations yet.

For example, users are not currently asked to type something like:

> "I want something spicy."

Instead, the first version uses a small set of predefined preferences.

This keeps the recommendation logic simpler while allowing me to test whether preference-based recommendations are useful in the first place.

Free-text input and AI recommendations can be explored later if the product needs a more flexible way to understand what someone wants.

## Current Flow

The updated experience is now:

**Choose what you are in the mood for → Select ingredients → Find meals → Review recommendations**

This is the version I will continue testing before introducing additional functionality.

## What I Learned

The main lesson from this iteration is that the product should not assume that the user's available ingredients are the beginning of the meal decision.

Ingredients answer:

> "What can I make?"

But the user's preference can answer:

> "What do I actually want right now?"

DishDash now tries to capture both.

## Next Step

I will continue testing the updated flow and observe whether starting with the user's preference produces recommendations that feel more relevant.

The next changes should continue to come from what I learn from users rather than from adding features simply because they are technically possible.

---

# Week 5 — Improving Recommendations, Meal Coverage, and Weekly Planning

## What I Worked On

After testing the updated preference-first discovery flow, I continued improving DishDash based on the product direction that came out of the earlier research.

This iteration focused on three areas:

- Making recommendations more useful
- Expanding the meal library
- Making the weekly planner support more realistic eating patterns

## Improving the Recommendation Engine

The first recommendation engine relied heavily on ingredient-match counts. While this made the logic simple and predictable, it was not enough to consistently produce recommendations that felt like good matches.

I decided to move to a multi-factor scoring approach rather than adding randomness or introducing AI.

The new scoring model considers:

- Preference fit: 35%
- Ingredient coverage: 30%
- Missing ingredients: 15%
- Time and effort: 10%
- Weekly variety: 10%

Ingredient coverage is calculated proportionally so that a meal that matches most of its ingredients can rank appropriately rather than simply rewarding meals with more total ingredients.

The recommendation system also considers what the user has already planned during the week. This helps reduce unnecessary repetition.

### Recommendation Output

I increased the recommendation limit from three to up to five meals.

The first three recommendations can have distinct roles:

- Best Match
- Easiest Option
- Wildcard

The fourth and fifth recommendations are additional relevant options rather than filler. If there are not enough suitable meals, the system can return fewer than five.

### Why I Made This Change

The goal was to make the recommendation system feel more useful without making it a black box.

I wanted the system to consider more of the actual decision instead of treating ingredient count as the main signal. Keeping the system deterministic also means the results remain predictable and testable.

## Expanding the Meal Library

I also expanded the meal library.

One observation that influenced this decision was that the foods people describe as everyday Nigerian meals are not limited to traditional dishes. People also commonly eat simple combinations, improvised meals, and modern or globally influenced foods.

Examples include things such as cabbage stew, spaghetti with egg sauce, noodles, shawarma, wraps, loaded fries, pasta dishes, and simple bread-and-egg combinations.

### What I Chose

I kept the existing meals and expanded the collection with more everyday meals that reflect the broader range of what people might actually consider when deciding what to eat.

The library now contains 95 meals.

The intention is not to turn DishDash into a traditional Nigerian recipe app. The product is focused on helping someone answer:

> "What can I eat today?"

A broader meal library makes that question more realistic for the people DishDash is trying to serve.

## Expanding the Weekly Planner

The original planner supported one meal per day.

I decided to change this because a weekly plan does not necessarily mean one eating occasion per day. A person may want to plan breakfast, lunch, dinner, and a snack.

The planner now has four named slots for each day:

- Breakfast
- Lunch
- Dinner
- Snack

This creates up to 28 possible meal slots across a seven-day week.

### Important Implementation Decision

The slots are independent.

Adding or replacing a breakfast meal should not overwrite lunch, dinner, or snack for the same day. Removing one slot should also leave the other planned meals unchanged.

Existing single-meal plans are migrated into an appropriate slot rather than being discarded.

## Updating the Grocery Flow

The grocery generator was updated to consider all meals across all four daily slots.

The grocery list still derives its ingredients from the weekly plan, removes ingredients the user already has, and deduplicates shared ingredients.

This means the grocery list remains connected to the complete weekly plan rather than only considering one meal per day.

## What I Learned

The main lesson from this iteration was that improving a product does not always mean adding a completely new feature.

The recommendation engine needed better reasoning, the meal library needed to better represent the user's reality, and the planner needed to reflect how people actually structure a week of eating.

These changes all strengthen the same core experience:

**Help a user decide what to cook, plan it for the week, and know what they need to buy.**

## Validation

After the recommendation, meal-library, and planner changes, I updated the relevant validation and test coverage to reflect the new product behavior.

The recommendation tests now account for the multi-factor scoring approach and the expanded recommendation output. Planner and grocery behavior also account for multiple meal slots per day.

The existing TypeScript and production build checks remain part of the validation process.
