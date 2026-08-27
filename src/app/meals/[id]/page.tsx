"use client";

import React, { useState, use, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MEAL_MAP } from "@/data/meals";
import { INGREDIENT_MAP } from "@/data/ingredients";
import { useUserState } from "@/hooks/useUserState";
import { AddToPlanModal } from "@/components/planner/AddToPlanModal";

interface MealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MealDetailPage({ params }: MealDetailPageProps) {
  const { id } = use(params);
  const meal = MEAL_MAP[id];

  const {
    availableIngredientIds,
    weeklyPlan,
    assignMealToDay,
  } = useUserState();

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!meal) {
    notFound();
  }

  // Partition ingredients based on active search state
  const { hasActiveSelection, haveIngredients, needIngredients } = useMemo(() => {
    const selectedSet = new Set(availableIngredientIds);
    const hasActive = selectedSet.size > 0;

    if (!hasActive) {
      return {
        hasActiveSelection: false,
        haveIngredients: [],
        needIngredients: meal.ingredients,
      };
    }

    const have: string[] = [];
    const need: string[] = [];

    for (const ingId of meal.ingredients) {
      if (selectedSet.has(ingId)) {
        have.push(ingId);
      } else {
        need.push(ingId);
      }
    }

    return {
      hasActiveSelection: true,
      haveIngredients: have,
      needIngredients: need,
    };
  }, [meal.ingredients, availableIngredientIds]);

  const handlePlanSuccess = (dayName: string) => {
    setSuccessMessage(`Scheduled for ${dayName}`);
    // Auto-dismiss confirmation banner after 4 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="meal-detail-container">
      {/* Top Back Navigation & Actions */}
      <div className="detail-top-nav">
        <Link href="/recommendations" className="back-link" aria-label="Back to recommendations">
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
          <span>Back to Recommendations</span>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="plan-success-toast" role="status" aria-live="polite">
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>
            <strong>{meal.name}</strong> added to plan: {successMessage}
          </span>
        </div>
      )}

      {/* Hero Header */}
      <header className="meal-detail-header">
        <div className="detail-badge-row">
          <span className="badge badge-secondary">{meal.category}</span>
          <span className={`badge ${meal.isQuick ? "badge-primary" : "badge-neutral"}`}>
            ⏱️ {meal.cookingTime} mins {meal.isQuick ? "• Quick" : ""}
          </span>
        </div>

        <h1 className="meal-detail-title">{meal.name}</h1>
        <p className="meal-detail-desc">{meal.description}</p>
      </header>

      {/* Primary CTA: Add to Weekly Plan */}
      <div className="detail-action-bar">
        <button
          type="button"
          onClick={() => setIsPlanModalOpen(true)}
          className="btn btn-primary btn-block btn-lg"
          aria-haspopup="dialog"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="14" x2="12" y2="18" />
            <line x1="10" y1="16" x2="14" y2="16" />
          </svg>
          <span>Add to Weekly Plan</span>
        </button>
      </div>

      {/* Ingredients Section */}
      <section className="detail-section card" aria-labelledby="detail-ingredients-heading">
        <h2 id="detail-ingredients-heading" className="detail-section-title">
          Ingredients ({meal.ingredients.length})
        </h2>

        {hasActiveSelection ? (
          <div className="ingredients-split-container">
            {haveIngredients.length > 0 && (
              <div className="ingredient-group">
                <span className="group-heading text-success">
                  ✓ You have ({haveIngredients.length})
                </span>
                <ul className="ingredient-item-list" aria-label="Ingredients you have">
                  {haveIngredients.map((ingId) => (
                    <li key={ingId} className="ingredient-item item-have">
                      <span className="bullet-icon">✓</span>
                      <span>{INGREDIENT_MAP[ingId]?.name || ingId}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {needIngredients.length > 0 && (
              <div className="ingredient-group">
                <span className="group-heading text-neutral">
                  + You need ({needIngredients.length})
                </span>
                <ul className="ingredient-item-list" aria-label="Ingredients you need">
                  {needIngredients.map((ingId) => (
                    <li key={ingId} className="ingredient-item item-need">
                      <span className="bullet-icon">+</span>
                      <span>{INGREDIENT_MAP[ingId]?.name || ingId}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ul className="ingredient-item-list default-list" aria-label="Meal ingredients">
            {meal.ingredients.map((ingId) => (
              <li key={ingId} className="ingredient-item">
                <span className="bullet-dot">•</span>
                <span>{INGREDIENT_MAP[ingId]?.name || ingId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Preparation Instructions */}
      <section className="detail-section card" aria-labelledby="detail-instructions-heading">
        <h2 id="detail-instructions-heading" className="detail-section-title">
          Preparation Steps
        </h2>
        <ol className="instructions-step-list" aria-label="Cooking instructions">
          {meal.instructions.map((step, index) => (
            <li key={index} className="instruction-step-item">
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="step-content">
                <p>{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Add to Plan Modal */}
      <AddToPlanModal
        isOpen={isPlanModalOpen}
        meal={meal}
        weeklyPlan={weeklyPlan}
        onAssignMeal={assignMealToDay}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={handlePlanSuccess}
      />
    </div>
  );
}
