"use client";

import { useI18n, type TranslationKey } from "@/lib/i18n";
import { FiUsers, FiCheckCircle, FiHome, FiPaperclip, FiMessageSquare } from "react-icons/fi";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<{ recruiterCount: number; reviewCount: number; companyCount: number } | null>(null);
  const [recentReviews, setRecentReviews] = useState<Array<{
    id: number; title: string; rating: number; created_at: string;
    recruiter_slug: string | null; recruiter_name: string | null;
    company_slug: string | null; company_name: string | null;
    ratification_count: number; has_evidence: number; comment_count: number;
  }>>([]);

  useEffect(() => {
    fetch("/api/reviews?status=approved&sort=date_desc&limit=10")
      .then((r) => r.json())
      .then((d) => setRecentReviews(d.reviews || []));
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="text-lime-400">{t("home.title")}</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">{t("home.subtitle")}</p>
        <div className="mx-auto max-w-xl">
          <SearchForm t={t} />
        </div>
      </section>

      {stats && (
        <section className="mb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t("home.statRecruiters"), value: stats.recruiterCount, icon: <FiUsers /> },
            { label: t("home.statReviews"), value: stats.reviewCount, icon: <FiCheckCircle /> },
            { label: t("home.statCompanies"), value: stats.companyCount, icon: <FiHome /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
              <div className="mb-2 text-3xl text-lime-400">{s.icon}</div>
              <div className="text-3xl font-bold text-lime-400">{s.value}</div>
              <div className="mt-1 text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("home.recentReviews")}</h2>
          <Link href="/review" className="text-sm text-lime-400 hover:text-lime-300">
            {t("home.submitYours")} &rarr;
          </Link>
        </div>
        <div className="space-y-3">
          {recentReviews.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">{t("home.noReviews")}</p>
          )}
          {recentReviews.map((review) => {
            const href = review.recruiter_slug
              ? `/recruiters/${review.recruiter_slug}`
              : review.company_slug
                ? `/companies/${review.company_slug}`
                : "#";
            return (
              <Link key={review.id} href={href} className="block rounded-xl border border-slate-800 bg-slate-900/30 p-5 transition-colors hover:border-lime-800/50 hover:bg-slate-900/60">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-200 truncate">{review.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 truncate">
                      {review.recruiter_name && `${review.recruiter_name}`}
                      {review.company_name && ` at ${review.company_name}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 flex-wrap">
                    {review.has_evidence > 0 && <FiPaperclip className="text-lg text-lime-500" title={t("evidence.hasEvidence")} />}
                    {review.comment_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400" title={t("comments.count", { n: review.comment_count })}>
                        <FiMessageSquare className="text-sm" /> {review.comment_count}
                      </span>
                    )}
                    {review.ratification_count > 0 && (
                      <span className="text-xs text-lime-500">{t("ratify.ratified")} ({review.ratification_count})</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SearchForm({ t }: { t: (k: TranslationKey, params?: Record<string, string | number>) => string }) {
  return (
    <form action="/search" method="GET" className="flex gap-2">
      <input
        type="text"
        name="q"
        placeholder={t("home.searchPlaceholder")}
        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-lime-600 px-4 sm:px-6 py-3 font-medium text-white transition-colors hover:bg-lime-500"
      >
        {t("home.search")}
      </button>
    </form>
  );
}
