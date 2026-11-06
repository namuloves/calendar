'use client';
import { useRef, useState } from 'react';
import type { Photo } from '@/lib/types';
import { MONTHS, parseKey } from '@/lib/dates';

export default function Viewer({ photos, start, onClose, onDelete }: { photos: Photo[]; start: number; onClose: () => void; onDelete: (p: Photo) => void }) {
  const [i, setI] = useState(Math.min(start, photos.length - 1));
  const x0 = useRef<number | null>(null);
  const ph = photos[i];
  if (!ph) return null;
  const { m, d } = parseKey(ph.day);
  const go = (n: number) => setI(Math.max(0, Math.min(photos.length - 1, n)));
  return (
    <div className="viewer" role="dialog" aria-label="Photo">
      <div className="vt">
        <button className="ibtn" aria-label="Back to day" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1>{MONTHS[m].slice(0, 3)} {d} · {i + 1} of {photos.length}</h1>
        <div style={{ display: 'flex' }}>
          <a className="ibtn" aria-label="Save photo to this device" href={ph.url} download={`photo-${ph.day}-${i + 1}.jpg`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" /></svg>
          </a>
          <button className="ibtn" aria-label="Delete photo" onClick={() => { if (confirm('Delete this photo?')) { const last = photos.length === 1; onDelete(ph); if (last) onClose(); else go(Math.min(i, photos.length - 2)); } }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 7V4.5h4V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5M14 11v5" /></svg>
          </button>
        </div>
      </div>
      <div className="img"
        onPointerDown={(e) => { x0.current = e.clientX; }}
        onPointerUp={(e) => { if (x0.current === null) return; const dx = e.clientX - x0.current; x0.current = null; if (dx < -40) go(i + 1); else if (dx > 40) go(i - 1); }}>
        <img src={ph.url} alt={`Photo ${i + 1} of ${photos.length}`} draggable={false} />
      </div>
      {photos.length > 1 && (
        <div className="strip">
          {photos.map((p, n) => <button key={p.id} className={n === i ? 'on' : ''} aria-label={`Photo ${n + 1}`} onClick={() => setI(n)}><img src={p.url} alt="" /></button>)}
        </div>
      )}
    </div>
  );
}
