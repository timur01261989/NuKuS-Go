import React, { memo, useMemo } from "react";
import { Popover, Typography } from "antd";

const { Text } = Typography;

function GuideContent({ guide }) {
  const items = Array.isArray(guide?.items) ? guide.items : [];
  const extra = Array.isArray(guide?.extra) ? guide.extra : [];

  return (
    <div style={{ maxWidth: 360 }}>
      <Text style={{ color: "#f8fafc", fontWeight: 700, display: "block", marginBottom: 8 }}>
        {guide?.title}
      </Text>
      {guide?.intro ? (
        <Text style={{ color: "#cbd5e1", display: "block", marginBottom: 10 }}>
          {guide.intro}
        </Text>
      ) : null}

      {items.map((item) => (
        <div key={item.key || item.title} style={{ marginBottom: 10 }}>
          <Text style={{ color: "#e2e8f0", fontWeight: 600, display: "block" }}>
            {item.title}
          </Text>
          <Text style={{ color: "#94a3b8", display: "block" }}>{item.description}</Text>
        </div>
      ))}

      {extra.length ? (
        <div style={{ marginBottom: 10 }}>
          {extra.map((line, index) => (
            <Text key={`${index}_${line}`} style={{ color: "#cbd5e1", display: "block" }}>
              • {line}
            </Text>
          ))}
        </div>
      ) : null}

      {guide?.footer ? (
        <Text style={{ color: "#7dd3fc", display: "block", marginTop: 4 }}>
          {guide.footer}
        </Text>
      ) : null}
    </div>
  );
}

function CircleGuideHintComponent({ guide }) {
  const content = useMemo(() => <GuideContent guide={guide} />, [guide]);

  return (
    <Popover
      content={content}
      trigger={["click"]}
      placement="topLeft"
      overlayInnerStyle={{
        borderRadius: 16,
        border: "1px solid rgba(148, 163, 184, 0.16)",
        background: "rgba(15, 23, 42, 0.98)",
      }}
    >
      <button
        type="button"
        aria-label={guide?.title || "Tushuntirma"}
        style={{
          width: 20,
          height: 20,
          minWidth: 20,
          borderRadius: "50%",
          border: "1px solid rgba(125, 211, 252, 0.55)",
          background: "rgba(8, 145, 178, 0.18)",
          color: "#67e8f9",
          fontWeight: 800,
          fontSize: 12,
          lineHeight: "18px",
          textAlign: "center",
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.2) inset",
        }}
      >
        !
      </button>
    </Popover>
  );
}

export default memo(CircleGuideHintComponent);
