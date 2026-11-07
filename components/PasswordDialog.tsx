'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase';

export default function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) setMsg(error.message); else setDone(true);
  };
  return (
    <>
      <button className="scrim" style={{ zIndex: 70 }} aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="login" style={{ position: 'absolute', zIndex: 71, left: 20, right: 20, top: '30%', height: 'auto', padding: 20, background: '#fff', borderRadius: 20, maxWidth: 'none', margin: 0 }}>
        <h1 style={{ fontSize: 20 }}>{done ? 'Password saved' : 'Set a password'}</h1>
        {done ? <p>Use your email and this password to sign in on any device.</p> : <>
          <input type="password" required minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" aria-label="New password" autoFocus />
          <button type="submit">Save password</button>
          {msg && <p style={{ color: 'var(--danger)' }}>{msg}</p>}
        </>}
        {done && <button type="button" onClick={onClose}>Done</button>}
      </form>
    </>
  );
}
