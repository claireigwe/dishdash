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
    id: "spicy",
    label: "Something spicy",
    description: "Hot, pepper-packed & aromatic dishes",
  },
  {
    id: "filling",
    label: "Something filling",
    description: "Hearty swallows, rich beans & heavy carbs",
  },
  {
    id: "quick",
    label: "Something quick",
    description: "Fast, easy meals ready in 30 mins or less",
  },
  {
    id: "sweet",
    label: "Something sweet",
    description: "Sweet ripe plantain & coconut delicacies",
  },
  {
    id: "surprise",
    label: "Surprise me",
    description: "Open to any delicious Nigerian favorite",
  },
];

export function PreferenceSelector({
  selectedPreference,
  onSelect,
}: PreferenceSelectorProps) {
  return (
    <div className="preference-selector-container">
      <div className="preference-header">
        <h2 id="section-preference" className="section-label">
          1. What are you in the mood for?
        </h2>
        <span className="section-subtitle">
          Choose what sounds good, and we'll find meals that match.
        </span>
      </div>

      <div
        className="preference-options-grid"
        role="radiogroup"
        aria-label="What are you in the mood for?"
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

