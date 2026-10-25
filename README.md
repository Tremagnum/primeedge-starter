# PrimeEdge Sports MVP Starter

A mobile-friendly research-only odds dashboard with NBA/MLB/NFL moneyline comparison and single/parlay payout calculations. NFL requires an eligible paid odds plan. No bet placement, accounts, or database in this first runnable starter.

## Start locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `ODDS_API_KEY` from https://theoddsapi.com/.
4. Run `npm run dev`.
5. Open http://localhost:3000.

## Deploy
Push to GitHub, import the repository into Vercel, and set `ODDS_API_KEY` in Vercel environment variables. Do not put API secrets in variables prefixed with `NEXT_PUBLIC_`.

## Limits and roadmap
- The current app displays live API odds when configured; it does not automatically persist records or handle wagers.
- The free API plan may not include NFL or advanced markets.
- The API response is cached for 15 minutes at Next's server fetch level. For production, use a shared scheduled database cache, rate limiting, monitoring, and verify display/redistribution rights.
- Next additions: Supabase Auth and saved bet-tracking, settlement results, stable odds snapshots, then paid subscriptions and validated models.
- No guarantee of winning outcomes; third-party odds can be stale.
