import { dbAll } from "@/lib/db";
import Link from "next/link";
import { getServerDict, st } from "@/lib/i18n/server";

interface TopRecruiterRow {
  id: number; name: string; slug: string | null;
  company_name: string | null; review_count: number; total_ratifications: number;
}

interface TopCompanyRow {
  id: number; name: string; slug: string | null;
  review_count: number; total_ratifications: number;
}

export default async function TopPage() {
  const dict = await getServerDict();

  const recruiters = (await dbAll(
    `SELECT r.id, r.name, r.slug, c.name as company_name,
            COUNT(rv.id) as review_count,
            (SELECT COUNT(*) FROM review_ratifications rr JOIN reviews rv2 ON rr.review_id = rv2.id WHERE rv2.recruiter_id = r.id) as total_ratifications
     FROM recruiters r
     LEFT JOIN companies c ON r.company_id = c.id
     JOIN reviews rv ON rv.recruiter_id = r.id
     WHERE rv.status = 'approved'
     GROUP BY r.id
     HAVING total_ratifications > 0
     ORDER BY total_ratifications DESC, review_count DESC
     LIMIT 50`
  )) as TopRecruiterRow[];

  const companies = (await dbAll(
    `SELECT c.id, c.name, c.slug,
            COUNT(rv.id) as review_count,
            (SELECT COUNT(*) FROM review_ratifications rr JOIN reviews rv2 ON rr.review_id = rv2.id WHERE rv2.company_id = c.id) as total_ratifications
     FROM companies c
     JOIN reviews rv ON rv.company_id = c.id
     WHERE rv.status = 'approved'
     GROUP BY c.id
     HAVING total_ratifications > 0
     ORDER BY total_ratifications DESC, review_count DESC
     LIMIT 50`
  )) as TopCompanyRow[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-100">{st("top.title", dict)}</h1>
      <p className="mb-8 text-slate-400">{st("top.subtitle", dict)}</p>

      {recruiters.length === 0 && companies.length === 0 && (
        <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
          {st("top.noData", dict)}
        </p>
      )}

      {recruiters.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-300">
            {st("top.recruiters", dict, { n: recruiters.length })}
          </h2>
          <div className="space-y-3">
            {recruiters.map((r, i) => (
              <Link
                key={r.id}
                href={`/recruiters/${r.slug || r.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-red-800/50 hover:bg-slate-900/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900/30 text-sm font-bold text-red-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-200 truncate">{r.name}</h3>
                  {r.company_name && (
                    <p className="text-sm text-slate-500 truncate">{r.company_name}</p>
                  )}
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className="font-medium text-red-400">{st("top.ratifications", dict, { n: r.total_ratifications })}</div>
                  <div className="text-slate-500">{st("top.reviews", dict, { n: r.review_count })}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-300">
            {st("top.companies", dict, { n: companies.length })}
          </h2>
          <div className="space-y-3">
            {companies.map((c, i) => (
              <Link
                key={c.id}
                href={`/companies/${c.slug || c.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-red-800/50 hover:bg-slate-900/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900/30 text-sm font-bold text-red-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-200 truncate">{c.name}</h3>
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className="font-medium text-red-400">{st("top.ratifications", dict, { n: c.total_ratifications })}</div>
                  <div className="text-slate-500">{st("top.reviews", dict, { n: c.review_count })}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
