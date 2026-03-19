export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Client home design
        primary: "#F46A0A",
        primaryHome: "#F46A0A",
        primarySidebar: "#2F6BFF",
        // Driver home design
        backgroundLightDriver: "#EEF5FB",
        cardLightDriver: "#FFFFFF",
        backgroundLight: "#EEF5FB",
        backgroundLightSidebar: "#F8FBFF",
        backgroundDark: "#161A22",
        softBlue: "#EEF5FB",
        cardDark: "#161A22",
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
