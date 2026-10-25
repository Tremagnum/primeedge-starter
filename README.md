# PrimeEdge Sports v2

A responsive, research-only odds dashboard with NBA/MLB/NFL moneyline comparison, a multi-selection calculator, Supabase email authentication, private single-pick tracking, and manually recorded results/ROI. NFL odds require an eligible API plan. The app does not place wagers.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Keep your existing `.env.local` and set `ODDS_API_KEY` and the Supabase URL and publishable key:

   ```dotenv
   ODDS_API_KEY=your_odds_api_key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
   ```

4. Run `npm run dev` and open http://localhost:3000.

Never replace `.env.local` with `.env.example` or commit local credentials. The example file contains placeholders only.

## Supabase setup

This project uses the `@supabase/ssr` browser client and the existing row-level-security-protected `public.tracked_bets` table. The SQL reference is [`supabase-schema.sql`](./supabase-schema.sql). The current PrimeEdge Supabase project already has this table and its owner-only policies, so do not run the script again as part of this UI upgrade. For a new database, review the script and execute it once in the Supabase SQL Editor.

Enable email signups in Supabase Authentication. If email confirmation is enabled, configure the local and production Site URL/redirect URLs in Supabase Auth settings.

## Deploy to Vercel

Set `ODDS_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment settings, then redeploy. Use the Supabase publishable key, never a secret/service-role key or database password in a `NEXT_PUBLIC_` variable.

## Features and limitations

- The live odds API route remains at `/api/odds`.
- The research slip calculates illustrative potential returns; parlays are not saved.
- Saved single picks are scoped to the signed-in user by Supabase Row Level Security.
- Results are entered manually. Profit and ROI are estimates based on user-entered results, not official settlement.
- No wagers, deposits, or sportsbook transactions are accepted.
- Verify odds freshness, provider licensing, and local legal requirements before relying on displayed information.
