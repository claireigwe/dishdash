"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const isDiscoveryActive = pathname === "/" || pathname.startsWith("/recommendations") || pathname.startsWith("/meals");
  const isPlannerActive = pathname.startsWith("/planner");
  const isGroceriesActive = pathname.startsWith("/groceries");

  return (
    <nav className="app-bottom-nav" aria-label="Main Navigation">
      <div className="app-bottom-nav-inner">
        <Link
          href="/"
          className={`nav-item ${isDiscoveryActive ? "active" : ""}`}
          aria-current={isDiscoveryActive ? "page" : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span>Find Meals</span>
        </Link>

        <Link
          href="/planner"
          className={`nav-item ${isPlannerActive ? "active" : ""}`}
          aria-current={isPlannerActive ? "page" : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Plan</span>
        </Link>

        <Link
          href="/groceries"
          className={`nav-item ${isGroceriesActive ? "active" : ""}`}
          aria-current={isGroceriesActive ? "page" : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Groceries</span>
        </Link>
      </div>
    </nav>
  );
}
