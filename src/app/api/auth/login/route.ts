import { NextRequest, NextResponse } from "next/server";
import { dbGet } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await dbGet<{ id: number; name: string; email: string; password_hash: string }>(
      "SELECT * FROM users WHERE email = ?", email
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ message: "Logged in" });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
