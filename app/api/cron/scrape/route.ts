import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes (Vercel Pro limit)

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { scrapeJazzNYC } = await import("@/scraper/scrape");
    const { normalizeScrapedData } = await import("@/scraper/normalize");
    const { pushToSupabase, cleanupStaleEvents } = await import(
      "@/scraper/push-to-db"
    );

    // 1. Scrape
    const scraped = await scrapeJazzNYC();

    // 2. Normalize + validate
    const normalized = normalizeScrapedData(scraped, "nyc");

    // 3. Push to DB
    const stats = await pushToSupabase(normalized, "nyc");

    // 4. Cleanup stale events
    const cleaned = await cleanupStaleEvents();

    // 5. Geocode new venues (skip in cron for now, it's too slow)
    // Could be a separate cron on a less frequent schedule

    const summary = {
      scraped: scraped.length,
      normalized: normalized.events.length,
      rejected: normalized.rejected.length,
      inserted: stats.eventsInserted,
      skipped: stats.eventsSkipped,
      venuesUpserted: stats.venuesUpserted,
      artistsUpserted: stats.artistsUpserted,
      cleaned,
      errors: stats.errors.length,
      timestamp: new Date().toISOString(),
    };

    // 6. Alert on anomalies
    const isAnomaly =
      scraped.length === 0 ||
      normalized.rejected.length > normalized.events.length * 0.5 ||
      stats.errors.length > 10;

    if (isAnomaly) {
      await sendAlert(summary, stats.errors);
    }

    return NextResponse.json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Scrape cron failed:", message);

    await sendAlert(
      { error: message, timestamp: new Date().toISOString() },
      [message]
    );

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function sendAlert(
  summary: Record<string, unknown>,
  errors: string[]
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("No RESEND_API_KEY, skipping alert email");
    return;
  }

  const body = `Fifth Set scraper alert:\n\n${JSON.stringify(summary, null, 2)}\n\nErrors:\n${errors.join("\n")}`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fifth Set <noreply@fifthset.live>",
        to: ["jared@fifthset.live"],
        subject: "Fifth Set Scraper Alert",
        text: body,
      }),
    });
  } catch (e) {
    console.error("Failed to send alert email:", e);
  }
}
