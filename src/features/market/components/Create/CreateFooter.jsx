
import React, { useMemo } from "react";
import { Button } from "antd";
import { useCreateAd } from "../../context/CreateAdContext";

export default function CreateFooter({ totalSteps, onSubmit }) {
  const { step, setStep } = useCreateAd();

  const isLast = useMemo(() => step >= totalSteps - 1, [step, totalSteps]);

  return (
    <div style={{
      position: "sticky", bottom: 0, zIndex: 20,
      background: "white", borderTop: "1px solid #f0f0f0",
      padding: 12, display: "flex", gap: 10
    }}>
      <Button
        disabled={step <= 0}
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        style={{ borderRadius: 12, flex: 1 }}
      >
        Orqaga
      </Button>
      <Button
        type="primary"
        onClick={() => {
          if (isLast) onSubmit?.();
          else setStep((s) => Math.min(totalSteps - 1, s + 1));
        }}
        style={{ borderRadius: 12, flex: 1 }}
      >
        {isLast ? "Yaratish" : "Keyingi"}
      </Button>
    </div>
  );
}
