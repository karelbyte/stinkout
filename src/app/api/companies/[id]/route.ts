import { NextRequest, NextResponse } from "next/server";
import { dbGet } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = parseInt(id, 10);

  let company;
  if (!isNaN(idNum)) {
    company = await dbGet("SELECT * FROM companies WHERE id = ?", idNum);
  }

  if (!company) {
    company = await dbGet("SELECT * FROM companies WHERE slug = ?", id);
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ company });
}
