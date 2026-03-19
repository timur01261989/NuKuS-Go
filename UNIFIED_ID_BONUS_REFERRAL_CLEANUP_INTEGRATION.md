# UniGo Unified ID Cleanup + Full Order Flow Integration

Bu patch quyidagilarni bajaradi:

1. Legacy bonus qatlamini runtime darajada o'chiradi:
   - `server/api/gamification.js` endi `client_bonuses` va `bonus_transactions` bilan ishlamaydi.
   - mijoz bonuslari endi faqat `wallets.bonus_balance_uzs` va `wallet_transactions` orqali yuradi.

2. Reward engine shared service ga ko'chirildi:
   - `server/_shared/rewardEngine.js`
   - `server/_shared/orders/orderCompletionPipeline.js`

3. Hamma asosiy order completion/cancel flow lar ulanadi:
   - `server/api/order_status.js`
   - `server/api/freight.js`
   - `server/api/delivery.js`

4. Delivery frontend endi to'g'ridan-to'g'ri Supabase write qilmaydi:
   - `src/modules/client/features/client/delivery/services/deliveryStore.js`
   - `src/modules/driver/legacy/components/services/DriverDelivery.jsx`
   - `src/services/deliveryApi.js`

5. Promo flow kuchaytirildi:
   - usage limit tekshiruvi
   - test user block
   - original total saqlash
   - cancel/revert support

Muhim:
- Eski jadvallar tarix uchun qoldirildi, lekin endi canonical source emas.
- Production oldidan `server/api/auth.js` dagi test OTP rejimini env orqali qat'iy cheklash kerak.
