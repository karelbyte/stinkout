import { NextResponse } from "next/server";
import { deleteSession, clearSessionCookie, getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    const cookieStore = await import("next/headers").then(m => m.cookies());
    const token = cookieStore.get("stinkout_session")?.value;
    if (token) await deleteSession(token);
  }
  await clearSessionCookie();
  return NextResponse.json({ message: "Logged out" });
}
