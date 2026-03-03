import axios from "axios";

export async function startVoipCall({ order_id, caller_role, caller_id, callee_role, callee_id, provider = "agora" }) {
  const { data } = await axios.post("/api/voip/start", {
    order_id,
    caller_role,
    caller_id,
    callee_role,
    callee_id,
    provider,
  });
  return data;
}

export async function endVoipCall({ log_id, ended_at, duration_sec }) {
  const { data } = await axios.post("/api/voip/end", {
    log_id,
    ended_at,
    duration_sec,
  });
  return data;
}
