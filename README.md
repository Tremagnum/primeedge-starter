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

   The browser client also supports the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` name if your project still uses an anon key. If both are set, the publishable key takes precedence. Never use a secret or service-role key in a `NEXT_PUBLIC_` variable.

4. Run `npm run dev` and open http://localhost:3000.

Never replace `.env.local` with `.env.example` or commit local credentials. The example file contains placeholders only.

## Supabase setup

This project uses the `@supabase/ssr` browser client and the existing row-level-security-protected `public.tracked_bets` table. The SQL reference is [`supabase-schema.sql`](./supabase-schema.sql). The current PrimeEdge Supabase project already has this table and its owner-only policies, so do not run the script again as part of this UI upgrade. For a new database, review the script and execute it once in the Supabase SQL Editor.

Enable email signups in Supabase Authentication. Keep the Site URL set to the production homepage and allow the production and local `/auth/callback` URLs in Auth URL Configuration. New signup and password-reset emails return through the callback, which exchanges Supabase auth codes and then redirects users safely.

The app includes `/auth/set-password` for invitation and recovery sessions and `/auth/forgot-password` for requesting a reset email. Signup and reset requests explicitly return through `/auth/callback`. Signup trims surrounding whitespace from the email, displays Supabase's signup error code and message, and distinguishes a pending confirmation from an immediately signed-in account. The sign-in dialog can resend confirmation emails. Supabase dashboard invitations use the configured Site URL; the app detects the invitation session returned in the URL fragment and forwards the user to the password setup page. Keep the production homepage as the Site URL, and allow both the production and local callback URLs in Auth URL Configuration. Never put a service-role key in the browser or change the production Site URL to a one-time password page.

For local signup troubleshooting, confirm `NEXT_PUBLIC_SUPABASE_URL` and either the publishable key or legacy anon key are present in `.env.local`, then restart `npm run dev`. Check the visible error and browser Network request to `/auth/v1/signup`; do not share passwords, tokens, or authorization headers. Do not disable email confirmation to work around SMTP delivery.

The sign-in dialog lets a user request another signup confirmation email after a signup attempt. For public signup delivery, configure custom SMTP under Supabase Authentication → Emails; Supabase's built-in sender is restricted to project team addresses and is rate-limited. If an email still does not arrive, check the Auth logs, provider delivery logs, spam folder, and that the callback URL is allowed in Auth URL Configuration.

## Deploy to Vercel

Set `ODDS_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment settings, then redeploy. Use the Supabase publishable key, never a secret/service-role key or database password in a `NEXT_PUBLIC_` variable.

## Research and analytics upgrade

The app also includes `/research` for bookmaker moneyline comparisons and a Supabase-backed matchup watchlist, `/intelligence` for an educational odds and expected-value calculator, and `/dashboard` for a user's saved picks and watchlist. The original homepage, odds API, and authentication screens remain in place.

The Supabase JavaScript client is already included. To enable matchup watchlists, review and run [`supabase-migration.sql`](./supabase-migration.sql) in the SQL Editor for the same Supabase project used by the app. It adds only `public.pe_watchlist`, with row-level security limiting access to each authenticated user's own rows; it does not modify tracked bets. No new environment variables are required.

## Features and limitations

- The live odds API route remains at `/api/odds`.
- The research page uses the existing `/api/odds` endpoint; it does not expose the provider key to the browser.
- Bet intelligence is an educational calculator, not a prediction or recommendation.
- The dashboard reads the existing `tracked_bets` table and the new private watchlist.
- The research slip calculates illustrative potential returns; parlays are not saved.
- Saved single picks are scoped to the signed-in user by Supabase Row Level Security.
- Results are entered manually. Profit and ROI are estimates based on user-entered results, not official settlement.
- No wagers, deposits, or sportsbook transactions are accepted.
- Verify odds freshness, provider licensing, and local legal requirements before relying on displayed information.
