import { QuickReply } from "./chat.types";

export const QUICK_REPLIES: QuickReply[] = [
  // Driver replies
  { id: "d1", text_uz: "Yo'lda kelayapman",       text_ru: "Я еду к вам",           text_en: "On my way",           role: "driver",  order: 1 },
  { id: "d2", text_uz: "2 daqiqada yetib kelaman", text_ru: "Буду через 2 минуты",    text_en: "2 min away",          role: "driver",  order: 2 },
  { id: "d3", text_uz: "Siz ko'rsatgan joyda turibman", text_ru: "Я на месте",       text_en: "I am here",           role: "driver",  order: 3 },
  { id: "d4", text_uz: "Qayerda turibsiz?",        text_ru: "Где вы?",               text_en: "Where are you?",      role: "driver",  order: 4 },
  { id: "d5", text_uz: "Telefon raqamingizni yuboring", text_ru: "Пришлите номер",   text_en: "Send your number",    role: "driver",  order: 5 },
  // Client replies
  { id: "c1", text_uz: "Kira olasizmi, chiqib ketmang", text_ru: "Подъезжайте, буду", text_en: "Coming out",         role: "client",  order: 1 },
  { id: "c2", text_uz: "Kirish oldida turibman",    text_ru: "Стою у входа",          text_en: "At the entrance",     role: "client",  order: 2 },
  { id: "c3", text_uz: "Oz kutib turing",           text_ru: "Подождите немного",     text_en: "Please wait",         role: "client",  order: 3 },
  { id: "c4", text_uz: "Ko'rinib turasizmi?",      text_ru: "Вы видите меня?",       text_en: "Can you see me?",     role: "client",  order: 4 },
  { id: "c5", text_uz: "Ko'k kiyim kiyganman",     text_ru: "Я в синей одежде",      text_en: "I'm in blue",         role: "client",  order: 5 },
];
