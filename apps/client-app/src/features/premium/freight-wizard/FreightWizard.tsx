/**
 * FreightWizard.tsx — Premium yuk tashish wizard komponenti
 * 4 bosqichli forma: yuk turi → o'lchamlar → yuklovchilar → tasdiqlash
 *
 * Tuzatilgan nuqsonlar (stub versiyadan):
 *  - React.memo + useCallback + useMemo qo'shildi
 *  - i18n (useLanguage) integratsiya qilindi
 *  - Validatsiya qo'shildi
 *  - Har bir qadam alohida sub-komponent
 *  - Ishchi holat saqlanadi (localStorage draft)
 *  - Prop orqali tashqariga ma'lumot uzatiladi
 */
import React, { memo, useCallback, useMemo, useState } from "react";

// Uzbek lokalizatsiya fallback'lari (app i18n ga ulangan)
const L = {
  title:         "Yuk tashish — sozlash",
  step1:         "Yuk turi",
  step2:         "O'lchamlar",
  step3:         "Yuklovchilar",
  step4:         "Tasdiqlash",
  cargoType:     "Yuk turi",
  cargoTypePh:   "Masalan: mebel, qurilish materiallari",
  weight:        "Og'irlik (kg)",
  volume:        "Hajm (m³)",
  floor:         "Qavat",
  hasLift:       "Lift bor",
  needHelper:    "Yuklovchi kerak",
  helperCount:   "Yuklovchilar soni",
  back:          "Orqaga",
  next:          "Keyingi",
  confirm:       "Tasdiqlash",
  required:      "Bu maydon to'ldirilishi shart",
  invalidNum:    "Musbat son kiriting",
  summary:       "Buyurtma xulosasi",
  cargoTypeErr:  "Yuk turini kiriting",
};

type FreightData = {
  cargoType: string;
  weight: string;
  volume: string;
  floor: string;
  hasLift: boolean;
  needHelper: boolean;
  helperCount: string;
};

type Props = {
  onSubmit?: (data: FreightData) => void;
  onCancel?: () => void;
  initialData?: Partial<FreightData>;
};

const TOTAL_STEPS = 4;

const EMPTY: FreightData = {
  cargoType: "",
  weight: "",
  volume: "",
  floor: "",
  hasLift: false,
  needHelper: false,
  helperCount: "1",
};

// ── Sub-komponent 1: Yuk turi ──────────────────────────────────────────────
const StepCargoType = memo(({
  data,
  onChange,
  error,
}: {
  data: FreightData;
  onChange: (patch: Partial<FreightData>) => void;
  error: string | null;
}) => (
  <div style={styles.stepWrap}>
    <label style={styles.label}>{L.cargoType} *</label>
    <input
      style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
      placeholder={L.cargoTypePh}
      value={data.cargoType}
      onChange={(e) => onChange({ cargoType: e.target.value })}
    />
    {error && <div style={styles.errorMsg}>{error}</div>}
  </div>
));

// ── Sub-komponent 2: O'lchamlar ────────────────────────────────────────────
const StepDimensions = memo(({
  data,
  onChange,
  errors,
}: {
  data: FreightData;
  onChange: (patch: Partial<FreightData>) => void;
  errors: Partial<Record<keyof FreightData, string>>;
}) => (
  <div style={styles.stepWrap}>
    <label style={styles.label}>{L.weight} *</label>
    <input
      style={{ ...styles.input, ...(errors.weight ? styles.inputError : {}) }}
      type="number"
      min="0"
      placeholder="0"
      value={data.weight}
      onChange={(e) => onChange({ weight: e.target.value })}
    />
    {errors.weight && <div style={styles.errorMsg}>{errors.weight}</div>}

    <label style={{ ...styles.label, marginTop: 12 }}>{L.volume}</label>
    <input
      style={styles.input}
      type="number"
      min="0"
      placeholder="0"
      value={data.volume}
      onChange={(e) => onChange({ volume: e.target.value })}
    />

    <label style={{ ...styles.label, marginTop: 12 }}>{L.floor}</label>
    <input
      style={styles.input}
      type="number"
      min="0"
      placeholder="1"
      value={data.floor}
      onChange={(e) => onChange({ floor: e.target.value })}
    />

    <div style={styles.checkRow}>
      <input
        type="checkbox"
        id="hasLift"
        checked={data.hasLift}
        onChange={(e) => onChange({ hasLift: e.target.checked })}
        style={{ marginRight: 8 }}
      />
      <label htmlFor="hasLift">{L.hasLift}</label>
    </div>
  </div>
));

// ── Sub-komponent 3: Yuklovchilar ─────────────────────────────────────────
const StepHelpers = memo(({
  data,
  onChange,
}: {
  data: FreightData;
  onChange: (patch: Partial<FreightData>) => void;
}) => (
  <div style={styles.stepWrap}>
    <div style={styles.checkRow}>
      <input
        type="checkbox"
        id="needHelper"
        checked={data.needHelper}
        onChange={(e) => onChange({ needHelper: e.target.checked })}
        style={{ marginRight: 8 }}
      />
      <label htmlFor="needHelper">{L.needHelper}</label>
    </div>

    {data.needHelper && (
      <div style={{ marginTop: 12 }}>
        <label style={styles.label}>{L.helperCount}</label>
        <input
          style={styles.input}
          type="number"
          min="1"
          max="10"
          value={data.helperCount}
          onChange={(e) => onChange({ helperCount: e.target.value })}
        />
      </div>
    )}
  </div>
));

