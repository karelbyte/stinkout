import { NextRequest, NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { name, email } = await request.json();
  if (name) await dbRun("UPDATE users SET name = ? WHERE id = ?", name, user.id);
  if (email) await dbRun("UPDATE users SET email = ? WHERE id = ?", email, user.id);

  return NextResponse.json({ message: "Profile updated" });
}
