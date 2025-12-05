-- LearnLynk Tech Test - Task 2: RLS Policies

-- Enable Row-Level Security on leads table
alter table public.leads enable row level security;

-- Extract JWT helper for readability
-- Example:
-- current_setting('request.jwt.claims', true)::jsonb ->> 'user_id'

------------------------------
-- SELECT POLICY
------------------------------

drop policy if exists leads_select_policy on public.leads;

create policy leads_select_policy
on public.leads
for select
using (
  -- Ensure tenant isolation
  tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')

  AND (

    -- Admins can see ALL leads in their tenant
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'

    OR

    -- Counselors: leads they own
    owner_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')

    OR

    -- Counselors: leads assigned to any team they belong to
    exists (
      select 1
      from public.user_teams ut
      join public.teams t on t.id = ut.team_id
      where ut.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')
        and t.tenant_id = public.leads.tenant_id
        and t.id = public.leads.owner_id  -- assuming owner_id can represent team assignment
    )
  )
);

------------------------------
-- INSERT POLICY
------------------------------

drop policy if exists leads_insert_policy on public.leads;

create policy leads_insert_policy
on public.leads
for insert
with check (
  -- Only admin + counselor
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role') in ('admin', 'counselor')

  AND

  -- Must insert lead into their own tenant
  tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
);
