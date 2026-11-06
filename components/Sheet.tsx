'use client';
import { useEffect, useRef, useState } from 'react';
import type { Entry, Photo } from '@/lib/types';
import { longLabel, todayKey } from '@/lib/dates';
import { QUICK } from '@/lib/emoji';

const FULL = 0, HALF = 180, CLOSED = 900;
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

type Props = {
  day: string; entry: Entry | undefined; photos: Photo[];
  onClose: () => void; onEmoji: (e: string | null) => void; onNote: (n: string) => void;
  onAddPhoto: (f: File[]) => void; onOpenPhoto: (i: number) => void; onMore: () => void; onClear: () => void;
};

export default function Sheet(p: Props) {
  const [off, setOff] = useState(CLOSED);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState(p.entry?.note || '');
  const st = useRef({ y0: 0, t0: 0, off0: 0, off: CLOSED, moved: false, active: false });
  const cur = useRef(CLOSED); cur.current = off;
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef(note); noteRef.current = note;
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const r = requestAnimationFrame(() => requestAnimationFrame(() => setOff(HALF))); return () => cancelAnimationFrame(r); }, []);
  useEffect(() => () => { if (saveT.current) { clearTimeout(saveT.current); p.onNote(noteRef.current); } }, []); // flush on close
  const onNoteChange = (v: string) => {
    setNote(v);
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => { saveT.current = null; p.onNote(v); }, 500);
  };

  const close = () => { setDragging(false); setOff(CLOSED); setTimeout(p.onClose, 300); };

  const down = (e: React.PointerEvent) => {
    const s = st.current;
    s.y0 = e.clientY; s.t0 = Date.now(); s.off0 = cur.current; s.off = cur.current; s.moved = false; s.active = true;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    setDragging(true);
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current; if (!s.active) return;
    const raw = e.clientY - s.y0;
    if (Math.abs(raw) > 4) s.moved = true;
    let t = s.off0 + raw;
    if (t < FULL) t = Math.max(t * 0.25, -12);
    s.off = t; setOff(t);
  };
  const up = (e: React.PointerEvent) => {
    const s = st.current; if (!s.active) return;
    s.active = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    const vel = (s.off - s.off0) / Math.max(1, Date.now() - s.t0);
    const proj = s.off + vel * 220;
    setDragging(false);
    if (!s.moved) { setOff(cur.current < 90 ? HALF : FULL); return; } // tap toggles
    if (proj > 270) close(); else setOff(proj < 90 ? FULL : HALF);
  };
  const handlers = { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up };

  const prog = Math.min(1, Math.max(0, 1 - off / HALF));
  const tr = dragging ? 'none' : `transform 320ms ${EASE}`;
  const emoji = p.entry?.emoji || null;
  const label = longLabel(p.day);
  const isToday = p.day === todayKey();

  return (
    <>
      <button className="scrim" aria-label="Close day sheet" onClick={close}
        style={{ opacity: off > HALF ? Math.max(0, 1 - (off - HALF) / 400) : off === CLOSED ? 0 : 1, transition: dragging ? 'none' : 'opacity 280ms ease' }} />
      <div className="sheet-wrap" style={{ transform: `translateY(${off}px)`, transition: tr }} role="dialog" aria-label={label}>
        <div className="sheet">
          <button className="grab" aria-label="Resize day sheet" {...handlers}><span /></button>
          <div className="shead">
            <div {...handlers} style={{ flex: 1 }}>
              <h2>{label}</h2>
              {isToday && <small>Today</small>}
            </div>
            <button className="done" onClick={close}>Done</button>
          </div>

          <div className="lab">Emoji</div>
          <div className="row">
            {QUICK.map((e) => (
              <button key={e} className={'eb' + (emoji === e ? ' on' : '')} aria-pressed={emoji === e} onClick={() => p.onEmoji(emoji === e ? null : e)}>{e}</button>
            ))}
            <button className="eb more" aria-label="More emoji" onClick={p.onMore}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#16191A"><circle cx="5.5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="18.5" cy="12" r="1.8" /></svg>
            </button>
          </div>
          {emoji && !QUICK.includes(emoji) && <div className="row"><button className="eb on" onClick={() => p.onEmoji(null)} aria-label="Remove emoji">{emoji}</button></div>}

          <div className="lab" style={{ marginTop: 24 }}><label htmlFor="note">Note</label></div>
          <div className="notebox">
            <textarea id="note" value={note} onChange={(e) => onNoteChange(e.target.value)} placeholder="Write something…"
              style={{ height: Math.round(132 + 164 * prog), transition: dragging ? 'none' : `height 320ms ${EASE}` }} />
          </div>

          <div className="lab" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <span>Photos</span><span style={{ textTransform: 'none', letterSpacing: 0 }}>{p.photos.length || ''}</span>
          </div>
          <div className="photos">
            {p.photos.map((ph, i) => (
              <button key={ph.id} className="thumb" aria-label={`Open photo ${i + 1} of ${p.photos.length}`} onClick={() => p.onOpenPhoto(i)}>
                <img src={ph.url} alt="" />
              </button>
            ))}
            <button className="addp" onClick={() => fileRef.current?.click()}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3F4BD1" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) p.onAddPhoto(f); }} />
          </div>

          <button className="clear" onClick={() => { if (confirm('Clear everything on this day?')) { setNote(''); noteRef.current = ''; if (saveT.current) { clearTimeout(saveT.current); saveT.current = null; } p.onClear(); } }}>Clear this day</button>
        </div>
      </div>
    </>
  );
}
