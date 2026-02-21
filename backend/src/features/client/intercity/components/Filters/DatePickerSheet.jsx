import React from "react";
import { Button, Drawer, DatePicker, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useIntercity } from "../../context/IntercityContext";

const { Text } = Typography;

export default function DatePickerSheet() {
  const { travelDate, setTravelDate } = useIntercity();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        icon={<CalendarOutlined />}
        onClick={() => setOpen(true)}
        style={{ borderRadius: 14, height: 44, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
      >
        {travelDate?.format("DD MMM, YYYY")}
      </Button>

      <Drawer
        title="Sana tanlash"
        placement="bottom"
        height={320}
        open={open}
        onClose={() => setOpen(false)}
        bodyStyle={{ paddingBottom: 18 }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Text type="secondary">Qachon yo'lga chiqasiz?</Text>
          <DatePicker
            value={travelDate}
            onChange={(v) => v && setTravelDate(v)}
            disabledDate={(d) => d && d.isBefore(dayjs().startOf("day"))}
            style={{ width: "100%", height: 46, borderRadius: 14 }}
          />
          <Button type="primary" onClick={() => setOpen(false)} style={{ height: 46, borderRadius: 14 }}>
            Tayyor
          </Button>
        </div>
      </Drawer>
    </>
  );
}
