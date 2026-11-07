'use client';
import { useEffect, useMemo, useState } from 'react';

type E = { unicode: string; label: string; group?: number; tags?: string[] };
const GROUPS: [number, string][] = [[0, 'Faces'], [1, 'People'], [3, 'Animals'], [4, 'Food'], [5, 'Travel'], [6, 'Activity'], [7, 'Objects'], [8, 'Symbols'], [9, 'Flags']];

export default function Picker({ current, recent, onPick, onClose }: { current: string | null; recent: string[]; onPick: (e: string | null) => void; onClose: () => void }) {
  const [all, setAll] = useState<E[] | null>(null);
  const [cat, setCat] = useState<string>(recent.length ? 'Recent' : 'Faces');
  const [q, setQ] = useState('');
  useEffect(() => { import('emojibase-data/en/compact.json').then((m) => setAll((m.default as unknown as E[]).filter((e) => e.group !== undefined && e.group !== 2))); }, []);

  const list = useMemo<string[]>(() => {
    const term = q.trim().toLowerCase();
    if (term) {
      if (!/^[a-z0-9 \-']+$/i.test(term)) return [term]; // pasted/typed emoji
      if (!all) return [];
      const words = term.split(/\s+/);
      return all.filter((e) => { const hay = (e.label + ' ' + (e.tags || []).join(' ')).toLowerCase().split(/[^a-z0-9]+/); return words.every((w) => hay.some((h) => h.startsWith(w))); }).map((e) => e.unicode).slice(0, 300);
    }
    if (cat === 'Recent') return recent;
    const g = GROUPS.find((x) => x[1] === cat)?.[0];
    return all ? all.filter((e) => e.group === g).map((e) => e.unicode) : [];
  }, [q, cat, all, recent]);

  const cats = [...(recent.length ? ['Recent'] : []), ...GROUPS.map((g) => g[1])];
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
        <input className="psearch" placeholder="Search (e.g. computer) or paste an emoji" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search emoji" />
        <div className="chips">
          {cats.map((c) => <button key={c} className={'chip' + (cat === c && !q ? ' on' : '')} onClick={() => { setCat(c); setQ(''); }}>{c}</button>)}
        </div>
        <div className="grid">
          {!all && !q && cat !== 'Recent' && <div style={{ gridColumn: '1 / -1', color: 'var(--muted)', padding: 12 }}>Loading…</div>}
          {list.map((e) => <button key={e} className={e === current ? 'on' : ''} onClick={() => onPick(e)} aria-label={e}>{e}</button>)}
          {q.trim() && all && !list.length && <div style={{ gridColumn: '1 / -1', color: 'var(--muted)', padding: 12 }}>No emoji match “{q.trim()}”.</div>}
        </div>
      </div>
    </>
  );
}
