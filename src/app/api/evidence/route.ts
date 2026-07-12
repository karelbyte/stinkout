import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const reviewId = parseInt(formData.get("reviewId") as string, 10);
    const files = formData.getAll("evidence") as File[];

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const review = await dbGet("SELECT id FROM reviews WHERE id = ?", reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "message/rfc822"];
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `File type ${file.type} is not allowed` }, { status: 400 });
      }
    }

    for (const file of files) {
      if (file.size === 0) continue;
      const ext = file.name.split('.').pop() || 'bin';
      const uniqueName = `${reviewId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(uniqueName, file, { access: "public" });
      await dbRun(
        "INSERT INTO evidence (review_id, user_id, file_name, file_type, file_path, file_size) VALUES (?, ?, ?, ?, ?, ?)",
        reviewId, user.id, file.name, file.type, blob.url, file.size
      );
    }

    return NextResponse.json({ message: "Evidence uploaded" });
  } catch {
    return NextResponse.json({ error: "Failed to upload evidence" }, { status: 500 });
  }
}
