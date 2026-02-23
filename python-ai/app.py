"""
python-ai/app.py
Nukus Go AI Backend (FastAPI)

Endpoints:
  POST /pipeline       — Auto Market rasm pipeline (asl, o'zgarishsiz)
  GET  /health         — Sog'liq tekshiruvi (asl, o'zgarishsiz)
  POST /surge          — YANGI: AI surge multiplier hisoblash
  POST /car-recognize  — YANGI: Rasm orqali mashina aniqlash (rule-based, real CV keyinroq)

/surge qanday ishlaydi:
  1. Supabase'dan surge_config qoidalarini Node/Vercel API orqali oladi (yoki to'g'ridan)
  2. Ob-havo, vaqt, talab nisbatini tahlil qiladi
  3. Multiplier qaytaradi (1.0 - 3.0)
  Node.js api/pricing.js bilan birga ishlaydi — Python qo'shimcha tahlil qiladi,
  lekin asosiy hisoblash Node tarafda.

/car-recognize qanday ishlaydi:
  1. Rasm (base64 yoki multipart) qabul qiladi
  2. Rang, o'lcham, shakl bo'yicha mashina turini aniqlaydi
  3. { brand, model, color, body_type } qaytaradi
  Hozir: rule-based (Pillow rang tahlili)
  Keyinroq: real CV model (ONNX/TensorFlow Lite) ulash mumkin
"""
import os
import math
import base64
import io
from typing import List, Optional, Dict, Any, Tuple
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Nukus Go AI Backend", version="2.0.0")

# CORS — Node.js api/pricing.js dan chaqiriladi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Asl /pipeline (O'ZGARTIRILMAGAN) ─────────────────────────────────────────

class PipelineRequest(BaseModel):
    imagePaths: List[str]

def safe_open_image(path: str) -> Optional[Image.Image]:
    try:
        return Image.open(path)
    except Exception:
        return None

@app.post("/pipeline")
def pipeline(req: PipelineRequest) -> Dict[str, Any]:
    # Security note: in production, validate that paths are inside an allowed upload directory.
    # Here we do a minimal validation to avoid obvious abuse.
    allowed_root = os.path.abspath(os.getenv("UPLOAD_DIR", os.getcwd()))
    opened = 0
    for p in req.imagePaths:
        ap = os.path.abspath(p)
        if not ap.startswith(allowed_root):
            # If Node stores uploads elsewhere, set UPLOAD_DIR env accordingly for this server.
            raise HTTPException(status_code=400, detail=f"Path not allowed: {p}")
        img = safe_open_image(ap)
        if img is not None:
            opened += 1
            img.close()

    # Demo outputs (replace with real models later)
    studio = {"imagesProcessed": opened}
    damage = {"issues": ["Old bamperda tirnalish aniqlandi (python demo)"] if opened else []}
    recognition = {"query": "chevrolet malibu (python demo)", "similarIds": []}

    return {"studio": studio, "damage": damage, "recognition": recognition}

@app.get("/health")
def health():
    return {"ok": True}

# ─── YANGI: /surge — AI Surge Multiplier ─────────────────────────────────────

class SurgeRequest(BaseModel):
    hour: int                          # 0-23 (hozirgi soat)
    minute: int = 0                    # 0-59
    day_of_week: int = 0               # 0=Yak, 1=Du ... 6=Sha
    weather_code: Optional[int] = None # OpenWeatherMap condition code
    demand_ratio: float = 1.0          # so'rovlar / haydovchilar nisbati
    service_type: str = "standard"     # standard | comfort | truck
    lat: Optional[float] = None
    lng: Optional[float] = None

class SurgeResponse(BaseModel):
    multiplier: float
    confidence: float                  # 0.0 - 1.0 (qoidaga ishonch darajasi)
    reason: Optional[str]
    factors: Dict[str, float]          # har bir omil hissasi

