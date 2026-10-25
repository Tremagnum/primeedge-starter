'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Event } from '../lib/odds';
import { americanLabel, bestMoneylines, decimalOdds, impliedProbability, potentialProfit } from '../lib/odds';
import type { BetStatus, Database } from '../lib/supabase/database.types';
import { createClient } from '../lib/supabase/client';

type TrackedBet = Database['public']['Tables']['tracked_bets']['Row'];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

function isBetStatus(value: string): value is BetStatus {
  return value === 'pending' || value === 'won' || value === 'lost' || value === 'push';
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [league, setLeague] = useState('nba');
  const [events, setEvents] = useState<Event[]>([]);
  const [oddsError, setOddsError] = useState('');
  const [oddsLoading, setOddsLoading] = useState(true);
  const [stake, setStake] = useState('20');
  const [odds, setOdds] = useState('-110');
  const [legs, setLegs] = useState('-110,+150');

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [bets, setBets] = useState<TrackedBet[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsError, setBetsError] = useState('');
  const [betsRevision, setBetsRevision] = useState(0);
  const [betBusy, setBetBusy] = useState(false);
  const [busyBetId, setBusyBetId] = useState<string | null>(null);
  const [pickSport, setPickSport] = useState('nba');
  const [eventName, setEventName] = useState('');
  const [selection, setSelection] = useState('');
  const [sportsbook, setSportsbook] = useState('');
  const [pickOdds, setPickOdds] = useState('');
  const [pickStake, setPickStake] = useState('20');
  const [pickMessage, setPickMessage] = useState('');

  useEffect(() => {
    let active = true;
    setOddsLoading(true);
    setOddsError('');
    setEvents([]);
    fetch(`/api/odds?league=${league}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Request failed');
        if (active) setEvents(body.events ?? []);
      })
      .catch((error: unknown) => {
        if (active) setOddsError(errorMessage(error));
      })
      .finally(() => {
        if (active) setOddsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [league]);

  useEffect(() => {
    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error.message);
        setUser(data.session?.user ?? null);
        setAuthLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuthError(errorMessage(error));
        setAuthLoading(false);
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;

    if (!user || authLoading) {
      setBets([]);
      setBetsError('');
      setBetsLoading(false);
      return () => {
        active = false;
      };
    }

    setBetsLoading(true);
    setBetsError('');
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('tracked_bets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!active) return;
        if (error) {
          setBetsError(error.message);
          return;
        }
        setBets(data);
      } catch (error: unknown) {
        if (active) setBetsError(errorMessage(error));
      } finally {
        if (active) setBetsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, betsRevision, supabase, user]);

  const stakeNumber = Number(stake);
  const oddsNumber = Number(odds);
  const validStake = Number.isFinite(stakeNumber) && stakeNumber > 0;
  const validOdds = Number.isFinite(oddsNumber) && Number.isInteger(oddsNumber) && (oddsNumber >= 100 || oddsNumber <= -100);
  const legNumbers = legs.split(',').map((value) => Number(value.trim()));
  const validLegs = legNumbers.length > 0 && legNumbers.every((value) => Number.isInteger(value) && (value >= 100 || value <= -100));
  const payout = validStake && validOdds ? stakeNumber + potentialProfit(stakeNumber, oddsNumber) : null;
  const parlayPayout = validStake && validLegs ? stakeNumber * legNumbers.reduce((total, value) => total * decimalOdds(value), 1) : null;
  const pickOddsNumber = Number(pickOdds);
  const pickStakeNumber = Number(pickStake);
  const validPick = Number.isInteger(pickOddsNumber)
    && (pickOddsNumber >= 100 || pickOddsNumber <= -100)
    && Number.isFinite(pickStakeNumber)
    && pickStakeNumber > 0
    && eventName.trim().length > 0
    && selection.trim().length > 0;

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage('Check your email to confirm your account, then sign in here.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setPassword('');
    } catch (error: unknown) {
      setAuthError(errorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthMessage('');
    } catch (error: unknown) {
      setAuthError(errorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  function prepareTrackedPick(game: Event, team: string, price: number, book: string) {
    setPickSport(league);
    setEventName(`${game.away_team} at ${game.home_team}`);
    setSelection(`${team} moneyline`);
    setSportsbook(book);
    setPickOdds(String(price));
    setPickMessage('');
    document.getElementById('track-pick-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handleTrackPick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !validPick) return;

    setBetBusy(true);
    setBetsError('');
    setPickMessage('');
    try {
      const { error } = await supabase.from('tracked_bets').insert({
        user_id: user.id,
        sport: pickSport,
        event_name: eventName.trim(),
        selection: selection.trim(),
        sportsbook: sportsbook.trim() || null,
        american_odds: pickOddsNumber,
        stake: pickStakeNumber,
      });
      if (error) throw error;
      setPickMessage('Pick saved to your account.');
      setEventName('');
      setSelection('');
      setSportsbook('');
      setPickOdds('');
      setPickStake('20');
      setBetsRevision((revision) => revision + 1);
    } catch (error: unknown) {
      setBetsError(errorMessage(error));
    } finally {
      setBetBusy(false);
    }
  }

  async function updateBetStatus(betId: string, status: BetStatus) {
    setBusyBetId(betId);
    setBetsError('');
    try {
      const { error } = await supabase.from('tracked_bets').update({ status }).eq('id', betId);
      if (error) throw error;
      setBetsRevision((revision) => revision + 1);
    } catch (error: unknown) {
      setBetsError(errorMessage(error));
    } finally {
      setBusyBetId(null);
    }
  }

  async function deleteBet(betId: string) {
    if (!window.confirm('Delete this saved pick? This cannot be undone.')) return;
    setBusyBetId(betId);
    setBetsError('');
    try {
      const { error } = await supabase.from('tracked_bets').delete().eq('id', betId);
      if (error) throw error;
      setBetsRevision((revision) => revision + 1);
    } catch (error: unknown) {
      setBetsError(errorMessage(error));
    } finally {
      setBusyBetId(null);
    }
  }

  return (
    <main>
      <header>
        <div className="logo">◈ <strong>PrimeEdge</strong><span> SPORTS</span></div>
        <span className="tag">RESEARCH ONLY · NO WAGERING</span>
      </header>
      <section className="hero">
        <p className="eyebrow">SPORTS INTELLIGENCE PLATFORM</p>
        <h1>Make sense of the <em>numbers.</em></h1>
        <p>Compare sportsbook prices, calculate payouts, and research games. For informational use only.</p>
      </section>

      <div className="layout">
        <section className="panel wide account-panel">
          <div className="section-head">
            <div>
              <h2>Your account</h2>
              <p>Sign in to save and manage your private picks.</p>
            </div>
            {user && <button className="secondary-button" type="button" onClick={handleSignOut} disabled={authBusy}>Sign out</button>}
          </div>
          {authLoading ? <p className="muted">Checking your session…</p> : user ? (
            <p className="account-email">Signed in as <strong>{user.email}</strong></p>
          ) : (
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>Password<input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button className="primary-button" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'}</button>
              <button className="text-button" type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); setAuthMessage(''); }}>
                {authMode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </button>
            </form>
          )}
          {authError && <p className="notice" role="alert">{authError}</p>}
          {authMessage && <p className="success-notice" role="status">{authMessage}</p>}
        </section>

        <section className="panel wide">
          <div className="section-head">
            <div><h2>Odds comparison</h2><p>Best available moneyline among returned books</p></div>
            <div className="tabs">{['nba', 'mlb', 'nfl'].map((sport) => <button key={sport} type="button" className={league === sport ? 'selected' : ''} onClick={() => { setLeague(sport); setPickSport(sport); }}>{sport.toUpperCase()}</button>)}</div>
          </div>
          {oddsLoading ? <p className="muted">Loading sportsbook data…</p> : oddsError ? <p className="notice" role="alert">{oddsError}</p> : events.length === 0 ? <p className="notice">No upcoming games returned for this league. Try another league or check later.</p> : events.slice(0, 20).map((game) => (
            <article className="game" key={game.event_id}>
              <div><small>{new Date(game.start_time).toLocaleString()}</small><h3>{game.away_team} <span>at</span> {game.home_team}</h3></div>
              <div className="outcomes">{bestMoneylines(game).map((outcome) => (
                <div className="odd" key={outcome.name}>
                  <small>{outcome.name}</small><b>{americanLabel(outcome.price)}</b><small>{outcome.book}</small>
                  {user && <button type="button" className="track-button" onClick={() => prepareTrackedPick(game, outcome.name, outcome.price, outcome.book)}>Track pick</button>}
                </div>
              ))}</div>
            </article>
          ))}
          <p className="foot">Data is delayed or cached. Prices may change. An odds listing does not imply legal availability in your location.</p>
        </section>

        <section className="panel">
          <h2>Payout calculator</h2><p>Enter a stake and American odds.</p>
          <label>Stake ($)<input type="number" min="0" step="0.01" value={stake} onChange={(event) => setStake(event.target.value)} /></label>
          <label>American odds<input type="number" step="1" value={odds} onChange={(event) => setOdds(event.target.value)} /></label>
          {payout === null ? <p className="notice">Use a positive stake and odds of +100 or higher, or -100 or lower.</p> : <div className="result"><small>Potential total return</small><strong>${payout.toFixed(2)}</strong><span>Profit: ${(payout - stakeNumber).toFixed(2)} · Implied probability: {(impliedProbability(oddsNumber) * 100).toFixed(1)}%</span></div>}
        </section>

        <section className="panel">
          <h2>Parlay calculator</h2><p>Enter multiple American odds separated by commas.</p>
          <label>Leg odds<input type="text" value={legs} onChange={(event) => setLegs(event.target.value)} placeholder="-110,+150,-120" /></label>
          {parlayPayout === null ? <p className="notice">Enter valid American odds for every leg.</p> : <div className="result"><small>Theoretical total return</small><strong>${parlayPayout.toFixed(2)}</strong><span>{legNumbers.length} legs · Stake: ${stakeNumber.toFixed(2)}</span></div>}
          <p className="foot">Assumes independent outcomes and ignores correlation restrictions. Not a prediction.</p>
        </section>

        {user && <>
          <section className="panel" id="track-pick-form">
            <h2>Track a pick</h2><p>Save a single selection to your account. This does not place a wager.</p>
            <form onSubmit={handleTrackPick}>
              <label>Sport<select value={pickSport} onChange={(event) => setPickSport(event.target.value)}><option value="nba">NBA</option><option value="mlb">MLB</option><option value="nfl">NFL</option></select></label>
              <label>Game or event<input required maxLength={200} value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Team A at Team B" /></label>
              <label>Selection<input required maxLength={200} value={selection} onChange={(event) => setSelection(event.target.value)} placeholder="Team A moneyline" /></label>
              <label>Sportsbook (optional)<input maxLength={100} value={sportsbook} onChange={(event) => setSportsbook(event.target.value)} placeholder="Book name" /></label>
              <label>American odds<input required type="number" step="1" value={pickOdds} onChange={(event) => setPickOdds(event.target.value)} placeholder="-110 or +150" /></label>
              <label>Stake ($)<input required type="number" min="0.01" step="0.01" value={pickStake} onChange={(event) => setPickStake(event.target.value)} /></label>
              <button className="primary-button" type="submit" disabled={betBusy || !validPick}>{betBusy ? 'Saving…' : 'Save pick'}</button>
            </form>
            {pickMessage && <p className="success-notice" role="status">{pickMessage}</p>}
            {betsError && <p className="notice" role="alert">{betsError}</p>}
          </section>

          <section className="panel wide">
            <h2>Your saved picks</h2>
            <p>Only you can view and manage picks saved to your account.</p>
            {betsLoading ? <p className="muted">Loading your picks…</p> : betsError ? <p className="notice" role="alert">{betsError}</p> : bets.length === 0 ? <p className="notice">No saved picks yet. Track an odds comparison or add a pick above.</p> : (
              <div className="bets-list">{bets.map((bet) => (
                <article className="bet-row" key={bet.id}>
                  <div className="bet-details">
                    <span className="bet-sport">{bet.sport.toUpperCase()} · {bet.status.toUpperCase()}</span>
                    <h3>{bet.selection}</h3>
                    <p>{bet.event_name}{bet.sportsbook ? ` · ${bet.sportsbook}` : ''}</p>
                    <small>{americanLabel(bet.american_odds)} odds · ${Number(bet.stake).toFixed(2)} stake · {new Date(bet.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="bet-actions">
                    <label>Status<select aria-label={`Status for ${bet.selection}`} value={bet.status} disabled={busyBetId === bet.id} onChange={(event) => { if (isBetStatus(event.target.value)) void updateBetStatus(bet.id, event.target.value); }}><option value="pending">Pending</option><option value="won">Won</option><option value="lost">Lost</option><option value="push">Push</option></select></label>
                    <button className="delete-button" type="button" disabled={busyBetId === bet.id} onClick={() => deleteBet(bet.id)}>Delete</button>
                  </div>
                </article>
              ))}</div>
            )}
          </section>
        </>}
      </div>
      <footer>PrimeEdge Sports · Research only · No bets placed or accepted · 21+ recommended</footer>
    </main>
  );
}
