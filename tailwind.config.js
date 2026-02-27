export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Client home design
        primary: "#f48c25",
        primaryHome: "#f48c25",
        primarySidebar: "#ec5b13",
        backgroundLight: "#f0f4f8",
        backgroundLightSidebar: "#f8f6f6",
        backgroundDark: "#1a1f26",
        softBlue: "#e1e8f0",
        cardDark: "#232b35",
      },
      fontFamily: {
        display: [
          "Plus Jakarta Sans",
          "Public Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
