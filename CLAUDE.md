# Fifth Set

Find live jazz tonight. Listings, maps, and venue guides for NYC and NOLA (expanding).

**Live:** https://fifthset.live
**Deploy:** Vercel (auto-deploy on push to main)

---

## Tech Stack

- **Framework:** Next.js 16.1.6, App Router, React 19
- **Language:** TypeScript 5.7 (strict)
- **Database:** Supabase (Postgres + Auth + RLS)
- **Maps:** MapLibre GL JS + CARTO dark-matter tiles
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Auth:** Supabase Email OTP + OAuth (Google, Spotify)
- **Scraping:** Cheerio (daily cron via Vercel)
- **Email:** Resend
- **Analytics:** Vercel Analytics + Speed Insights

## Project Structure

```
app/
├── [city]/              # City-scoped pages (tonight, tomorrow, this-weekend, etc.)
│   ├── map/             # MapLibre map view
│   ├── venues/          # Venue list + detail
│   └── artists/         # Artist detail
├── login/               # Email OTP + OAuth
├── settings/            # User preferences
├── saved/               # Saved events
├── submit/              # Event/venue submission form
├── admin/submissions/   # Admin queue
├── api/
│   ├── cron/scrape/     # Daily scraper (6 AM ET)
│   ├── cron/enrich/     # Weekly enrichment (Mon)
│   ├── og/              # Dynamic OG images
│   └── venues/search/   # Cmd+K search
components/              # Reusable components
lib/
├── cities.ts            # City configs + timezone mappings
├── types.ts             # TypeScript interfaces
├── utils.ts             # Date/time formatters, cn()
├── jsonld.ts            # Structured data schemas
└── supabase/            # Client, server, auth, queries, admin
scraper/
├── scrape.ts            # NYC scraper
├── scrape-nola.ts       # NOLA scraper
├── normalize.ts         # Validation + dedup
├── push-to-db.ts        # Upsert to Supabase
├── geocode.ts           # Nominatim + Google Places fallback
└── enrich.ts            # Venue enrichment (website, phone, photo)
```

## Dev Commands

| Command | What |
|---------|------|
| `npm run dev` | Dev server on :3006 |
| `npm run build` | Production build (also pre-push hook) |
| `npm run lint` | ESLint |
| `npm run scrape` | NYC scraper (add `-- --push` to write to DB) |
| `npm run scrape:nola` | NOLA scraper (add `-- --push` to write) |
| `npm run geocode` | Geocode venues missing coordinates |
| `npm run enrich` | Enrich venue data |

## Key Conventions

### Timezone-Aware Dates
Always use `getLocalDate(timezone)` from `lib/utils.ts` when checking "today" in a city. Never use raw `new Date()` for date comparisons.

### Cities
Defined in `lib/cities.ts`. Each has slug, name, lat/lng, timezone, regions, and `live` flag. Use `getCityBySlug()`, `getCitySlugs()`, `getLocalDate()`.

### ISR
City pages: `revalidate = 300` (5 min). Venue/artist pages: 1 min. Search is dynamic.

### Venue Sponsor Tiers
`free` (standard), `spotlight` (featured border), `marquee` (top placement + homepage callout).

### Styling
- Dark theme only. Colors defined as CSS variables in `globals.css`.
- Gold accent: `--color-accent` (#d4a24e)
- Use `cn()` from `lib/utils.ts` for merging Tailwind classes.

### JSON-LD
Structured data built in `lib/jsonld.ts`, injected via `<JsonLd>` component. Schemas: Organization, MusicEvent, MusicVenue, Breadcrumb.

### Scraper Pipeline
1. Scrape HTML (Cheerio) → 2. Normalize + dedup → 3. Upsert to Supabase → 4. Geocode new venues → 5. Email report

**Never mention scraping sources in public-facing copy.** Use "curate" language.

### Pre-Push Hook
`.git/hooks/pre-push` runs `npm run build`. Lint/type errors block the push.

### Testing
No test framework configured yet. Needs Vitest added.

## Auth Flow

- Email OTP: enter email → Supabase sends code → enter code → session
- OAuth: Google or Spotify → `/auth/callback` → session
- Client: `lib/supabase/auth.ts` for sign in/up/out
- Server: `lib/supabase/server.ts` for SSR client

## CI/CD

- `.github/workflows/scrape.yml` - Daily scrape at 11:00 UTC (6 AM ET)
- `.github/workflows/site-health-pr.yml` - PR build checks
- Vercel auto-deploys on push to `main`
- Supabase env vars synced automatically via Vercel integration
