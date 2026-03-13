# Google Cloud Platform Setup

Fifth Set uses Google Places API (New) for venue geocoding and enrichment.

## 1. Budget Alert ($10/month)

1. Go to **GCP Billing > Budgets & Alerts**
2. Click **Create Budget**
3. Name: `Places API Monthly`
4. Scope: select your project
5. Amount: $10 (custom amount)
6. Thresholds: add alerts at 50% ($5), 90% ($9), 100% ($10)
7. Check "Email alerts to billing admins"
8. Click Finish

## 2. API Key Restriction

1. Go to **APIs & Services > Credentials**
2. Click your API key name
3. Under **API restrictions**, select **Restrict key**
4. In the dropdown, check only **Places API (New)**
5. Click Save

## 3. Daily Quota (100 requests/day)

1. Go to **APIs & Services > Enabled APIs**
2. Click **Places API (New)**
3. Click **Quotas & System Limits** tab
4. Find Text Search requests (or similar per-method quota)
5. Click the pencil/edit icon
6. Set limit to **100 per day**
7. Save

If the quotas tab doesn't show editable per-method limits, the fallback is already in code: `GOOGLE_PLACES_MAX_REQUESTS` env var caps requests per scraper run (default 50).

## Environment Variables

```
GOOGLE_PLACES_API_KEY=your-key-here
GOOGLE_PLACES_MAX_REQUESTS=50
```
