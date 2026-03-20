import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  // .env fayllarini to'liq yuklash (VITE_ prefikssizlarini ham)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    // Capacitor Android uchun muhim: relative path'lar to'g'ri ishlashi uchun
    base: "./",

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
        "@i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
      },
    },

    // Env o'zgaruvchilar yo'q bo'lsa ham app crash qilmasligi uchun
    // GitHub Actions Secrets dan kelgan qiymatlar ishlatiladi
    define: {
      // Faqat VITE_ prefiksli o'zgaruvchilarni safe inject qilamiz
      __VITE_SUPABASE_URL__: JSON.stringify(
        env.VITE_SUPABASE_URL || ""
      ),
      __VITE_API_BASE_URL__: JSON.stringify(
        env.VITE_API_BASE_URL || ""
      ),
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
        "react-is",
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
      // Android uchun sourcemap o'chirish (APK hajmini kamaytiradi)
      sourcemap: mode !== "production",
      chunkSizeWarningLimit: 1500,
      // Android WebView uchun es2015 target yetarli
      target: "es2015",
      rollupOptions: {
        external: [],
        output: {
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
          manualChunks(id) {
            // react-is react-dom dan OLDIN bo'lishi kerak
            if (id.includes("node_modules/react-is")) {
              return "vendor-react-is";
            }
            if (
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-router-dom") ||
              id.includes("node_modules/react-router/")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("node_modules/antd") ||
              id.includes("node_modules/@ant-design")
            ) {
              return "vendor-antd";
            }
            if (
              id.includes("node_modules/leaflet") ||
              id.includes("node_modules/react-leaflet")
            ) {
              return "vendor-map";
            }
            if (id.includes("node_modules/@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("node_modules/recharts")) {
              return "vendor-chart";
            }
            if (id.includes("node_modules/@tanstack")) {
              return "vendor-query";
            }
            if (id.includes("node_modules/axios")) {
              return "vendor-axios";
            }
          },
        },
      },
    },
  };
});
