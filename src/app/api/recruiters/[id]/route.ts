import { NextRequest, NextResponse } from "next/server";
import { dbGet } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = parseInt(id, 10);

  let recruiter;
  if (!isNaN(idNum)) {
    recruiter = await dbGet(
      `SELECT r.*, c.name as company_name, c.slug as company_slug
       FROM recruiters r LEFT JOIN companies c ON r.company_id = c.id WHERE r.id = ?`,
      idNum
    );
  }

  if (!recruiter) {
    recruiter = await dbGet(
      `SELECT r.*, c.name as company_name, c.slug as company_slug
       FROM recruiters r LEFT JOIN companies c ON r.company_id = c.id WHERE r.slug = ?`,
      id
    );
  }

  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  return NextResponse.json({ recruiter });
}
