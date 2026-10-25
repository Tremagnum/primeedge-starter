import type { Database } from './supabase/database.types';
import { createClient } from './supabase/client';
import { bestMoneylines, decimalOdds, impliedProbability, type Event } from './odds';
export type { Event } from './odds';
export type SavedBet = Database['public']['Tables']['tracked_bets']['Row'];

export function db() {
  return typeof window === 'undefined' ? null : createClient();
}
export function decimal(n:number) {
  return Number.isInteger(n) && (n >= 100 || n <= -100) ? decimalOdds(n) : NaN;
}
export function probability(n:number) {
  return Number.isFinite(decimal(n)) ? impliedProbability(n) : NaN;
}
export function money(n:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)}
export function american(n:number){return n>0?`+${n}`:`${n}`}
export function topPrices(event:Event){return bestMoneylines(event);}
export const samples:Event[]=[{event_id:'sample-1',home_team:'Warriors',away_team:'Lakers',start_time:'',books:[{book:'Demonstration',market:'h2h',outcomes:[{name:'Lakers',price:125},{name:'Warriors',price:-145}]}]},{event_id:'sample-2',home_team:'Knicks',away_team:'Celtics',start_time:'',books:[{book:'Demonstration',market:'h2h',outcomes:[{name:'Celtics',price:-115},{name:'Knicks',price:105}]}]}];
