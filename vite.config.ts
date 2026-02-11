import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "production" &&
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: false,
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "icon-192x192.png",
          "icon-512x512.png",
        ],
        manifest: {
          name: "a-now - Gestao de tarefas e produtividade",
          short_name: "a-now",
          description: "Aplicacao para gestao de tarefas, objetivos e produtividade",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#3b82f6",
          background_color: "#0f172a",
          orientation: "portrait-primary",
          lang: "pt-PT",
          categories: ["productivity", "business", "utilities"],
          icons: [
            {
              src: "/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
          ],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
