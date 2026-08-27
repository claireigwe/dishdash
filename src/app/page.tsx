"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUserState } from "@/hooks/useUserState";
import { IngredientSelector } from "@/components/discovery/IngredientSelector";
import { SelectedChips } from "@/components/discovery/SelectedChips";
import { PreferenceSelector } from "@/components/discovery/PreferenceSelector";

export default function DiscoveryHomePage() {
  const router = useRouter();
  const {
    availableIngredientIds,
    selectedPreference,
    toggleIngredient,
    removeIngredient,
    clearIngredients,
    setPreference,
  } = useUserState();

  const handleFindMeals = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/recommendations");
  };

  const ingredientCount = availableIngredientIds.length;

  return (
    <div className="discovery-container">
      {/* Hero Intro */}
      <section className="discovery-hero">
        <h1 className="hero-title">What should I cook today?</h1>
        <p className="hero-subtitle">
          Select what you have at home, choose a preference, and get tailored Nigerian meal suggestions.
        </p>
      </section>

      <form onSubmit={handleFindMeals} className="discovery-form">
        {/* Ingredient Selection Section */}
        <section className="discovery-section" aria-labelledby="section-ingredients">
          <div className="section-header">
            <h2 id="section-ingredients" className="section-label">
              1. What ingredients do you have?
            </h2>
            <span className="section-subtitle">
              Select any items on hand (or continue without selecting)
            </span>
          </div>

          <SelectedChips
            selectedIds={availableIngredientIds}
            onRemove={removeIngredient}
            onClearAll={clearIngredients}
          />

          <IngredientSelector
            selectedIds={availableIngredientIds}
            onToggle={toggleIngredient}
          />
        </section>

        {/* Preference Selection Section */}
        <section className="discovery-section" aria-labelledby="section-preference">
          <PreferenceSelector
            selectedPreference={selectedPreference}
            onSelect={setPreference}
          />
        </section>

        {/* Floating Bottom-Right Action */}
        <div className="discovery-floating-action-bar">
          <button
            type="submit"
            className={`btn btn-floating-find ${
              ingredientCount > 0 ? "btn-find-active" : "btn-find-idle"
            }`}
            aria-label="Find Meals"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Find Meals</span>
          </button>
        </div>
      </form>
    </div>
  );
}
