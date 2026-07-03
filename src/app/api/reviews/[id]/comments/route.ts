import { NextRequest, NextResponse } from "next/server";
import { dbAll, dbRun, dbGet } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviewId = parseInt(id, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const comments = await dbAll(
    `SELECT c.*, u.name as user_name
     FROM review_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.review_id = ?
     ORDER BY c.created_at ASC`,
    reviewId
  );

  return NextResponse.json({ comments });
}

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

  const { body } = await request.json();
  if (!body || body.trim().length === 0) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  const result = await dbRun(
    "INSERT INTO review_comments (review_id, user_id, body) VALUES (?, ?, ?)",
    reviewId, user.id, body.trim()
  );

  const comment = await dbGet(
    `SELECT c.*, u.name as user_name
     FROM review_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    Number(result.lastInsertRowid)
  );

  return NextResponse.json({ comment }, { status: 201 });
}
