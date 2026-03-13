import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const city = request.nextUrl.searchParams.get("city")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ venues: [] });
  }

  const supabase = await createClient();
  const pattern = `%${escapeLike(q)}%`;

  let query = supabase
    .from("venues")
    .select("id, name, city_slug")
    .ilike("name", pattern)
    .limit(8);

  if (city && city !== "other") {
    query = query.eq("city_slug", city);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Venue search error:", error);
    return NextResponse.json({ venues: [] });
  }

  return NextResponse.json({ venues: data ?? [] });
}
