'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'verifying'>('idle');
  const [msg, setMsg] = useState('');

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault(); setState('sending'); setMsg('');
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    if (error) { setState('idle'); setMsg(error.message); } else setState('sent');
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setState('verifying'); setMsg('');
    const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    if (error) { setState('sent'); setMsg(error.message); }
  };

  if (state === 'sent' || state === 'verifying') {
    return (
      <form className="login" onSubmit={verify}>
        <h1>Enter code</h1>
        <p>We emailed a code to {email}. Type it here.</p>
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" required placeholder="Code" value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Sign-in code" autoFocus />
        <button type="submit" disabled={state === 'verifying' || code.length < 6}>{state === 'verifying' ? 'Checking…' : 'Sign in'}</button>
        {msg && <p style={{ color: 'var(--danger)' }}>{msg}</p>}
        <p><button type="button" onClick={() => send()} style={{ all: 'unset', color: 'var(--accent)', cursor: 'pointer', fontSize: 15 }}>Send a new code</button></p>
      </form>
    );
  }
  return (
    <form className="login" onSubmit={send}>
      <h1>Calendar</h1>
      <p>Private. We’ll email you a sign-in code.</p>
      <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" autoComplete="email" />
      <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send code'}</button>
      {msg && <p style={{ color: 'var(--danger)' }}>{msg}</p>}
    </form>
  );
}
