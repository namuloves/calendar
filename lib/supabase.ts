import { createClient } from '@supabase/supabase-js';
import type { Entry, Photo, Store } from './types';
import { shrink } from './image';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = !!(url && anon);

// Remember the signed-in user's token ourselves and attach it to every request.
// (On some browsers the default client was sending the anonymous key instead, so saves hit row-level security.)
let token: string | null = null;
export const sb = cloudEnabled
  ? createClient(url!, anon!, {
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (token && (h.get('Authorization') || '').startsWith('Bearer sb_')) h.set('Authorization', `Bearer ${token}`);
          return fetch(input, { ...init, headers: h });
        }
      }
    })
  : (null as never);
if (cloudEnabled && typeof window !== 'undefined') {
  sb.auth.onAuthStateChange((_e: string, s: { access_token?: string } | null) => { token = s?.access_token ?? null; });
  sb.auth.getSession().then(({ data }: { data: { session: { access_token: string } | null } }) => { if (data.session) token = data.session.access_token; });
}

export const cloudStore: Store = {
  async loadEntries() {
    const { data, error } = await sb.from('entries').select('day,emoji,note');
    if (error) throw error;
    return (data || []) as Entry[];
  },
  async saveEntry(e) {
    if (!e.emoji && !e.note.trim()) { const { error } = await sb.from('entries').delete().eq('day', e.day); if (error) throw error; return; }
    const { error } = await sb.from('entries').upsert({ day: e.day, emoji: e.emoji, note: e.note, updated_at: new Date().toISOString() }, { onConflict: 'user_id,day' });
    if (error) throw error;
  },
  async clearDay(day) {
    const { data } = await sb.from('photos').select('path').eq('day', day);
    if (data?.length) await sb.storage.from('photos').remove(data.map((r) => r.path));
    await sb.from('photos').delete().eq('day', day);
    await sb.from('entries').delete().eq('day', day);
  },
  async listPhotos() {
    const { data, error } = await sb.from('photos').select('id,day,path,created_at').order('created_at');
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) return [];
    const { data: signed } = await sb.storage.from('photos').createSignedUrls(rows.map((r) => r.path), 3600);
    const map = new Map((signed || []).map((s) => [s.path, s.signedUrl]));
    return rows.map((r) => ({ id: r.id, day: r.day, path: r.path, created: Date.parse(r.created_at), url: map.get(r.path) || '' }));
  },
  async addPhoto(day, file) {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user!.id;
    const blob = await shrink(file);
    const path = `${uid}/${day}/${crypto.randomUUID()}.jpg`;
    const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
    if (up.error) throw up.error;
    const { data, error } = await sb.from('photos').insert({ day, path }).select('id,created_at').single();
    if (error) throw error;
    const { data: s } = await sb.storage.from('photos').createSignedUrl(path, 3600);
    return { id: data.id, day, path, created: Date.parse(data.created_at), url: s?.signedUrl || '' } as Photo;
  },
  async deletePhoto(p) {
    if (p.path) await sb.storage.from('photos').remove([p.path]);
    await sb.from('photos').delete().eq('id', p.id);
  }
};
