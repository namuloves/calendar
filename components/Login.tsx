'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState('sending');
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) { setState('error'); setMsg(error.message); } else setState('sent');
  };
  return (
    <form className="login" onSubmit={submit}>
      <h1>Calendar</h1>
      <p>{state === 'sent' ? 'Check your email for a sign-in link.' : 'Private. Sign in with a link sent to your email.'}</p>
      {state !== 'sent' && <>
        <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" autoComplete="email" />
        <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send link'}</button>
      </>}
      {state === 'error' && <p style={{ color: 'var(--danger)' }}>{msg}</p>}
    </form>
  );
}
