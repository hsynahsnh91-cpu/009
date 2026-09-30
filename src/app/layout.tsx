import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ExplainX — Understand anything",
  description:
    "A space for your curiosity. Build understanding, one idea at a time.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
