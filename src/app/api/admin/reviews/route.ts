import { NextRequest, NextResponse } from "next/server";
import { dbAll } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let reviews: Record<string, unknown>[];
  if (q) {
    const like = `%${q}%`;
    reviews = await dbAll(
      `SELECT rv.*, u.name as user_name, r.name as recruiter_name, r.slug as recruiter_slug,
              c.name as company_name, c.slug as company_slug,
              (SELECT COUNT(*) FROM review_ratifications WHERE review_id = rv.id) as ratification_count
       FROM reviews rv
       LEFT JOIN users u ON rv.user_id = u.id
       LEFT JOIN recruiters r ON rv.recruiter_id = r.id
       LEFT JOIN companies c ON rv.company_id = c.id
       WHERE rv.status = 'pending'
         AND (rv.title LIKE ? OR r.name LIKE ? OR c.name LIKE ?)
       ORDER BY rv.created_at DESC LIMIT ? OFFSET ?`,
      like, like, like, limit, offset
    );
  } else {
    reviews = await dbAll(
      `SELECT rv.*, u.name as user_name, r.name as recruiter_name, r.slug as recruiter_slug,
              c.name as company_name, c.slug as company_slug,
              (SELECT COUNT(*) FROM review_ratifications WHERE review_id = rv.id) as ratification_count
       FROM reviews rv
       LEFT JOIN users u ON rv.user_id = u.id
       LEFT JOIN recruiters r ON rv.recruiter_id = r.id
       LEFT JOIN companies c ON rv.company_id = c.id
       WHERE rv.status = 'pending'
       ORDER BY rv.created_at DESC LIMIT ? OFFSET ?`,
      limit, offset
    );
  }

  const evidenceResults = await Promise.all(
    reviews.map((rv) =>
      dbAll(
        `SELECT e.*, (SELECT COUNT(*) FROM evidence_validations WHERE evidence_id = e.id) as validation_count
         FROM evidence e WHERE e.review_id = ? ORDER BY e.created_at DESC`,
        rv.id as number
      )
    )
  );

  const result = reviews.map((rv, i) => ({
    ...rv,
    evidence: evidenceResults[i],
  }));

  return NextResponse.json({ reviews: result });
}
