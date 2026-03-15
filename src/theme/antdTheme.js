export function getAntdTheme() {
  return {
    token: {
      colorPrimary: "var(--brand)",
      borderRadius: 16,
      fontFamily: "var(--font-sans)",

      /* Text */
      colorTextBase: "var(--text)",
      colorText: "var(--text)",
      colorTextSecondary: "var(--text-2)",

      /* Layout background */
      colorBgLayout: "var(--bg-layout)",
      colorBgContainer: "var(--bg-elevated)",

      /* Border */
      colorBorder: "#E5E7EB",
    },

    components: {
      Card: {
        borderRadiusLG: 24,
        headerBg: "transparent",
        colorBgContainer: "var(--card-bg)",
        colorBorderSecondary: "var(--card-border)",
        boxShadowTertiary: "var(--shadow-soft)",
      },

      Modal: {
        contentBg: "var(--card-bg-strong)",
        headerBg: "transparent",
      },

      Drawer: {
        colorBgElevated: "var(--card-bg-strong)",
      },

      Button: {
        borderRadiusLG: 18,
        fontWeight: 800,
      },

      Input: {
        colorBgContainer: "var(--field-bg)",
        colorBorder: "var(--field-border)",
        borderRadius: 14,
      },

      Select: {
        colorBgContainer: "var(--field-bg)",
        colorBorder: "var(--field-border)",
        borderRadius: 14,
      },
    },
  };
}
