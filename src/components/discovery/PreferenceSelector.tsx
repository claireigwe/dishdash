import React from "react";
import { MealPreference } from "@/types/meal";

interface PreferenceSelectorProps {
  selectedPreference: MealPreference;
  onSelect: (preference: MealPreference) => void;
}

interface PreferenceOption {
  id: MealPreference;
  label: string;
  description: string;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    id: "quick",
    label: "Quick & Easy",
    description: "Ready in 30 minutes or less",
  },
  {
    id: "different",
    label: "Something Different",
    description: "Avoid meals already in your plan",
  },
  {
    id: "none",
    label: "No Preference",
    description: "Rank purely by ingredient match",
  },
];

export function PreferenceSelector({
  selectedPreference,
  onSelect,
}: PreferenceSelectorProps) {
  return (
    <div className="preference-selector-container">
      <div className="preference-header">
        <label className="section-label">Meal Preference</label>
        <span className="section-subtitle">Choose how to rank your suggestions</span>
      </div>

      <div
        className="preference-options-grid"
        role="radiogroup"
        aria-label="Meal preference selection"
      >
        {PREFERENCE_OPTIONS.map((opt) => {
          const isSelected = selectedPreference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(opt.id)}
              className={`preference-card ${isSelected ? "selected" : ""}`}
            >
              <div className="preference-radio-indicator" aria-hidden="true">
                <span className={`radio-dot ${isSelected ? "checked" : ""}`} />
              </div>
              <div className="preference-card-content">
                <span className="preference-title">{opt.label}</span>
                <span className="preference-desc">{opt.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
