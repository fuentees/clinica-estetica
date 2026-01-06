-- ======================================================
-- PROFILES
-- ======================================================
alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;

create policy "profiles_select_own"
on profiles
for select
to authenticated
using (
  auth.uid() = id
);

-- ======================================================
-- CLINICS (leitura liberada para usuários autenticados)
-- ======================================================
alter table clinics enable row level security;

drop policy if exists "clinics_select" on clinics;

create policy "clinics_select"
on clinics
for select
to authenticated
using (true);

-- ======================================================
-- ROLES
-- ======================================================
alter table roles enable row level security;

drop policy if exists "roles_select" on roles;

create policy "roles_select"
on roles
for select
to authenticated
using (true);
