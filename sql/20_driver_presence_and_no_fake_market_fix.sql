-- UniGo production cleanup
-- 1) Approved driver application -> drivers row + driver_presence row
insert into public.drivers (
  user_id, application_id, transport_type, allowed_services, seat_count, max_freight_weight_kg, payload_volume_m3,
  vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, is_verified, is_active, is_suspended, approved_at, updated_at
)
select
  da.user_id,
  da.id,
  da.transport_type,
  case
    when da.transport_type = 'truck' then array['freight']::text[]
    when da.transport_type = 'bus_gazel' then array['delivery','inter_district','inter_city','freight']::text[]
    else array['taxi','delivery','inter_district','inter_city','freight']::text[]
  end,
  coalesce(da.seat_count, 0),
  coalesce(da.requested_max_freight_weight_kg, 0),
  coalesce(da.requested_payload_volume_m3, 0),
  da.vehicle_brand, da.vehicle_model, da.vehicle_year, da.vehicle_plate, da.vehicle_color,
  true, true, false, now(), now()
from public.driver_applications da
where da.status = 'approved'
on conflict (user_id) do update set
  application_id = excluded.application_id,
  transport_type = excluded.transport_type,
  allowed_services = excluded.allowed_services,
  seat_count = excluded.seat_count,
  max_freight_weight_kg = excluded.max_freight_weight_kg,
  payload_volume_m3 = excluded.payload_volume_m3,
  vehicle_brand = excluded.vehicle_brand,
  vehicle_model = excluded.vehicle_model,
  vehicle_year = excluded.vehicle_year,
  vehicle_plate = excluded.vehicle_plate,
  vehicle_color = excluded.vehicle_color,
  is_verified = true,
  is_active = true,
  is_suspended = false,
  approved_at = now(),
  updated_at = now();

insert into public.driver_presence (driver_id, is_online, state, created_at, updated_at)
select d.user_id, false, 'offline', now(), now()
from public.drivers d
on conflict (driver_id) do nothing;
