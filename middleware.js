/**
 * middleware.js — Vercel Edge Middleware
 * =========================================
 * Vazifasi:
 *  - /api/* so'rovlari uchun oddiy rate limiting
 *  - Brute-force hujumlardan himoya
 *
 * Bu Vercel Edge Middleware formatida yozilgan.
 * Vercel loyiha ildizida joylashgan bo'lishi kerak.
 *
 * Hozircha: IP-based in-memory rate limiting.
 * Kelajakda: Upstash Ratelimit bilan almashtiring (ko'p serverda ishlaydi).
 *
 * O'rnatish: hech narsa kerak emas, Vercel avtomatik taniydi.
 */

import { NextResponse } from "next/server";

// IP => { count, resetAt }
// ESLATMA: Bu Edge Runtime'da faqat bitta instance uchun ishlaydi.
// Ko'p serverda Upstash Ratelimit kerak.
const rateLimitMap = new Map();

// Konfiguratsiya
const WINDOW_MS = 60 * 1000; // 1 daqiqa
const MAX_REQUESTS = 120;    // Daqiqada 120 so'rov (1 haydovchi uchun yetarli)

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Faqat API so'rovlarini tekshirish
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // IP olish
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    // Yangi window
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: "Too many requests. Bir daqiqadan so'ng urinib ko'ring." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
