# Fifth Set: City Data Sources

Research document for jazz event listing sources across US cities. Each source is evaluated for scrapability, data quality, and fit with our existing cheerio-based scraper pattern (HTML table parsing, normalize.ts validation, Supabase push).

## How We Evaluate Sources

| Criteria | What We Look For |
|----------|-----------------|
| **Data completeness** | Date, time, venue, artist at minimum. End times, descriptions, and links are bonuses. |
| **Structure** | Static HTML (tables, lists, cards) is ideal. JS-rendered or SPA content requires headless browsers... adds complexity. |
| **Update frequency** | Daily or rolling-week updates preferred. Monthly calendars work but require more frequent scraping. |
| **Coverage** | Comprehensive (most/all venues in the city) vs. partial (one venue or genre subset). |
| **robots.txt** | Permissive is ideal. Restrictive or Cloudflare-protected adds legal and technical friction. |
| **Stability** | Has the site been around for years? Volunteer-run sites can disappear. Institutional sites are safer bets. |
| **Scrape difficulty** | Simple (static HTML, cheerio) / Medium (pagination, multiple pages) / Hard (JS-rendered, auth-walled, CAPTCHA) |

**Ideal source profile:** A single page (or small set of pages) with static HTML listing multiple venues' events, updated daily, with permissive robots.txt. Basically... another jazz-nyc.com.

---

## NYC (Current)

