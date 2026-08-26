import React from "react";

export default function GroceriesPage() {
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
          Grocery Checklist
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)" }}>
          Automatically derived from your weekly plan, excluding ingredients you already have.
        </p>
      </div>

      <div className="card">
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
          The dynamic grocery checklist will be built in Phase 6.
        </p>
      </div>
    </div>
  );
}
