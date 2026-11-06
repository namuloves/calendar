'use client';
import { useState } from 'react';
import { CATS } from '@/lib/emoji';

export default function Picker({ current, recent, onPick, onClose }: { current: string | null; recent: string[]; onPick: (e: string | null) => void; onClose: () => void }) {
  const cats = [{ name: 'Recent', list: recent }, ...CATS].filter((c) => c.list.length);
  const [cat, setCat] = useState(cats[0].name);
  const [q, setQ] = useState('');
  const all = Array.from(new Set(CATS.flatMap((c) => c.list)));
  const list = q.trim() ? all.filter((e) => e.includes(q.trim())) : cats.find((c) => c.name === cat)!.list;
  return (
    <>
      <button className="picker-scrim" aria-label="Close" onClick={onClose} />
      <div className="picker" role="dialog" aria-label="Choose emoji">
        <div className="phead">
          <button className="ibtn" aria-label="Back" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16191A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <h2>Choose emoji</h2>
          <button className="link" onClick={() => onPick(null)}>None</button>
        </div>
        <input className="psearch" placeholder="Paste or type an emoji" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search emoji" />
        <div className="chips">
          {cats.map((c) => <button key={c.name} className={'chip' + (cat === c.name && !q ? ' on' : '')} onClick={() => { setCat(c.name); setQ(''); }}>{c.name}</button>)}
        </div>
        <div className="grid">
          {list.map((e) => <button key={e} className={e === current ? 'on' : ''} onClick={() => onPick(e)} aria-label={e}>{e}</button>)}
          {q.trim() && !list.length && <button onClick={() => onPick(q.trim())} style={{ gridColumn: '1 / -1', aspectRatio: 'auto', height: 48, fontSize: 16 }}>Use “{q.trim()}”</button>}
        </div>
      </div>
    </>
  );
}
