-- PrimeEdge Phase 3. Safe to rerun. DOES NOT alter existing profiles or tracked_bets.
create table if not exists public.pe_watchlist (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_id text not null,
 sport text not null,
 home_team text not null,
 away_team text not null,
 start_time timestamptz,
 created_at timestamptz not null default now(),
 unique(user_id,event_id)
);
create index if not exists pe_watchlist_user_idx on public.pe_watchlist(user_id);
alter table public.pe_watchlist enable row level security;
revoke all on public.pe_watchlist from anon, authenticated;
grant select,insert,delete on public.pe_watchlist to authenticated;
drop policy if exists "pe_select_own" on public.pe_watchlist;
drop policy if exists "pe_insert_own" on public.pe_watchlist;
drop policy if exists "pe_delete_own" on public.pe_watchlist;
create policy "pe_select_own" on public.pe_watchlist for select to authenticated using ((select auth.uid())=user_id);
create policy "pe_insert_own" on public.pe_watchlist for insert to authenticated with check ((select auth.uid())=user_id);
create policy "pe_delete_own" on public.pe_watchlist for delete to authenticated using ((select auth.uid())=user_id);
