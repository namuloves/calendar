import type { Entry, Photo, Store } from './types';
import { shrink } from './image';

const EK = 'cal.entries.v1';
const rd = (): Record<string, Entry> => { try { return JSON.parse(localStorage.getItem(EK) || '{}'); } catch { return {}; } };
const wr = (o: Record<string, Entry>) => { try { localStorage.setItem(EK, JSON.stringify(o)); } catch {} };

const db = (): Promise<IDBDatabase> => new Promise((res, rej) => {
  const r = indexedDB.open('cal', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const tx = async <T,>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const d = await db();
  return new Promise((res, rej) => { const r = f(d.transaction('photos', mode).objectStore('photos')); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
};

export const localStore: Store = {
  async loadEntries() { return Object.values(rd()); },
  async saveEntry(e) { const o = rd(); if (!e.emoji && !e.note.trim()) delete o[e.day]; else o[e.day] = e; wr(o); },
  async clearDay(day) {
    const o = rd(); delete o[day]; wr(o);
    const all = await tx<any[]>('readonly', (s) => s.getAll());
    await Promise.all(all.filter((p) => p.day === day).map((p) => tx('readwrite', (s) => s.delete(p.id))));
  },
  async listPhotos() {
    const all = await tx<any[]>('readonly', (s) => s.getAll());
    return all.sort((a, b) => a.created - b.created).map((p) => ({ id: p.id, day: p.day, created: p.created, url: URL.createObjectURL(p.blob) }));
  },
  async addPhoto(day, file) {
    const blob = await shrink(file);
    const rec = { id: crypto.randomUUID(), day, created: Date.now(), blob };
    await tx('readwrite', (s) => s.put(rec));
    return { id: rec.id, day, created: rec.created, url: URL.createObjectURL(blob) } as Photo;
  },
  async deletePhoto(p) { await tx('readwrite', (s) => s.delete(p.id)); }
};
