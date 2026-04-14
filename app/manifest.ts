import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renobo voorraad",
    short_name: "Renobo",
    description: "Interne stock app voor pads, panelen en toebehoren.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f6",
    theme_color: "#ff1d25",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
