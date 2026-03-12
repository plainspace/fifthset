# Fifth Set

**Find live jazz tonight.** Listings, maps, and venue guides for jazz in NYC and beyond.

[fifthset.live](https://fifthset.live)

## Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Database:** Supabase (Postgres, Auth, RLS)
- **Maps:** MapLibre GL JS + CARTO dark-matter tiles
- **Styling:** Tailwind CSS v4
- **Deploy:** Vercel
- **Scraper:** Node.js + Cheerio (daily cron via GitHub Actions)

## Getting Started

```bash
cp .env.example .env
# Fill in Supabase credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (scraper only) |

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run scrape` | Run jazz-nyc.com scraper |
| `npm run geocode` | Geocode venues missing coordinates |

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
│   ├── scrape.ts             # jazz-nyc.com scraper
│   ├── push-to-db.ts         # Upsert scraped data to Supabase
│   └── geocode.ts            # Venue geocoding (Nominatim)
└── .github/workflows/
    └── scrape.yml            # Daily cron at 6am ET
```

## Features

- **Timezone-aware dates** using `Intl.DateTimeFormat` per city
- **ISR** (5-min revalidation) for fresh data without full rebuilds
- **Dynamic OG images** via `next/og` edge runtime
- **JSON-LD structured data** (MusicEvent, MusicVenue, Organization)
- **Cmd+K search** across venues and artists
- **Auth** via Supabase (email/password, Google, Spotify OAuth)
- **Sponsor tiers** (Free, Spotlight, Marquee) with featured treatment
- **MapLibre** dark map with clustered venue markers
- **Mobile-first** responsive design

## Sponsorship Tiers

| Tier | Price | Treatment |
|------|-------|-----------|
| Free | $0 | Standard listing |
| Spotlight | $99/mo | Gold border, "Featured" badge, priority sort |
| Marquee | $349/mo | Same + newsletter placement, homepage feature |

## Cities

NYC (live), Chicago, New Orleans, LA, SF (scaffolded, pending scrapers).

## Data Pipeline

The scraper runs daily at 6am ET via GitHub Actions:

1. Fetches jazz-nyc.com HTML table
2. Parses rows into venue/artist/event records
3. Upserts to Supabase (deduplicates by name/date)
4. Auto-geocodes new venues via Nominatim (7-strategy fallback)

## Email Addresses

| Address | Where | Purpose |
|---------|-------|---------|
| `hello@fifthset.live` | About page | General contact |
| `venues@fifthset.live` | For Venues page | Sponsor inquiries |

Both need to be set up as forwards or inboxes.

## License

Private.
