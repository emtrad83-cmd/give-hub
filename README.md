# GIVE Hub

A personal GIVE Life Operating System for Wisdom, Wellness, Wealth, Magic, People, Goals, and daily momentum.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually:

```text
http://localhost:5173/give-hub/
```

## Optional Supabase sync

The app works in local preview mode without Supabase. To enable cloud sync, create `.env.local`:

```env
VITE_SUPABASE_URL=your_real_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_real_supabase_anon_key
```

If these are missing or placeholder values, GIVE Hub saves to browser localStorage.
