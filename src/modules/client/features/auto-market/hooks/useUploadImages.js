// Supabase Storage uploader (fallback: local preview)
import { useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient.js";

const SB_READY =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

const BUCKET = "auto-market";

function safeExt(name = "") {
  const i = name.lastIndexOf(".");
  if (i === -1) return "jpg";
  return name.slice(i + 1).toLowerCase() || "jpg";
}

export default function useUploadImages() {
  const [uploading, setUploading] = useState(false);

  async function upload(files = []) {
    setUploading(true);
    try {
      // Fallback: local preview urls
      if (!SB_READY) {
        return files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        // Still allow local preview, but mark as not-uploaded
        return files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), local_only: true }));
      }

      const uploaded = [];
      for (const f of files) {
        const ext = safeExt(f.name);
        const filename = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(filename, f, {
          cacheControl: "3600",
          upsert: false,
        });

        if (error) {
          // If bucket doesn't exist yet, fallback to local
          const msg = String(error.message || "").toLowerCase();
          if (msg.includes("bucket") || msg.includes("not found")) {
            uploaded.push({ name: f.name, url: URL.createObjectURL(f), local_only: true });
            continue;
          }
          throw error;
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
        uploaded.push({ name: f.name, url: data.publicUrl });
      }
      return uploaded;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
