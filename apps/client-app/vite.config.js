import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@":          fileURLToPath(new URL("./src", import.meta.url)),
      "@services":  fileURLToPath(new URL("./src/services", import.meta.url)),
      "@i18n":      fileURLToPath(new URL("./src/i18n", import.meta.url)),
      // Monorepo shared libs
      "@unigo/core-types":  fileURLToPath(new URL("../../libs/core-types/src", import.meta.url)),
      "@unigo/utils":       fileURLToPath(new URL("../../libs/utils/src", import.meta.url)),
      "@unigo/ui-kit":      fileURLToPath(new URL("../../libs/ui-kit/src", import.meta.url)),
      "@unigo/api-client":  fileURLToPath(new URL("../../libs/api-client/src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5173,
  },
  optimizeDeps: {
    include: [
      "react", "react-dom", "react-router-dom", "react-is",
      "@supabase/supabase-js", "leaflet", "react-leaflet",
      "antd", "@ant-design/icons", "recharts",
      "@tanstack/react-query", "axios",
    ],
  },
  build: {
    minify: "esbuild",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        chunkFileNames:  "assets/[name]-[hash].js",
        entryFileNames:  "assets/[name]-[hash].js",
        assetFileNames:  "assets/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules/react-is"))                   return "vendor-react";
          if (id.includes("node_modules/react"))                       return "vendor-react";
          if (id.includes("node_modules/antd") || id.includes("@ant-design")) return "vendor-antd";
          if (id.includes("node_modules/leaflet"))                     return "vendor-map";
          if (id.includes("node_modules/@supabase"))                   return "vendor-supabase";
          if (id.includes("node_modules/recharts"))                    return "vendor-chart";
          if (id.includes("node_modules/@tanstack"))                   return "vendor-query";
        },
      },
    },
  },
});
