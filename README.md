# Yomusic

Search Indian film music by music director, singer, movie, or year — and create YouTube playlists saved directly to your YouTube channel.

**Free to run** — built on Vercel (free tier) + Supabase (free tier) + YouTube Data API v3 (free quota).

---

## Features

- Filter by: Language, Music Director, Singer, Movie Name, Year Range, Song Count (5–50)
- Smart YouTube search using videoCategoryId=Music and quoted phrases
- Select/deselect individual songs from results
- Create a real YouTube playlist saved to your Google account
- View your playlist history; open any playlist on YouTube

---

## Setup

### 1. Supabase Project

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema below
3. Go to **Authentication → Providers → Google** and enable it
   - Add `https://www.googleapis.com/auth/youtube` to **Additional Scopes**
   - Copy your Google Client ID + Secret (you'll get these from step 2)

**SQL Schema** — paste into Supabase SQL Editor and run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE playlists (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_id    TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  video_count   INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE playlist_items (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id      UUID        NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_video_id TEXT        NOT NULL,
  title            TEXT        NOT NULL,
  channel_title    TEXT,
  thumbnail_url    TEXT,
  position         INTEGER     NOT NULL DEFAULT 0,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_history (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filters       JSONB       NOT NULL,
  query_string  TEXT        NOT NULL,
  result_count  INTEGER     NOT NULL DEFAULT 0,
  quota_used    INTEGER     NOT NULL DEFAULT 0,
  searched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quota_usage (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE    NOT NULL DEFAULT CURRENT_DATE,
  units_consumed  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can only see their own data)
CREATE POLICY "users own playlists" ON playlists USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users own playlist_items" ON playlist_items USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users own search_history" ON search_history USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users own quota_usage" ON quota_usage USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 2. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → Create or select a project
2. Enable **YouTube Data API v3** (APIs & Services → Library)
3. Create an **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Also add `http://localhost:3000/auth/callback` for local dev
4. Create an **API Key** (APIs & Services → Credentials → Create Credentials → API Key)
   - Restrict it to YouTube Data API v3
5. Configure the **OAuth consent screen**:
   - Add scope: `https://www.googleapis.com/auth/youtube`
   - Add your email as a test user (while in Testing mode)

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key          # Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # Project Settings → API (keep secret)
YOUTUBE_API_KEY=your-api-key                         # Google Cloud Console → Credentials
NEXT_PUBLIC_APP_URL=http://localhost:3000            # Change to your Vercel URL for prod
DAILY_QUOTA_PER_USER=2000                            # Optional: units per user per day
```

### 4. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel project settings
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://yomusic.vercel.app`)
5. Update the OAuth redirect URI in Google Cloud Console to include `https://your-vercel-url.vercel.app/auth/callback`
6. Update the Supabase redirect URL in Authentication → URL Configuration → Redirect URLs

---

## YouTube API Quota

YouTube Data API v3 gives 10,000 units/day for free.

| Action | Cost |
|--------|------|
| Search (any filter combo) | 100 units |
| Create playlist | 50 units |
| Add each song | 50 units each |

A typical session (2 searches + 10-song playlist) costs ~750 units. The soft per-user daily cap is configurable via `DAILY_QUOTA_PER_USER`.

---

## Tech Stack

- [Next.js 15](https://nextjs.org) — App Router, TypeScript
- [Supabase](https://supabase.com) — Auth (Google OAuth) + Postgres
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://radix-ui.com) primitives
- [Vercel](https://vercel.com) — deployment
