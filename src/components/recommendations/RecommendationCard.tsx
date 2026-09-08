import React from "react";
import Link from "next/link";
import { MealRecommendation, MealPreference, RecommendationRole } from "@/types/meal";
import { INGREDIENT_MAP } from "@/data/ingredients";

interface RecommendationCardProps {
  recommendation: MealRecommendation;
  preference: MealPreference;
  rankIndex: number;
}

const ROLE_CONFIG: Record<
  RecommendationRole,
  { label: string; badgeClass: string; icon: string }
> = {
  best_match: {
    label: "Best Match",
    badgeClass: "rank-badge rank-badge-best",
    icon: "★",
  },
  easiest: {
    label: "Easiest Option",
    badgeClass: "rank-badge rank-badge-easiest",
    icon: "⚡",
  },
  wildcard: {
    label: "Wildcard Choice",
    badgeClass: "rank-badge rank-badge-wildcard",
    icon: "✦",
  },
  another_good_match: {
    label: "Good Match",
    badgeClass: "rank-badge rank-badge-good",
    icon: "✓",
  },
  another_option: {
    label: "Another Option",
    badgeClass: "rank-badge rank-badge-option",
    icon: "✦",
  },
};

export function RecommendationCard({
  recommendation,
  preference,
  rankIndex,
}: RecommendationCardProps) {
  const { meal, matchedIngredients, missingIngredients, role, explanation } = recommendation;
  const hasMatched = matchedIngredients.length > 0;

  const roleInfo = role
    ? ROLE_CONFIG[role]
    : {
        label: `#${rankIndex + 1} Suggestion`,
        badgeClass: "rank-badge",
        icon: "#",
      };

  // Explanation fallback if not provided directly
  const displayExplanation =
    explanation ||
    (hasMatched
      ? `Uses ${matchedIngredients.length} of your ingredients • ${
          missingIngredients.length > 0
            ? `Needs ${missingIngredients.length} more`
            : "You have all ingredients!"
        }`
      : `Suggested from our curated library • Ready in ${meal.cookingTime} mins`);

  return (
    <article className="recommendation-card card" aria-labelledby={`meal-title-${meal.id}`}>
      {/* Header with Role Badge & Attributes */}
      <div className="card-top-row">
        <span className={roleInfo.badgeClass}>
          {roleInfo.icon} {roleInfo.label}
        </span>
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
        <span>{displayExplanation}</span>
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
