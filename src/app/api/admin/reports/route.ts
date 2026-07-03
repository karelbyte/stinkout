import { NextRequest, NextResponse } from "next/server";
import { dbAll, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reports = await dbAll(
    `SELECT r.*, rv.title as review_title, u.name as reporter_name
     FROM reports r
     JOIN reviews rv ON r.review_id = rv.id
     JOIN users u ON r.user_id = u.id
     ORDER BY r.created_at DESC`
  );

  return NextResponse.json({ reports });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const reportId = parseInt(searchParams.get("id") || "", 10);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  await dbRun("DELETE FROM reports WHERE id = ?", reportId);
  return NextResponse.json({ message: "Report dismissed" });
}
