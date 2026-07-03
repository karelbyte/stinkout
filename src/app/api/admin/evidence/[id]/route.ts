import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { del } from "@vercel/blob";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const evidenceId = parseInt(id, 10);
  if (isNaN(evidenceId)) {
    return NextResponse.json({ error: "Invalid evidence id" }, { status: 400 });
  }

  const evidence = await dbGet<{ id: number; file_path: string }>("SELECT * FROM evidence WHERE id = ?", evidenceId);
  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  await dbRun("DELETE FROM evidence_validations WHERE evidence_id = ?", evidenceId);
  await dbRun("DELETE FROM evidence WHERE id = ?", evidenceId);

  try {
    await del(evidence.file_path);
  } catch {
    // file may not exist
  }

  return NextResponse.json({ message: "Evidence deleted" });
}
