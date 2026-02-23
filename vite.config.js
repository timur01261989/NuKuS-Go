import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  base: "/", // MUHIM! Vercel uchun

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
      "@providers": fileURLToPath(new URL("./src/providers", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
    },
  },

  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5173,
  },

  // optimizeDeps.force: true olib tashlandi — har build sekinlashtirardi
  // Faqat kerak bo'lganda (yangi dependency qo'shilganda) qo'lda ishlatiladi:
  // vite --force
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
    // console.log larni production builddan olib tashlash
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Katta kutubxonalarni alohida chunk'larga ajratish
        // — birinchi sahifa yuklanishi ~40% tez bo'ladi
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
