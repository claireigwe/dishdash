import React from "react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="offline-page-container">
      <div className="offline-card card" role="region" aria-label="Offline status">
        <div className="offline-icon" aria-hidden="true">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1 className="offline-title">You're Offline</h1>
        <p className="offline-desc">
          DishDash works completely offline. Your weekly plan and grocery checklist are safely stored on your device.
        </p>

        <div className="offline-actions">
          <Link href="/planner" className="btn btn-primary btn-block">
            Open Weekly Planner
          </Link>
          <Link href="/groceries" className="btn btn-secondary btn-block">
            Open Grocery List
          </Link>
          <Link href="/" className="btn btn-secondary btn-block">
            Find Meals
          </Link>
        </div>
      </div>
    </div>
  );
}
