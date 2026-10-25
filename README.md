# PrimeEdge Sports MVP Starter

A mobile-friendly research-only odds dashboard with NBA/MLB/NFL moneyline comparison, single/parlay payout calculations, email accounts, and private saved-pick tracking. NFL requires an eligible paid odds plan. No bet placement is offered.

## Start locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `ODDS_API_KEY` from https://theoddsapi.com/.
4. Add your Supabase project URL and publishable key to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Run `npm run dev`.
6. Open http://localhost:3000.

The Supabase browser client and database types are in `src/lib/supabase/`. Email signup and confirmation must be enabled in the Supabase dashboard. Signed-in users can save single picks, update their result status, and delete picks; row-level security restricts access to each user's own records. Database access uses the project's publishable key and user session, never a service-role key.

## Deploy
Push to GitHub, import the repository into Vercel, and set `ODDS_API_KEY` in Vercel environment variables. Do not put API secrets in variables prefixed with `NEXT_PUBLIC_`.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel as well. Never use a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

## Limits and roadmap
- The app displays live API odds when configured. Saved picks are for personal tracking only and are not submitted to sportsbooks or automatically settled.
- The free API plan may not include NFL or advanced markets.
- The API response is cached for 15 minutes at Next's server fetch level. For production, use a shared scheduled database cache, rate limiting, monitoring, and verify display/redistribution rights.
- Next additions: linked parlay legs, settlement results, stable odds snapshots, then paid subscriptions and validated models.
- No guarantee of winning outcomes; third-party odds can be stale.
