import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes (Vercel Pro limit)

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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

    await sendSummary(summary, allErrors);

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

async function sendSummary(
  summary: Record<string, unknown>,
  errors: string[]
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const nyc = summary.nyc as Record<string, unknown> | undefined;
  const nola = summary.nola as Record<string, unknown> | undefined;
  const cleaned = summary.cleaned as number | undefined;
  const timestamp = summary.timestamp as string;
  const date = new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

  const hasErrors = errors.length > 0;
  const statusIcon = hasErrors ? "&#9888;" : "&#9989;";
  const statusText = hasErrors ? "Completed with issues" : "Completed successfully";

  function cityRow(label: string, data: Record<string, unknown> | undefined): string {
    if (!data) return "";
    if (data.error) {
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${label}</td>
          <td colspan="4" style="padding:8px 12px;border-bottom:1px solid #eee;color:#dc2626">Failed: ${data.error}</td>
        </tr>`;
    }
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${data.scraped ?? 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${data.normalized ?? 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#16a34a;font-weight:600">${data.inserted ?? 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#9ca3af">${data.skipped ?? 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#dc2626">${data.rejected ?? 0}</td>
      </tr>`;
  }

  const html = `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2 style="margin:0 0 4px;font-size:18px">Fifth Set Scraper Report</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px">${date} at ${time} ET</p>

      <p style="font-size:15px;margin:0 0 16px">${statusIcon} ${statusText}</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">City</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Scraped</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Valid</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Added</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Skipped</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Rejected</th>
          </tr>
        </thead>
        <tbody>
          ${cityRow("NYC", nyc)}
          ${cityRow("NOLA", nola)}
        </tbody>
      </table>

      ${cleaned ? `<p style="font-size:14px;color:#6b7280;margin:0 0 16px">Cleaned up ${cleaned} stale event${cleaned === 1 ? "" : "s"} (30+ days old)</p>` : ""}

      ${hasErrors ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin-bottom:16px">
          <p style="margin:0 0 8px;font-weight:600;color:#dc2626;font-size:14px">${errors.length} error${errors.length === 1 ? "" : "s"}</p>
          <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#7f1d1d">
            ${errors.slice(0, 20).map((e) => `<li style="margin:0 0 4px">${e}</li>`).join("")}
            ${errors.length > 20 ? `<li style="color:#9ca3af">...and ${errors.length - 20} more</li>` : ""}
          </ul>
        </div>
      ` : ""}

      <p style="font-size:12px;color:#9ca3af;margin:0;border-top:1px solid #e5e7eb;padding-top:12px">
        Automated report from Fifth Set scraper cron
      </p>
    </div>`;

  const subject = hasErrors
    ? `Scraper Report: ${errors.length} issue${errors.length === 1 ? "" : "s"} - ${date}`
    : `Scraper Report: ${(nyc && !nyc.error ? (nyc.inserted as number) : 0) + (nola && !nola.error ? (nola.inserted as number) : 0)} new events - ${date}`;

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
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error("Failed to send summary email:", e);
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
