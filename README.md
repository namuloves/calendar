# Private calendar

Next.js + Supabase PWA. Monthly grids in one continuous scroll, emoji / notes / photos per day, 일주 (day pillar) in hanja.

## Run locally (no account needed)
1. `npm install`
2. `npm run dev` → http://localhost:3000
3. With no env vars set, data stays in this browser (localStorage + IndexedDB).

## Turn on Supabase (sync across devices, private)
1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (tables, RLS, private `photos` bucket).
3. Auth → URL configuration: add your site URL (and `http://localhost:3000`) as redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
5. Restart. You get an email sign-in link; only your account can read your rows and photos.

## Put it on your phone
1. Deploy to Vercel (set the two env vars there).
2. Open the URL in Safari → Share → Add to Home Screen.
