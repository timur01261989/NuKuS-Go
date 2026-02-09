AUTO SAVDO (Yo'lovchi dashboard ichida)
- ClientDashboard: 5ta tugma qoladi. Tagiga 'Avto savdo' preview qo'shildi.
- 'Savdoga kirish' bosilsa Modal panel ochiladi va e'lonlar ro'yxati chiqadi.
- Ma'lumotlar: public/config/market_listings.json (test uchun sample).
- Konfiguratsiya: public/config/market.json

Keyin backendga ulanganingizda:
- marketService.js ichida listMarketCars() ni APIga ulang.
- UI o'zgarmaydi, ishlash prinsipi saqlanadi.
