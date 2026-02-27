import React from "react";
import { Card, Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";

/**
 * PhotoGallery - mashinani rasmga olish/yuklash (mijoz ishonishi uchun).
 * Bu yerda upload faqat local preview. Serverga yuborishni xohlasangiz apiHelper bilan qo'shasiz.
 */
export default function PhotoGallery({ photos, onChange }) {
  const fileList = photos || [];

  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Mashina rasmlari</div>
      <Upload
        listType="picture-card"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList: next }) => {
          if (next.length > 8) {
            message.warning("Ko'pi bilan 8 ta rasm");
            return;
          }
          onChange?.(next);
        }}
      >
        {fileList.length >= 8 ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 6, fontSize: 12 }}>Qo'shish</div>
          </div>
        )}
      </Upload>
    </Card>
  );
}
