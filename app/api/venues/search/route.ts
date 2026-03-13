import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const city = request.nextUrl.searchParams.get("city")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ venues: [] });
  }

  const supabase = createAdminClient();
  const pattern = `%${escapeLike(q)}%`;

  let query = supabase
    .from("venues")
    .select("id, name, city_id")
    .ilike("name", pattern)
    .limit(8);

  if (city && city !== "other") {
    const { data: cityRow } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", city)
      .single();

    if (cityRow) {
      query = query.eq("city_id", cityRow.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Venue search error:", error);
    return NextResponse.json({ venues: [] });
  }

  return NextResponse.json({ venues: data ?? [] });
}
