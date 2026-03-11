UniGo orders uchun final yagona ID fix pack

Nima o'zgardi:
- public.orders endi faqat user_id bilan ishlaydi.
- orders.client_id butunlay olib tashlandi.
- driver_applications va driver_documents avvalgidek user_id bilan qoladi.
- orders RLS endi faqat user_id va driver_id bo'yicha ishlaydi.
- frontend order create/polling/rating/history oqimlari client_id emas, user_id bilan ishlaydi.
- server/api/order.js endi orders insert/select/cancel/active oqimida client_id ishlatmaydi.

Muhim SQL fayllar:
1. sql/19_orders_remove_client_id_final.sql  <-- asosiy final migration
2. sql/06_orders_permissions_and_policies.sql <-- yangilangan policy/grant fayli
3. sql/01_unigo_superapp_schema.sql <-- fresh install uchun tozalangan schema

Tavsiya etilgan qo'llash tartibi:
1. Frontend/backend fayllarni almashtiring.
2. Supabase SQL Editor ichida sql/19_orders_remove_client_id_final.sql ni ishga tushiring.
3. Agar fresh baza bo'lsa, sql/01 va keyin sql/02/04/06 ni ishlating.
4. Deploy qiling va hard refresh qiling.

Tekshirish:
- orders jadvalida client_id ustuni bo'lmasligi kerak.
- yangi order yaratilganda faqat user_id to'ladi.
- driver_applications.user_id va driver_documents.user_id o'zgarmaydi.
