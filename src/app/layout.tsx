import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/common/AppShell";

export const metadata: Metadata = {
  title: "DishDash — Meal Decision Tool for Solo Cooks",
  description: "Stop wondering what to cook. Get tailored Nigerian meal suggestions from ingredients you already have.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D95328",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
