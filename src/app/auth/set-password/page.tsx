'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import styles from '../auth.module.css';
import { createClient } from '../../../lib/supabase/client';
import type { Database } from '../../../lib/supabase/database.types';

export default function SetPasswordPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkError, setLinkError] = useState(false);

  useEffect(() => {
    setLinkError(new URLSearchParams(window.location.search).has('error'));
    const client = createClient();
    setSupabase(client);
    if (!client) {
      setMessage('Password setup is temporarily unavailable. Please try again later.');
      return;
    }

    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setReady(Boolean(session));
    });

    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      setReady(Boolean(data.session));
    }).catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? error.message : 'Unable to verify your invitation.');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !ready) return;
    if (password.length < 8) {
      setMessage('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }
      window.location.assign('/');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Unable to update your password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.brand}>PRIMEEDGE SPORTS</p>
        <h1>Create your password</h1>
        <p className={styles.description}>
          Choose a password to finish setting up your account.
        </p>
        {linkError ? (
          <p className={styles.message} role="alert">
            This invitation or reset link is invalid or expired. Request a fresh link to continue.
          </p>
        ) : ready ? (
          <form onSubmit={savePassword}>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Set password'}
            </button>
          </form>
        ) : (
          <p className={styles.message} role="status">
            {message || 'Open this page using a valid invitation or password reset link.'}
          </p>
        )}
        {message && ready && <p className={styles.message} role="status">{message}</p>}
        <Link className={styles.inlineLink} href="/auth/forgot-password">
          Request a password reset email
        </Link>
      </section>
    </main>
  );
}
