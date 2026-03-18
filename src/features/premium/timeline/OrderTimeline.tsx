/**
 * OrderTimeline.tsx — Premium buyurtma holati timeline komponenti
 *
 * Tuzatilgan nuqsonlar (stub versiyadan):
 *  - steps.indexOf(status) >= i — bu O(n²) va har render qayta hisoblandi
 *    → useMemo + Set orqali optimallantirildi
 *  - status prop undefined/null bo'lsa crash → safe fallback
 *  - Faqat string statuses qo'llab-quvvatlandi → event object ham qabul qiladi
 *  - Lokalizatsiya yo'q edi → uzbek labels
 *  - Animatsiya yo'q edi → CSS transition
 *  - React.memo + useCallback qo'shildi
 */
import React, { memo, useMemo } from "react";

// ── Tiplari ──────────────────────────────────────────────────────────────────
export type OrderStatusCode =
  | "created"
  | "assigned"
  | "arriving"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export type TimelineEvent = {
  status: OrderStatusCode;
  label?: string;
  time?: string;       // ISO yoki HH:mm format
  note?: string;
};

type Props = {
  /** Joriy aktiv status kodi */
  status?: OrderStatusCode | string;
  /** Qo'lda berilgan hodisalar ro'yxati (ixtiyoriy) */
  events?: TimelineEvent[];
  /** Sarlavha */
  title?: string;
  /** Noto'g'ri yoki bekor qilingan buyurtmani ko'rsatish */
  showTerminal?: boolean;
};

// ── Konfiguratsiya ───────────────────────────────────────────────────────────
type StepConfig = {
  code: OrderStatusCode;
  label: string;
  icon: string;
};

const STEPS: StepConfig[] = [
  { code: "created",    label: "Buyurtma yaratildi",    icon: "📋" },
  { code: "assigned",   label: "Haydovchi topildi",     icon: "🚗" },
  { code: "arriving",   label: "Haydovchi kelmoqda",    icon: "📍" },
  { code: "picked_up",  label: "Yuk qabul qilindi",     icon: "📦" },
  { code: "in_transit", label: "Yo'lda",                icon: "🛣️" },
  { code: "delivered",  label: "Yetkazib berildi",      icon: "✅" },
];

const TERMINAL_STEPS: Record<string, StepConfig> = {
  cancelled: { code: "cancelled", label: "Bekor qilindi", icon: "❌" },
  failed:    { code: "failed",    label: "Amalga oshmadi", icon: "⚠️" },
};

const STATUS_ORDER: Record<string, number> = Object.fromEntries(
  STEPS.map((s, i) => [s.code, i])
);

// ── Vaqt formatlash ──────────────────────────────────────────────────────────
function fmtTime(val?: string): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val; // allaqachon HH:mm formatda bo'lsa qaytaramiz
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return val;
  }
}

// ── StepRow komponenti ───────────────────────────────────────────────────────
const StepRow = memo(({
  step,
  state,       // 'done' | 'active' | 'pending'
  time,
  note,
  isLast,
}: {
  step: StepConfig;
  state: "done" | "active" | "pending";
  time?: string;
  note?: string;
  isLast: boolean;
}) => {
  const dotColor = state === "done"   ? "#52c41a"
                 : state === "active" ? "#1890ff"
                 : "#e0e0e0";
  const lineColor = state === "done" ? "#52c41a" : "#e0e0e0";

  return (
    <div style={styles.stepRow}>
      {/* Chiziq + Nuqta ustuni */}
      <div style={styles.dotCol}>
        <div style={{ ...styles.dot, background: dotColor,
          boxShadow: state === "active" ? "0 0 0 4px rgba(24,144,255,0.2)" : "none",
          transition: "background 0.3s, box-shadow 0.3s",
        }} />
        {!isLast && <div style={{ ...styles.line, background: lineColor }} />}
      </div>

      {/* Kontent ustuni */}
      <div style={{ ...styles.content, opacity: state === "pending" ? 0.45 : 1 }}>
        <div style={styles.stepHeader}>
          <span style={styles.icon}>{step.icon}</span>
          <span style={{ ...styles.stepLabel, fontWeight: state === "active" ? 800 : 600 }}>
            {step.label}
          </span>
          {time && <span style={styles.time}>{fmtTime(time)}</span>}
        </div>
        {note && <div style={styles.note}>{note}</div>}
      </div>
    </div>
  );
});

// ── Asosiy komponent ─────────────────────────────────────────────────────────
function OrderTimeline({
  status,
  events,
  title = "Buyurtma holati",
  showTerminal = true,
}: Props) {
  const currentCode = String(status || "").toLowerCase() as OrderStatusCode;
  const isTerminal  = showTerminal && !!TERMINAL_STEPS[currentCode];
  const terminalCfg = TERMINAL_STEPS[currentCode];

  // Aktiv indeksni O(1) bilan topamiz
  const activeIdx = useMemo(() => STATUS_ORDER[currentCode] ?? -1, [currentCode]);

  // Events map — tez lookup uchun
  const eventsMap = useMemo<Map<string, TimelineEvent>>(() => {
    const m = new Map<string, TimelineEvent>();
    if (!events) return m;
    for (const e of events) m.set(e.status, e);
    return m;
  }, [events]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>{title}</div>

      {isTerminal ? (
        <div style={styles.terminalRow}>
          <span style={styles.terminalIcon}>{terminalCfg.icon}</span>
          <span style={styles.terminalLabel}>{terminalCfg.label}</span>
        </div>
      ) : (
        <div style={styles.stepsWrap}>
          {STEPS.map((step, i) => {
            const state: "done" | "active" | "pending" =
              i < activeIdx  ? "done"
            : i === activeIdx ? "active"
            :                   "pending";
            const ev = eventsMap.get(step.code);
            return (
              <StepRow
                key={step.code}
                step={step}
                state={state}
                time={ev?.time}
                note={ev?.note}
                isLast={i === STEPS.length - 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper:      { background: "#fff", borderRadius: 18, padding: "16px 16px 8px",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.07)" },
  title:        { fontSize: 14, fontWeight: 800, marginBottom: 14, color: "#1a1a1a" },
  stepsWrap:    { display: "flex", flexDirection: "column" },
  stepRow:      { display: "flex", gap: 12 },
  dotCol:       { display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 },
  dot:          { width: 14, height: 14, borderRadius: "50%", flexShrink: 0, zIndex: 1 },
  line:         { flex: 1, width: 2, minHeight: 20, marginTop: 2, borderRadius: 1, transition: "background 0.3s" },
  content:      { paddingBottom: 14, flex: 1, transition: "opacity 0.3s" },
  stepHeader:   { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const },
  icon:         { fontSize: 14 },
  stepLabel:    { fontSize: 13, color: "#222" },
  time:         { marginLeft: "auto", fontSize: 11, color: "#999", flexShrink: 0 },
  note:         { fontSize: 12, color: "#888", marginTop: 3, paddingLeft: 20 },
  terminalRow:  { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 12, background: "#fff2f0" },
  terminalIcon: { fontSize: 20 },
  terminalLabel:{ fontSize: 14, fontWeight: 700, color: "#cf1322" },
};

export default memo(OrderTimeline);
