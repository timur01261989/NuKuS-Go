# UniGo yangi schema izohi

## Asosiy qoida
- `profiles.id = auth.users.id`
- shu ID `drivers.user_id`, `wallets.user_id`, `orders.client_id`, `orders.driver_id`, `auto_market_ads.owner_user_id` va boshqa jadvallarda ishlatiladi.

## Haydovchi oqimi
- `driver_applications` — ariza va hujjatlar
- `drivers` — faqat tasdiqlangan driver capability profili
- `driver_presence` — online/offline, service, lat/lng, current state

## Buyurtmalar
- barcha asosiy xizmatlar `orders` jadvalida
- atomic accept uchun `accept_order_atomic`
- yakunlash va wallet settlement uchun `complete_order_atomic`

## Avto savdo
- e'lonlar `auto_market_ads`
- rasmlar `auto_market_images`
- to'lovlar `auto_market_payments`
- reveal/promo uchun qo'shimcha jadvallar schema ichida mavjud
