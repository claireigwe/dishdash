# Product Requirements Document: Meal Decision and Planning PWA

## 1. Product Summary

A mobile-first Progressive Web App (PWA) for people who live alone and prepare their own meals.

The product helps users answer one recurring question:

> **What should I cook today?**

Users tell the app which ingredients they have and, optionally, what they are looking for. The app recommends a small number of Nigerian meals that match their situation.

Users can then save meals to a weekly plan. The plan can generate a simple grocery list containing ingredients needed for planned meals that the user does not already have.

V1 uses a fixed Nigerian meal library and simple rule-based matching. It does not use AI.

The product is designed to reduce the mental effort of deciding what to cook. It is not a general recipe platform, nutrition app, budgeting app, or grocery marketplace.

---

## 2. Problem Statement

People who live alone often have to decide what to cook every day.

Many can cook and may already have ingredients at home, but they repeatedly fall back on familiar meals because deciding what else to make takes effort.

This creates three related problems:

1. **Meal decision fatigue:** the user has to repeatedly figure out what to cook.
2. **Repetition:** the user keeps returning to the same familiar meals.
3. **Poor planning:** the user may have ingredients at home without knowing how to use them across the week.

The primary problem V1 addresses is:

> **I have to figure out what to cook again, and I keep falling back on the same meals.**

Meal planning and grocery lists support this primary problem. They are not separate product goals.

---

## 3. Product Goals

### Primary goal

Make it easier for a person living alone to decide what to cook.

### Secondary goals

- Help users discover Nigerian meals they may not have considered.
- Help users avoid repeatedly making the same meals.
- Reduce the daily effort of deciding what to cook by allowing users to plan meals ahead.
- Make grocery planning easier from the meals already selected.

### Product hypothesis

If users can quickly describe what ingredients they have and what kind of meal they want, then a small set of relevant meal suggestions will help them make a cooking decision with less effort than starting from a large recipe library.

---

## 4. Target Users and Persona

### Initial target user

A person who:

- Lives alone.
- Regularly prepares their own meals.
- Has basic cooking ability.
- Is familiar with Nigerian food.
- Gets tired of eating the same meals.
- Sometimes has ingredients available but does not know what to make.
- Wants to spend less mental effort deciding what to cook.

### Primary persona

**The Solo Home Cook**

They are capable of preparing everyday meals but do not want to spend time deciding what to cook. They may have several ingredients available, but opening a recipe website with hundreds of choices can create more work rather than solving the decision.

V1 is not designed for families or people planning meals for multiple people.

---

## 5. User Goals and Core Jobs

### Core job

> When I need to decide what to cook, help me find a meal I would actually want to make using what I already have.

### Supporting jobs

- Find something to cook from ingredients already available.
- Find something different from meals I usually make.
- Find a meal that does not require much time or effort.
- Decide what to cook for the next few days.
- Know which ingredients I need to buy for planned meals.

The product should help the user make a decision. It should not encourage endless recipe browsing.

---

## 6. User Flows

### Flow 1: Find a meal

1. User opens the app.
2. User selects ingredients they currently have.
3. User optionally selects a preference:
   - Quick and easy
   - Something different
   - No preference
4. User selects **Find meals**.
5. The system evaluates the meal library.
6. The system displays up to five recommended meals.
7. User selects a meal.
8. User views the meal details.
9. User can add the meal to the weekly plan.

### Flow 2: View a meal

1. User selects a recommended meal.
2. The app displays:
   - Meal name
   - Ingredients
   - Preparation instructions
   - Cooking time
   - Meal category
3. User can add the meal to a day in the weekly plan.

### Flow 3: Plan a meal

1. User opens the weekly planner.
2. User selects a day.
3. User adds a meal to that day.
4. The meal appears in the weekly plan.
5. User can change or remove the meal.

V1 supports one planned meal per day.

### Flow 4: Generate grocery list