**Source:** [jazz-nyc.com](https://jazz-nyc.com/)

**Status:** Live and working.

**What works well:**
- Single-page HTML table with all events for the current period
- Clean columns: date (MM/DD/YY), time, area code (MT, BK, etc.), venue + link, artist + link
- Static HTML... cheerio parses it directly, no headless browser needed
- Covers the entire NYC metro area including NJ, CT, Westchester, Long Island
- Updated daily

**Data extracted:**
- Date, start time, end time (when available), region, venue name, venue URL, artist name, artist URL

**Rejection rate:** Low. Most events pass normalize.ts validation.

**Lessons for other cities:**
- The simpler the HTML structure, the more reliable the scraper
- Area codes map cleanly to our `regions` in cities.ts
- Single-page sources eliminate pagination complexity

---

## Chicago

### Source 1: Jazz Institute of Chicago (PRIMARY)
- **URL:** `https://jazzinstituteofchicago.org/events/` (or `/calendar/`)
- **What's available:** Events calendar covering jazz performances across Chicago. The Jazz Institute is the city's main jazz advocacy org, so their listings tend to be comprehensive.
- **Data fields:** Date, time, venue, artist/ensemble, sometimes descriptions and ticket links.
- **HTML structure:** WordPress-based site. Events likely rendered via a calendar plugin (The Events Calendar is common). Expect `<article>` or `<div>` cards with structured class names. May have list view and calendar view... list view is easier to scrape.
- **Update frequency:** Weekly or as events are submitted. Rolling calendar.
- **Coverage:** Broad. They aggregate from multiple venues across the city.
- **Scrape difficulty:** Medium. WordPress event plugins produce predictable HTML, but may paginate. Check if list view loads all events or requires "Load More" (AJAX).
- **robots.txt:** Likely permissive (WordPress default). Verify `/robots.txt`.
- **Notes:** This is the best single source for Chicago jazz. The Jazz Institute has been running since 1969... they're not going anywhere.

### Source 2: Chicago Jazz Magazine / chicagojazz.com
- **URL:** `https://chicagojazz.com/`
- **What's available:** Event listings, venue directory, artist profiles.
- **Data fields:** Date, time, venue, artist, sometimes cover charge.
- **HTML structure:** Likely WordPress or custom CMS. Calendar/list format.
- **Update frequency:** Regular, possibly weekly.
- **Coverage:** Good but may overlap heavily with Jazz Institute listings.
- **Scrape difficulty:** Medium. Need to check if events are statically rendered.
- **Notes:** Good secondary source for cross-referencing. If the Jazz Institute covers most events, this becomes a validation source rather than a primary scraper target.

### Source 3: Chicago Reader Events
- **URL:** `https://chicagoreader.com/events/` (filter by music/jazz)
- **What's available:** Comprehensive Chicago event listings. Jazz is a subcategory of music events.
- **Data fields:** Date, time, venue, artist, price, description, sometimes images.
- **HTML structure:** Modern CMS with structured event cards. May require category filtering via URL params.
- **Update frequency:** Daily.
- **Coverage:** Very broad (all genres), so jazz events are a subset. Need to filter by category or keyword.
- **Scrape difficulty:** Medium-Hard. Likely JS-rendered (React/Next.js). May need Playwright or an API endpoint. Pagination is almost certain.
- **robots.txt:** Major publication... generally permissive for search engines, but rate-limit sensitive.
- **Notes:** Best as a supplementary source. The volume of non-jazz events means more filtering work. But it catches smaller venues the Jazz Institute might miss.

### Chicago Region Mapping
Existing regions in cities.ts: South Side, West Side, North Side, The Loop. Most Chicago jazz venues cluster in:
- **South Side:** Historic jazz corridor (Green Mill is actually North Side, but South Side has deep roots)
- **The Loop / Downtown:** Jazz Showcase, Andy's Jazz Club
- **North Side:** Green Mill, some Uptown venues

### Recommendation
Start with Jazz Institute of Chicago as the primary source. Add Chicago Reader as a fallback for venue coverage gaps.

---

## New Orleans

### Source 1: WWOZ Livewire (PRIMARY)
- **URL:** `https://www.wwoz.org/calendar/livewire-music`
- **What's available:** THE definitive source for live music in New Orleans. WWOZ is the city's community radio station and their "Livewire" calendar is the gold standard. Updated by volunteers and venue owners daily.
- **Data fields:** Date, time, venue, artist/band, genre tags, sometimes cover charge.
- **HTML structure:** The Livewire calendar has historically been a structured listing page. Likely Drupal-based. Events are grouped by date with venue and artist info in a list or table-like format.
- **Update frequency:** Daily. Often updated same-day as events are announced.
- **Coverage:** Comprehensive. Covers everything from Frenchmen Street clubs to hotel lobbies to second-line parades. Jazz, brass band, R&B, funk, blues... basically all New Orleans music.
- **Scrape difficulty:** Medium. The site is older and likely serves static or server-rendered HTML. Pagination by date. May need to scrape multiple days' pages.
- **robots.txt:** Community radio station... likely permissive. They want people to find live music.
- **Notes:** This is the equivalent of jazz-nyc.com for New Orleans, except even better maintained. The challenge is filtering: WWOZ lists ALL live music, not just jazz. We'd need genre filtering in our normalizer, or accept a broader "live music in NOLA" dataset (which honestly makes sense for that city... the lines between jazz, funk, and brass band blur constantly).

### Source 2: NOLA.com / Times-Picayune Events
- **URL:** `https://www.nola.com/entertainment/music/`
- **What's available:** Event listings from the city's main newspaper.
- **Data fields:** Date, time, venue, description.
- **HTML structure:** Modern news CMS. Likely JS-heavy.
- **Update frequency:** Regular but not daily.
- **Coverage:** Partial. Focuses on bigger events and headliners.
- **Scrape difficulty:** Hard. Major news site with likely Cloudflare protection, paywalls, and JS rendering.
- **Notes:** Skip this as a scraping target. Use WWOZ instead. NOLA.com is better for manual cross-referencing.

### Source 3: Individual Venue Sites
Key jazz venues in NOLA worth monitoring:
- **Preservation Hall:** `https://www.preservationhall.com/` (iconic, limited schedule)
- **Snug Harbor:** `https://snugjazz.com/` (Frenchmen Street, dedicated jazz)
- **The Spotted Cat:** `https://www.spottedcatmusicclub.com/` (nightly music, Frenchmen)
- **d.b.a.:** Frenchmen Street staple
- **Maison:** Frenchmen, nightly jazz and brass band

**Notes:** Individual venue scraping is a fallback. WWOZ already aggregates most of these. Only worth scraping directly if WWOZ misses events or if we want to enrich data with venue-specific details (cover charge, set times).

### NOLA Region Mapping
Existing regions in cities.ts: French Quarter, Marigny, Treme, CBD, Uptown. This maps well to the actual venue distribution:
- **French Quarter:** Preservation Hall, Maison Bourbon, Fritzel's
- **Marigny (Frenchmen Street):** Snug Harbor, Spotted Cat, d.b.a., Maison, Blue Nile
- **Treme:** Candlelight Lounge, Bullet's Sports Bar (brass band traditions)
- **CBD:** Hotels with jazz lounges, Joy Theater
- **Uptown:** Tipitina's (more funk/rock but crosses over), Maple Leaf Bar

### Recommendation
WWOZ Livewire is the clear primary source. It's comprehensive, community-maintained, and likely scrapable. The genre filtering challenge is solvable... either filter in the scraper or add a genre field to our data model.

---

## Los Angeles

### Source 1: LA Jazz Scene / lajazz.com
- **URL:** `https://www.lajazz.com/`
- **What's available:** Jazz event calendar for the greater Los Angeles area. Community-maintained listing site.
- **Data fields:** Date, time, venue, artist, sometimes descriptions.
- **HTML structure:** Older-style site. Likely static HTML or simple CMS. Similar in spirit to jazz-nyc.com.
- **Update frequency:** Regular, possibly weekly or as submitted.
- **Coverage:** Moderate. Focused specifically on jazz, which is good for our use case.
- **Scrape difficulty:** Low-Medium. If it's simple HTML like jazz-nyc.com, cheerio handles it fine.
- **robots.txt:** Likely permissive (small community site).
- **Notes:** Best candidate for a jazz-nyc.com-equivalent in LA. The LA jazz scene is geographically dispersed, so a single aggregator like this is valuable.

### Source 2: Blue Whale (Venue-specific)
- **URL:** `https://bluewhale.la/` or `https://www.bluewhalemusic.com/`
- **What's available:** Calendar for one of LA's premier jazz venues in Little Tokyo.
- **Data fields:** Date, time, artist, ticket link, sometimes description.
- **HTML structure:** Modern website, possibly Squarespace or similar. Calendar widget.
- **Update frequency:** Monthly.
- **Coverage:** Single venue only. But it's a major one.
- **Scrape difficulty:** Medium. Depends on whether calendar is static or JS-rendered.
- **Notes:** Worth adding as a supplementary source, but not a primary scraper. Good for validation.

### Source 3: Catalina Jazz Club
- **URL:** `https://www.catalinajazzclub.com/`
- **What's available:** Schedule for this historic Hollywood jazz club.
- **Data fields:** Date, artist, time, ticket info.
- **HTML structure:** WordPress or similar. Event listing page.
- **Update frequency:** Monthly.
- **Coverage:** Single venue.
- **Scrape difficulty:** Low-Medium.
- **Notes:** Another supplementary venue source. Catalina's has been a staple since 1986.

### Source 4: LA Weekly Events
- **URL:** `https://www.laweekly.com/events/`
- **What's available:** Broad event listings for LA. Music is a subcategory.
- **Data fields:** Date, time, venue, description.
- **HTML structure:** Modern CMS, likely JS-rendered.
- **Update frequency:** Regular.
- **Coverage:** Broad but jazz is a small fraction.
- **Scrape difficulty:** Hard. JS-rendered, pagination, category filtering needed.
- **Notes:** Same trade-offs as Chicago Reader. Too much noise unless we can filter efficiently.

### LA Region Mapping
Existing regions in cities.ts: Hollywood, Downtown, Leimert Park, Santa Monica, South LA. This reflects the real distribution:
- **Hollywood:** Catalina Jazz Club, various hotel lounges
- **Downtown / Little Tokyo:** Blue Whale, various rotating venues
- **Leimert Park:** World Stage, community jazz hub (historically significant for West Coast jazz)
- **Santa Monica:** Harvelle's, some beach-area clubs
- **South LA:** Community venues, churches with jazz programs

### Recommendation
Start with lajazz.com as the primary source. Supplement with Blue Whale and Catalina scraping if lajazz.com has coverage gaps. LA's scene is more fragmented than NYC or NOLA, so we may need 2-3 sources to get reasonable coverage.

---

## San Francisco

### Source 1: SFJAZZ
- **URL:** `https://www.sfjazz.org/calendar/`
- **What's available:** Calendar for SFJAZZ Center, the city's premier jazz institution. Also lists some partner/community events.
- **Data fields:** Date, time, artist, venue (usually SFJAZZ Center), ticket info, description.
- **HTML structure:** Modern, well-built website. Likely React or similar SPA. May have a public API or structured JSON in page source.
- **Update frequency:** Monthly/seasonal. Their programming is booked well in advance.
- **Coverage:** Primarily their own venue, but SFJAZZ Center is THE jazz venue in SF. Some community event listings.
- **Scrape difficulty:** Medium-Hard. Modern SPA likely requires headless browser. BUT... institutional sites like this sometimes embed structured data (JSON-LD, schema.org) for SEO, which is easy to parse.
- **robots.txt:** Likely permissive for event pages (they want ticket sales).
- **Notes:** Essential source but covers mainly one venue. Need supplementary sources for the broader SF scene.

### Source 2: SF Jazz Heritage Center / Community Listings
- **URL:** Various community-maintained listings
- **What's available:** Smaller venue jazz events across SF and the Bay Area.
- **Notes:** The SF jazz scene outside SFJAZZ Center is scattered across small clubs, restaurants, and bars. There isn't a single dominant aggregator like jazz-nyc.com or WWOZ.

### Source 3: Bay Area Jazz / Community Calendars
- **URL:** Various (sfgate.com/events, bayareajazz.com if active)
- **What's available:** Aggregated jazz events for the Bay Area.
- **Data fields:** Variable.
- **Coverage:** Spotty. The Bay Area's jazz scene is more distributed across SF, Oakland, and Berkeley.
- **Scrape difficulty:** Variable.
- **Notes:** May need to check if bayareajazz.com or similar community sites exist and are maintained. The Bay Area jazz community tends to rely on email lists and social media more than centralized web calendars.

### Source 4: Individual Venue Sites
Key SF jazz venues:
- **SFJAZZ Center:** Primary (covered above)
- **Black Cat:** `https://blackcatsf.com/` (Tenderloin, jazz and supper club)
- **Mr. Tipple's Recording Studio:** Jazz cocktail bar
- **Club Deluxe:** Haight-Ashbury, jazz and swing
- **Birdland Jazz Club SF:** If operating

### SF Region Mapping
Existing regions in cities.ts: Fillmore, North Beach, SoMa, Mission. This reflects:
- **Fillmore:** SFJAZZ Center (Fillmore District is the historic jazz corridor)
- **North Beach:** Various clubs, some jazz at Vesuvio/nearby spots
- **SoMa:** Occasional jazz events in multi-purpose venues
- **Mission:** Bar jazz, smaller venues

### Recommendation
SFJAZZ.org is the starting point, but it's only one venue. SF is the hardest city to get comprehensive coverage for because there's no single aggregator. Consider launching SF with just SFJAZZ events and expanding as we find community sources. Alternatively... investigate whether SFJAZZ's site includes a broader community calendar beyond their own programming.

---

## Testing Plan

Before going live with any new city scraper, run through this validation process.

### Step 1: Dry-Run Scrape
```bash
npm run scrape -- --city [slug] --dry-run
```
- Scrape the source and run through normalize.ts
- Do NOT push to Supabase
- Log all events, rejected events, and rejection reasons

### Step 2: Manual Spot-Check (10 Events)
Pick 10 events from the dry-run output at random:
- [ ] Verify the event actually exists on the source website
- [ ] Confirm date is correct (watch for timezone/date-boundary issues)
- [ ] Confirm time format parsed correctly (12h to 24h conversion)
- [ ] Confirm venue name matches (no HTML artifacts, encoding issues)
- [ ] Confirm artist name is clean (no "w/" or "feat." left unparsed)
- [ ] Check that venue URLs and artist URLs resolve (if present)

### Step 3: Cross-Reference Against Google
Search "jazz tonight in [city]" and "jazz this week in [city]":
- [ ] Are the top 5-10 Google results reflected in our scraped data?
- [ ] Are there major venues missing from our data?
- [ ] Are there events in our data that don't appear anywhere else (possible false positives)?

### Step 4: Validate Through normalize.ts
Check the rejection rate and reasons:
- [ ] **Target rejection rate: <5%** of total scraped events
- [ ] Review each rejection reason:
  - "Empty venue name" or "Empty artist name" = scraper selector is wrong
  - "Invalid date" = date parsing needs adjustment for this source's format
  - "Past date" = source includes historical events, need to filter
  - "Too far out" = source lists events beyond 90-day window, fine to skip
  - "Invalid start time" = time parsing needs adjustment for this source's format

### Step 5: Duplicate Detection
- [ ] Check for duplicate events (same venue + date + time + artist)
- [ ] Check for near-duplicates (slightly different artist names for same event)
- [ ] Verify venue deduplication works (e.g., "The Jazz Showcase" vs "Jazz Showcase")

### Step 6: Region Mapping Validation
- [ ] Every event maps to a valid region from cities.ts
- [ ] No "unknown" or fallback regions (means venue location data is missing)
- [ ] Region distribution looks reasonable (not 100% in one region)

### Step 7: Multi-Day Monitoring
Run the scraper daily for 3-5 days before going live:
- [ ] Data volume is consistent day-to-day
- [ ] No sudden drops (site changed HTML structure)
- [ ] No sudden spikes (scraper pulling non-event content)
- [ ] Rejection rate stays below 5%

### Go-Live Checklist
- [ ] All 7 steps above pass
- [ ] Scraper runs successfully 3+ consecutive days
- [ ] City is enabled in cities.ts (already done for all 4 cities)
- [ ] Cron job updated to include new city slug
- [ ] Geocoding works for new city's venues

---

## Priority Ranking

| Rank | City | Why |
|------|------|-----|
| **1** | **New Orleans** | WWOZ Livewire is a near-perfect source... community-maintained, comprehensive, updated daily, likely simple HTML. Closest thing to another jazz-nyc.com. NOLA is also the spiritual home of jazz, so it's a strong brand signal for Fifth Set. |
| **2** | **Chicago** | Jazz Institute of Chicago provides a solid single-source aggregator. WordPress-based means predictable HTML. Chicago has the second-largest jazz scene in the US. |
| **3** | **Los Angeles** | lajazz.com could be simple to scrape if the HTML is clean, but LA's fragmented scene means one source won't cover everything. Expect to need 2-3 scrapers for reasonable coverage. |
| **4** | **San Francisco** | No good single aggregator exists. SFJAZZ.org covers one (important) venue but the rest of the scene is scattered. SF should wait until we've proven the multi-city model works with easier cities. |

### Implementation Order Notes

**Phase 1: NOLA**
- Scrape WWOZ Livewire
- Add genre filtering (jazz vs. all live music)
- Validate region mapping against Frenchmen Street cluster

**Phase 2: Chicago**
- Scrape Jazz Institute of Chicago
- Handle WordPress event plugin HTML patterns
- Cross-reference with Chicago Reader for coverage gaps

**Phase 3: LA**
- Start with lajazz.com
- Add Blue Whale and Catalina as supplementary
- Test whether 1 source is enough or if we need all 3

**Phase 4: SF**
- Start with SFJAZZ.org (may need headless browser)
- Research whether SFJAZZ has a public API or structured data
- Scout for community aggregator sites that may have emerged

---

## Scraper Architecture Notes

Our current pattern (`scrape.ts`) is tightly coupled to jazz-nyc.com's table structure. For multi-city support, we need:

1. **Per-city scraper functions** (e.g., `scrapeWWOZ()`, `scrapeJazzInstituteChicago()`)
2. **Shared interface** (all return `ScrapedEvent[]`)
3. **Shared normalization** (normalize.ts already accepts a `citySlug` param)
4. **City-specific region mapping** (like AREA_MAP for NYC, but per city)
5. **Optional: headless browser support** for JS-rendered sources (Playwright, only when needed)

The `ScrapedEvent` interface already works for any city:
```typescript
interface ScrapedEvent {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24h)
  endTime?: string;
  region: string;     // maps to cities.ts regions
  venueName: string;
  venueUrl?: string;
  artistName: string;
  artistUrl?: string;
}
```

No changes to the data model needed. Each new city just needs a scraper function that outputs this shape.
