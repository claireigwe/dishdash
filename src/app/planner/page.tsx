import React from "react";

export default function PlannerPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "var(--space-1)",
          }}
        >
          Weekly Meal Plan
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)" }}>
          Plan one meal per day for the week to reduce daily decision fatigue.
        </p>
      </div>

      <div className="card">
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
          The 7-day planner functionality will be built in Phase 5.
        </p>
      </div>
    </div>
  );
}
