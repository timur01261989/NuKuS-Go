-- UniGo 7-bosqich: legacy qatlam cleanup plan va audit metadata
begin;

create schema if not exists app_meta;

create table if not exists app_meta.legacy_cleanup_registry (
  legacy_table text primary key,
  canonical_replacement text not null,
  audit_scope text not null,
  runtime_status text not null,
  data_status text not null,
  drop_readiness text not null,
  cleanup_stage smallint not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function app_meta.touch_legacy_cleanup_registry_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_legacy_cleanup_registry_updated_at on app_meta.legacy_cleanup_registry;
create trigger trg_legacy_cleanup_registry_updated_at
before update on app_meta.legacy_cleanup_registry
for each row
execute function app_meta.touch_legacy_cleanup_registry_updated_at();

insert into app_meta.legacy_cleanup_registry
(legacy_table, canonical_replacement, audit_scope, runtime_status, data_status, drop_readiness, cleanup_stage, notes)
values
('drivers', 'profiles + driver_applications + driver_service_settings + vehicles + driver_presence', 'driver-core', 'write-blocked-but-still-present', 'needs-backfill-verification', 'not_ready', 1, 'Still referenced by foreign keys and old SQL functions; do not drop in this phase'),
('driver_profiles', 'profiles', 'driver-profile', 'no-runtime-reference-detected', 'manual-row-audit-required', 'audit_only', 2, 'Code audit should confirm zero reads before archival'),
('inter_prov_trips', 'interprov_trips', 'intercity', 'compat-shadow-layer', 'needs-row-diff-check', 'not_ready', 1, 'Legacy naming layer still exists alongside canonical interprov_trips'),
('transactions', 'wallet_transactions', 'wallet', 'no-runtime-reference-detected', 'manual-ledger-reconciliation-required', 'audit_only', 2, 'Do not drop before financial reconciliation'),
('billing_transactions', 'wallet_transactions or dedicated billing ledger', 'wallet-billing', 'read-only-legacy', 'manual-ledger-reconciliation-required', 'audit_only', 2, 'Still contains historical billing semantics; keep until billing UI fully migrated')
on conflict (legacy_table) do update
set
  canonical_replacement = excluded.canonical_replacement,
  audit_scope = excluded.audit_scope,
  runtime_status = excluded.runtime_status,
  data_status = excluded.data_status,
  drop_readiness = excluded.drop_readiness,
  cleanup_stage = excluded.cleanup_stage,
  notes = excluded.notes,
  updated_at = now();

create or replace view app_meta.v_legacy_cleanup_plan as
select
  legacy_table,
  canonical_replacement,
  audit_scope,
  runtime_status,
  data_status,
  drop_readiness,
  cleanup_stage,
  notes,
  updated_at
from app_meta.legacy_cleanup_registry
order by cleanup_stage, legacy_table;

create or replace view app_meta.v_legacy_cleanup_actions as
select *
from (
  values
    ('drivers', 1, 'Block new business logic from reading drivers directly'),
    ('drivers', 2, 'Move remaining FK dependencies to canonical driver core tables before drop plan'),
    ('driver_profiles', 1, 'Run row-count + schema diff against profiles'),
    ('driver_profiles', 2, 'Archive then drop only after prod query logs show zero reads'),
    ('inter_prov_trips', 1, 'Run row parity diff with interprov_trips'),
    ('inter_prov_trips', 2, 'Freeze writes then convert to compatibility view or archive table'),
    ('transactions', 1, 'Reconcile totals against wallet_transactions by user and date'),
    ('transactions', 2, 'Archive only after finance verification passes'),
    ('billing_transactions', 1, 'Reconcile with wallet_transactions and any billing UI/export consumers'),
    ('billing_transactions', 2, 'Split into dedicated billing ledger if billing semantics must remain')
) as t(legacy_table, step_no, action)
order by legacy_table, step_no;

comment on view app_meta.v_legacy_cleanup_plan is 'Phase 7 metadata: legacy cleanup readiness';
comment on view app_meta.v_legacy_cleanup_actions is 'Phase 7 metadata: ordered cleanup actions for each legacy table';

commit;
