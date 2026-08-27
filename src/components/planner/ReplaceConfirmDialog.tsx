"use client";

import React, { useEffect, useRef } from "react";
import { Meal } from "@/types/meal";
import { MEAL_MAP } from "@/data/meals";

interface ReplaceConfirmDialogProps {
  isOpen: boolean;
  dayLabel: string;
  existingMealId: string;
  newMeal: Meal;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReplaceConfirmDialog({
  isOpen,
  dayLabel,
  existingMealId,
  newMeal,
  onConfirm,
  onCancel,
}: ReplaceConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const existingMeal = MEAL_MAP[existingMealId];
  const existingMealName = existingMeal ? existingMeal.name : "another meal";

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="modal-container replace-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="replace-dialog-title"
        aria-describedby="replace-dialog-desc"
        ref={dialogRef}
      >
        <div className="replace-dialog-header">
          <div className="warning-icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 id="replace-dialog-title" className="replace-dialog-title">
            Replace Planned Meal?
          </h2>
        </div>

        <div id="replace-dialog-desc" className="replace-dialog-body">
          <p className="replace-prompt">
            <strong>{dayLabel}</strong> is currently scheduled for:
          </p>
          <div className="current-planned-meal-box">
            <span className="current-meal-name">{existingMealName}</span>
          </div>
          <p className="replace-consequence">
            Would you like to replace it with <strong>{newMeal.name}</strong>?
          </p>
        </div>

        <div className="replace-dialog-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary"
          >
            Replace Meal
          </button>
        </div>
      </div>
    </div>
  );
}
