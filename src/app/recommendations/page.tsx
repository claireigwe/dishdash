"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useUserState } from "@/hooks/useUserState";
import { getRecommendations } from "@/lib/recommendationEngine";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { NoMatchState } from "@/components/recommendations/NoMatchState";

export default function RecommendationsPage() {
  const {
    availableIngredientIds,
    selectedPreference,
    weeklyPlan,
    isLoaded,
  } = useUserState();

  const recommendations = useMemo(() => {
    return getRecommendations({
      selectedIngredientIds: availableIngredientIds,
      preference: selectedPreference,
      weeklyPlan,
    });
  }, [availableIngredientIds, selectedPreference, weeklyPlan]);

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <p>Finding meal recommendations...</p>
      </div>
    );
  }

  const preferenceLabelMap = {
    quick: "Quick & Easy (≤30m)",
    different: "Something Different",
    none: "All Meals",
  };

  return (
    <div className="recommendations-container">
      {/* Top Header & Search Summary */}
      <div className="recommendations-header">
        <div className="header-nav-row">
          <Link href="/" className="back-link" aria-label="Adjust your search criteria">
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Adjust Ingredients</span>
          </Link>
          <span className="results-count-badge">
            {recommendations.length} {recommendations.length === 1 ? "Meal" : "Meals"} Found
          </span>
        </div>

        <h1 className="recommendations-title">Recommended for You</h1>
        <p className="recommendations-summary-text">
          {availableIngredientIds.length > 0
            ? `Based on ${availableIngredientIds.length} selected ingredient${
                availableIngredientIds.length > 1 ? "s" : ""
              } • Preference: ${preferenceLabelMap[selectedPreference]}`
            : `Preference: ${preferenceLabelMap[selectedPreference]}`}
        </p>
      </div>

      {/* Results List or No Match State */}
      {recommendations.length === 0 ? (
        <NoMatchState
          selectedIngredientIds={availableIngredientIds}
          preference={selectedPreference}
        />
      ) : (
        <div className="recommendations-list" role="feed" aria-label="Meal recommendations list">
          {recommendations.map((rec, index) => (
            <RecommendationCard
              key={rec.meal.id}
              recommendation={rec}
              preference={selectedPreference}
              rankIndex={index}
            />
          ))}
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="recommendations-footer">
        <Link href="/" className="btn btn-secondary btn-block">
          Change Ingredients or Preference
        </Link>
      </div>
    </div>
  );
}
