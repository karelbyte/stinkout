"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
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

const PAGE_SIZE = 10;

function ReviewsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sort = searchParams.get("sort") || "date_desc";

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("status", "approved");
    params.set("sort", sort);
    params.set("limit", PAGE_SIZE.toString());
    params.set("offset", ((page - 1) * PAGE_SIZE).toString());
    if (q) params.set("q", q);

    fetch(`/api/reviews?${params}`)
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [q, page, sort]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQ = formData.get("q") as string;
    const params = new URLSearchParams();
    if (searchQ) params.set("q", searchQ);
    params.set("page", "1");
    params.set("sort", sort);
    router.push(`/reviews?${params}`);
  }

  function changeSort(newSort: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", "1");
    params.set("sort", newSort);
    router.push(`/reviews?${params}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-100">{t("reviews.title")}</h1>
      <p className="mb-8 text-slate-400">{t("reviews.subtitle")}</p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t("reviews.searchPlaceholder")}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-lime-600 px-6 py-3 font-medium text-white transition-colors hover:bg-lime-500"
        >
{t("common.search")}
          </button>
        </form>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-slate-500">{t("reviews.sort")}</span>
        {[
          { value: "date_desc", label: t("reviews.sortNewest") },
          { value: "date_asc", label: t("reviews.sortOldest") },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => changeSort(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              sort === opt.value
                ? "bg-lime-600 text-white"
                : "border border-slate-700 text-slate-400 hover:border-slate-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-slate-500">{t("reviews.loading")}</p>}

      {!loading && reviews.length === 0 && (
        <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
          {q ? t("reviews.noResults", { q }) : t("reviews.noReviews")}
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => {
          const href = review.recruiter_slug
            ? `/recruiters/${review.recruiter_slug}`
            : review.company_slug
              ? `/companies/${review.company_slug}`
              : "#";
          return (
            <Link
              key={review.id}
              href={href}
              className="block rounded-xl border border-slate-800 bg-slate-900/30 p-5 transition-colors hover:border-lime-800/50 hover:bg-slate-900/60"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-200">{review.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {review.recruiter_name && `${review.recruiter_name}`}
                    {review.company_name && ` at ${review.company_name}`}
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
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{review.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            params.set("page", (page - 1).toString());
            params.set("sort", sort);
            router.push(`/reviews?${params}`);
          }}
          disabled={page <= 1}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("reviews.previous")}
        </button>
        <span className="text-sm text-slate-500">{t("reviews.page", { n: page })}</span>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            params.set("page", (page + 1).toString());
            params.set("sort", sort);
            router.push(`/reviews?${params}`);
          }}
          disabled={reviews.length < PAGE_SIZE}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("reviews.next")}
        </button>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-12 text-center text-slate-500">Loading...</div>}>
      <ReviewsList />
    </Suspense>
  );
}
