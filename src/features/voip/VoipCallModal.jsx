import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Modal, Space, Typography } from "antd";
import AgoraRTC from "agora-rtc-sdk-ng";
import { endVoipCall } from "../../services/voipApi";

const { Text } = Typography;

/**
 * Professional VOIP (Agora Web SDK) - audio-only.
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - session: { ok, provider, app_id, channel, token, uid, log_id, expires_at, error? }
 */
export default function VoipCallModal({ open, onClose, session }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | ending | ended | error
  const [err, setErr] = useState(null);
  const startedAtRef = useRef(null);

  const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function run() {
      setErr(null);

      if (!session?.ok) {
        setStatus("error");
        setErr(session?.error || "VOIP session not ready.");
        return;
      }
      if (session.provider !== "agora") {
        setStatus("error");
        setErr("Unsupported VOIP provider: " + session.provider);
        return;
      }

      setStatus("connecting");
      try {
        // Join channel
        await client.join(session.app_id, session.channel, session.token, session.uid);

        if (cancelled) return;

        // Create microphone track and publish
        const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([micTrack]);

        startedAtRef.current = Date.now();
        setStatus("connected");

        // Cleanup on close/unmount
        return () => {
          try { micTrack.close(); } catch {}
        };
      } catch (e) {
        setStatus("error");
        setErr(e?.message || String(e));
      }
    }

    const cleanupPromise = run();

    return () => {
      cancelled = true;
      // Best-effort leave
      (async () => {
        try {
          const localTracks = client.localTracks || [];
          for (const t of localTracks) {
            try { t.stop(); } catch {}
            try { t.close(); } catch {}
          }
          await client.leave();
        } catch {}
      })();
      // also call any cleanup returned from run()
      if (cleanupPromise && typeof cleanupPromise.then === "function") {
        cleanupPromise.then((cleanup) => {
          if (typeof cleanup === "function") cleanup();
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.ok, session?.token, session?.channel, session?.uid, session?.app_id]);

  async function handleEnd() {
    if (!session?.log_id) {
      onClose?.();
      return;
    }
    setStatus("ending");
    const duration_sec = startedAtRef.current ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)) : null;
    try {
      await endVoipCall({ log_id: session.log_id, duration_sec });
    } catch {
      // ignore, do not block closing
    }
    try {
      const localTracks = client.localTracks || [];
      for (const t of localTracks) {
        try { t.stop(); } catch {}
        try { t.close(); } catch {}
      }
      await client.leave();
    } catch {}
    setStatus("ended");
    onClose?.();
  }

  return (
    <Modal
      open={open}
      title="In-app Call"
      onCancel={handleEnd}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {status === "error" && (
          <Alert type="error" showIcon message="VOIP error" description={err || "Unknown error"} />
        )}
        {status !== "error" && (
          <>
            <Text type="secondary">
              Provider: {session?.provider || "agora"} • Channel: {session?.channel || "-"}
            </Text>
            <Text>
              Status: <b>{status}</b>
            </Text>
            {session?.expires_at && (
              <Text type="secondary">Token expires at: {new Date(session.expires_at).toLocaleString()}</Text>
            )}
          </>
        )}

        <Space>
          <Button danger onClick={handleEnd} disabled={status === "ending"}>
            End call
          </Button>
          <Button onClick={onClose} disabled={status === "ending"}>
            Hide
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
