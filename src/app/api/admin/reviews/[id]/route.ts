import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyCreatorReviewApproved } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const reviewId = parseInt(id, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const review = await dbGet<{
    id: number; title: string; user_id: number;
    recruiter_slug: string | null; company_slug: string | null;
  }>(
    `SELECT rv.id, rv.title, rv.user_id, r.slug as recruiter_slug, c.slug as company_slug
     FROM reviews rv
     LEFT JOIN recruiters r ON rv.recruiter_id = r.id
     LEFT JOIN companies c ON rv.company_id = c.id
     WHERE rv.id = ?`,
    reviewId
  );
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const { status } = await request.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbRun("UPDATE reviews SET status = ? WHERE id = ?", status, reviewId);

  if (status === "approved") {
    const creator = await dbGet<{ name: string; email: string }>(
      "SELECT name, email FROM users WHERE id = ?",
      review.user_id
    );
    if (creator) {
      notifyCreatorReviewApproved(
        creator.email,
        creator.name,
        review.title,
        review.recruiter_slug,
        review.company_slug
      );
    }
  }

  return NextResponse.json({ message: `Review ${status}` });
}