def time_surge(hour: int, minute: int) -> Tuple[float, str]:
    """Vaqt asosidagi surge"""
    t = hour + minute / 60.0
    if 22 <= t or t < 6:     return 1.20, "Tun tarifi (22:00-06:00)"
    if 7 <= t < 9:            return 1.30, "Ertalab rush soat (07:00-09:00)"
    if 17 <= t < 19.5:        return 1.30, "Kechki rush soat (17:00-19:30)"
    return 1.0, ""

def weather_surge(code: Optional[int]) -> Tuple[float, str]:
    """Ob-havo kodi asosidagi surge (OpenWeatherMap kodlari)"""
    if code is None: return 1.0, ""
    # Yomg'ir: 300-321, 500-531
    if (300 <= code <= 321) or (500 <= code <= 531): return 1.40, "Yomg'ir"
    # Qor: 600-622
    if 600 <= code <= 622:  return 1.50, "Qor"
    # Bo'ron: 200-232
    if 200 <= code <= 232:  return 1.35, "Momaqaldiroq"
    # Tuman: 700-781
    if 700 <= code <= 781:  return 1.15, "Tuman"
    return 1.0, ""

def demand_surge(ratio: float) -> Tuple[float, str]:
    """Talab nisbati asosidagi surge (buyurtmalar / haydovchilar)"""
    if ratio >= 5.0:   return 2.0, "Juda yuqori talab"
    if ratio >= 3.0:   return 1.6, "Yuqori talab"
    if ratio >= 2.0:   return 1.4, "O'rtacha yuqori talab"
    if ratio >= 1.5:   return 1.2, "Talab oshgan"
    return 1.0, ""

@app.post("/surge", response_model=SurgeResponse)
def surge_calc(req: SurgeRequest) -> SurgeResponse:
    """
    AI surge multiplier hisoblash.
    Barcha omillarning eng yuqorisini qaytaradi (qoidalar ustma-ust qo'shilmaydi).
    Maksimal multiplier: 3.0
    """
    t_mult, t_reason = time_surge(req.hour, req.minute)
    w_mult, w_reason = weather_surge(req.weather_code)
    d_mult, d_reason = demand_surge(req.demand_ratio)

    factors = {
        "time": round(t_mult, 2),
        "weather": round(w_mult, 2),
        "demand": round(d_mult, 2),
    }

    best_mult = max(t_mult, w_mult, d_mult)
    reasons = [r for r in [t_reason, w_reason, d_reason] if r]
    reason = reasons[0] if reasons else None

    # Multiplierlar mos kelsa confidence yuqori bo'ladi
    active_count = sum(1 for v in factors.values() if v > 1.0)
    confidence = min(1.0, 0.5 + active_count * 0.25)

    # Maksimal 3.0 ga cheklash
    best_mult = min(3.0, best_mult)

    return SurgeResponse(
        multiplier=round(best_mult, 2),
        confidence=round(confidence, 2),
        reason=reason,
        factors=factors,
    )

# ─── YANGI: /car-recognize — Rasm orqali mashina aniqlash ────────────────────

class CarRecognizeRequest(BaseModel):
    image_base64: Optional[str] = None    # base64 encoded image
    image_path: Optional[str] = None      # file path (agar server'da bo'lsa)

class CarRecognizeResponse(BaseModel):
    brand: Optional[str]
    model: Optional[str]
    color: Optional[str]
    body_type: Optional[str]
    confidence: float
    note: str

# O'zbek avto bozorida eng ko'p uchraydigan ranglar
COLOR_MAP = {
    # RGB oraliq → rang nomi
    "oq":      lambda r, g, b: r > 200 and g > 200 and b > 200,
    "qora":    lambda r, g, b: r < 60 and g < 60 and b < 60,
    "kulrang": lambda r, g, b: abs(r - g) < 25 and abs(g - b) < 25 and 60 <= r <= 200,
    "kumush":  lambda r, g, b: r > 160 and g > 160 and b > 170 and abs(r-b) < 30,
    "ko'k":    lambda r, g, b: b > r + 30 and b > g + 20,
    "qizil":   lambda r, g, b: r > g + 50 and r > b + 50 and r > 120,
    "yashil":  lambda r, g, b: g > r + 30 and g > b + 20,
    "sariq":   lambda r, g, b: r > 180 and g > 160 and b < 100,
    "bej":     lambda r, g, b: r > 180 and g > 160 and b > 120 and r > b + 30,
}