1. User has meals in the weekly plan.
2. User opens the grocery list.
3. The app collects the ingredients required by those meals.
4. The app removes ingredients the user has marked as already available.
5. The remaining ingredients appear as the grocery list.
6. User can mark grocery items as purchased.

---

## 7. MVP Scope

### Included

- Mobile-first PWA.
- Nigerian meal library.
- Ingredient selection.
- Simple meal preferences.
- Rule-based meal recommendations.
- Meal details.
- Meal selection.
- Seven-day meal planner.
- One planned meal per day.
- Grocery list generated from planned meals.
- Ability to mark ingredients as already available.
- Ability to mark grocery items as purchased.
- Local persistence of user data.
- Basic offline access after the app has loaded and cached its data.

### Meal library

V1 should contain approximately 40 to 60 Nigerian meals.

Every meal should have structured data for:

- Name
- Ingredients
- Preparation instructions
- Cooking time
- Meal category
- Preference attributes
- A stable unique identifier

The meal library is application data created for the product. Users do not create recipes in V1.

---

## 8. Out of Scope

V1 does not include:

- AI-generated recommendations.
- AI-generated recipes.
- Food prices.
- Cost calculations.
- Budget tracking.
- Real-time grocery prices.
- Grocery delivery.
- Online grocery shopping.
- Calorie tracking.
- Macro tracking.
- Medical nutrition advice.
- Social features.
- User-generated recipes.
- Advanced personalisation.
- Notifications.
- Accounts.
- Authentication.
- Payments.
- Multi-person meal planning.
- Complex dietary or medical filtering.
- A large recipe browsing catalogue as the primary experience.

---

## 9. Functional Requirements

### 9.1 Ingredient Selection

**FR-01:** The user must be able to select ingredients they currently have.

**FR-02:** The ingredient selector must support search so the user does not need to scroll through the entire ingredient list.

**FR-03:** The user must be able to remove a selected ingredient before requesting recommendations.

**FR-04:** The system must allow the user to continue without selecting an ingredient if they want recommendations based only on their preference.

**FR-05:** The system must prevent duplicate ingredient selections.

### 9.2 Preferences

**FR-06:** The user may select one preference before requesting recommendations.

Available preferences:

- Quick and easy
- Something different
- No preference

**FR-07:** The user must be able to request recommendations without selecting a preference.

### 9.3 Recommendations

**FR-08:** The system must evaluate the selected ingredients and preference against the meal library.

**FR-09:** The system must return no more than five recommendations in the initial results.

**FR-10:** Each recommendation must show enough information for the user to decide whether to open it, including meal name, cooking time, category, and ingredient match information.

**FR-11:** Recommendations must be ranked by the defined recommendation logic in Section 10.

**FR-12:** If no meal is a strong match, the system must still provide useful alternatives where possible and clearly indicate that the matches are weaker.

**FR-13:** If no meals can reasonably be recommended, the system must tell the user that no suitable match was found and allow them to change their ingredients or preference.

### 9.4 Meal Details

**FR-14:** The meal detail screen must display the meal name, ingredients, preparation instructions, cooking time, and category.

**FR-15:** The user must be able to add a meal to a selected day in the weekly plan.

### 9.5 Weekly Planner

**FR-16:** The planner must display seven days.

**FR-17:** The user must be able to add one meal to each day.

**FR-18:** The user must be able to replace a planned meal.

**FR-19:** The user must be able to remove a planned meal.

**FR-20:** The planner must persist across app sessions on the same device.

### 9.6 Grocery List

**FR-21:** The system must generate a grocery list from the ingredients of meals in the weekly plan.

**FR-22:** If the same ingredient appears in multiple planned meals, it must appear once in the grocery list.

**FR-23:** The user must be able to mark an ingredient as already available.

**FR-24:** Ingredients marked as already available must be excluded from the active grocery list.

**FR-25:** The user must be able to mark grocery items as purchased.

**FR-26:** The grocery list must not attempt to calculate prices or quantities in V1.

---

