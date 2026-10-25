'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import { createClient } from '../../../lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function sendResetEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage('Password reset is temporarily unavailable. Please try again later.');
      return;
    }

    setSending(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
      });
      if (error) setMessage(error.message);
      else setMessage('If an account exists for that address, a password reset link is on its way.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Unable to send a password reset email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.brand}>PRIMEEDGE SPORTS</p>
        <h1>Reset your password</h1>
        <p className={styles.description}>
          Enter your account email and we’ll send a secure reset link.
        </p>
        <form onSubmit={sendResetEmail}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        {message && <p className={styles.message} role="status">{message}</p>}
        <div className={styles.links}>
          <Link href="/">Back to PrimeEdge</Link>
          <Link href="/">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
