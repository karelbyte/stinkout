import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await dbGet("SELECT id FROM users WHERE email = ?", email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const userCount = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM users"))!.c;
    const role = process.env.ADMIN_EMAIL === email && userCount === 0 ? "admin" : "user";

    const password_hash = hashPassword(password);
    const result = await dbRun(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      name, email, password_hash, role
    );

    const token = await createSession(Number(result.lastInsertRowid));
    await setSessionCookie(token);

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
