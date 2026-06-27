import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meal Plan",
    short_name: "Meal Plan",
    description: "Manage your weekly meal menus",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      { src: "/app-icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/app-icon?size=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
