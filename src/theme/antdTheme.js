export function getAntdTheme() {
  return {
    token: {
      colorPrimary: "var(--brand)",
      borderRadius: 12,
      fontFamily: "var(--font-sans)",

      /* Text */
      colorTextBase: "var(--text)",
      colorText: "var(--text)",
      colorTextSecondary: "var(--text-2)",

      /* Layout background */
      colorBgLayout: "var(--bg-layout)",
      colorBgContainer: "var(--bg-elevated)",

      /* Border */
      colorBorder: "rgba(0,0,0,0.08)",
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
        borderRadiusLG: 16,
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
