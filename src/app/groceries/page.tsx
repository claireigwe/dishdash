"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useUserState } from "@/hooks/useUserState";
import { generateGroceryList } from "@/lib/groceryGenerator";
import { GroceryItemRow } from "@/components/groceries/GroceryItemRow";
import { GroceryItem } from "@/types/planner";

const CATEGORY_ORDER = [
  "Staples & Grains",
  "Proteins",
  "Vegetables & Produce",
  "Oils & Seasonings",
] as const;

export default function GroceriesPage() {
  const {
    weeklyPlan,
    availableIngredientIds,
    purchasedGroceryItemIds,
    toggleGroceryItem,
    isLoaded,
  } = useUserState();

  // Derive grocery list pure & dynamically
  const groceryItems = useMemo(() => {
    return generateGroceryList({
      weeklyPlan,
      availableIngredientIds,
      purchasedGroceryItemIds,
    });
  }, [weeklyPlan, availableIngredientIds, purchasedGroceryItemIds]);

  // Count planned meals
  const plannedMealsCount = useMemo(() => {
    if (!weeklyPlan || !Array.isArray(weeklyPlan.days)) return 0;
    return weeklyPlan.days.filter(
      (d) => typeof d.mealId === "string" && d.mealId.length > 0
    ).length;
  }, [weeklyPlan]);

  // Count checked items
  const purchasedCount = useMemo(() => {
    return groceryItems.filter((item) => item.isPurchased).length;
  }, [groceryItems]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, []);
    }

    for (const item of groceryItems) {
      const cat = item.category || "Oils & Seasonings";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    }

    return map;
  }, [groceryItems]);

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <p>Loading grocery checklist...</p>
      </div>
    );
  }

  // STATE A: No meals planned in the 7-day schedule
  if (plannedMealsCount === 0) {
    return (
      <div className="groceries-container">
        <header className="groceries-header">
          <h1 className="groceries-title">Grocery List</h1>
          <p className="groceries-subtitle">
            Derived from meals in your weekly plan minus what you already have.
          </p>
        </header>

        <div className="grocery-empty-card card" role="region" aria-label="Empty grocery list">
          <div className="grocery-empty-icon" aria-hidden="true">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="empty-card-title">Your grocery list is empty</h2>
          <p className="empty-card-desc">
            Plan some meals for the week and we'll build your grocery list automatically.
          </p>
          <Link href="/planner" className="btn btn-primary btn-block">
            Plan Your Week
          </Link>
        </div>
      </div>
    );
  }

  // STATE B: Meals are planned, but 0 ingredients needed (user already has all required items in search selection)
  if (groceryItems.length === 0) {
    return (
      <div className="groceries-container">
        <header className="groceries-header">
          <div className="groceries-header-top">
            <h1 className="groceries-title">Grocery List</h1>
            <span className="results-count-badge">0 Items Needed</span>
          </div>
          <p className="groceries-subtitle">
            Derived from {plannedMealsCount} planned meal{plannedMealsCount > 1 ? "s" : ""}.
          </p>
        </header>

        <div className="grocery-all-set-card card" role="region" aria-label="All ingredients available">
          <div className="grocery-success-icon" aria-hidden="true">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="empty-card-title">You're all set!</h2>
          <p className="empty-card-desc">
            You already have everything needed for your {plannedMealsCount} planned meal{plannedMealsCount > 1 ? "s" : ""}.
          </p>
          <div className="all-set-actions">
            <Link href="/planner" className="btn btn-primary btn-block">
              View Weekly Plan
            </Link>
            <Link href="/" className="btn btn-secondary btn-block">
              Adjust Available Ingredients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STATE C: Active grocery checklist
  return (
    <div className="groceries-container">
      {/* Page Header */}
      <header className="groceries-header">
        <div className="groceries-header-top">
          <h1 className="groceries-title">Grocery List</h1>
          <span className="results-count-badge">
            {purchasedCount} of {groceryItems.length} Checked
          </span>
        </div>
        <p className="groceries-subtitle">
          Based on {plannedMealsCount} planned meal{plannedMealsCount > 1 ? "s" : ""} minus your selected ingredients.
        </p>
      </header>

      {/* Progress Summary Bar */}
      <div className="grocery-progress-banner card">
        <div className="progress-info">
          <span className="progress-label">Shopping Progress</span>
          <span className="progress-numbers">
            {purchasedCount} / {groceryItems.length} items
          </span>
        </div>
        <div className="progress-bar-track" aria-hidden="true">
          <div
            className="progress-bar-fill"
            style={{
              width: `${(purchasedCount / groceryItems.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Categorized Grocery Checklist */}
      <div className="grocery-categories-list" role="feed" aria-label="Categorized grocery checklist">
        {CATEGORY_ORDER.map((category) => {
          const items = groupedItems.get(category) || [];
          if (items.length === 0) return null;

          const catPurchased = items.filter((i) => i.isPurchased).length;

          return (
            <section
              key={category}
              className="grocery-category-section card"
              aria-labelledby={`cat-heading-${category}`}
            >
              <div className="category-header-row">
                <h2 id={`cat-heading-${category}`} className="category-section-title">
                  {category}
                </h2>
                <span className="category-count-badge">
                  {catPurchased}/{items.length}
                </span>
              </div>

              <div className="grocery-items-group" role="group" aria-label={`${category} items`}>
                {items.map((item) => (
                  <GroceryItemRow
                    key={item.ingredientId}
                    item={item}
                    onToggle={toggleGroceryItem}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