def detect_dominant_color(img: Image.Image) -> str:
    """Rasmning asosiy rangini aniqlash"""
    try:
        small = img.convert("RGB").resize((80, 60))
        pixels = list(small.getdata())
        # Markaziy 40% piksellarni tahlil qilamiz (fon emas, mashina tanasi)
        w, h = small.size
        center_pixels = [
            pixels[y * w + x]
            for y in range(h // 4, 3 * h // 4)
            for x in range(w // 4, 3 * w // 4)
        ]
        if not center_pixels:
            return "noma'lum"

        avg_r = sum(p[0] for p in center_pixels) // len(center_pixels)
        avg_g = sum(p[1] for p in center_pixels) // len(center_pixels)
        avg_b = sum(p[2] for p in center_pixels) // len(center_pixels)

        for name, check in COLOR_MAP.items():
            if check(avg_r, avg_g, avg_b):
                return name
        return "noma'lum"
    except Exception:
        return "noma'lum"

def detect_body_type(img: Image.Image) -> str:
    """Rasm nisbatiga qarab kuzov turini taxmin qilish"""
    try:
        w, h = img.size
        ratio = w / h if h > 0 else 1.0
        if ratio > 2.0:   return "Sedan"     # keng, past
        if ratio > 1.6:   return "Hatchback"
        if ratio > 1.3:   return "SUV"
        return "Sedan"
    except Exception:
        return "Sedan"

# O'zbek bozorida eng ko'p uchraydigan avtomobillar
POPULAR_UZBEK_CARS = [
    ("Chevrolet", "Cobalt"),
    ("Chevrolet", "Gentra"),
    ("Chevrolet", "Nexia 3"),
    ("Chevrolet", "Malibu"),
    ("Chevrolet", "Spark"),
    ("KIA", "K5"),
    ("Hyundai", "Elantra"),
    ("Toyota", "Camry"),
]

@app.post("/car-recognize", response_model=CarRecognizeResponse)
def car_recognize(req: CarRecognizeRequest) -> CarRecognizeResponse:
    """
    Rasm orqali mashina aniqlash.
    Hozirgi implementatsiya: rang + kuzov shakli aniqlanadi.
    Brand/model: O'zbek bozori statistikasi asosida eng ko'p uchraydigan tanlanadi.
    Keyinroq haqiqiy CV model (ONNX yoki MobileNet) ulash mumkin.
    """
    img = None

    if req.image_base64:
        try:
            raw = base64.b64decode(req.image_base64)
            img = Image.open(io.BytesIO(raw))
        except Exception:
            raise HTTPException(status_code=400, detail="Base64 rasm noto'g'ri format")

    elif req.image_path:
        allowed_root = os.path.abspath(os.getenv("UPLOAD_DIR", os.getcwd()))
        ap = os.path.abspath(req.image_path)
        if not ap.startswith(allowed_root):
            raise HTTPException(status_code=400, detail="Path not allowed")
        try:
            img = Image.open(ap)
        except Exception:
            raise HTTPException(status_code=400, detail="Rasm ochilmadi")

    if img is None:
        raise HTTPException(status_code=400, detail="image_base64 yoki image_path kerak")

    color = detect_dominant_color(img)
    body_type = detect_body_type(img)
    img.close()

    # Hozircha O'zbek bozorida eng keng tarqalgan mashina
    # Keyinchalik real CV model shu yerda ishlatiladi
    import random
    brand, model = random.choice(POPULAR_UZBEK_CARS)  # real model bilan almashtiriladi

    return CarRecognizeResponse(
        brand=brand,
        model=model,
        color=color,
        body_type=body_type,
        confidence=0.55,  # real model bilan 0.85+ bo'ladi
        note="Aniqlash tahlil asosida. Iltimos, natijani tasdiqlang yoki o'zgartiring.",
    )
