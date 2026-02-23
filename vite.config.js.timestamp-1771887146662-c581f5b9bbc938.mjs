// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "/",
  // MUHIM! Vercel uchun
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      "@features": fileURLToPath(new URL("./src/features", __vite_injected_original_import_meta_url)),
      "@services": fileURLToPath(new URL("./src/services", __vite_injected_original_import_meta_url)),
      "@utils": fileURLToPath(new URL("./src/utils", __vite_injected_original_import_meta_url)),
      "@lib": fileURLToPath(new URL("./src/lib", __vite_injected_original_import_meta_url)),
      "@i18n": fileURLToPath(new URL("./src/i18n", __vite_injected_original_import_meta_url)),
      "@providers": fileURLToPath(new URL("./src/providers", __vite_injected_original_import_meta_url)),
      "@shared": fileURLToPath(new URL("./src/shared", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5173
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
      "axios"
    ]
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
          "vendor-query": ["@tanstack/react-query"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSBcIm5vZGU6dXJsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgYmFzZTogXCIvXCIsIC8vIE1VSElNISBWZXJjZWwgdWNodW5cblxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoXCIuL3NyY1wiLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgIFwiQGZlYXR1cmVzXCI6IGZpbGVVUkxUb1BhdGgobmV3IFVSTChcIi4vc3JjL2ZlYXR1cmVzXCIsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgXCJAc2VydmljZXNcIjogZmlsZVVSTFRvUGF0aChuZXcgVVJMKFwiLi9zcmMvc2VydmljZXNcIiwgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICBcIkB1dGlsc1wiOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoXCIuL3NyYy91dGlsc1wiLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgIFwiQGxpYlwiOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoXCIuL3NyYy9saWJcIiwgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICBcIkBpMThuXCI6IGZpbGVVUkxUb1BhdGgobmV3IFVSTChcIi4vc3JjL2kxOG5cIiwgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICBcIkBwcm92aWRlcnNcIjogZmlsZVVSTFRvUGF0aChuZXcgVVJMKFwiLi9zcmMvcHJvdmlkZXJzXCIsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgXCJAc2hhcmVkXCI6IGZpbGVVUkxUb1BhdGgobmV3IFVSTChcIi4vc3JjL3NoYXJlZFwiLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcbiAgICBwb3J0OiA1MTczLFxuICB9LFxuXG4gIC8vIG9wdGltaXplRGVwcy5mb3JjZTogdHJ1ZSBvbGliIHRhc2hsYW5kaSBcdTIwMTQgaGFyIGJ1aWxkIHNla2lubGFzaHRpcmFyZGlcbiAgLy8gRmFxYXQga2VyYWsgYm8nbGdhbmRhICh5YW5naSBkZXBlbmRlbmN5IHFvJ3NoaWxnYW5kYSkgcW8nbGRhIGlzaGxhdGlsYWRpOlxuICAvLyB2aXRlIC0tZm9yY2VcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgXCJyZWFjdFwiLFxuICAgICAgXCJyZWFjdC1kb21cIixcbiAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxuICAgICAgXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIixcbiAgICAgIFwibGVhZmxldFwiLFxuICAgICAgXCJyZWFjdC1sZWFmbGV0XCIsXG4gICAgICBcImFudGRcIixcbiAgICAgIFwiQGFudC1kZXNpZ24vaWNvbnNcIixcbiAgICAgIFwicmVjaGFydHNcIixcbiAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXG4gICAgICBcImF4aW9zXCIsXG4gICAgXSxcbiAgfSxcblxuICBidWlsZDoge1xuICAgIC8vIGNvbnNvbGUubG9nIGxhcm5pIHByb2R1Y3Rpb24gYnVpbGRkYW4gb2xpYiB0YXNobGFzaFxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIEthdHRhIGt1dHVieG9uYWxhcm5pIGFsb2hpZGEgY2h1bmsnbGFyZ2EgYWpyYXRpc2hcbiAgICAgICAgLy8gXHUyMDE0IGJpcmluY2hpIHNhaGlmYSB5dWtsYW5pc2hpIH40MCUgdGV6IGJvJ2xhZGlcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgXCJ2ZW5kb3ItcmVhY3RcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgIFwidmVuZG9yLWFudGRcIjogW1wiYW50ZFwiLCBcIkBhbnQtZGVzaWduL2ljb25zXCJdLFxuICAgICAgICAgIFwidmVuZG9yLW1hcFwiOiBbXCJsZWFmbGV0XCIsIFwicmVhY3QtbGVhZmxldFwiXSxcbiAgICAgICAgICBcInZlbmRvci1zdXBhYmFzZVwiOiBbXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIl0sXG4gICAgICAgICAgXCJ2ZW5kb3ItY2hhcnRcIjogW1wicmVjaGFydHNcIl0sXG4gICAgICAgICAgXCJ2ZW5kb3ItcXVlcnlcIjogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWUsV0FBVztBQUYrRixJQUFNLDJDQUEyQztBQUluTCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBO0FBQUEsRUFFTixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQ3BELGFBQWEsY0FBYyxJQUFJLElBQUksa0JBQWtCLHdDQUFlLENBQUM7QUFBQSxNQUNyRSxhQUFhLGNBQWMsSUFBSSxJQUFJLGtCQUFrQix3Q0FBZSxDQUFDO0FBQUEsTUFDckUsVUFBVSxjQUFjLElBQUksSUFBSSxlQUFlLHdDQUFlLENBQUM7QUFBQSxNQUMvRCxRQUFRLGNBQWMsSUFBSSxJQUFJLGFBQWEsd0NBQWUsQ0FBQztBQUFBLE1BQzNELFNBQVMsY0FBYyxJQUFJLElBQUksY0FBYyx3Q0FBZSxDQUFDO0FBQUEsTUFDN0QsY0FBYyxjQUFjLElBQUksSUFBSSxtQkFBbUIsd0NBQWUsQ0FBQztBQUFBLE1BQ3ZFLFdBQVcsY0FBYyxJQUFJLElBQUksZ0JBQWdCLHdDQUFlLENBQUM7QUFBQSxJQUNuRTtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTztBQUFBO0FBQUEsSUFFTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQTtBQUFBLFFBR04sY0FBYztBQUFBLFVBQ1osZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGVBQWUsQ0FBQyxRQUFRLG1CQUFtQjtBQUFBLFVBQzNDLGNBQWMsQ0FBQyxXQUFXLGVBQWU7QUFBQSxVQUN6QyxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQSxVQUMzQyxnQkFBZ0IsQ0FBQyxVQUFVO0FBQUEsVUFDM0IsZ0JBQWdCLENBQUMsdUJBQXVCO0FBQUEsUUFDMUM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
