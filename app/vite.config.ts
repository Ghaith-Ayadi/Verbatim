import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig(({ mode }) => {
  // Local dev: hoist VITE_* from the monorepo root .env files (one place for app + scripts).
  // CI / Vercel: those vars come from process.env — merge them so they aren't lost.
  const root = path.resolve(__dirname, "..");
  const fileEnv = loadEnv(mode, root, "VITE_");
  const processEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith("VITE_")),
  ) as Record<string, string>;
  const env = { ...fileEnv, ...processEnv };
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Verbatim",
          short_name: "Verbatim",
          description: "Local-first writing.",
          theme_color: "#0a0a0a",
          background_color: "#0a0a0a",
          display: "standalone",
          // The installed PWA is the writing tool, not the public reader.
          start_url: "/admin",
          scope: "/",
          icons: [
            { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          ],
        },
        workbox: {
          // Cache the shell. Supabase requests pass through; Dexie holds the data.
          navigateFallback: "/index.html",
          globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    define: Object.fromEntries(
      Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]),
    ),
    server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  };
});
