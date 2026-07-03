import { NextRequest, NextResponse } from "next/server";
import { dbAll } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  let recruiters;
  if (q.trim()) {
    const like = `%${q}%`;
    recruiters = await dbAll(
      "SELECT id, name, slug, email, created_at FROM recruiters WHERE name LIKE ? ORDER BY name ASC LIMIT 20",
      like
    );
  } else {
    recruiters = await dbAll("SELECT id, name, slug, email, created_at FROM recruiters ORDER BY name ASC LIMIT 20");
  }

  return NextResponse.json({ recruiters });
}
