import { NextRequest, NextResponse } from "next/server";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { put } from "@vercel/blob";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recruiterId = searchParams.get("recruiterId");
  const companyId = searchParams.get("companyId");
  const status = searchParams.get("status") || "approved";
  const sort = searchParams.get("sort") || "date_desc";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const conditions: string[] = ["rv.status = ?"];
  const params: (string | number)[] = [status];

  if (recruiterId) {
    conditions.push("rv.recruiter_id = ?");
    params.push(parseInt(recruiterId, 10));
  }
  if (companyId) {
    conditions.push("rv.company_id = ?");
    params.push(parseInt(companyId, 10));
  }

  const orderClause =
    sort === "rating_desc" ? "rv.rating DESC" :
    sort === "rating_asc" ? "rv.rating ASC" :
    sort === "date_asc" ? "rv.created_at ASC" :
    "rv.created_at DESC";

  const reviews = await dbAll(
    `SELECT rv.*,
            r.name as recruiter_name, r.slug as recruiter_slug,
            c.name as company_name, c.slug as company_slug,
             (SELECT COUNT(*) FROM evidence WHERE review_id = rv.id) as has_evidence,
             (SELECT COUNT(*) FROM review_ratifications WHERE review_id = rv.id) as ratification_count,
             (SELECT COUNT(*) FROM review_comments WHERE review_id = rv.id) as comment_count
     FROM reviews rv
     LEFT JOIN recruiters r ON rv.recruiter_id = r.id
     LEFT JOIN companies c ON rv.company_id = c.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
    ...params, limit, offset
  );

  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const rating = Math.max(1, Math.min(5, parseInt(formData.get("rating") as string, 10) || 3));
    const recruiterName = (formData.get("recruiterName") as string)?.trim() || null;
    const companyName = (formData.get("companyName") as string)?.trim() || null;
    const files = formData.getAll("evidence") as File[];

    if (!title || !description) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 });
      }
    }

    let recruiterId: number | null = null;
    let companyId: number | null = null;

    if (recruiterName) {
      const existing = await dbGet<{ id: number; slug: string }>("SELECT id, slug FROM recruiters WHERE name = ?", recruiterName);
      if (existing) {
        recruiterId = existing.id;
      } else {
        const slug = generateSlug(recruiterName);
        const rs = await dbRun("INSERT INTO recruiters (name, slug) VALUES (?, ?)", recruiterName, slug);
        recruiterId = Number(rs.lastInsertRowid);
      }
    }

    if (companyName) {
      const existing = await dbGet<{ id: number }>("SELECT id FROM companies WHERE name = ?", companyName);
      if (existing) {
        companyId = existing.id;
      } else {
        const slug = generateSlug(companyName);
        const rs = await dbRun("INSERT INTO companies (name, slug) VALUES (?, ?)", companyName, slug);
        companyId = Number(rs.lastInsertRowid);
      }
    }

    const result = await dbRun(
      `INSERT INTO reviews (user_id, recruiter_id, company_id, title, description, rating, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      user.id, recruiterId, companyId, title, description, rating
    );

    const reviewId = Number(result.lastInsertRowid);

    if (files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;
        const ext = file.name.split('.').pop() || 'bin';
        const uniqueName = `${reviewId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const blob = await put(uniqueName, file, { access: "public" });
        await dbRun(
          `INSERT INTO evidence (review_id, user_id, file_name, file_type, file_path, file_size)
           VALUES (?, ?, ?, ?, ?, ?)`,
          reviewId, user.id, file.name, file.type, blob.url, file.size
        );
      }
    }

    return NextResponse.json({
      id: reviewId,
      message: "Review submitted successfully. It will be visible after moderation.",
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
