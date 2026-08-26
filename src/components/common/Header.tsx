import React from "react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title, showBack = false }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {showBack && (
            <Link
              href="/"
              aria-label="Go back to Home"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.25rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <Link href="/" className="app-brand">
            <span>DishDash</span>
            <span className="app-brand-badge">Solo Cook</span>
          </Link>
        </div>
        {title && (
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--color-text-secondary)",
            }}
          >
            {title}
          </span>
        )}
      </div>
    </header>
  );
}
