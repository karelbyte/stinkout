import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { broadcastToAllUsers } from "@/lib/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { logs } = await broadcastToAllUsers(user.name);
  const success = logs.filter((l) => l.ok).length;
  const failed = logs.filter((l) => !l.ok);

  return NextResponse.json({
    message: `Sent: ${success}, Failed: ${failed.length} of ${logs.length}`,
    total: logs.length,
    success,
    failed,
    logs,
  });
}