## 10. Meal Data and Recommendation Logic

### 10.1 Meal data

Each meal should contain:

- `id`
- `name`
- `ingredients`
- `instructions`
- `cookingTime`
- `category`
- `isQuick`
- `categoryTags`

The meal library should use a consistent ingredient naming system so that matching works reliably.

### 10.2 Ingredient matching

For each meal, the system calculates how many of the user's selected ingredients are present in the meal.

The basic ingredient match score is:

> Number of selected ingredients found in the meal.

A meal containing four of the user's five selected ingredients therefore ranks above a meal containing one of those ingredients, all else being equal.

The system must not require every ingredient in a meal to be selected before showing it.

### 10.3 Preference matching

#### Quick and easy

A meal qualifies as quick when its defined cooking time is **30 minutes or less**.

When the user selects Quick and easy, qualifying meals receive a ranking boost.

#### Something different

V1 defines "different" using meal categories.

When the user selects Something different, the system should rank meals from categories that are less represented in the user's current weekly plan above meals from categories already heavily represented in that plan.

If the user has no existing weekly plan, the system should prioritise variety across categories rather than repeating the same category in the first five results.

This does not attempt to learn long-term user preferences.

#### No preference

The system ranks meals primarily by ingredient match.

### 10.4 Recommendation ranking

The system should rank meals using these priorities:

1. Strong ingredient match.
2. Preference match.
3. Variety when Something different is selected.
4. Shorter cooking time as a tie-breaker.
5. Stable meal ordering as the final tie-breaker.

The exact internal scoring method may use simple integer weights, but it must preserve these priorities.

The recommendation system must be deterministic. The same inputs should produce the same ranking.

### 10.5 Weak and empty matches

If the user has selected ingredients but no meal contains at least one of them, the system should tell the user that none of the selected ingredients matched the meal library and suggest changing the ingredients.

The system must not pretend a meal is a match when it contains none of the selected ingredients.

---

## 11. Weekly Meal Planning Requirements

The planner exists to reduce repeated daily decision-making.

### Planner behaviour

- Display the current seven-day planning period.
- Allow one meal per day.
- Allow the user to add a meal from recommendations or meal details.
- Allow replacement of a planned meal.
- Allow removal of a planned meal.
- Preserve planned meals when the user closes and reopens the app.

The planner does not need:

- Multiple meals per day.
- Breakfast/lunch/dinner categories.
- Automatic meal scheduling.
- Nutrition calculations.
- Calendar integrations.

---

## 12. Grocery List Requirements

The grocery list is generated from the weekly plan.

For each planned meal:

1. Read its ingredient list.
2. Add each ingredient to the grocery list.
3. Merge duplicate ingredients.
4. Remove ingredients the user has marked as already available.
5. Display the remaining ingredients.

V1 does not calculate quantities or prices.

If an ingredient is needed by multiple meals, it still appears only once.

If the user removes a meal from the weekly plan, the grocery list must update to reflect the remaining planned meals.

If the user marks an ingredient as already available, it should no longer appear in the active shopping list.

---

## 13. PWA Requirements

The product must be installable as a PWA.

### Required behaviour

- Provide a valid web app manifest.
- Provide an appropriate app name and icon.
- Use a service worker or equivalent PWA mechanism to support basic caching.
- The app shell and meal library should remain available after they have been cached.
- User data stored locally should remain available when the app is reopened.
- The core meal discovery experience should work without a network connection after the required assets and data have been cached.

V1 does not require synchronisation across devices.

If the user clears browser storage or removes the app data, locally stored information may be lost.

---

## 14. Technical Requirements

### Recommended stack

- Next.js
- TypeScript
- CSS
- PWA support
- Browser local storage or IndexedDB for local user data

### Architecture

V1 should be a client-focused application with no backend.

The meal library can be stored as structured static application data.

User-generated state should be stored locally on the device.

No database server is required.

No API is required for the core product.

No authentication is required.

No AI service is required.

