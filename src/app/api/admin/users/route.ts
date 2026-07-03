import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await dbAll(
    `SELECT u.*, (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as review_count
     FROM users u ORDER BY u.created_at DESC`
  );

  return NextResponse.json({ users });
}
