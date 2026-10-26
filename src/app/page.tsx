'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Event } from '../lib/odds';
import { americanLabel, bestMoneylines, decimalOdds, impliedProbability } from '../lib/odds';
import { createClient } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';

type Pick = Database['public']['Tables']['tracked_bets']['Row'];
type Slip = { eventId: string; sport: string; event: string; selection: string; price: number; sportsbook: string };
const leagues = ['nba','nfl','mlb'] as const;
const currency = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export default function Home() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [view,setView] = useState<'markets'|'slip'|'tracker'>('markets');
  const [league,setLeague] = useState('nba');
  const [events,setEvents] = useState<Event[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [fetchedAt,setFetchedAt] = useState('');
  const [slip,setSlip] = useState<Slip[]>([]);
  const [stake,setStake] = useState('25');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirmationEmail,setConfirmationEmail] = useState('');
  const [userId,setUserId] = useState<string|null>(null);
  const [authOpen,setAuthOpen] = useState(false);
  const [authMessage,setAuthMessage] = useState('');
  const [authLoading,setAuthLoading] = useState(false);
  const [resendLoading,setResendLoading] = useState(false);
  const [tracked,setTracked] = useState<Pick[]>([]);
  const [saveMessage,setSaveMessage] = useState('');
  const [refresh,setRefresh] = useState(0);
  const wager = Number(stake);
  const validStake = Number.isFinite(wager) && wager > 0 && wager <= 1000000;
  const combined = slip.reduce((a,p)=>a*decimalOdds(p.price),1);
  const payout = validStake ? wager*combined : 0;
  useEffect(()=>{
    const authHash = new URLSearchParams(window.location.hash.slice(1));
    if (authHash.get('type') === 'invite' || authHash.get('type') === 'recovery') {
      window.location.replace(`/auth/set-password${window.location.hash}`);
      return;
    }
    setSupabase(createClient());
  },[]);
  const stats = useMemo(()=>{
    const closed = tracked.filter(p=>p.status!=='pending');
    const risk = closed.reduce((s,p)=>s+Number(p.stake),0);
    const profit = closed.reduce((s,p)=>s+(p.status==='won'? Number(p.stake)*(decimalOdds(p.american_odds)-1):p.status==='lost'?-Number(p.stake):0),0);
    return { profit, roi:risk>0?profit/risk*100:0, wins:closed.filter(p=>p.status==='won').length, settled:closed.filter(p=>p.status==='won'||p.status==='lost').length };
  },[tracked]);
  useEffect(()=>{
    let active = true;
    setLoading(true);setError('');setEvents([]);
    fetch(`/api/odds?league=${league}`).then(async r=>{
      const data = await r.json();
      if(!r.ok) throw new Error(data.error||'Unable to fetch odds');
      if(active){setEvents(data.events??[]);setFetchedAt(data.fetched_at??'');}
    }).catch(e=>{if(active)setError(e instanceof Error?e.message:'Unknown error');}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[league,refresh]);
  useEffect(()=>{
    if(!supabase)return;
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUserId(session?.user?.id??null));
    return ()=>subscription.unsubscribe();
  },[supabase]);
  useEffect(()=>{
    if(!supabase||!userId){setTracked([]);return;}
    let current = true;
    void (async()=>{
      try{
        const {data,error}=await supabase.from('tracked_bets').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(100);
        if(!current)return;
        if(error)setSaveMessage(error.message);
        else setTracked(data);
      }catch(error:unknown){
        if(current)setSaveMessage(errorMessage(error));
      }
    })();
    return ()=>{current=false};
  },[userId,refresh]);
  const toggle=(pick:Slip)=>setSlip(old=>old.some(p=>p.eventId===pick.eventId&&p.selection===pick.selection)?old.filter(p=>p.eventId!==pick.eventId):[...old.filter(p=>p.eventId!==pick.eventId),pick]);
  const auth=async(kind:'signup'|'login')=>{
    if(!supabase){
      setAuthMessage('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY), then restart Next.js.');
      return;
    }
    if(kind==='signup')setConfirmationEmail('');
    setAuthLoading(true);setAuthMessage('');
    const normalizedEmail=email.trim();
    try{
      const res = kind==='signup'
        ? await supabase.auth.signUp({
            email:normalizedEmail,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
          })
        : await supabase.auth.signInWithPassword({email:normalizedEmail,password});
      if(res.error){
        console.error('Supabase authentication request failed:',{
          code:res.error.code,
          status:res.error.status,
          message:res.error.message,
        });
        setAuthMessage(`${res.error.message}${res.error.code?` (${res.error.code})`:''}`);
      }
      else if(kind==='signup'){
        if(res.data.session){
          setConfirmationEmail('');
          setAuthMessage('Your account was created and you are signed in.');
        }else if(res.data.user){
          setConfirmationEmail(normalizedEmail);
          setAuthMessage('Supabase accepted the signup and created a pending account. Check your inbox and spam folder for a confirmation email. If none arrives, use Resend confirmation email.');
        }else{
          setConfirmationEmail('');
          setAuthMessage('Supabase did not return a new account. If this email is already registered, sign in or use Forgot your password. Otherwise check the Supabase Auth logs and email delivery settings.');
        }
      }
      else{setAuthMessage('Signed in successfully.');setAuthOpen(false);}
    }catch(error:unknown){
      const message=errorMessage(error);
      console.error('Unexpected Supabase authentication failure:',message);
      setAuthMessage(`${message} Check your connection and Supabase project configuration.`);
    }finally{
      setAuthLoading(false);
    }
  };
  const resendConfirmation=async()=>{
    if(!supabase||!confirmationEmail)return;
    setResendLoading(true);setAuthMessage('');
    try{
      const {error}=await supabase.auth.resend({
        type:'signup',
        email:confirmationEmail,
        options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/`},
      });
      if(error)setAuthMessage(error.message);
      else setAuthMessage('If this account is still awaiting confirmation, a new email has been requested. Check your inbox and spam folder.');
    }catch(error:unknown){
      setAuthMessage(errorMessage(error));
    }finally{
      setResendLoading(false);
    }
  };
  const savePick=async()=>{
    if(!supabase||!userId){setAuthOpen(true);setSaveMessage('Sign in first to save your selection.');return;}
    if(slip.length!==1){setSaveMessage('For now, tracking supports one selection at a time. Parlays are for calculation only.');return;}
    if(!validStake){setSaveMessage('Enter a stake greater than zero.');return;}
    const p=slip[0];
    try{
      const {error}=await supabase.from('tracked_bets').insert({user_id:userId,sport:p.sport,event_name:p.event,selection:p.selection,sportsbook:p.sportsbook,american_odds:p.price,stake:wager,status:'pending'});
      if(error)setSaveMessage(error.message);
      else{setSaveMessage('Selection saved to your tracker.');setRefresh(r=>r+1);setView('tracker');}
    }catch(error:unknown){
      setSaveMessage(errorMessage(error));
    }
  };
  const updateStatus=async(id:string,status:Pick['status'])=>{
    if(!supabase||!userId)return;
    try{
      const {error}=await supabase.from('tracked_bets').update({status}).eq('id',id).eq('user_id',userId);
      if(error)setSaveMessage(error.message); else {setSaveMessage('Result updated.');setRefresh(r=>r+1);}
    }catch(error:unknown){
      setSaveMessage(errorMessage(error));
    }
  };
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-symbol">✦</span><div><strong>PRIME<span>EDGE</span></strong><small>SPORTS INTELLIGENCE</small></div></div>
      <p className="nav-label">WORKSPACE</p>
      <button onClick={()=>setView('markets')} className={'nav-item '+(view==='markets'?'active':'')}>◈ <span>Markets</span></button>
      <button onClick={()=>setView('slip')} className={'nav-item '+(view==='slip'?'active':'')}>▤ <span>My slip {slip.length?`(${slip.length})`:''}</span></button>
      <button onClick={()=>setView('tracker')} className={'nav-item '+(view==='tracker'?'active':'')}>▥ <span>Bet tracker</span></button>
      <p className="nav-label">MORE TOOLS</p>
      <Link href="/research" className="nav-item">◉ <span>Research Lab</span></Link>
      <Link href="/intelligence" className="nav-item">◌ <span>Bet Intelligence</span></Link>
      <Link href="/dashboard" className="nav-item">▧ <span>My Dashboard</span></Link>
      <div className="aside-bottom"><div className="status-dot">● <span>Research platform</span></div><small>No real-money wagers or deposits.</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="mobile-brand">✦ PRIME<span>EDGE</span></div><span className="live-label"><i/> ODDS RESEARCH</span><div className="top-actions">{userId?<button className="btn outline" onClick={async()=>{await supabase?.auth.signOut();setAuthMessage('');}}>Sign out</button>:<button className="btn primary" onClick={()=>setAuthOpen(true)}>Sign in / Join ↗</button>}</div></header>
      <div className="content">
        <section className="hero"><div><div className="eyebrow">YOUR SPORTS INTELLIGENCE PLATFORM <span>✧</span></div><h1>Find the edge.<br/><em>Know the numbers.</em></h1><p>Compare sportsbook odds, create a research slip, and track results in one polished workspace.</p><div className="hero-actions"><button className="btn primary" onClick={()=>setView('markets')}>Explore markets →</button><button className="btn ghost" onClick={()=>setView('tracker')}>View my performance ↗</button><Link className="btn ghost" href="/research">Research Lab →</Link><Link className="btn ghost" href="/intelligence">Bet Intelligence →</Link><Link className="btn ghost" href="/dashboard">My Dashboard →</Link></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-icon">✦</div></div></section>
        <div className="stat-grid"><div className="stat"><span>AVAILABLE MATCHUPS</span><strong>{loading?'—':events.length}</strong><small>{league.toUpperCase()} · Current feed</small></div><div className="stat"><span>TRACKED PICKS</span><strong>{tracked.length}</strong><small>{userId?'Your personal records':'Sign in to start tracking'}</small></div><div className="stat"><span>TRACKED PROFIT</span><strong className={stats.profit>=0?'positive':'negative'}>{currency(stats.profit)}</strong><small>Settled singles only</small></div><div className="stat"><span>TRACKED ROI</span><strong>{stats.roi.toFixed(1)}%</strong><small>{stats.wins} wins · {stats.settled} decisions</small></div></div>
        <div className="section-header"><div><div className="eyebrow small">PRIMEEDGE / {view.toUpperCase()}</div><h2>{view==='markets'?'Explore the markets':view==='slip'?'Research slip':'Performance tracker'}</h2><p>{view==='markets'?'Select a moneyline to add it to your research slip.':view==='slip'?'Estimate theoretical returns for your selections.':'Manage your saved picks and results.'}</p></div>{view==='markets'&&<button className="btn outline" onClick={()=>setRefresh(r=>r+1)}>↻ Refresh</button>}</div>
        {view==='markets'&&<div className="markets-layout"><section className="surface market-panel"><div className="panel-top"><div className="sport-tabs">{leagues.map(l=><button key={l} onClick={()=>setLeague(l)} className={league===l?'on':''}>{l.toUpperCase()}</button>)}</div><span className="info-chip">MONEYLINE · BEST AVAILABLE</span></div>
          {loading?<div className="empty">Loading sportsbook markets…</div>:error?<div className="empty"><strong>Live odds unavailable</strong><p>{error}</p><small>Confirm your existing ODDS_API_KEY in .env.local and that your plan covers this league.</small></div>:events.length===0?<div className="empty">No upcoming games for this league right now.</div>:events.slice(0,25).map(e=>{
            const options=bestMoneylines(e).filter(o=>o.name===e.home_team||o.name===e.away_team);
            return <div className="match" key={e.event_id}><div className="match-top"><span className="league-pill">{league.toUpperCase()}</span><span>{new Date(e.start_time).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</span></div><div className="match-body"><div className="teams"><div className="team"><span className="team-badge">{e.away_team.split(' ').map(s=>s[0]).slice(-2).join('')}</span>{e.away_team}</div><div className="team"><span className="team-badge">{e.home_team.split(' ').map(s=>s[0]).slice(-2).join('')}</span>{e.home_team}</div></div><div className="prices">{[e.away_team,e.home_team].map(name=>{
              const o=options.find(x=>x.name===name);const selected=slip.some(p=>p.eventId===e.event_id&&p.selection===name);
              return <button disabled={!o} key={name} className={'price-button '+(selected?'picked':'')} onClick={()=>o&&toggle({eventId:e.event_id,sport:league.toUpperCase(),event:`${e.away_team} @ ${e.home_team}`,selection:name,price:o.price,sportsbook:o.book})}><strong>{o?americanLabel(o.price):'—'}</strong><small>{o?o.book:'No price'}</small></button>;
            })}</div></div></div>;
          })}
          <p className="disclaimer">Odds may be delayed, cached, or unavailable. Verify price and legal availability with the provider. Displaying an odds quote does not constitute a wager.</p>
        </section><aside className="surface side-card"><div className="card-head"><h3>Research slip</h3><span className="count">{slip.length}</span></div><p>Build your selection list while browsing markets.</p>{slip.length===0?<div className="slip-empty">✧<p>Your slip is empty</p><small>Tap a price to add it here.</small></div>:<><div className="mini-picks">{slip.map(p=><div key={p.eventId}><span>{p.selection}</span><strong>{americanLabel(p.price)}</strong></div>)}</div><button className="btn primary full" onClick={()=>setView('slip')}>View slip →</button></>}</aside></div>}
        {view==='slip'&&<section className="surface slip-view"><div className="card-head"><h3>My selections</h3><button className="text-button" onClick={()=>setSlip([])}>Clear all</button></div>{slip.length===0?<div className="empty">No selections yet. <button className="text-button" onClick={()=>setView('markets')}>Browse markets →</button></div>:<div className="slip-rows">{slip.map(p=><div className="slip-row" key={p.eventId}><div><strong>{p.selection}</strong><small>{p.event} · {p.sportsbook}</small></div><div><b>{americanLabel(p.price)}</b><button className="remove" aria-label={'Remove '+p.selection} onClick={()=>setSlip(s=>s.filter(x=>x.eventId!==p.eventId))}>✕</button></div></div>)}</div>}
          <div className="calculator"><div><label htmlFor="stake">Simulated stake (USD)</label><input id="stake" value={stake} type="number" min="0" step="0.01" onChange={e=>setStake(e.target.value)}/>{!validStake&&<small className="error-text">Enter a valid positive stake.</small>}</div><div className="return-box"><small>Theoretical total return</small><strong>{slip.length&&validStake?currency(payout):'—'}</strong><span>Potential profit: {slip.length&&validStake?currency(payout-wager):'—'}</span></div></div><div className="slip-actions"><button className="btn outline" onClick={()=>setView('markets')}>← Add selections</button><button className="btn primary" disabled={slip.length===0||!validStake} onClick={savePick}>Save single to tracker</button></div>{saveMessage&&<p className="feedback">{saveMessage}</p>}<p className="disclaimer">Parlay math assumes independent legs, ignores correlation rules, and is not a prediction. Tracking currently saves only single selections.</p></section>}
        {view==='tracker'&&<section className="surface tracker-view"><div className="card-head"><h3>Saved selections</h3><span className="info-chip">YOUR ACCOUNT</span></div>{!supabase?<div className="empty">Connect Supabase to enable accounts and saved picks. Follow the included setup guide.</div>:!userId?<div className="empty">Sign in to save selections and review your record.<br/><button className="btn primary" onClick={()=>setAuthOpen(true)}>Sign in / Create account</button></div>:tracked.length===0?<div className="empty">No saved picks yet. Add a selection from the markets.</div>:<div className="table-wrap"><table><thead><tr><th>Selection</th><th>Odds</th><th>Stake</th><th>Result</th></tr></thead><tbody>{tracked.map(p=><tr key={p.id}><td><strong>{p.selection}</strong><small>{p.event_name}</small></td><td>{americanLabel(p.american_odds)}</td><td>{currency(Number(p.stake))}</td><td><select aria-label={'Result for '+p.selection} value={p.status} onChange={e=>updateStatus(p.id,e.target.value as Pick['status'])}><option value="pending">Pending</option><option value="won">Won</option><option value="lost">Lost</option><option value="push">Push</option></select></td></tr>)}</tbody></table></div>}{saveMessage&&<p className="feedback">{saveMessage}</p>}<p className="disclaimer">Results are manually entered. ROI measures settled stakes, and pending picks are excluded.</p></section>}
        <footer>© PrimeEdge Sports · Analytics and research only · No wagers accepted · Sample projections do not guarantee outcomes.</footer>
      </div>
    </main>
    {authOpen&&<div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false);}}><div className="modal" role="dialog" aria-modal="true" aria-label="PrimeEdge account"><div className="card-head"><h2>Join PrimeEdge</h2><button className="remove" onClick={()=>setAuthOpen(false)} aria-label="Close">✕</button></div><p>Sign in or create an account to save your picks privately.</p>{!supabase?<div className="notice">Supabase has not been configured. Add your public URL and publishable key to .env.local, then restart the app.</div>:<><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setConfirmationEmail('');}}/></label><label>Password<input type="password" autoComplete="current-password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/></label><div className="modal-buttons"><button className="btn primary" disabled={authLoading||resendLoading||!email||password.length<6} onClick={()=>auth('login')}>Sign in</button><button className="btn outline" disabled={authLoading||resendLoading||!email||password.length<6} onClick={()=>auth('signup')}>Create account</button></div>{confirmationEmail&&<button className="btn outline full" disabled={authLoading||resendLoading} onClick={resendConfirmation}>{resendLoading?'Sending…':'Resend confirmation email'}</button>}<a className="auth-help-link" href="/auth/forgot-password">Forgot your password?</a></>}{authMessage&&<p className="feedback" role="status">{authMessage}</p>}</div></div>}
    <nav className="mobile-nav"><button onClick={()=>setView('markets')} className={view==='markets'?'on':''}>◈<span>Markets</span></button><button onClick={()=>setView('slip')} className={view==='slip'?'on':''}>▤<span>Slip ({slip.length})</span></button><button onClick={()=>setView('tracker')} className={view==='tracker'?'on':''}>▥<span>Tracker</span></button></nav>
  </div>;
}