### Technical principle

Use the simplest architecture that can support the defined MVP.

Do not add a backend, database, authentication system, API, or external service unless a requirement in this PRD makes it necessary.

---

## 15. Data Model

### Meal

```text
Meal
- id
- name
- ingredients[]
- instructions[]
- cookingTime
- category
- isQuick
- categoryTags[]
```

### Ingredient

```text
Ingredient
- id
- name
```

### Weekly Plan

```text
WeeklyPlan
- weekStartDate
- days[]
```

Each day contains:

```text
DayPlan
- date
- mealId
```

### User State

```text
UserState
- availableIngredients[]
- weeklyPlan
- purchasedGroceryItems[]
```

The user state is stored locally.

There is no server-side user record in V1.

---

## 16. Accessibility Requirements

The app must:

- Use semantic HTML where appropriate.
- Provide accessible labels for interactive controls.
- Ensure interactive elements can be reached using a keyboard.
- Provide visible focus states.
- Maintain sufficient text and interface contrast.
- Avoid communicating information through colour alone.
- Use appropriate heading hierarchy.
- Provide meaningful labels for form controls.
- Ensure selected ingredients and selected preferences have a clear non-colour indication.
- Make important status changes understandable to assistive technology where practical.

The interface should remain usable when text is increased.

---

## 17. Performance Requirements

The MVP should:

- Load the initial app quickly on a normal mobile connection.
- Avoid unnecessary external requests.
- Keep the meal library lightweight.
- Avoid loading large assets that do not support the core experience.
- Perform recommendation matching locally without noticeable delay.
- Avoid unnecessary third-party libraries.

The recommendation process should not depend on a remote API.

---

## 18. Security and Privacy Considerations

V1 stores user data locally on the user's device.

The product should not collect or transmit personal information because accounts and backend services are not required.

The app should not request unnecessary permissions.

The product should clearly communicate that locally stored plans and ingredient information may be lost if the user clears the app's browser data.

---

## 19. Success Metrics

### Primary success metric

**Meal planning decision rate**

The percentage of recommendation sessions that result in the user selecting a meal and adding it to their weekly plan.

This measures whether the recommendation experience helps the user make a decision.

### Supporting metrics

**Recommendation engagement**

Percentage of recommendation sessions where the user opens at least one recommended meal.

**Recommendation-to-plan rate**

Percentage of opened meal details that result in the meal being added to the weekly plan.

**Planning completion**

Percentage of active users who add meals to at least three different days in a seven-day plan.

**Repeat usage**

Percentage of users who return to the app to make another meal decision during the test period.

### Qualitative validation

During MVP testing, ask users:

- Did the recommendations help you decide what to cook?
- Did you find something you would actually make?
- Did the ingredient selection feel easy?
- Did the app reduce the effort of deciding what to cook?
- What would you normally do instead?

The primary question is whether the product makes the cooking decision easier, not whether users browse many recipes.

---

## 20. Risks and Mitigations

### Risk 1: The meal library is too small

Users may quickly exhaust the available options.

**Mitigation:** Start with approximately 40 to 60 meals and ensure the library covers several Nigerian meal categories.

### Risk 2: Recommendations are poor

Users may select ingredients that produce weak matches.

**Mitigation:** Use structured meal data and deterministic matching rules. Test recommendations with common ingredient combinations before release.

### Risk 3: Ingredient selection creates friction

Users may find it annoying to search for many ingredients.

**Mitigation:** Use searchable ingredient selection and allow the user to proceed without selecting ingredients.

### Risk 4: The product becomes another recipe catalogue

Users may browse instead of making decisions.

**Mitigation:** Keep recommendations limited to five results and make the main entry point the decision flow rather than a large recipe library.

### Risk 5: "Something different" is not meaningful

Category-based variety may not always reflect what a user considers different.

**Mitigation:** Keep the V1 definition simple and validate it with real users. Do not introduce long-term personalisation until there is evidence that it is needed.