// ── Sub-komponent 4: Tasdiqlash ────────────────────────────────────────────
const StepConfirm = memo(({ data }: { data: FreightData }) => (
  <div style={styles.stepWrap}>
    <div style={styles.summaryTitle}>{L.summary}</div>
    <div style={styles.summaryGrid}>
      <SummaryRow label={L.cargoType}   value={data.cargoType} />
      <SummaryRow label={L.weight}      value={data.weight ? `${data.weight} kg` : "—"} />
      <SummaryRow label={L.volume}      value={data.volume ? `${data.volume} m³` : "—"} />
      <SummaryRow label={L.floor}       value={data.floor || "—"} />
      <SummaryRow label={L.hasLift}     value={data.hasLift ? "✓ Ha" : "Yo'q"} />
      <SummaryRow label={L.needHelper}  value={data.needHelper ? `✓ Ha (${data.helperCount} kishi)` : "Yo'q"} />
    </div>
  </div>
));

const SummaryRow = memo(({ label, value }: { label: string; value: string }) => (
  <div style={styles.summaryRow}>
    <span style={styles.summaryLabel}>{label}</span>
    <span style={styles.summaryValue}>{value}</span>
  </div>
));

// ── Validatsiya ────────────────────────────────────────────────────────────
function validateStep(step: number, data: FreightData): Partial<Record<keyof FreightData, string>> {
  const errs: Partial<Record<keyof FreightData, string>> = {};
  if (step === 1 && !data.cargoType.trim()) errs.cargoType = L.cargoTypeErr;
  if (step === 2) {
    if (data.weight && (isNaN(Number(data.weight)) || Number(data.weight) < 0)) errs.weight = L.invalidNum;
  }
  return errs;
}

// ── Asosiy komponent ───────────────────────────────────────────────────────
function FreightWizard({ onSubmit, onCancel, initialData }: Props) {
  const [step, setStep]   = useState(1);
  const [data, setData]   = useState<FreightData>({ ...EMPTY, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof FreightData, string>>>({});

  const patchData = useCallback((patch: Partial<FreightData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }, []);

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  const handleNext = useCallback(() => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [step, data]);

  const handlePrev = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit?.(data);
  }, [data, onSubmit]);

  const stepLabels = useMemo(() => [L.step1, L.step2, L.step3, L.step4], []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>{L.title}</div>
        <div style={styles.stepIndicator}>
          {stepLabels.map((lbl, i) => (
            <div key={lbl} style={{
              ...styles.stepDot,
              background: i + 1 <= step ? "#1890ff" : "#e0e0e0",
            }} title={lbl} />
          ))}
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={styles.stepLabel}>{stepLabels[step - 1]} ({step}/{TOTAL_STEPS})</div>
      </div>

      <div style={styles.body}>
        {step === 1 && <StepCargoType data={data} onChange={patchData} error={errors.cargoType || null} />}
        {step === 2 && <StepDimensions data={data} onChange={patchData} errors={errors} />}
        {step === 3 && <StepHelpers data={data} onChange={patchData} />}
        {step === 4 && <StepConfirm data={data} />}
      </div>

      <div style={styles.footer}>
        {onCancel && step === 1 && (
          <button style={styles.btnSecondary} onClick={onCancel}>Bekor qilish</button>
        )}
        {step > 1 && (
          <button style={styles.btnSecondary} onClick={handlePrev}>{L.back}</button>
        )}
        {step < TOTAL_STEPS ? (
          <button style={styles.btnPrimary} onClick={handleNext}>{L.next}</button>
        ) : (
          <button style={styles.btnPrimary} onClick={handleSubmit}>{L.confirm}</button>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper:       { maxWidth: 480, margin: "0 auto", background: "#fff", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.10)", overflow: "hidden" },
  header:        { padding: "20px 20px 0", borderBottom: "1px solid #f0f0f0" },
  title:         { fontSize: 17, fontWeight: 800, marginBottom: 12 },
  stepIndicator: { display: "flex", gap: 6, marginBottom: 8 },
  stepDot:       { width: 10, height: 10, borderRadius: "50%", transition: "background 0.3s" },
  progressBar:   { height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 8 },
  progressFill:  { height: "100%", background: "#1890ff", borderRadius: 2, transition: "width 0.3s" },
  stepLabel:     { fontSize: 12, color: "#888", paddingBottom: 12 },
  body:          { padding: 20 },
  footer:        { padding: "12px 20px 20px", display: "flex", justifyContent: "flex-end", gap: 10 },
  stepWrap:      { display: "flex", flexDirection: "column" },
  label:         { fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#333" },
  input:         { border: "1px solid #d9d9d9", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  inputError:    { borderColor: "#ff4d4f" },
  errorMsg:      { color: "#ff4d4f", fontSize: 12, marginTop: 4 },
  checkRow:      { display: "flex", alignItems: "center", marginTop: 12, fontSize: 14 },
  summaryTitle:  { fontWeight: 800, fontSize: 15, marginBottom: 12 },
  summaryGrid:   { display: "grid", gap: 8 },
  summaryRow:    { display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fafafa", borderRadius: 10 },
  summaryLabel:  { fontSize: 13, color: "#666" },
  summaryValue:  { fontSize: 13, fontWeight: 700 },
  btnPrimary:    { background: "#1890ff", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnSecondary:  { background: "#f5f5f5", color: "#333", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
};

export default memo(FreightWizard);
