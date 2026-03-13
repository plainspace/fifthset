import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CITY_LABELS: Record<string, string> = {
  nyc: "New York City",
  nola: "New Orleans",
  chicago: "Chicago",
  la: "Los Angeles",
  sf: "San Francisco",
  other: "Other",
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (data._honey) {
      return NextResponse.json({ success: true });
    }

    const required = ["artist", "date", "time_hour", "time_minute", "time_period", "venue", "city", "email"];
    const missing = required.filter((f) => !data[f]?.trim());
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const time = `${data.time_hour}:${data.time_minute} ${data.time_period}`;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("No RESEND_API_KEY configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const cityLabel = CITY_LABELS[data.city] || data.city;
    const subject = `New Show Submission: ${data.artist} at ${data.venue}`;

    let pendingId: string | null = null;
    try {
      const supabase = createAdminClient();
      const { data: pending } = await supabase
        .from("pending_events")
        .insert({
          artist: data.artist,
          venue: data.venue,
          date: data.date,
          time,
          city: data.city,
          genre: data.genre || null,
          venue_url: data.venue_url || null,
          description: data.description || null,
          submitter_email: data.email,
          submitter_name: data.submitter_name || null,
          submitter_role: data.role || null,
        })
        .select("id")
        .single();
      pendingId = pending?.id || null;
    } catch (dbError) {
      console.error("Failed to insert pending event:", dbError);
    }

    const adminKey = process.env.ADMIN_API_KEY;
    const approvalLinks = pendingId && adminKey
      ? `
        <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e5e5;">
          <p style="font-size: 14px; color: #666; margin-bottom: 12px;">Quick actions:</p>
          <a href="https://fifthset.live/api/admin/submissions/${pendingId}?action=approve&key=${adminKey}" style="display: inline-block; padding: 10px 24px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 12px;">Approve</a>
          <a href="https://fifthset.live/api/admin/submissions/${pendingId}?action=reject&key=${adminKey}" style="display: inline-block; padding: 10px 24px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 12px;">Reject</a>
          <a href="https://fifthset.live/admin/submissions?key=${adminKey}" style="display: inline-block; padding: 10px 24px; background: #d97706; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">Review</a>
        </div>`
      : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 24px; font-size: 20px;">New Show Submission</h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; width: 140px;">Artist</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.artist)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Date</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.date)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Time</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(time)}</td>
          </tr>
          ${data.genre ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Genre</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.genre)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Venue</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.venue)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">City</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(cityLabel)}</td>
          </tr>
          ${data.venue_url ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Venue URL</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;"><a href="${esc(data.venue_url)}">${esc(data.venue_url)}</a></td>
          </tr>` : ""}
          ${data.description ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Description</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.description)}</td>
          </tr>` : ""}
        </table>

        <h3 style="margin-bottom: 12px; font-size: 16px;">Submitter</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; width: 140px;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td>
          </tr>
          ${data.submitter_name ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.submitter_name)}</td>
          </tr>` : ""}
          ${data.role ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600;">Role</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${esc(data.role)}</td>
          </tr>` : ""}
        </table>
        ${approvalLinks}
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fifth Set <noreply@fifthset.live>",
        to: ["jared@fifthset.live"],
        reply_to: data.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json(
        { error: "Failed to send submission" },
        { status: 500 }
      );
    }

    try {
      const confirmationHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 24px; font-size: 20px;">We got your show submission</h2>
          <p style="line-height: 1.6; margin-bottom: 16px;">
            Thanks for submitting ${esc(data.artist)} at ${esc(data.venue)} on ${esc(data.date)}.
          </p>
          <p style="line-height: 1.6; margin-bottom: 16px;">
            We review submissions daily and add shows within 24 hours.
          </p>
          <p style="line-height: 1.6; margin-bottom: 0;">
            If you have questions, reply to this email.
          </p>
        </div>
      `;

      const confirmRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Fifth Set <noreply@fifthset.live>",
          to: [data.email],
          reply_to: "hello@fifthset.live",
          subject: "We got your show submission",
          html: confirmationHtml,
        }),
      });

      if (!confirmRes.ok) {
        const confirmErr = await confirmRes.text();
        console.error("Confirmation email error:", confirmErr);
      }
    } catch (confirmError) {
      console.error("Failed to send confirmation email:", confirmError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
