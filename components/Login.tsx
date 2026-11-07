'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setMsg(error.message); setBusy(false); }
  };
  return (
    <form className="login" onSubmit={submit}>
      <h1>Calendar</h1>
      <p>Private. Sign in with your email and password.</p>
      <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" autoComplete="username" />
      <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" autoComplete="current-password" />
      <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {msg && <p style={{ color: 'var(--danger)' }}>{msg}</p>}
    </form>
  );
}
