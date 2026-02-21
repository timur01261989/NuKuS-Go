export default function CenterPin({ visible, isMoving }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -100%)",
        zIndex: 1001,
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          transform: isMoving ? "scale(0.9)" : "scale(1)",
          transition: "transform 140ms ease"
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#111",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)"
          }}
        />
        <div style={{ width: 2, height: 24, background: "#111", margin: "0 auto" }} />
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid #111",
            background: "rgba(0,0,0,0.08)",
            marginTop: -6
          }}
        />
      </div>
    </div>
  );
}
