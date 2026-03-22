import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const ML_URL = process.env.ML_SERVICE_URL || "http://ml-service:8000";

// ── Voice command processor ────────────────────────────────────────
const COMMAND_PATTERNS = {
  uz: [
    { pattern: /taksi.*?([\w\s]+)/i,     intent: "order_taxi",     extract: (m: any) => ({ destination: m[1]?.trim() }) },
    { pattern: /yetkazib ber.*?([\w\s]+)/i, intent: "order_delivery", extract: (m: any) => ({ pickup: m[1]?.trim() }) },
    { pattern: /holat/i,                 intent: "order_status",   extract: () => ({}) },
    { pattern: /bekor qil/i,             intent: "cancel_order",   extract: () => ({}) },
    { pattern: /narx.*?(?:qancha|necha)/i, intent: "get_price",   extract: () => ({}) },
    { pattern: /yaqinroq.*?haydovchi/i,  intent: "nearby_drivers", extract: () => ({}) },
  ],
  ru: [
    { pattern: /такси.*?([\w\s]+)/i,     intent: "order_taxi",     extract: (m: any) => ({ destination: m[1]?.trim() }) },
    { pattern: /доставка.*?([\w\s]+)/i,  intent: "order_delivery", extract: (m: any) => ({ pickup: m[1]?.trim() }) },
    { pattern: /статус/i,               intent: "order_status",   extract: () => ({}) },
    { pattern: /отмен/i,                intent: "cancel_order",   extract: () => ({}) },
    { pattern: /цена|стоимость/i,       intent: "get_price",      extract: () => ({}) },
  ],
};

function parseVoiceCommand(text: string, lang: "uz" | "ru" = "uz") {
  const patterns = COMMAND_PATTERNS[lang] || COMMAND_PATTERNS.uz;
  for (const { pattern, intent, extract } of patterns) {
    const match = text.match(pattern);
    if (match) return { intent, params: extract(match), raw: text, confidence: 0.85 };
  }
  return { intent: "unknown", params: {}, raw: text, confidence: 0.3 };
}

// ── Response templates ─────────────────────────────────────────────
const RESPONSES: Record<string, Record<string, string>> = {
  order_taxi:    { uz: "Taksi buyurtma qilyapman...",     ru: "Заказываю такси..." },
  order_delivery:{ uz: "Yetkazib berish buyurtma qilyapman...", ru: "Оформляю доставку..." },
  order_status:  { uz: "Buyurtma holatini tekshiryapman...", ru: "Проверяю статус заказа..." },
  cancel_order:  { uz: "Buyurtmani bekor qilyapman",      ru: "Отменяю заказ..." },
  get_price:     { uz: "Narxni hisoblayman...",            ru: "Считаю стоимость..." },
  nearby_drivers:{ uz: "Yaqin haydovchilarni qidirmoqda...", ru: "Ищу ближайших водителей..." },
  unknown:       { uz: "Kechirasiz, tushunmadim. Qayta aytib bering.", ru: "Извините, не понял. Повторите." },
};

// ── Endpoints ─────────────────────────────────────────────────────
app.post("/voice/transcribe", async (req, res) => {
  // In production: call Whisper API or local Whisper model
  const { audio_base64, lang = "uz" } = req.body;
  if (!audio_base64) return res.status(400).json({ error: "audio_base64 required" });

  // Stub — in production integrate OpenAI Whisper or faster-whisper
  res.json({
    text:        "Taksi chaqir",
    lang:        lang,
    confidence:  0.92,
    duration_ms: 850,
  });
});

app.post("/voice/parse", (req, res) => {
  const { text, lang = "uz" } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const result = parseVoiceCommand(text, lang as "uz" | "ru");
  const responseText = RESPONSES[result.intent]?.[lang] || RESPONSES.unknown[lang];

  res.json({
    ...result,
    response_text: responseText,
    tts_needed:    true,
  });
});

app.post("/voice/synthesize", async (req, res) => {
  // TTS — in production use ElevenLabs / Google TTS / local TTS
  const { text, lang = "uz", voice = "female" } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  // Stub response — replace with actual TTS API
  res.json({
    text,
    lang,
    audio_url:   null,
    audio_base64:null,
    duration_ms: text.length * 70,
    engine:      "stub",
    note:        "Integrate ElevenLabs or Google TTS for production",
  });
});

// ── Navigation voice guidance ─────────────────────────────────────
app.post("/voice/navigate", (req, res) => {
  const { instruction, lang = "uz", bearing } = req.body;
  const UZ_DIRECTIONS: Record<string, string> = {
    "turn-left":  "Chapga buring",
    "turn-right": "O'ngga buring",
    "straight":   "To'g'ri boring",
    "arrive":     "Manzilga yetib keldingiz",
    "roundabout": "Aylanma chorrahadan chiqing",
  };
  const RU_DIRECTIONS: Record<string, string> = {
    "turn-left":  "Поверните налево",
    "turn-right": "Поверните направо",
    "straight":   "Езжайте прямо",
    "arrive":     "Вы прибыли",
    "roundabout": "Выезжайте с кольца",
  };

  const directions = lang === "ru" ? RU_DIRECTIONS : UZ_DIRECTIONS;
  const text = directions[instruction] || instruction;

  res.json({ instruction, text, lang, bearing });
});

app.get("/health", (_, res) => res.json({ service: "voice", status: "ok" }));

const PORT = Number(process.env.PORT) || 3028;
app.listen(PORT, () => console.warn(`[voice-service] :${PORT}`));
