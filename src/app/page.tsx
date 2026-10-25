'use client';
import { useEffect, useState } from 'react';
import type { Event } from '../lib/odds';
import { americanLabel, bestMoneylines, decimalOdds, impliedProbability, potentialProfit } from '../lib/odds';

export default function Home() {
 const [league,setLeague] = useState('nba');
 const [events,setEvents] = useState<Event[]>([]);
 const [error,setError] = useState('');
 const [loading,setLoading] = useState(true);
 const [stake,setStake] = useState('20');
 const [odds,setOdds] = useState('-110');
 const [legs,setLegs] = useState('-110,+150');
 useEffect(()=>{
   let active=true;
   setLoading(true); setError(''); setEvents([]);
   fetch(`/api/odds?league=${league}`).then(async r=>{
     const body = await r.json(); if(!r.ok) throw new Error(body.error || 'Request failed');
     if(active) setEvents(body.events ?? []);
   }).catch(e=>{if(active) setError(e.message)}).finally(()=>{if(active)setLoading(false)});
   return ()=>{active=false};
 },[league]);
 const stakeNumber=Number(stake), oddsNumber=Number(odds);
 const validStake=Number.isFinite(stakeNumber)&&stakeNumber>0;
 const validOdds=Number.isFinite(oddsNumber)&&Number.isInteger(oddsNumber)&&(oddsNumber>=100 || oddsNumber<=-100);
 const legNumbers=legs.split(',').map(s=>Number(s.trim()));
 const validLegs=legNumbers.length>0 && legNumbers.every(n=> Number.isInteger(n) && (n>=100||n<=-100));
 const payout=validStake&&validOdds?stakeNumber+potentialProfit(stakeNumber, oddsNumber):null;
 const parlayPayout=validStake&&validLegs?stakeNumber*legNumbers.reduce((a,n)=>a*decimalOdds(n),1):null;
 return <main>
  <header><div className="logo">◈ <strong>PrimeEdge</strong><span> SPORTS</span></div><span className="tag">RESEARCH ONLY · NO WAGERING</span></header>
  <section className="hero"><p className="eyebrow">SPORTS INTELLIGENCE PLATFORM</p><h1>Make sense of the <em>numbers.</em></h1><p>Compare sportsbook prices, calculate payouts, and research games. For informational use only.</p></section>
  <div className="layout"><section className="panel wide"><div className="section-head"><div><h2>Odds comparison</h2><p>Best available moneyline among returned books</p></div><div className="tabs">{['nba','mlb','nfl'].map(x=><button key={x} className={league===x?'selected':''} onClick={()=>setLeague(x)}>{x.toUpperCase()}</button>)}</div></div>
  {loading?<p className="muted">Loading sportsbook data…</p>:error?<p className="notice">{error}</p>:events.length===0?<p className="notice">No upcoming games returned for this league. Try another league or check later.</p>:events.slice(0,20).map(e=><article className="game" key={e.event_id}><div><small>{new Date(e.start_time).toLocaleString()}</small><h3>{e.away_team} <span>at</span> {e.home_team}</h3></div><div className="outcomes">{bestMoneylines(e).map(o=><div className="odd" key={o.name}><small>{o.name}</small><b>{americanLabel(o.price)}</b><small>{o.book}</small></div>)}</div></article>)}
  <p className="foot">Data is delayed or cached. Prices may change. An odds listing does not imply legal availability in your location.</p></section>
  <section className="panel"><h2>Payout calculator</h2><p>Enter a stake and American odds.</p><label>Stake ($)<input type="number" min="0" step="0.01" value={stake} onChange={e=>setStake(e.target.value)}/></label><label>American odds<input type="number" step="1" value={odds} onChange={e=>setOdds(e.target.value)}/></label>{payout===null?<p className="notice">Use a positive stake and odds of +100 or higher, or -100 or lower.</p>:<div className="result"><small>Potential total return</small><strong>${payout.toFixed(2)}</strong><span>Profit: ${(payout-stakeNumber).toFixed(2)} · Implied probability: {(impliedProbability(oddsNumber)*100).toFixed(1)}%</span></div>}</section>
  <section className="panel"><h2>Parlay calculator</h2><p>Enter multiple American odds separated by commas.</p><label>Leg odds<input type="text" value={legs} onChange={e=>setLegs(e.target.value)} placeholder="-110,+150,-120" /></label>{parlayPayout===null?<p className="notice">Enter valid American odds for every leg.</p>:<div className="result"><small>Theoretical total return</small><strong>${parlayPayout.toFixed(2)}</strong><span>{legNumbers.length} legs · Stake: ${stakeNumber.toFixed(2)}</span></div>}<p className="foot">Assumes independent outcomes and ignores correlation restrictions. Not a prediction.</p></section></div>
  <footer>PrimeEdge Sports · Research only · No bets placed or accepted · 21+ recommended</footer>
 </main>;
}
