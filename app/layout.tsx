import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NumVeda Admin — Analytics Dashboard",
  description: "NumVeda business intelligence & analytics dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
