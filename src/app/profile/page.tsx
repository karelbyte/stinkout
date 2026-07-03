"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiPaperclip, FiMessageSquare } from "react-icons/fi";
import { useI18n } from "@/lib/i18n";

interface ReviewItem {
  id: number;
  title: string;
  description: string;
  rating: number;
  status: string;
  created_at: string;
  recruiter_name: string | null;
  recruiter_slug: string | null;
  company_name: string | null;
  company_slug: string | null;
  ratification_count: number;
  has_evidence: number;
  comment_count: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        return fetch(`/api/reviews?userId=${data.user.id}&limit=50`)
          .then((r) => r.json())
          .then((d) => setReviews(d.reviews || []));
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleDelete(reviewId: number) {
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch {
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-slate-500">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-200">{t("profile.deleteTitle")}</h3>
            <p className="mb-6 text-sm text-slate-400">{t("profile.deleteConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
                className="flex-1 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deletingId === confirmId ? t("profile.deleting") : t("profile.delete")}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                disabled={deletingId !== null}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 disabled:opacity-50"
              >
                {t("profile.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h1 className="text-3xl font-bold text-slate-100">{user?.name}</h1>
        <p className="mt-1 text-slate-400">{user?.email}</p>
        <p className="mt-1 text-sm text-slate-500">{t("profile.reviewCount", { n: reviews.length })}</p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-300">{t("profile.reviews")}</h2>
        {reviews.length === 0 && (
          <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
            {t("profile.noReviews")}{" "}
            <Link href="/review" className="text-lime-400 hover:text-lime-300">
              {t("profile.submitOne")}
            </Link>
          </p>
        )}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-200">{review.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {review.recruiter_name && `${review.recruiter_name}`}
                    {review.company_name && ` at ${review.company_name}`}
                    {!review.recruiter_name && !review.company_name && t("profile.generalReview")}
                    {" · "}
                    {new Date(review.created_at).toLocaleDateString('en-US')}
                  </p>
                </div>
                  <div className="flex items-center gap-3">
                    {review.has_evidence > 0 && (
                      <FiPaperclip className="text-lg text-lime-500" title={t("evidence.hasEvidence")} />
                    )}
                    {review.comment_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400" title={t("comments.count", { n: review.comment_count })}>
                        <FiMessageSquare className="text-sm" /> {review.comment_count}
                      </span>
                    )}
                    {review.ratification_count > 0 && (
                      <span className="text-xs text-lime-500">
                        {t("ratify.ratified")} ({review.ratification_count})
                      </span>
                    )}
                    {review.status !== "approved" && (
                      <span className="rounded bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
                        {review.status}
                      </span>
                    )}
                  </div>
              </div>
              <p className="mb-3 line-clamp-3 text-sm text-slate-400">{review.description}</p>
              <div className="flex items-center gap-3">
                {review.recruiter_slug && (
                  <Link href={`/recruiters/${review.recruiter_slug}`} className="text-xs text-lime-400 hover:text-lime-300">
                    {t("profile.viewRecruiter")}
                  </Link>
                )}
                {review.company_slug && (
                  <Link href={`/companies/${review.company_slug}`} className="text-xs text-lime-400 hover:text-lime-300">
                    {t("profile.viewCompany")}
                  </Link>
                )}
                <button
                  onClick={() => setConfirmId(review.id)}
                  className="ml-auto text-xs text-red-400 hover:text-red-300"
                >
                  {t("profile.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
