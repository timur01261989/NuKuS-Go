/**
 * RecipientForm.tsx — Premium qabul qiluvchi forma
 *
 * Tuzatilgan nuqsonlar (stub versiyadan):
 *  - Holat saqlanmaydi edi (onChange yo'q) → onChange prop orqali chiqarildi
 *  - Telefon validatsiyasi yo'q edi → +998 mask + regex
 *  - Ism validatsiyasi yo'q edi → min 2 belgi
 *  - React.memo + useCallback + useMemo qo'shildi
 *  - Accessibility: label, aria-invalid, aria-describedby
 *  - i18n fallback'lar qo'shildi
 */
import React, { memo, useCallback, useMemo, useState } from "react";

// ── Tiplari ─────────────────────────────────────────────────────────────────
export type RecipientData = {
  name: string;
  phone: string;
  note: string;
};

type Props = {
  value?: Partial<RecipientData>;
  onChange?: (data: RecipientData) => void;
  /** Forma naqshini o'zgartirish: 'full' yoki 'compact' */
  variant?: "full" | "compact";
  disabled?: boolean;
};

// ── Validatsiya ──────────────────────────────────────────────────────────────
const PHONE_RE = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

function validateRecipient(data: RecipientData): Partial<Record<keyof RecipientData, string>> {
  const errs: Partial<Record<keyof RecipientData, string>> = {};
  if (!data.name.trim() || data.name.trim().length < 2) errs.name = "Ism kamida 2 ta belgi bo'lishi kerak";
  if (!data.phone.trim()) errs.phone = "Telefon raqami kiritilishi shart";
  else if (!PHONE_RE.test(data.phone.replace(/\s/g, ""))) errs.phone = "Noto'g'ri format. Masalan: +998 90 123 45 67";
  return errs;
}

// ── Telefon formatlash ───────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  // +998 XX XXX XX XX formatiga keltiradi
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "+998 ";
  const uz = digits.startsWith("998") ? digits : "998" + digits.replace(/^0/, "");
  const d = uz.slice(3, 13); // max 10 raqam
  let out = "+998";
  if (d.length > 0) out += " " + d.slice(0, 2);
  if (d.length > 2) out += " " + d.slice(2, 5);
  if (d.length > 5) out += " " + d.slice(5, 7);
  if (d.length > 7) out += " " + d.slice(7, 9);
  return out;
}

// ── FieldRow helper ──────────────────────────────────────────────────────────
const FieldRow = memo(({
  id, label, required, error, children,
}: {
  id: string; label: string; required?: boolean;
  error?: string; children: React.ReactNode;
}) => (
  <div style={styles.field}>
    <label htmlFor={id} style={styles.label}>
      {label}{required && <span style={styles.req}> *</span>}
    </label>
    {children}
    {error && <div id={`${id}-err`} role="alert" style={styles.errMsg}>{error}</div>}
  </div>
));

// ── Asosiy komponent ─────────────────────────────────────────────────────────
function RecipientForm({ value, onChange, variant = "full", disabled = false }: Props) {
  const [touched, setTouched] = useState<Partial<Record<keyof RecipientData, boolean>>>({});

  const data: RecipientData = useMemo(() => ({
    name:  value?.name  ?? "",
    phone: value?.phone ?? "+998 ",
    note:  value?.note  ?? "",
  }), [value]);

  const errors = useMemo(() => validateRecipient(data), [data]);

  const handleChange = useCallback((field: keyof RecipientData, raw: string) => {
    const next: RecipientData = { ...data, [field]: field === "phone" ? formatPhone(raw) : raw };
    onChange?.(next);
  }, [data, onChange]);

  const handleBlur = useCallback((field: keyof RecipientData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const nameErr  = touched.name  ? errors.name  : undefined;
  const phoneErr = touched.phone ? errors.phone : undefined;

  return (
    <div style={{ ...styles.wrapper, ...(variant === "compact" ? styles.compact : {}) }}>
      <div style={styles.sectionTitle}>Qabul qiluvchi</div>

      <FieldRow id="rcpt-name" label="Ism Familiya" required error={nameErr}>
        <input
          id="rcpt-name"
          style={{ ...styles.input, ...(nameErr ? styles.inputErr : {}) }}
          placeholder="Masalan: Aziz Karimov"
          value={data.name}
          disabled={disabled}
          aria-invalid={!!nameErr}
          aria-describedby={nameErr ? "rcpt-name-err" : undefined}
          onChange={e => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
        />
      </FieldRow>

      <FieldRow id="rcpt-phone" label="Telefon raqami" required error={phoneErr}>
        <input
          id="rcpt-phone"
          type="tel"
          inputMode="tel"
          style={{ ...styles.input, ...(phoneErr ? styles.inputErr : {}) }}
          placeholder="+998 90 123 45 67"
          value={data.phone}
          disabled={disabled}
          aria-invalid={!!phoneErr}
          aria-describedby={phoneErr ? "rcpt-phone-err" : undefined}
          onChange={e => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
        />
      </FieldRow>

      {variant === "full" && (
        <FieldRow id="rcpt-note" label="Izoh (ixtiyoriy)">
          <textarea
            id="rcpt-note"
            style={styles.textarea}
            placeholder="Masalan: 3-qavat, qo'ng'iroq qiling"
            value={data.note}
            disabled={disabled}
            rows={3}
            onChange={e => handleChange("note", e.target.value)}
          />
        </FieldRow>
      )}

      {/* Validatsiya holati — tashqi foydalanuvchi uchun ochiq signal */}
      {Object.keys(errors).length === 0 && (touched.name || touched.phone) && (
        <div style={styles.validOk}>✓ Ma'lumotlar to'g'ri</div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper:      { display: "flex", flexDirection: "column", gap: 14, padding: 16,
                  background: "#fff", borderRadius: 18,
                  boxShadow: "0 4px 18px rgba(0,0,0,0.07)" },
  compact:      { padding: 10, gap: 10, boxShadow: "none", border: "1px solid #f0f0f0" },
  sectionTitle: { fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 },
  field:        { display: "flex", flexDirection: "column", gap: 4 },
  label:        { fontSize: 13, fontWeight: 600, color: "#444" },
  req:          { color: "#ff4d4f" },
  input:        { border: "1px solid #d9d9d9", borderRadius: 10, padding: "10px 12px",
                  fontSize: 14, outline: "none", transition: "border-color 0.2s",
                  width: "100%", boxSizing: "border-box" as const },
  inputErr:     { borderColor: "#ff4d4f", background: "#fff2f0" },
  textarea:     { border: "1px solid #d9d9d9", borderRadius: 10, padding: "10px 12px",
                  fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit",
                  width: "100%", boxSizing: "border-box" as const },
  errMsg:       { fontSize: 12, color: "#ff4d4f", marginTop: 2 },
  validOk:      { fontSize: 12, color: "#52c41a", fontWeight: 600 },
};

// Export: ixtiyoriy validatsiya funksiyasi ham eksport qilinadi
export { validateRecipient };
export default memo(RecipientForm);
