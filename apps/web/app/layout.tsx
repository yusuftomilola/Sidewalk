import type { ReactElement, ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sidewalk Starter",
  description: "Hackathon starter for rebuilding Sidewalk from scratch."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
