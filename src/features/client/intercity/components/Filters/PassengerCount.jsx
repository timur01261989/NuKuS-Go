import React from "react";
import { Button, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useIntercity } from "../../context/IntercityContext";
import { useClientText } from "../../shared/i18n_clientLocalize";

const { Text } = Typography;

export default function PassengerCount() {
  const { passengers, setPassengers, selectedSeats, setSelectedSeats } = useIntercity();
  const { cp } = useClientText();

  const set = (n) => {
    setPassengers(n);
    // Agar o'rindiqlar tanlangan bo'lsa, limitdan oshsa kesib tashlaymiz
    if (selectedSeats.length > n) setSelectedSeats(selectedSeats.slice(0, n));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Button
        icon={<UserOutlined />}
        style={{ borderRadius: 14, height: 44, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
      >
        <Text style={{ fontWeight: 700 }}>{passengers} {cp("ta")}</Text>
      </Button>

      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4].map((n) => (
          <Button
            key={n}
            type={passengers === n ? "primary" : "default"}
            onClick={() => set(n)}
            style={{ width: 44, height: 44, borderRadius: 14 }}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}
