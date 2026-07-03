import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const { role } = await request.json();
  if (!["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await dbGet("SELECT id FROM users WHERE id = ?", userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await dbRun("UPDATE users SET role = ? WHERE id = ?", role, userId);
  return NextResponse.json({ message: "User role updated" });
}
