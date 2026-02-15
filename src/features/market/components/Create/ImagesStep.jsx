
import React from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useCreateAd } from "../../context/CreateAdContext";
import useUploadImages from "../../hooks/useUploadImages";

export default function ImagesStep() {
  const { ad, patch } = useCreateAd();
  const { uploading, upload } = useUploadImages();

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 10, fontWeight: 700 }}>
        Rasmlar (1-8 dona)
      </div>

      <Upload
        listType="picture-card"
        multiple
        maxCount={8}
        beforeUpload={() => false}
        onChange={async ({ fileList }) => {
          // upload on demand
          const urls = await upload(fileList);
          if (urls?.length) {
            patch({ photos: urls });
          } else {
            message.info("Rasm yuklash demo rejimda ishlayapti.");
          }
        }}
      >
        <Button icon={<UploadOutlined />} loading={uploading}>Yuklash</Button>
      </Upload>

      {ad.photos?.length ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
          Tanlangan: {ad.photos.length} ta
        </div>
      ) : null}
    </div>
  );
}
