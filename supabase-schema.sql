-- Run ONCE in the Supabase SQL Editor for a fresh PrimeEdge database.
create table if not exists public.tracked_bets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 sport text not null,
 event_name text not null,
 selection text not null,
 sportsbook text,
 american_odds integer not null check(american_odds <= -100 or american_odds >= 100),
 stake numeric(12,2) not null check(stake > 0),
 status text not null default 'pending' check(status in ('pending','won','lost','push')),
 created_at timestamptz not null default now()
);
create index if not exists tracked_bets_user_id_idx on public.tracked_bets(user_id);
alter table public.tracked_bets enable row level security;
revoke all on public.tracked_bets from anon, authenticated;
grant select,insert,update,delete on public.tracked_bets to authenticated;
-- Safe to rerun the RLS statements; policies are recreated.
drop policy if exists "Read own bets" on public.tracked_bets;
drop policy if exists "Create own bets" on public.tracked_bets;
drop policy if exists "Update own bets" on public.tracked_bets;
drop policy if exists "Delete own bets" on public.tracked_bets;
create policy "Read own bets" on public.tracked_bets for select to authenticated using ((select auth.uid())=user_id);
create policy "Create own bets" on public.tracked_bets for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own bets" on public.tracked_bets for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Delete own bets" on public.tracked_bets for delete to authenticated using ((select auth.uid())=user_id);
