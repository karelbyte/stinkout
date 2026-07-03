import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
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

  const review = await dbGet("SELECT id FROM reviews WHERE id = ?", reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const existing = await dbGet<{ id: number }>(
    "SELECT id FROM review_ratifications WHERE review_id = ? AND user_id = ?",
    reviewId, user.id
  );

  if (existing) {
    await dbRun("DELETE FROM review_ratifications WHERE review_id = ? AND user_id = ?", reviewId, user.id);
  } else {
    await dbRun("INSERT INTO review_ratifications (review_id, user_id) VALUES (?, ?)", reviewId, user.id);
  }

  const count = (await dbGet<{ c: number }>(
    "SELECT COUNT(*) as c FROM review_ratifications WHERE review_id = ?", reviewId
  ))!.c;

  return NextResponse.json({ ratified: !existing, count });
}