### Risk 6: Offline behaviour becomes technically complex

PWA caching may introduce unnecessary development work.

**Mitigation:** Limit offline requirements to cached application assets, meal data, and locally stored user state.

### Risk 7: Users expect quantities in the grocery list

The grocery list may be less useful without quantities.

**Mitigation:** Clearly treat V1 as a simple ingredient checklist. Quantities can be considered only after the core product is validated.

---

## 21. Open Questions

### Question 1
How many meals are needed before users feel the library offers enough variety?

**Why it matters:** A small library may limit the product's ability to solve repetition.

**Decision needed:** Validate the initial 40 to 60 meal target through testing.

### Question 2
Do users prefer selecting individual ingredients or choosing from broader ingredient groups?

**Why it matters:** Ingredient entry may become the largest source of friction.

**Decision needed:** Test the ingredient selection interface with real users.

### Question 3
Does category-based "Something different" actually produce meals users perceive as different?

**Why it matters:** The product's core problem includes meal repetition.

**Decision needed:** Validate the definition before adding more complex personalisation.

### Question 4
Should meal quantities be added in a future version?

**Why it matters:** Quantities would make the grocery list more useful but add data and calculation complexity.

**Decision needed:** Base the decision on user feedback from V1.

---

## 22. Assumptions and Decisions

### Decision 1: V1 focuses on Nigerian meals

**Why:** The initial product is intended for users familiar with Nigerian food, and a focused meal library is easier to structure and test.

**What could change it:** User research may show a need for meals from other cuisines.

### Decision 2: Cost is excluded

**Why:** Food prices change by location and time. Supporting cost estimates would require additional data and introduce unnecessary complexity.

**What could change it:** Strong user demand for budgeting may justify a later version.

### Decision 3: AI is excluded

**Why:** The MVP needs to test whether structured recommendations solve the core decision problem. AI is not necessary for that test.

**What could change it:** Testing may show that rule-based recommendations cannot provide useful enough variety.

### Decision 4: No accounts or backend

**Why:** V1 does not require cross-device synchronisation or server-side user data.

**What could change it:** Features such as accounts, synchronisation, analytics requiring server-side storage, or shared plans could require a backend later.

### Decision 5: Local storage is used for user state

**Why:** It is sufficient for the MVP and avoids unnecessary infrastructure.

**What could change it:** Cross-device access or server-side persistence becomes a product requirement.

### Decision 6: One meal per day

**Why:** It keeps the planner simple and directly tests whether planning reduces repeated decision-making.

**What could change it:** Users may need multiple meals per day after V1 testing.

### Assumption 1: The target user is comfortable with basic cooking

**Why:** The product is intended to reduce meal decision effort rather than teach cooking from scratch.

**What could change it:** Research may show that users need more preparation guidance.

### Assumption 2: Users can identify the ingredients they currently have

**Why:** Ingredient-based recommendations depend on the user providing useful input.

**What could change it:** Testing may show that ingredient selection is too much work.

### Assumption 3: Category-based variety is a reasonable first definition of "different"

**Why:** It provides a simple rule-based method without requiring long-term personalisation.

**What could change it:** User testing may show that category differences do not match user expectations.

---

# MVP Definition

V1 is a mobile-first PWA that helps people who live alone decide what Nigerian meal to cook.

The user tells the app what ingredients they have and can select either "Quick and easy," "Something different," or no preference. The app compares that information against a fixed library of Nigerian meals and returns up to five ranked recommendations. The user can open a meal, read its instructions, and add it to a seven-day plan.

The weekly planner reduces the need to make the same decision every day. The grocery list is generated from planned meals and removes ingredients the user already has. User state is stored locally on the device.

V1 deliberately does not include AI, accounts, a backend, food prices, budgeting, nutrition tracking, social features, notifications, grocery delivery, or advanced personalisation. The purpose of V1 is to test one thing: **whether a focused recommendation experience can make deciding what to cook easier for someone who lives alone.**
