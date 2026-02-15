
import { useCallback, useState } from "react";
import { uploadImages } from "../services/marketApi";

export default function useUploadImages() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).map((x) => x.originFileObj || x).filter(Boolean);
    setUploading(true);
    try {
      const urls = await uploadImages(files);
      return urls || [];
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, upload };
}
