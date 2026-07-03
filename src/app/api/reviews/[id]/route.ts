import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun, dbAll } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { del } from "@vercel/blob";

export async function PATCH(
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

  const review = await dbGet<{
    id: number; user_id: number; title: string; description: string;
    rating: number; recruiter_id: number | null; company_id: number | null;
  }>("SELECT * FROM reviews WHERE id = ?", reviewId);

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.user_id !== user.id) {
    return NextResponse.json({ error: "You can only edit your own reviews" }, { status: 403 });
  }

  const { title, description, rating } = await request.json();

  if (title) await dbRun("UPDATE reviews SET title = ? WHERE id = ?", title, reviewId);
  if (description) await dbRun("UPDATE reviews SET description = ? WHERE id = ?", description, reviewId);
  if (rating) {
    const r = parseInt(rating, 10);
    if (r >= 1 && r <= 5) {
      await dbRun("UPDATE reviews SET rating = ? WHERE id = ?", r, reviewId);
    }
  }

  await dbRun("UPDATE reviews SET status = 'pending' WHERE id = ?", reviewId);

  return NextResponse.json({ message: "Review updated" });
}

export async function DELETE(
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

  const review = await dbGet<{ id: number; user_id: number }>("SELECT * FROM reviews WHERE id = ?", reviewId);

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.user_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const evidenceList = await dbAll<{ file_path: string }>("SELECT * FROM evidence WHERE review_id = ?", reviewId);

  for (const ev of evidenceList) {
    try {
      await del(ev.file_path);
    } catch {
      // file may not exist
    }
  }

  await dbRun("DELETE FROM review_comments WHERE review_id = ?", reviewId);
  await dbRun("DELETE FROM review_ratifications WHERE review_id = ?", reviewId);
  await dbRun("DELETE FROM reports WHERE review_id = ?", reviewId);
  await dbRun("DELETE FROM evidence_validations WHERE evidence_id IN (SELECT id FROM evidence WHERE review_id = ?)", reviewId);
  await dbRun("DELETE FROM evidence WHERE review_id = ?", reviewId);
  await dbRun("DELETE FROM reviews WHERE id = ?", reviewId);

  return NextResponse.json({ message: "Review deleted" });
}
