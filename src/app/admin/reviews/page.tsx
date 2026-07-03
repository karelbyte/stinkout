"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface EvidenceItem {
  id: number;
  review_id: number;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  validation_count: number;
}

interface ReviewItem {
  id: number;
  title: string;
  description: string;
  rating: number;
  status: string;
  created_at: string;
  user_name: string | null;
  recruiter_name: string | null;
  company_name: string | null;
  evidence: EvidenceItem[];
  ratification_count: number;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  review_count: number;
}

interface ReportItem {
  id: number;
  review_id: number;
  user_id: number;
  reason: string;
  created_at: string;
  review_title: string;
  reporter_name: string;
}

type Tab = "reviews" | "users" | "reports";

const PAGE_SIZE = 10;

export default function AdminPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("reviews");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);

  async function loadReviews() {
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set("q", searchQ);
      params.set("offset", ((page - 1) * PAGE_SIZE).toString());
      params.set("limit", PAGE_SIZE.toString());
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }
        setCheckingAuth(false);
        loadReviews();
      })
      .catch(() => router.push("/"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function switchTab(newTab: Tab) {
    setTab(newTab);
    setLoading(true);
    setSearchQ("");
    setPage(1);
    if (newTab === "reviews") loadReviews();
    else if (newTab === "users") loadUsers();
    else loadReports();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    loadReviews();
  }

  async function handleStatus(reviewId: number, status: "approved" | "rejected") {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  }

  async function handleDeleteEvidence(evidenceId: number) {
    if (!confirm(t("evidence.deleteConfirm"))) return;

    const res = await fetch(`/api/admin/evidence/${evidenceId}`, { method: "DELETE" });

    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) => ({
          ...r,
          evidence: r.evidence.filter((e) => e.id !== evidenceId),
        }))
      );
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  }

  async function handleDismissReport(reportId: number) {
    const res = await fetch(`/api/admin/reports?id=${reportId}`, { method: "DELETE" });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  }

  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-slate-500">
        {t("common.checkingAuth")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">{t("admin.title")}</h1>
        <Link href="/admin/stats" className="text-sm text-lime-400 hover:text-lime-300">
          {t("admin.stats")} &rarr;
        </Link>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-slate-800 bg-slate-900/50 p-1 overflow-x-auto">
        <button
          onClick={() => switchTab("reviews")}
          className={`shrink-0 flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "reviews"
              ? "bg-lime-600 text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {t("admin.pendingReviews", { n: reviews.length })}
        </button>
        <button
          onClick={() => switchTab("reports")}
          className={`shrink-0 flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "reports"
              ? "bg-lime-600 text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {t("admin.reports", { n: reports.length })}
        </button>
        <button
          onClick={() => switchTab("users")}
          className={`shrink-0 flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "users"
              ? "bg-lime-600 text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {t("admin.users")}
        </button>
      </div>

      {tab === "reviews" && (
        <>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-lime-600"
            />
            <button type="submit" className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-500">
              {t("admin.search")}
            </button>
          </form>
          {loading && <p className="text-center text-slate-500">{t("common.loading")}</p>}
          {!loading && reviews.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
              {t("admin.noPending")}
            </p>
          )}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-200">{review.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {t("admin.reportedBy", { name: review.user_name || "Unknown" })}
                      {review.recruiter_name && ` — ${review.recruiter_name}`}
                      {review.company_name && ` at ${review.company_name}`}
                    </p>
                    {review.ratification_count > 0 && (
                      <p className="mt-1 text-xs text-lime-500">
                        {t("admin.ratifiedBy", { n: review.ratification_count })}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mb-4 whitespace-pre-wrap text-slate-400">{review.description}</p>
                {review.evidence.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">{t("evidence.title")}</h3>
                    {review.evidence.map((ev) => (
                      <div key={ev.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg bg-slate-800 px-4 py-2">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <span className="truncate">{ev.file_name}</span>
                          <span className="shrink-0 text-xs text-slate-500">{t("admin.validations", { n: ev.validation_count })}</span>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <a href={ev.file_path} target="_blank" rel="noopener noreferrer" className="text-xs text-lime-400 hover:text-lime-300">{t("admin.viewEvidence")}</a>
                          <button onClick={() => handleDeleteEvidence(ev.id)} className="text-xs text-red-400 hover:text-red-300">{t("admin.deleteEvidence")}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleStatus(review.id, "approved")} className="rounded-lg bg-lime-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-500">{t("admin.approve")}</button>
                  <button onClick={() => handleStatus(review.id, "rejected")} className="rounded-lg bg-red-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">{t("admin.reject")}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button onClick={() => { setPage(p => Math.max(1, p-1)); loadReviews(); }} disabled={page <= 1} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 disabled:opacity-40">{t("admin.previous")}</button>
            <span className="text-sm text-slate-500">{t("admin.page", { n: page })}</span>
            <button onClick={() => { setPage(p => p+1); loadReviews(); }} disabled={reviews.length < PAGE_SIZE} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 disabled:opacity-40">{t("admin.next")}</button>
          </div>
        </>
      )}

      {tab === "reports" && (
        <>
          {loading && <p className="text-center text-slate-500">{t("common.loading")}</p>}
          {!loading && reports.length === 0 && (
            <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
              {t("admin.noReports")}
            </p>
          )}
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-200">{r.review_title}</h3>
                    <p className="text-sm text-slate-500">
                      {t("admin.reportedBy", { name: r.reporter_name })} &middot; {new Date(r.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <button onClick={() => handleDismissReport(r.id)} className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-slate-600">{t("admin.dismiss")}</button>
                </div>
                <p className="text-sm text-slate-400">{r.reason}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "users" && (
        <>
          {loading && <p className="text-center text-slate-500">{t("common.loading")}</p>}
          {!loading && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-400">{t("register.name")}</th>
                    <th className="px-4 py-3 font-medium text-slate-400">{t("login.email")}</th>
                    <th className="px-4 py-3 font-medium text-slate-400">{t("admin.users")}</th>
                    <th className="px-4 py-3 font-medium text-slate-400">{t("admin.reviews")}</th>
                    <th className="px-4 py-3 font-medium text-slate-400">{t("admin.joined")}</th>
                    <th className="px-4 py-3 font-medium text-slate-400">{t("admin.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-900/30">
                      <td className="px-4 py-3 text-slate-200">{u.name}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          u.role === "admin"
                            ? "bg-amber-900/50 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{u.review_count}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString('en-US')}</td>
                      <td className="px-4 py-3">
                        {u.role === "admin" ? (
                          <button onClick={() => handleRoleChange(u.id, "user")} className="rounded border border-red-800 px-3 py-1 text-xs text-red-400 transition-colors hover:border-red-700 hover:text-red-300">{t("admin.removeAdmin")}</button>
                        ) : (
                          <button onClick={() => handleRoleChange(u.id, "admin")} className="rounded border border-amber-700 px-3 py-1 text-xs text-amber-400 transition-colors hover:border-amber-600 hover:text-amber-300">{t("admin.makeAdmin")}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
