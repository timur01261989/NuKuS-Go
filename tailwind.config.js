export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        unigo: {
          primary: "#F59E0B", // Vibrant Orange
          dark: "#1F2937", // Deep Grayish Blue
          accent: "#3B82F6", // Professional Blue
        },
      },
      boxShadow: {
        modern:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        neumorphic: "20px 20px 60px #bebebe, -20px -20px 60px #ffffff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
