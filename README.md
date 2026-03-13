# Fifth Set

**Find live jazz tonight.** Listings, maps, and venue guides for jazz in NYC and beyond.

[fifthset.live](https://fifthset.live)

## Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Database:** Supabase (Postgres, Auth, RLS)
- **Maps:** MapLibre GL JS + CARTO dark-matter tiles
- **Styling:** Tailwind CSS v4
- **Deploy:** Vercel (Supabase integration syncs env vars automatically)
- **Auth:** Supabase Email OTP (passwordless)
- **Scraper:** Node.js + Cheerio (daily cron via Vercel)
- **Email:** Resend (alerts + form submissions)
- **Analytics:** Vercel Analytics + Speed Insights

## Getting Started

```bash
cp .env.example .env
# Fill in Supabase credentials
npm install
npm run dev
```

Open [http://localhost:3006](http://localhost:3006).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (scraper only) |
| `CRON_SECRET` | Yes | Protects cron API routes |
| `RESEND_API_KEY` | Yes | Email alerts + form submissions |
| `GOOGLE_PLACES_API_KEY` | No | Geocoding fallback |
| `GOOGLE_PLACES_MAX_REQUESTS` | No | Per-run geocode budget (default: 50) |

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run scrape` | Scrape NYC (jazz-nyc.com). Add `-- --push` to write to DB |
| `npm run scrape:nola` | Scrape NOLA (WWOZ Livewire). Add `-- --push` to write to DB |
| `npm run geocode` | Geocode venues missing coordinates |
| `npm run enrich` | Enrich venue data (website, phone, photo) |

## Git Hooks

A pre-push hook runs `next lint` before allowing pushes, so lint errors never reach Vercel.

The hook lives in `.git/hooks/pre-push` (local only, not committed). After a fresh clone, re-add it:

```bash
cat > .git/hooks/pre-push << 'HOOK'
#!/bin/sh
echo "Running lint check before push..."
npm run lint --prefix "$(git rev-parse --show-toplevel)"
if [ $? -ne 0 ]; then
  echo ""
  echo "Lint failed. Fix errors before pushing."
  exit 1
fi
HOOK
chmod +x .git/hooks/pre-push
```

## Project Structure

```
fifthset/
├── app/
│   ├── [city]/              # City-scoped pages
│   │   ├── page.tsx         # Tonight's listings
│   │   ├── tomorrow/        # Tomorrow's listings
│   │   ├── this-weekend/    # Weekend listings
│   │   ├── this-week/       # This week listings
│   │   ├── next-week/       # Next week listings
│   │   ├── map/             # MapLibre map view
│   │   ├── venues/          # Venue list + detail
│   │   └── artists/         # Artist detail
│   ├── login/               # Auth (email, Google, Spotify)
│   ├── settings/            # User preferences
│   ├── about/               # About page
│   ├── for-venues/          # Sponsorship info
│   ├── auth/callback/       # OAuth callback handler
│   └── api/og/              # Dynamic OG image generation
├── components/
│   ├── EventCard.tsx         # Event listing card
│   ├── EventList.tsx         # Time-of-day grouped events
│   ├── VenueCard.tsx         # Venue card with event count
│   ├── ListingsView.tsx      # Single-date listings page
│   ├── GroupedListingsView.tsx # Multi-date listings page
│   ├── Nav.tsx               # Navigation + city/date filters
│   ├── Search.tsx            # Cmd+K search (venues + artists)
│   ├── UserMenu.tsx          # Auth state + user dropdown
│   ├── Map.tsx               # MapLibre map component
│   ├── JsonLd.tsx            # Structured data injection
│   └── SkeletonCard.tsx      # Loading skeleton
├── lib/
│   ├── types.ts              # Shared TypeScript types
│   ├── cities.ts             # Static city data + timezones
│   ├── utils.ts              # Date/time helpers, formatters
│   ├── jsonld.ts             # JSON-LD schema builders
│   └── supabase/
│       ├── server.ts         # Server-side Supabase client
│       ├── client.ts         # Browser-side Supabase client
│       ├── auth.ts           # Auth helpers (sign in/up/out, OAuth)
│       └── queries.ts        # Data fetching functions
├── scraper/
│   ├── scrape.ts             # NYC scraper (jazz-nyc.com)
│   ├── scrape-nola.ts        # NOLA scraper (WWOZ Livewire)
│   ├── normalize.ts          # Data validation + name normalization
│   ├── push-to-db.ts         # Upsert scraped data to Supabase
│   ├── geocode.ts            # Venue geocoding (Nominatim + Google Places)
│   ├── enrich.ts             # Venue data enrichment
│   └── inspect-wwoz.ts       # WWOZ HTML structure debugger
```

## Features

- **Timezone-aware dates** using `Intl.DateTimeFormat` per city
- **ISR** (5-min revalidation) for fresh data without full rebuilds
- **Dynamic OG images** via `next/og` edge runtime
- **JSON-LD structured data** (MusicEvent, MusicVenue, Organization)
- **Cmd+K search** across venues and artists
- **Auth** via Supabase (email/password, Google, Spotify OAuth)
- **Weekly sponsorship** (Claim a Week model for venue featuring)
- **MapLibre** dark map with clustered venue markers
- **Mobile-first** responsive design

## Sponsorship

Weekly "Claim a Week" model:

- $99/week per city
- Featured badge, top placement, city page banner
- "Tonight at [Venue]" homepage callout
- Analytics on impressions and clicks

## Cities

| City | Slug | Source | Status |
|------|------|--------|--------|
| New York City | `nyc` | jazz-nyc.com | Live |
| New Orleans | `nola` | WWOZ Livewire | Live |
| Chicago | `chicago` | TBD | Coming Soon |
| Los Angeles | `la` | TBD | Coming Soon |
| San Francisco | `sf` | TBD | Coming Soon |

## Data Pipeline

Scrapers run daily at 10 AM UTC (6 AM ET) via Vercel cron:

1. **Scrape** sources (jazz-nyc.com, WWOZ Livewire)
2. **Normalize** and validate (dates, times, names, dedup)
3. **Push** to Supabase (upsert venues/artists, insert events)
4. **Cleanup** stale events (older than 30 days)
5. **Geocode** new venues (Nominatim 7-strategy fallback, then Google Places)
6. **Alert** on failures via Resend email

## Email Addresses

| Address | Where | Purpose |
|---------|-------|---------|
| `hello@fifthset.live` | About page | General contact |
| `venues@fifthset.live` | For Venues page | Sponsor inquiries |
| `*@fifthset.live` | Catch-all | Forwards to personal email |

All addresses route through Cloudflare Email Routing to Jared's personal inbox. Catch-all is enabled.

## Listening Match (Planned)

Connect your Spotify or Apple Music account, and Fifth Set will match your listening history against artists in the database... then notify you when one of those artists has an upcoming show.

### How It Works

1. **Daily cron** syncs listening data from connected accounts (top artists, recently played)
2. **Matching engine** compares external artists against the venue/artist database
3. **Notifications** fire when a matched artist has an event (email via Resend, push in Phase 3)

### Spotify Integration

- OAuth with scopes: `user-read-recently-played`, `user-top-read`
- Endpoints: `/v1/me/top/artists`, `/v1/me/player/recently-played`
- Refresh token stored in `user_music_connections` table
- Daily sync pulls top and recently played artists

### Apple Music Integration

- MusicKit JS for browser auth
- Apple Music API: `/v1/me/library/artists`, `/v1/me/recent/played`
- Developer token (server-side JWT) + user music token
- Same sync pattern as Spotify

### Data Model (new tables)

```
user_music_connections
  id, user_id, provider (spotify | apple_music),
  access_token, refresh_token, token_expires_at,
  last_synced_at, created_at

user_listened_artists
  id, user_id, provider, external_artist_name,
  external_artist_id, artist_id (nullable FK to artists),
  match_confidence, last_seen_at

artist_aliases
  id, artist_id, alias (for fuzzy matching)
```

### Matching Logic

- Exact name match first
- Fuzzy match via Levenshtein or trigram (`pg_trgm` extension)
- `artist_aliases` table for known variations (e.g. "Benny Green Trio" → "Benny Green")
- Unmatched artists flagged for manual review
- Match confidence score stored per record

### UI

- **Settings page:** Connect Spotify / Connect Apple Music buttons
- **Event cards:** "You listen to this artist" badge
- **Notification preferences:** email digest frequency (daily, weekly, or off)

### Privacy

- Only artist listening data is stored... no tracks, no play counts
- Users can disconnect anytime (deletes tokens + all listening data)
- Clear disclosure on the connect screen about what data is accessed

## License

Private.
