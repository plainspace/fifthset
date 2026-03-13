import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const CITY_SLUG_MAP: Record<string, string> = {
  nyc: "nyc",
  "new york city": "nyc",
  nola: "nola",
  "new orleans": "nola",
  chicago: "chicago",
  la: "la",
  "los angeles": "la",
  sf: "sf",
  "san francisco": "sf",
};

function htmlPage(title: string, message: string, success: boolean) {
  const color = success ? "#16a34a" : "#dc2626";
  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafafa;">
  <div style="text-align: center; padding: 40px;">
    <div style="font-size: 48px; margin-bottom: 16px;">${success ? "&#10003;" : "&#10007;"}</div>
    <h1 style="font-size: 24px; color: ${color}; margin-bottom: 8px;">${title}</h1>
    <p style="color: #666; font-size: 16px;">${message}</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const key = searchParams.get("key");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || key !== adminKey) {
    return htmlPage("Unauthorized", "Invalid or missing API key.", false);
  }

  if (action !== "approve" && action !== "reject") {
    return htmlPage("Invalid Action", "Action must be approve or reject.", false);
  }

  const supabase = createAdminClient();

  const { data: submission, error: fetchError } = await supabase
    .from("pending_events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !submission) {
    return htmlPage("Not Found", "Submission not found.", false);
  }

  if (submission.status !== "pending") {
    return htmlPage("Already Processed", `This submission was already ${submission.status}.`, false);
  }

  if (action === "approve") {
    const result = await approveSubmission(supabase, submission);
    if (!result.ok) {
      return htmlPage("Error", result.error!, false);
    }
    return htmlPage(
      "Approved",
      `${submission.artist} at ${submission.venue} on ${submission.date} has been added.`,
      true
    );
  }

  await supabase
    .from("pending_events")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return htmlPage(
    "Rejected",
    `${submission.artist} at ${submission.venue} submission has been rejected.`,
    true
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status, artist, venue, date, time, city, genre } = body;

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: "Status must be approved or rejected" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: submission, error: fetchError } = await supabase
    .from("pending_events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: `Submission already ${submission.status}` },
      { status: 409 }
    );
  }

  const fieldUpdates: Record<string, string> = {};
  if (artist !== undefined) fieldUpdates.artist = artist;
  if (venue !== undefined) fieldUpdates.venue = venue;
  if (date !== undefined) fieldUpdates.date = date;
  if (time !== undefined) fieldUpdates.time = time;
  if (city !== undefined) fieldUpdates.city = city;
  if (genre !== undefined) fieldUpdates.genre = genre;

  if (Object.keys(fieldUpdates).length > 0) {
    await supabase.from("pending_events").update(fieldUpdates).eq("id", id);
  }

  const { data: updated } = await supabase
    .from("pending_events")
    .select("*")
    .eq("id", id)
    .single();

  if (status === "approved") {
    const result = await approveSubmission(supabase, updated || submission);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, event_id: result.eventId });
  }

  await supabase
    .from("pending_events")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true });
}

async function approveSubmission(
  supabase: ReturnType<typeof createAdminClient>,
  submission: Record<string, string>
): Promise<{ ok: boolean; eventId?: string; error?: string }> {
  const citySlug =
    CITY_SLUG_MAP[submission.city] ||
    CITY_SLUG_MAP[submission.city.toLowerCase()] ||
    submission.city;

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (!city) {
    return { ok: false, error: `City '${submission.city}' not found` };
  }

  const venueSlug = slugify(submission.venue);
  const { error: venueError } = await supabase.from("venues").upsert(
    {
      city_id: city.id,
      name: submission.venue,
      slug: venueSlug,
      website: submission.venue_url || null,
      sponsor_tier: "free",
    },
    { onConflict: "city_id,slug" }
  );

  if (venueError) {
    return { ok: false, error: `Venue upsert failed: ${venueError.message}` };
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("city_id", city.id)
    .eq("slug", venueSlug)
    .single();

  const artistSlug = slugify(submission.artist);
  const { error: artistError } = await supabase.from("artists").upsert(
    {
      name: submission.artist,
      slug: artistSlug,
    },
    { onConflict: "slug" }
  );

  if (artistError) {
    return { ok: false, error: `Artist upsert failed: ${artistError.message}` };
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("slug", artistSlug)
    .single();

  const startTime = convertTo24Hour(submission.time);

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      venue_id: venue!.id,
      artist_id: artist?.id || null,
      date: submission.date,
      start_time: startTime,
      description: submission.description || null,
      source_url: null,
    })
    .select("id")
    .single();

  if (eventError) {
    return { ok: false, error: `Event insert failed: ${eventError.message}` };
  }

  await supabase
    .from("pending_events")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", submission.id);

  return { ok: true, eventId: event!.id };
}

function convertTo24Hour(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}
