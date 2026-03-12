# UniGo 6-bosqich: SQL cleanup

Bu bosqich quyidagilarni qiladi:

- `driver_service_settings` jadvalini migration qatlamida qat'iy yaratadi
- `vehicles` uchun matching engine ishlatadigan ustunlarni standartlaydi
- matching uchun kerakli indexlarni qo'shadi
- `app_meta.v_driver_core_matching_snapshot` view orqali canonical driver holatini audit qilishni osonlashtiradi

## Nima uchun kerak

Oldingi bosqichlarda `driver_service_settings` va `vehicles` amalda ishlatilayotgan edi, lekin migration layering parchalanib qolgan edi:
- ayrim ustunlar faqat `alter table` bilan kiritilgan
- matching engine uchun kerakli ustunlar har doim to'liq normalize qilinmagan
- keyingi bosqichdagi yagona dispatch logic uchun SQL foundation yo'q edi

## Natija

Matching engine endi quyidagi canonical qatlamga tayana oladi:

- `driver_presence`
- `driver_service_settings`
- `vehicles`
- `driver_applications` (approval gate)
