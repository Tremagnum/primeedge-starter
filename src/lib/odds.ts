export type Outcome = { name: string; price: number; point?: number };
export type Book = { book: string; market: string; updated_at?: string; outcomes: Outcome[] };
export type Event = { event_id: string; home_team: string; away_team: string; start_time: string; books: Book[] };
export function decimalOdds(american: number): number {
  if (!Number.isFinite(american) || american === 0) return NaN;
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}
export function impliedProbability(american: number): number { return 1 / decimalOdds(american); }
export function potentialProfit(stake: number, american: number): number { return stake * (decimalOdds(american) - 1); }
export function americanLabel(price: number): string { return price > 0 ? `+${price}` : String(price); }
export function bestMoneylines(event: Event) {
  const map = new Map<string, {price: number; book: string}>();
  for (const b of event.books ?? []) {
    if (b.market !== 'h2h') continue;
    for (const o of b.outcomes ?? []) {
      const current = map.get(o.name);
      if (!current || decimalOdds(o.price) > decimalOdds(current.price)) map.set(o.name, {price:o.price, book:b.book});
    }
  }
  return [...map.entries()].map(([name, value]) => ({name, ...value}));
}
