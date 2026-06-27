import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cook Admin",
  description: "Menu authoring for the cook app",
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
