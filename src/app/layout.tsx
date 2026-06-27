import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Meal Plan — Admin",
  description: "Manage your weekly meal menus",
  appleWebApp: {
    capable: true,
    title: "Meal Plan",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/app-icon?size=192",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
