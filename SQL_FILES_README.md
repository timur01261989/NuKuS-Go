# UniGo SQL fayllari

Endi loyiha uchun faqat quyidagi SQL fayllar ishlatiladi:

1. `sql/00_reset_unigo_superapp.sql` — eski aralash jadvallarni test/dev bazadan tozalaydi
2. `sql/01_unigo_superapp_schema.sql` — yangi yagona ID asosidagi schema
3. `sql/02_unigo_superapp_rls.sql` — RLS policy va access qoidalari
4. `sql/README_UZ.md` — qisqa tushuntirish

Eski SQL fayllar loyihadan olib tashlandi. Bu versiyada `auth.users.id` barcha modullar uchun yagona identifikatordir.
