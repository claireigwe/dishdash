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
        <div className="header-brand-group">
          {showBack && (
            <Link
              href="/"
              aria-label="Go back to Home"
              className="header-back-button"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <Link href="/" className="app-brand">
            <span className="brand-logo-text">DishDash</span>
            <span className="app-brand-badge">Solo Cook</span>
          </Link>
        </div>
        {title && <span className="header-page-title">{title}</span>}
      </div>
    </header>
  );
}
