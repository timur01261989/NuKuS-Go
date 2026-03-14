begin;

-- Referral base reward: admin can change reward_amount_uzs and min_order_amount_uzs later from admin panel.
insert into public.bonus_campaigns (
  name,
  campaign_type,
  audience_type,
  service_type,
  reward_type,
  reward_amount_uzs,
  min_order_amount_uzs,
  usage_limit_per_user,
  stackable,
  priority,
  is_active,
  metadata
)
select
  'Referral Invite Base Reward',
  'referral',
  'both',
  null,
  'fixed_amount',
  3000,
  20000,
  1,
  false,
  100,
  true,
  jsonb_build_object(
    'program_key', 'referral_base',
    'editable_in_admin', true,
    'notes', 'Invite reward. Change reward_amount_uzs and min_order_amount_uzs from admin panel.'
  )
where not exists (
  select 1
  from public.bonus_campaigns
  where name = 'Referral Invite Base Reward'
    and campaign_type = 'referral'
);

update public.bonus_campaigns
set
  audience_type = 'both',
  reward_type = 'fixed_amount',
  reward_amount_uzs = 3000,
  min_order_amount_uzs = 20000,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'program_key', 'referral_base',
    'editable_in_admin', true,
    'notes', 'Invite reward. Change reward_amount_uzs and min_order_amount_uzs from admin panel.'
  )
where campaign_type = 'referral'
  and (name = 'Referral Invite Base Reward' or name = 'Default Referral Bonus');

insert into public.bonus_campaigns (
  name,
  campaign_type,
  audience_type,
  service_type,
  reward_type,
  reward_amount_uzs,
  min_order_amount_uzs,
  usage_limit_per_user,
  stackable,
  priority,
  is_active,
  metadata
)
select
  'Driver Referral First 5 Trips Reward',
  'driver_milestone',
  'both',
  null,
  'fixed_amount',
  10000,
  0,
  1,
  false,
  110,
  true,
  jsonb_build_object(
    'program_key', 'driver_referral_first_5_trips',
    'editable_in_admin', true,
    'milestone_trips', 5,
    'notes', 'Extra inviter reward when the referred user completes first 5 driver trips.'
  )
where not exists (
  select 1
  from public.bonus_campaigns
  where name = 'Driver Referral First 5 Trips Reward'
    and campaign_type = 'driver_milestone'
);

update public.bonus_campaigns
set
  audience_type = 'both',
  reward_type = 'fixed_amount',
  reward_amount_uzs = 10000,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'program_key', 'driver_referral_first_5_trips',
    'editable_in_admin', true,
    'milestone_trips', 5,
    'notes', 'Extra inviter reward when the referred user completes first 5 driver trips.'
  )
where campaign_type = 'driver_milestone'
  and name = 'Driver Referral First 5 Trips Reward';

commit;
