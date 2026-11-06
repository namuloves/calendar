'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Entry, Photo, Store } from '@/lib/types';
import { MONTHS, dayPillar, key, todayKey } from '@/lib/dates';
import { localStore } from '@/lib/localStore';
import { cloudEnabled, cloudStore, sb } from '@/lib/supabase';
import Sheet from './Sheet';
import Picker from './Picker';
import Viewer from './Viewer';
import Login from './Login';

const SPAN = 12; // months before/after the current month

export default function App() {
  const [session, setSession] = useState<'loading' | 'in' | 'out'>(cloudEnabled ? 'loading' : 'in');
  useEffect(() => {
    if (!cloudEnabled) return;
    sb.auth.getSession().then(({ data }: any) => setSession(data.session ? 'in' : 'out'));
    const { data } = sb.auth.onAuthStateChange((_e: any, s: any) => setSession(s ? 'in' : 'out'));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === 'loading') return null;
  if (session === 'out') return <Login />;
  return <Calendar store={cloudEnabled ? cloudStore : localStore} />;
}

function Calendar({ store }: { store: Store }) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sheet, setSheet] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null); // target day
  const [viewer, setViewer] = useState<{ day: string; i: number } | null>(null);
  const [quick, setQuick] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [toast, setToast] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoTarget = useRef(todayKey());
  const today = todayKey();

  const fail = useCallback((e: unknown) => { setToast((e as Error)?.message || 'Something went wrong'); setTimeout(() => setToast(''), 3500); }, []);

  useEffect(() => {
    store.loadEntries().then((l) => setEntries(Object.fromEntries(l.map((e) => [e.day, e])))).catch(fail);
    store.listPhotos().then(setPhotos).catch(fail);
  }, [store, fail]);

  const photosBy = useMemo(() => {
    const m: Record<string, Photo[]> = {};
    photos.forEach((p) => (m[p.day] ||= []).push(p));
    return m;
  }, [photos]);

  const recent = useMemo(() => {
    const l = Object.values(entries).filter((e) => e.emoji).sort((a, b) => (a.day < b.day ? 1 : -1)).map((e) => e.emoji!);
    return Array.from(new Set(l)).slice(0, 21);
  }, [entries]);

  const entriesRef = useRef(entries); entriesRef.current = entries;
  const patch = useCallback((day: string, p: Partial<Entry>) => {
    const base: Entry = entriesRef.current[day] ?? { day, emoji: null, note: '' };
    const next: Entry = { ...base, ...p };
    const copy = { ...entriesRef.current };
    if (!next.emoji && !next.note.trim()) delete copy[day]; else copy[day] = next;
    entriesRef.current = copy; setEntries(copy);
    store.saveEntry(next).catch(fail);
  }, [store, fail]);

  const addPhotos = useCallback(async (day: string, files: File[]) => {
    for (const f of files) {
      try { const ph = await store.addPhoto(day, f); setPhotos((c) => [...c, ph]); } catch (e) { fail(e); }
    }
  }, [store, fail]);

  const delPhoto = useCallback((p: Photo) => { setPhotos((c) => c.filter((x) => x.id !== p.id)); store.deletePhoto(p).catch(fail); }, [store, fail]);

  const months = useMemo(() => {
    const t = new Date();
    return Array.from({ length: SPAN * 2 + 1 }, (_, i) => {
      const dt = new Date(t.getFullYear(), t.getMonth() + i - SPAN, 1);
      const y = dt.getFullYear(), m = dt.getMonth();
      const lead = dt.getDay(), dim = new Date(y, m + 1, 0).getDate();
      const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, k) => k + 1)];
      while (cells.length % 7) cells.push(null);
      const weeks: (number | null)[][] = [];
      for (let k = 0; k < cells.length; k += 7) weeks.push(cells.slice(k, k + 7));
      return { y, m, weeks, current: i === SPAN };
    });
  }, []);

  const toToday = useCallback((smooth: boolean) => {
    const el = scroller.current?.querySelector<HTMLElement>('[data-current="1"]');
    if (el && scroller.current) scroller.current.scrollTo({ top: el.offsetTop - 8, behavior: smooth ? 'smooth' : 'auto' });
  }, []);
  useEffect(() => { toToday(false); }, [toToday]);

  const onScroll = useCallback(() => {
    const sc = scroller.current; if (!sc) return;
    const els = sc.querySelectorAll<HTMLElement>('[data-y]');
    let y = year;
    for (const el of Array.from(els)) { if (el.offsetTop - 8 <= sc.scrollTop + 80) y = Number(el.dataset.y); else break; }
    setYear((c) => (c === y ? c : y));
  }, [year]);

  const sendQuick = () => {
    const v = quick.trim(); if (!v) return;
    const cur = entries[today]?.note || '';
    patch(today, { note: cur ? cur + '\n' + v : v });
    setQuick('');
  };

  const sheetDay = sheet;
  const viewerPhotos = viewer ? photosBy[viewer.day] || [] : [];

  return (
    <div className="app">
      <div className="top">
        <h1>{year}</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {cloudEnabled && <button className="link" style={{ color: 'var(--muted)', fontSize: 13 }} onClick={() => sb.auth.signOut()}>Sign out</button>}
          <button className="link" onClick={() => toToday(true)}>Today</button>
        </div>
      </div>

      <div className="scroll" ref={scroller} onScroll={onScroll}>
        {months.map(({ y, m, weeks, current }) => (
          <section className="month" key={y + '-' + m} data-y={y} data-current={current ? 1 : undefined}>
            <h2>{MONTHS[m]}{m === 0 ? ` ${y}` : ''}</h2>
            <div className="wd" aria-hidden="true">{['S', 'M', 'T', 'W', 'R', 'F', 'S'].map((l, i) => <span key={i}>{l}</span>)}</div>
            {weeks.map((w, wi) => (
              <div className={'week' + (wi === 0 ? ' first' : '')} key={wi}>
                {w.map((d, di) => {
                  if (!d) return <div key={di} style={{ height: 72 }} />;
                  const k = key(y, m, d), e = entries[k], has = !!photosBy[k]?.length, isT = k === today;
                  return (
                    <button key={di} className={'cell' + (isT ? ' today' : '')} onClick={() => setSheet(k)}
                      aria-label={`${MONTHS[m]} ${d}${isT ? ', today' : ''}${e?.emoji ? ', has emoji' : ''}${e?.note ? ', has note' : ''}${has ? ', has photo' : ''}`}>
                      <span className="n">{d}</span>
                      <span className="hj" aria-hidden="true">{dayPillar(y, m, d)}</span>
                      {e?.emoji && <span className="em" aria-hidden="true">{e.emoji}</span>}
                      {e?.note && <span className="dot" aria-hidden="true" />}
                      {has && <svg className="ph" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16191A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3.5 17l5-4.5 4 3.5 3-2.5 5 4" /></svg>}
                    </button>
                  );
                })}
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="dock">
        <div className="pill">
          <button className="ibtn" aria-label="Add emoji to today" onClick={() => setPicker(today)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16191A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 14c.8 1.4 2 2 3.5 2s2.7-.6 3.5-2" /><path d="M9 9.5v.5M15 9.5v.5" /></svg>
          </button>
          <input value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendQuick()} placeholder="Note for today" aria-label="Quick note for today" enterKeyHint="send" />
          <button className="ibtn" aria-label="Add photo to today" onClick={() => { photoTarget.current = today; fileRef.current?.click(); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16191A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M3.5 17l5-4.5 4 3.5 3-2.5 5 4" /></svg>
          </button>
          <button className="send" aria-label="Save note" disabled={!quick.trim()} onClick={sendQuick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) addPhotos(photoTarget.current, f); }} />
      </div>

      {sheetDay && (
        <Sheet key={sheetDay} day={sheetDay} entry={entries[sheetDay]} photos={photosBy[sheetDay] || []}
          onClose={() => setSheet(null)}
          onEmoji={(e) => patch(sheetDay, { emoji: e })}
          onNote={(n) => patch(sheetDay, { note: n })}
          onAddPhoto={(f) => addPhotos(sheetDay, f)}
          onOpenPhoto={(i) => setViewer({ day: sheetDay, i })}
          onMore={() => setPicker(sheetDay)}
          onClear={() => { store.clearDay(sheetDay).catch(fail); setEntries((c) => { const n = { ...c }; delete n[sheetDay]; return n; }); setPhotos((c) => c.filter((p) => p.day !== sheetDay)); }} />
      )}
      {picker && (
        <Picker current={entries[picker]?.emoji || null} recent={recent} onClose={() => setPicker(null)}
          onPick={(e) => { patch(picker, { emoji: e }); setPicker(null); }} />
      )}
      {viewer && viewerPhotos.length > 0 && <Viewer photos={viewerPhotos} start={viewer.i} onDelete={delPhoto} onClose={() => setViewer(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
