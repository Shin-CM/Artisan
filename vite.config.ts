import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

/**
 * Vite ajoute `crossorigin` sur script / link en prod. Sous le WebView Tauri
 * (https://tauri.localhost), WebKit peut refuser le module sans en-têtes CORS
 * adaptés → écran blanc. Ce front n’est servi que par Tauri : on retire l’attribut.
 */
function tauriDesktopHtmlNoCrossOrigin(): Plugin {
  let outDir = "";
  return {
    name: "tauri-desktop-html-no-crossorigin",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    /** Après tous les `writeBundle` : sinon Vite peut réécraser index.html après notre patch. */
    closeBundle() {
      const htmlPath = path.join(outDir, "index.html");
      if (!fs.existsSync(htmlPath)) return;
      const html = fs.readFileSync(htmlPath, "utf8");
      const next = html.replace(/\s+crossorigin(?:=["'][^"']*["'])?/g, "");
      if (next !== html) fs.writeFileSync(htmlPath, next);
    },
  };
}

// https://vite.dev/config/
// https://v2.tauri.app/start/frontend/vite/
// Chemins relatifs en build : les URLs absolues `/assets/...` cassent le chargement
// sous le WebView Tauri (écran blanc) ; `./` est la config recommandée par Tauri + Vite.
export default defineConfig(async ({ command }) => ({
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  base: command === "build" ? "./" : "/",
  plugins: [react(), tailwindcss(), tauriDesktopHtmlNoCrossOrigin()],
  build: {
    // WebKit (macOS/Linux) : aligné sur la doc Tauri ; Windows : Chromium.
    ...(command === "build"
      ? {
          // safari13 (doc Tauri Linux/WebKit2GTK) est trop bas pour React 19 / RR7 ; WebKit Tauri macOS est récent.
          target:
            process.env.TAURI_ENV_PLATFORM === "windows"
              ? "chrome105"
              : "safari16",
          minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
          sourcemap: !!process.env.TAURI_ENV_DEBUG,
          // Moins de balises <link rel="modulepreload"> (et de risques CORS / ordre d’écriture).
          modulePreload: false,
        }
      : {}),
    // react-pdf reste un chunk dédié ~1.6 Mo ; chargé seulement avec devis/factures/branding/template
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts")) return "vendor-recharts";
          if (id.includes("@react-pdf")) return "vendor-react-pdf";
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("lucide-react")) return "vendor-lucide";
          if (id.includes("@radix-ui")) return "vendor-radix";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
