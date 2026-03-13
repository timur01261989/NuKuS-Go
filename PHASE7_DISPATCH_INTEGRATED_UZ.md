# Phase 7 Dispatch Engine loyihaga integratsiya qilindi

## Qo'shilgan fayllar

### SQL
- sql/32_phase7_dispatch_engine.sql
- sql/32_phase7_dispatch_engine_README_UZ.md

### Server
- server/_shared/queue/dispatchQueueService.js
- server/workers/dispatchQueueWorker.js
- server/api/dispatch_enqueue.js

### Frontend
- src/modules/driver/services/driverOrderService.js
- src/modules/driver/hooks/useDriverOrders.js

### Mavjud faylga qo'shilgan export
- src/services/dispatch/dispatchApi.js -> enqueueDispatchJob(order)

## Ishlash oqimi
1. Order yaratiladi
2. Frontend yoki backend enqueueDispatchJob(...) chaqiradi
3. dispatch_queue ga job tushadi
4. dispatchQueueWorker queued joblarni oladi
5. dispatch_match_order_phase7(...) online driverlarni topadi
6. dispatch_assignments ga offer yoziladi
7. Driver useDriverOrders(...) orqali assignmentlarni oladi
8. Driver accept qilsa accept_order_atomic(...) ishlaydi

## Muhim
Bu bosqich mavjud dispatchRealtime va driverPresence logikasini buzmaydi.
Bu qo'shimcha dispatch engine qatlami sifatida qo'shildi.
