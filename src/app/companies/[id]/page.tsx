import { notFound } from "next/navigation";
import { dbAll, dbGet } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";
import EvidenceSection, { type EvidenceItem } from "@/components/EvidenceSection";
import ReviewActions from "@/components/ReviewActions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  let name: string | undefined;
  if (!isNaN(idNum)) {
    const c = await dbGet<{ name: string }>("SELECT name FROM companies WHERE id = ?", idNum);
    if (c) name = c.name;
  }
  if (!name) {
    const c = await dbGet<{ name: string }>("SELECT name FROM companies WHERE slug = ?", id);
    if (c) name = c.name;
  }
  if (!name) return { title: "Company Not Found" };
  return {
    title: name,
    description: `Reviews and reports for company ${name}. See what experiences others have shared about working with them.`,
    openGraph: { title: `${name} — Stinkout`, description: `Reviews and reports for company ${name}.` },
    alternates: { canonical: `/companies/${id}` },
  };
}

interface ReviewRow {
  id: number; title: string; description: string; rating: number;
  status: string; created_at: string; user_id: number;
  comment_count: number; ratification_count: number;
  recruiter_name: string; company_name: string;
}

interface CompanyRow {
  id: number; name: string; description: string | null;
  website: string | null; slug: string | null;
}
import RatifyButton from "@/components/RatifyButton";
import ReportButton from "@/components/ReportButton";
import CommentSection from "@/components/CommentSection";
import { FiPaperclip, FiMessageSquare } from "react-icons/fi";
import { getServerDict, st } from "@/lib/i18n/server";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dict = await getServerDict();
  const idNum = parseInt(id, 10);

  let company: CompanyRow | undefined;

  if (!isNaN(idNum)) {
    company = (await dbGet("SELECT * FROM companies WHERE id = ?", idNum)) as CompanyRow | undefined;
  }

  if (!company) {
    company = (await dbGet("SELECT * FROM companies WHERE slug = ?", id)) as CompanyRow | undefined;
  }

  if (!company) notFound();

  const currentUser = await getCurrentUser();

  const reviews = await dbAll(
    `SELECT rv.*, r.name as recruiter_name,
            (SELECT COUNT(*) FROM review_ratifications WHERE review_id = rv.id) as ratification_count,
            (SELECT COUNT(*) FROM review_comments WHERE review_id = rv.id) as comment_count
     FROM reviews rv
     LEFT JOIN recruiters r ON rv.recruiter_id = r.id
     WHERE rv.company_id = ?
     ORDER BY rv.created_at DESC`,
    company.id
  );

  const ratifiedByUser = new Set<number>();
  if (currentUser) {
    const rows = await dbAll<{ review_id: number }>(
      "SELECT review_id FROM review_ratifications WHERE user_id = ?",
      currentUser.id
    );
    for (const r of rows) ratifiedByUser.add(r.review_id);
  }

  const typedReviews = reviews as unknown as ReviewRow[];
  const evidenceByReview = new Map<number, EvidenceItem[]>();

  for (const review of typedReviews) {
    const evidence = await dbAll<EvidenceItem>(
      `SELECT e.*,
              (SELECT COUNT(*) FROM evidence_validations WHERE evidence_id = e.id) as validation_count,
              0 as validated_by_me
       FROM evidence e
       WHERE e.review_id = ?
       ORDER BY e.created_at DESC`,
      review.id
    );
    evidenceByReview.set(review.id, evidence);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-4 flex flex-col sm:flex-row items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{company.name}</h1>
            {company.description && (
              <p className="mt-1 text-slate-400">{company.description}</p>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-lime-400 hover:text-lime-300"
              >
                {company.website}
              </a>
            )}
          </div>
          <div className="sm:text-right">
            <div className="text-sm text-slate-500">
              {st("company.reviewCount", dict, { n: reviews.length })}
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-300">{st("company.reviews", dict)}</h2>
        {reviews.length === 0 && (
          <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
            {st("company.noReviews", dict)}
          </p>
        )}
        <div className="space-y-4">
          {typedReviews.map((review) => {
            const reviewEvidence = evidenceByReview.get(review.id) || [];
            return (
              <div key={review.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
                <div className="mb-3 flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-slate-200">
                        {review.title}
                        {reviewEvidence.length > 0 && (
                          <FiPaperclip className="ml-1 inline text-lg text-lime-500" title={st("evidence.hasEvidence", dict)} />
                        )}
                      </h3>
                      {review.comment_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500" title={st("comments.count", dict, { n: review.comment_count })}>
                          <FiMessageSquare className="text-sm" /> {review.comment_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {review.recruiter_name && `by ${review.recruiter_name} · `}
                      {new Date(review.created_at).toLocaleDateString('en-US')}
                      {review.status !== "approved" && (
                        <span className="ml-2 rounded bg-yellow-900/50 px-2 py-0.5 text-yellow-400">
                          {review.status}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-slate-400">{review.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <RatifyButton
                    reviewId={review.id}
                    initialCount={review.ratification_count}
                    initialRatified={ratifiedByUser.has(review.id)}
                  />
                  <ReviewActions reviewId={review.id} reviewUserId={review.user_id} />
                  <div className="ml-auto">
                    <ReportButton reviewId={review.id} />
                  </div>
                </div>
                <EvidenceSection evidence={reviewEvidence} reviewId={review.id} />
                <CommentSection reviewId={review.id} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
