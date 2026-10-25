import { NextRequest, NextResponse } from 'next/server';
import type { Event } from '../../../lib/odds';

const leagues: Record<string,string> = { nba: 'basketball_nba', mlb: 'baseball_mlb', nfl: 'americanfootball_nfl' };
export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get('league') ?? 'nba';
  const sport = leagues[league];
  if (!sport) return NextResponse.json({error:'Unsupported league'}, {status:400});
  const key = process.env.ODDS_API_KEY;
  if (!key || key === 'replace_me') return NextResponse.json({error:'Set ODDS_API_KEY in .env.local to activate live data'}, {status:503});
  const url = new URL('https://api.theoddsapi.com/odds/');
  url.searchParams.set('sport_key', sport);
  url.searchParams.set('regions','us');
  url.searchParams.set('markets','h2h');
  try {
    const upstream = await fetch(url, {headers: {'x-api-key':key}, next:{revalidate:900}});
    if (!upstream.ok) return NextResponse.json({error:`Odds provider returned ${upstream.status}`}, {status:502});
    const payload = await upstream.json() as {data?:Event[]};
    return NextResponse.json({events:payload.data ?? [], fetched_at:new Date().toISOString()}, {headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=60'}});
  } catch {
    return NextResponse.json({error:'Unable to reach odds provider'}, {status:502});
  }
}
