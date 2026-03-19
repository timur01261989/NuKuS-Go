import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5173,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "leaflet",
      "react-leaflet",
      "antd",
      "@ant-design/icons",
      "recharts",
      "@tanstack/react-query",
      "axios",
    ],
  },
  build: {
    minify: "esbuild",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Hash prevents chunk name collision between same-named files in different dirs
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-antd": ["antd", "@ant-design/icons"],
          "vendor-map": ["leaflet", "react-leaflet"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-chart": ["recharts"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
});
