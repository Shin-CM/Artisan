import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

function normalizeBase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/";
  let out = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!out.endsWith("/")) out = `${out}/`;
  return out;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = normalizeBase(env.VITE_TABLET_BASE ?? "/");
  const iconSrc = `${basePath}vite.svg`.replace(/\/{2,}/g, "/");

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [],
        manifest: {
          name: "Artisan Tablette",
          short_name: "Artisan",
          description: "Clients et devis - reseau local",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          start_url: basePath,
          icons: [
            {
              src: iconSrc,
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      strictPort: false,
    },
  };
});
