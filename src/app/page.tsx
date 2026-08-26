import React from "react";

export default function HomePage() {
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
          What should I cook today?
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)" }}>
          Find quick, relevant Nigerian meal ideas using what you already have at home.
        </p>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <span className="badge badge-primary" style={{ alignSelf: "flex-start" }}>
          Phase 1 Foundation
        </span>
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
          DishDash Shell Ready
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
          The core layout, design system, type contracts, and safe client storage utilities have been established.
        </p>
      </div>
    </div>
  );
}
