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
    const { scrapeWWOZ } = await import("@/scraper/scrape-nola");
    const { normalizeScrapedData } = await import("@/scraper/normalize");
    const { pushToSupabase, cleanupStaleEvents } = await import(
      "@/scraper/push-to-db"
    );

    const results: Record<string, unknown> = {};
    const allErrors: string[] = [];

    // --- NYC ---
    try {
      const scraped = await scrapeJazzNYC();
      const normalized = normalizeScrapedData(scraped, "nyc");
      const stats = await pushToSupabase(normalized, "nyc", "https://jazz-nyc.com/");
      results.nyc = {
        scraped: scraped.length,
        normalized: normalized.events.length,
        rejected: normalized.rejected.length,
        inserted: stats.eventsInserted,
        skipped: stats.eventsSkipped,
      };
      if (scraped.length === 0 || stats.errors.length > 10) {
        allErrors.push(`NYC anomaly: ${scraped.length} scraped, ${stats.errors.length} errors`);
      }
      allErrors.push(...stats.errors);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.nyc = { error: msg };
      allErrors.push(`NYC failed: ${msg}`);
    }

    // --- NOLA ---
    try {
      const scraped = await scrapeWWOZ();
      const normalized = normalizeScrapedData(scraped, "nola");
      const stats = await pushToSupabase(normalized, "nola", "https://www.wwoz.org/livewire");
      results.nola = {
        scraped: scraped.length,
        normalized: normalized.events.length,
        rejected: normalized.rejected.length,
        inserted: stats.eventsInserted,
        skipped: stats.eventsSkipped,
      };
      // NOLA is new... don't alert on 0 events until selectors are tuned
      if (stats.errors.length > 10) {
        allErrors.push(`NOLA anomaly: ${stats.errors.length} errors`);
      }
      allErrors.push(...stats.errors);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.nola = { error: msg };
      allErrors.push(`NOLA failed: ${msg}`);
    }

    // Cleanup stale events (all cities)
    const cleaned = await cleanupStaleEvents();

    const summary = {
      ...results,
      cleaned,
      errors: allErrors.length,
      timestamp: new Date().toISOString(),
    };

    if (allErrors.length > 0) {
      await sendAlert(summary, allErrors);
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
