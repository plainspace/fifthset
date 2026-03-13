# Adding Cities to Fifth Set

Internal reference for expanding city coverage on fifthset.live.

---

## Current State

### Scrapers Live (automated daily via Vercel cron)

| City | Scraper File | Source | Status |
|------|-------------|--------|--------|
| NYC | `scraper/scrape.ts` | jazz-nyc.com | Working |
| New Orleans | `scraper/scrape-nola.ts` | WWOZ Livewire | Working |

### In Database, No Scraper (submission-only)

These cities exist in the DB and appear in the submit form, but rely entirely on user submissions until scrapers are built.

**Already had DB entries:** Chicago, Los Angeles, San Francisco

**Recently added:** Atlanta, Austin, Boston, DC, Denver, Detroit, Houston, Kansas City, Miami, Minneapolis, Nashville, Philadelphia, Pittsburgh, Portland, Seattle

---

## How to Add a New City

### 1. Database migration

Add the city to the `cities` table in Supabase with slug, display name, and regions. Regions should reflect real neighborhood clusters where jazz venues exist (e.g., for DC: U Street, Georgetown, Adams Morgan, Capitol Hill).

### 2. Submit form dropdown

The city needs to appear in the submission form so users can submit events. This is driven by the cities data... once the city is in the DB, it should show up.

### 3. Scraper file (when a source is identified)

Create a new scraper file following the existing pattern:

- File: `scraper/scrape-[slug].ts`
- Export a function (e.g., `scrapeDC()`) that returns `ScrapedEvent[]`
- Each event needs at minimum: date (YYYY-MM-DD), startTime (HH:MM 24h), venueName, artistName, region
- See `scraper/scrape.ts` (NYC) and `scraper/scrape-nola.ts` for reference implementations

The `ScrapedEvent` interface is already city-agnostic:
```typescript
interface ScrapedEvent {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24h)
  endTime?: string;
  region: string;     // maps to city's regions
  venueName: string;
  venueUrl?: string;
  artistName: string;
  artistUrl?: string;
}
```

### 4. Register in cron route

Add the new scraper to `app/api/cron/scrape/route.ts` following the NYC/NOLA pattern:

1. Import the scrape function
2. Add a try/catch block that scrapes, normalizes (via `normalizeScrapedData`), and pushes (via `pushToSupabase`)
3. Include the source URL in the `pushToSupabase` call for attribution

### 5. Test before going live

See `docs/city-sources.md` for the full testing plan (dry-run, spot-check, duplicate detection, multi-day monitoring). The short version: run the scraper for 3-5 days in dry-run mode before enabling it in production.

---

## Priority Cities for Scraper Development

Ranked by jazz scene significance and source scrapability.

| Priority | City | Why | Best Known Source |
|----------|------|-----|-------------------|
| 1 | Chicago | Second-largest US jazz scene, Jazz Institute has a solid aggregator | Jazz Institute of Chicago (WordPress events page) |
| 2 | DC | U Street corridor, major jazz history, Kennedy Center programming | DC Jazz Festival site, Kennedy Center calendar |
| 3 | Philadelphia | Strong scene around South Broad Street, Chris' Jazz Cafe corridor | Philly Jazz calendar, individual venue sites |
| 4 | Detroit | Deep jazz roots, Baker's Keyboard Lounge (oldest jazz club in US) | Detroit Jazz Festival org, local venue sites |
| 5 | Kansas City | Historic jazz city, 18th & Vine district, active scene | American Jazz Museum calendar, KC Jazz venues |
| 6 | Los Angeles | Large but fragmented scene | lajazz.com (potential jazz-nyc.com equivalent) |
| 7 | San Francisco | No single aggregator, SFJAZZ covers one venue | SFJAZZ.org calendar |

See `docs/city-sources.md` for detailed source research on Chicago, LA, SF, and NOLA (including HTML structure analysis, scrape difficulty, and region mapping).

---

## Known Jazz Listing Sources by City

Sources worth investigating for scraper development. Quality and scrapability vary.

| City | Potential Sources |
|------|-------------------|
| **Chicago** | Jazz Institute of Chicago (events page), Chicago Jazz Magazine, Chicago Reader events |
| **DC** | CapitalBop (DC jazz blog/calendar), Kennedy Center jazz calendar, Blues Alley schedule |
| **Philadelphia** | Philadelphia Jazz Project, Chris' Jazz Cafe calendar, South Jazz Kitchen |
| **Detroit** | Dirty Dog Jazz Cafe calendar, Cliff Bell's schedule, Detroit Jazz Festival org |
| **Kansas City** | American Jazz Museum events, Green Lady Lounge, The Blue Room at AJM |
| **Los Angeles** | lajazz.com, Blue Whale calendar, Catalina Jazz Club |
| **San Francisco** | SFJAZZ.org, Black Cat SF, individual venue sites |
| **Boston** | Scullers Jazz Club, Wally's Cafe (one of oldest jazz clubs), Berklee events |
| **Nashville** | Nashville Jazz Workshop, Rudy's Jazz Room |
| **Minneapolis** | Dakota Jazz Club, Twin Cities Jazz Festival org |
| **Atlanta** | Atlanta Jazz Festival org, Venkman's, Velvet Note |
| **Denver** | Dazzle Jazz, Nocturne Jazz, Denver jazz community calendars |
| **Houston** | Houston Jazz Festival, Cezanne, The Jazz Spot |
| **Austin** | Elephant Room (main jazz venue), Austin jazz community |
| **Miami** | South Beach Jazz Festival, Lagniappe, jazz at Faena |
| **Portland** | PDX Jazz (Portland Jazz Festival org), Jack London Revue |
| **Pittsburgh** | Manchester Craftsmen's Guild (MCG Jazz), Pittsburgh Jazz Society |
| **Seattle** | Earshot Jazz (festival org with year-round listings), Tula's Jazz Club |

**Best bets for easy scraping:** Cities with a single dominant aggregator site (like jazz-nyc.com was for NYC). Chicago's Jazz Institute, KC's American Jazz Museum, Seattle's Earshot Jazz, and Portland's PDX Jazz are the most likely candidates for clean, scrapable sources.

---

## The Hybrid Model

Not every city needs a scraper on day one. The system supports a two-track approach:

**Scraper cities:** Automated daily pulls from source sites. High volume, consistent coverage. Currently NYC and NOLA.

**Submission cities:** Users submit events through the form on fifthset.live. Lower volume but covers any city in the database. This is how all 15 new cities work right now.

**How they work together:**

- Submissions fill gaps in scraper coverage (one-off events, pop-ups, venues the source site misses)
- Scrapers provide the baseline so the city page isn't empty
- A city can start as submission-only and graduate to scraper-backed once a good source is found and built
- Even scraper cities benefit from submissions... no single source catches everything

**The practical sequence for a new city:**

1. Add to database (it becomes submission-only immediately)
2. Research sources (check `docs/city-sources.md`, scout sites)
3. Build scraper when a good source is confirmed
4. Run in dry-run mode for 3-5 days
5. Enable in cron route
6. Submissions continue alongside the scraper

This means every city in the database is "live" from the moment it's added... it just might not have much content until either submissions come in or a scraper gets built. That's fine. An empty city page with a working submit form is better than no city page at all.
