# Phase 7 Dispatch Engine

Bu migratsiya mavjud loyiha ichiga qo'shiladi va hech qaysi mavjud jadvalni buzmaydi.

## Qo'shiladigan obyektlar
- public.dispatch_queue
- public.dispatch_assignments
- public.drivers_in_dispatch_radius(...)
- public.dispatch_match_order_phase7(...)
- public.enqueue_dispatch_job(...)

## Ishlash oqimi
1. Client order yaratiladi
2. enqueue_dispatch_job(...) queue ga yozadi
3. Worker queued job ni oladi
4. dispatch_match_order_phase7(...) yaqin online driverlarni topadi
5. dispatch_assignments ga offer yoziladi
6. Driver realtime feed assignmentlarni oladi
