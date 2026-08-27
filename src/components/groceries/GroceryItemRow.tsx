"use client";

import React from "react";
import { GroceryItem } from "@/types/planner";

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (ingredientId: string) => void;
}

export function GroceryItemRow({ item, onToggle }: GroceryItemRowProps) {
  const isChecked = item.isPurchased;
  const neededForMeals =
    item.requiredByMealNames && item.requiredByMealNames.length > 0
      ? item.requiredByMealNames.join(", ")
      : "Planned meals";

  return (
    <div
      className={`grocery-item-row ${isChecked ? "item-purchased" : ""}`}
      onClick={() => onToggle(item.ingredientId)}
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(item.ingredientId);
        }
      }}
      aria-label={`${item.ingredientName}. Needed for: ${neededForMeals}. ${
        isChecked ? "Checked off" : "Not checked"
      }`}
    >
      {/* Checkbox indicator */}
      <div
        className={`grocery-checkbox ${isChecked ? "checked" : ""}`}
        aria-hidden="true"
      >
        {isChecked && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Item info */}
      <div className="grocery-item-content">
        <span className={`grocery-item-name ${isChecked ? "name-strikethrough" : ""}`}>
          {item.ingredientName}
        </span>
        <span className="grocery-item-meals">
          Needed for: <strong>{neededForMeals}</strong>
        </span>
      </div>
    </div>
  );
}
