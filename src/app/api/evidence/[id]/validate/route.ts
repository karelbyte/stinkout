import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const evidenceId = parseInt(id, 10);
  if (isNaN(evidenceId)) {
    return NextResponse.json({ error: "Invalid evidence id" }, { status: 400 });
  }

  const evidence = await dbGet("SELECT id FROM evidence WHERE id = ?", evidenceId);
  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  try {
    await dbRun(
      "INSERT INTO evidence_validations (evidence_id, user_id) VALUES (?, ?)",
      evidenceId, user.id
    );
    return NextResponse.json({ message: "Validated" });
  } catch {
    return NextResponse.json({ error: "Already validated" }, { status: 409 });
  }
}
