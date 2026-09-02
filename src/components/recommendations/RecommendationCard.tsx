import React from "react";
import Link from "next/link";
import { MealRecommendation, MealPreference } from "@/types/meal";
import { INGREDIENT_MAP } from "@/data/ingredients";

interface RecommendationCardProps {
  recommendation: MealRecommendation;
  preference: MealPreference;
  rankIndex: number;
}

export function RecommendationCard({
  recommendation,
  preference,
  rankIndex,
}: RecommendationCardProps) {
  const { meal, matchedIngredients, missingIngredients } = recommendation;
  const hasMatched = matchedIngredients.length > 0;

  // Derive plain-English explanation
  const explanationParts: string[] = [];

  if (hasMatched) {
    explanationParts.push(`Uses ${matchedIngredients.length} of your ingredients`);
    if (missingIngredients.length > 0) {
      explanationParts.push(`Needs ${missingIngredients.length} more`);
    } else {
      explanationParts.push("You have all ingredients!");
    }
  } else {
    explanationParts.push("Suggested from our curated library");
  }

  if (preference === "quick" && meal.isQuick) {
    explanationParts.push(`Ready in ${meal.cookingTime} mins`);
  } else if (preference === "spicy") {
    explanationParts.push("Spicy & flavor-packed");
  } else if (preference === "filling") {
    explanationParts.push("Hearty & filling");
  } else if (preference === "sweet") {
    explanationParts.push("Sweet & savory profile");
  } else if (preference === "surprise") {
    explanationParts.push("Curated Nigerian favorite");
  }

  return (
    <article className="recommendation-card card" aria-labelledby={`meal-title-${meal.id}`}>
      {/* Header with Rank & Badges */}
      <div className="card-top-row">
        <span className="rank-badge">#{rankIndex + 1} Suggestion</span>
        <div className="badge-group">
          <span className="badge badge-secondary">{meal.category}</span>
          <span className={`badge ${meal.isQuick ? "badge-primary" : "badge-neutral"}`}>
            {meal.cookingTime} mins
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <h2 id={`meal-title-${meal.id}`} className="meal-card-title">
        {meal.name}
      </h2>
      <p className="meal-card-description">{meal.description}</p>

      {/* Explainable Match Reason Banner */}
      <div className="match-explanation-banner">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{explanationParts.join(" • ")}</span>
      </div>

      {/* Ingredient Match Breakdown */}
      <div className="ingredient-breakdown-section">
        {hasMatched && (
          <div className="matched-ingredients-block">
            <span className="breakdown-label">Ingredients you have:</span>
            <div className="chip-list">
              {matchedIngredients.map((id) => (
                <span key={id} className="pill-chip pill-matched">
                  ✓ {INGREDIENT_MAP[id]?.name || id}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingIngredients.length > 0 && (
          <div className="missing-ingredients-block">
            <span className="breakdown-label">Ingredients needed:</span>
            <div className="chip-list">
              {missingIngredients.map((id) => (
                <span key={id} className="pill-chip pill-missing">
                  + {INGREDIENT_MAP[id]?.name || id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="card-action-row">
        <Link
          href={`/meals/${meal.id}`}
          className="btn btn-primary btn-block"
          aria-label={`View recipe for ${meal.name}`}
        >
          View Recipe & Steps
        </Link>
      </div>
    </article>
  );
}
