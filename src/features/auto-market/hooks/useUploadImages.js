// Demo uploader: real projectda Supabase Storage / S3 ishlatasiz.
import { useState } from "react";

export default function useUploadImages() {
  const [uploading, setUploading] = useState(false);

  async function upload(files = []) {
    setUploading(true);
    try {
      // fake delay
      await new Promise(r => setTimeout(r, 600));
      // local preview URLs
      return files.map(f => ({
        name: f.name,
        url: URL.createObjectURL(f),
      }));
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
