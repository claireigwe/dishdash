import React from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  headerTitle?: string;
  showBack?: boolean;
}

export function AppShell({ children, headerTitle, showBack }: AppShellProps) {
  return (
    <div className="app-shell">
      <Header title={headerTitle} showBack={showBack} />
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
