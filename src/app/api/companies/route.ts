import { NextRequest, NextResponse } from "next/server";
import { dbAll } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  let companies;
  if (q.trim()) {
    const like = `%${q}%`;
    companies = await dbAll(
      "SELECT id, name, slug, description, website FROM companies WHERE name LIKE ? ORDER BY name ASC LIMIT 20",
      like
    );
  } else {
    companies = await dbAll("SELECT id, name, slug, description, website FROM companies ORDER BY name ASC LIMIT 20");
  }

  return NextResponse.json({ companies });
}
