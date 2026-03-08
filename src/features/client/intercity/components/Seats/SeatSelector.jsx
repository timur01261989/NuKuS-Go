import React, { useMemo } from "react";
import { Button, Typography, message } from "antd";
import { useIntercity } from "../../context/IntercityContext";
import { useClientText } from "../../shared/i18n_clientLocalize";
import Legend from "./Legend";

const { Text } = Typography;

/**
 * Oddiy salon sxemasi:
 *   [A1] [A2]
 *   [B1] [B2]
 * driver seat bor, lekin tanlanmaydi
 */

const SEATS = ["A1", "A2", "B1", "B2"];

export default function SeatSelector({ busySeats = [] }) {
  const { passengers, selectedSeats, setSelectedSeats } = useIntercity();
  const { cp } = useClientText();

  const busy = useMemo(() => new Set(busySeats), [busySeats]);
  const mine = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  const toggle = (id) => {
    if (busy.has(id)) return;

    if (mine.has(id)) {
      setSelectedSeats(selectedSeats.filter((x) => x !== id));
      return;
    }

    if (selectedSeats.length >= passengers) {
      message.warning(`${cp("Maksimal")} ${passengers} ${cp("ta")} ${cp("O'rindiq tanlash")}`);
      return;
    }

    setSelectedSeats([...selectedSeats, id]);
  };

  const SeatBtn = ({ id }) => {
    const isBusy = busy.has(id);
    const isMine = mine.has(id);

    return (
      <Button
        onClick={() => toggle(id)}
        disabled={isBusy}
        style={{
          height: 54,
          borderRadius: 14,
          border: isMine ? "1px solid #1677ff" : "1px solid #e6e6e6",
          background: isMine ? "#1677ff" : isBusy ? "rgba(0,0,0,0.08)" : "#fff",
          color: isMine ? "#fff" : "#111",
          fontWeight: 800,
        }}
      >
        {id}
      </Button>
    );
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontWeight: 800 }}>{cp("O'rindiq tanlash")}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {cp("Tanlangan:")} {selectedSeats.length}/{passengers}
        </Text>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {SEATS.map((id) => (
          <SeatBtn key={id} id={id} />
        ))}
      </div>

      <Legend />
    </div>
  );
}
