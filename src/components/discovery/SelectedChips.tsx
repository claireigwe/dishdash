import React from "react";
import { INGREDIENT_MAP } from "@/data/ingredients";

interface SelectedChipsProps {
  selectedIds: string[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function SelectedChips({
  selectedIds,
  onRemove,
  onClearAll,
}: SelectedChipsProps) {
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="selected-ingredients-container">
      <div className="selected-ingredients-header">
        <span className="selected-count">
          Selected Ingredients ({selectedIds.length})
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="clear-all-btn"
          aria-label="Clear all selected ingredients"
        >
          Clear all
        </button>
      </div>

      <div className="selected-chips-list" role="list" aria-label="Selected ingredients list">
        {selectedIds.map((id) => {
          const ingredient = INGREDIENT_MAP[id];
          const displayName = ingredient ? ingredient.name : id;

          return (
            <span key={id} className="selected-chip" role="listitem">
              <span>{displayName}</span>
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="chip-remove-btn"
                aria-label={`Remove ${displayName}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
