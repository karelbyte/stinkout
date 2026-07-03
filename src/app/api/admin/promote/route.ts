import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";

export async function POST(request: NextRequest) {
  const headers = request.headers;
  const host = headers.get("host") || "";

  // Only allow from localhost
  if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1") && !host.startsWith("[::1]")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await dbGet<{ id: number }>("SELECT id FROM users WHERE email = ?", email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await dbRun("UPDATE users SET role = 'admin' WHERE id = ?", user.id);
  return NextResponse.json({ message: "User promoted to admin" });
}
