alter table public.leads enable row level security;

drop policy if exists leads_select_policy on public.leads;

create policy leads_select_policy
on public.leads
for select
using (

  -- Extract JWT info
  (current_setting('request.jwt.claims', true)::jsonb)->>'tenant_id' = tenant_id
  AND (

      -- Admins: full access to all leads of their tenant
      ( (current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'admin' )

      OR

      -- Counselors: can read leads they own
      (owner_id = (current_setting('request.jwt.claims', true)::jsonb)->>'user_id')

      OR

      -- Counselors: can read leads belonging to teams they are part of
      exists (
        select 1
        from public.user_teams ut
        join public.teams t on t.id = ut.team_id
        where ut.user_id = (current_setting('request.jwt.claims', true)::jsonb)->>'user_id'
          and t.id = public.leads.owner_id  -- lead assigned to a team owner OR team bucket
      )
  )
);

