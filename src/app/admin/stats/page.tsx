import { isAdmin } from "@/lib/auth";
import { dbAll, dbGet } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerDict, st } from "@/lib/i18n/server";

export default async function StatsPage() {
  if (!(await isAdmin())) redirect("/");

  const dict = await getServerDict();

  const totalUsers = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM users"))!.c;
  const totalReviews = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM reviews"))!.c;
  const approvedReviews = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM reviews WHERE status = 'approved'"))!.c;
  const pendingReviews = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM reviews WHERE status = 'pending'"))!.c;
  const totalRecruiters = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM recruiters"))!.c;
  const totalCompanies = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM companies"))!.c;
  const totalRatifications = (await dbGet<{ c: number }>("SELECT COUNT(*) as c FROM review_ratifications"))!.c;

  interface TopRecruiter {
    name: string; slug: string; ratifications: number; reviews: number;
  }
  const topRecruiters = (await dbAll(
    `SELECT r.name, r.slug,
            COUNT(rr.id) as ratifications,
            COUNT(rv.id) as reviews
     FROM recruiters r
     LEFT JOIN reviews rv ON rv.recruiter_id = r.id
     LEFT JOIN review_ratifications rr ON rr.review_id = rv.id
     GROUP BY r.id
     ORDER BY ratifications DESC LIMIT 5`
  )) as TopRecruiter[];

  const monthlyReviews = await dbAll(
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
     FROM reviews
     GROUP BY month
     ORDER BY month DESC LIMIT 12`
  );

  const monthlyReviewsTyped = monthlyReviews as Array<{ month: string; count: number }>;
  const maxMonthly = Math.max(...monthlyReviewsTyped.map((m) => m.count), 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/reviews" className="text-sm text-lime-400 hover:text-lime-300">&larr; {st("stats.back", dict)}</Link>
        <h1 className="text-3xl font-bold text-slate-100">{st("stats.title", dict)}</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: st("stats.users", dict), value: totalUsers },
          { label: st("stats.recruiters", dict), value: totalRecruiters },
          { label: st("stats.companies", dict), value: totalCompanies },
          { label: st("stats.ratifications", dict), value: totalRatifications },
          { label: st("stats.totalReviews", dict), value: totalReviews },
          { label: st("stats.approved", dict), value: approvedReviews },
          { label: st("stats.pending", dict), value: pendingReviews },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
            <div className="text-2xl font-bold text-lime-400">{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-300">{st("stats.topRecruiters", dict)}</h2>
          {topRecruiters.length === 0 ? (
            <p className="text-sm text-slate-500">{st("stats.noData", dict)}</p>
          ) : (
            <div className="space-y-3">
              {topRecruiters.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <Link href={`/recruiters/${r.slug}`} className="text-sm text-slate-200 hover:text-lime-400">
                    {r.name}
                  </Link>
                  <span className="text-sm text-slate-500">{r.ratifications} rats / {r.reviews} revs</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-300">{st("stats.monthlyReviews", dict)}</h2>
          {monthlyReviews.length === 0 ? (
            <p className="text-sm text-slate-500">{st("stats.noData", dict)}</p>
          ) : (
            <div className="space-y-2">
              {monthlyReviewsTyped.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-slate-400">{m.month}</span>
                  <div className="h-4 flex-1 rounded bg-slate-800">
                    <div
                      className="h-full rounded bg-lime-600"
                      style={{ width: `${Math.min(100, (m.count / maxMonthly) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-slate-500">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
