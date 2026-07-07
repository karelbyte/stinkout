import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendBroadcastToUser } from "@/lib/email";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId || typeof userId !== "number") {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const result = await sendBroadcastToUser(userId, user.name);

  if (!result.ok) {
    return NextResponse.json({
      message: `Failed: ${result.error || "Unknown error"}`,
      log: result,
    });
  }

  return NextResponse.json({
    message: `Sent to ${result.name} (${result.email})`,
    log: result,
  });
}
