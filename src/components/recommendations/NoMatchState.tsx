import React from "react";
import Link from "next/link";
import { INGREDIENT_MAP } from "@/data/ingredients";

interface NoMatchStateProps {
  selectedIngredientIds: string[];
  preference?: string;
}

export function NoMatchState({ selectedIngredientIds, preference }: NoMatchStateProps) {
  const hasIngredients = selectedIngredientIds.length > 0;

  return (
    <div className="no-match-card card" role="region" aria-label="No matching meals found">
      <div className="no-match-icon-wrapper" aria-hidden="true">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="no-match-title">No Matching Meals Found</h2>
      <p className="no-match-description">
        {hasIngredients
          ? "None of the 20 Nigerian meals in our library match your selected ingredients with the active preference."
          : "No meals in our library currently match your selected preference."}
      </p>

      {hasIngredients && (
        <div className="no-match-selected-summary">
          <span className="summary-label">Your selected ingredients:</span>
          <div className="chip-list">
            {selectedIngredientIds.map((id) => (
              <span key={id} className="pill-chip pill-neutral">
                {INGREDIENT_MAP[id]?.name || id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="no-match-suggestions">
        <p className="suggestion-text">
          💡 <strong>Tip:</strong> Try selecting common Nigerian staples such as <em>Rice</em>, <em>Palm oil</em>, <em>Onions</em>, or <em>Yam</em>, or try searching with <em>No preference</em>.
        </p>
      </div>

      <Link href="/" className="btn btn-primary btn-block">
        Adjust Ingredients & Search Again
      </Link>
    </div>
  );
}
