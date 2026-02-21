import React from "react";
import { Alert, Progress } from "antd";
import { useAiProcess } from "../../../context/AiProcessContext";

function StepRow({ label, step }) {
  const status = step?.status || "queued";
  const color =
    status === "done" ? "green" : status === "running" ? "blue" : status === "error" ? "red" : "default";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
      <span>{label}</span>
      <span style={{ color: color === "default" ? "#64748b" : color }}>
        {status}
      </span>
    </div>
  );
}

export default function AiPipelineStatus() {
  const { state } = useAiProcess();

  if (state.status === "idle") return null;

  return (
    <div style={{ marginTop: 12 }}>
      {state.status === "error" ? (
        <Alert type="error" message={state.error || "AI xatolik"} showIcon />
      ) : (
        <>
          <Alert
            type={state.status === "done" ? "success" : "info"}
            message={state.status === "done" ? "AI tayyor" : "AI tahlil qilinmoqda..."}
            description={state.status === "done" ? "Natijalar yangilandi." : "Orqa fonda ishlayapti, davom etavering."}
            showIcon
          />
          <div style={{ marginTop: 10 }}>
            <Progress percent={state.progress} />
            <StepRow label="Studio mode" step={state.steps?.studio} />
            <StepRow label="Damage detection" step={state.steps?.damage} />
            <StepRow label="Recognition / Visual search" step={state.steps?.recognition} />
          </div>
        </>
      )}
    </div>
  );
}
