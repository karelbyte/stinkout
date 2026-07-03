import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = parseInt(id, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const { reason } = await request.json();
  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 });
  }

  const review = await dbGet("SELECT id FROM reviews WHERE id = ?", reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const existing = await dbGet<{ id: number }>(
    "SELECT id FROM reports WHERE review_id = ? AND user_id = ?", reviewId, user.id
  );

  if (existing) {
    return NextResponse.json({ error: "You already reported this review" }, { status: 409 });
  }

  await dbRun("INSERT INTO reports (review_id, user_id, reason) VALUES (?, ?, ?)", reviewId, user.id, reason.trim());

  return NextResponse.json({ message: "Report submitted" });
}
