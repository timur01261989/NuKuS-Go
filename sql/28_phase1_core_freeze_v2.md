# UniGo 1-bosqich v2

Bu versiyada asosiy farq:
- `driver_presence` jadvali hozircha `driver_id` bilan qoldiriladi
- `user_id` ga majburlab o'tkazilmaydi
- qolgan driver core jadvallar `auth.users.id` modeliga tekislanadi

## Nega shunday qilindi
Real bazada `driver_presence` ustunlari:
- driver_id
- is_online
- state
- active_service_type
- current_order_id
- lat
- lng
- heading
- speed
- accuracy
- last_seen_at
- created_at
- updated_at

Demak shu jadvalni birdan `user_id` ga o'tkazish xavfli.
Hozircha:
- `driver_presence.driver_id -> auth.users.id`
qilib ishlatamiz.

Keyingi bosqichda xohlasak `driver_id` ni `user_id` ga rename qilish mumkin.
Lekin hozir front/back yiqilmasligi muhimroq.
