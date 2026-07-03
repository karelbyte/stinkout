import { dbAll } from "@/lib/db";
import Link from "next/link";
import { getServerDict, st } from "@/lib/i18n/server";

interface RecruiterSearchRow {
  id: number; name: string; slug: string | null; email: string | null;
  created_at: string; company_name: string | null; review_count: number;
}

interface CompanySearchRow {
  id: number; name: string; slug: string | null;
  description: string | null; review_count: number;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const dict = await getServerDict();
  const like = `%${q}%`;

  const recruiters: RecruiterSearchRow[] = q.trim()
    ? (await dbAll(
        `SELECT r.id, r.name, r.slug, r.email, r.created_at, c.name as company_name,
                (SELECT COUNT(*) FROM reviews WHERE recruiter_id = r.id) as review_count
         FROM recruiters r
         LEFT JOIN companies c ON r.company_id = c.id
         WHERE r.name LIKE ?
         ORDER BY r.name ASC LIMIT 30`,
        like
      )) as RecruiterSearchRow[]
    : [];

  const companies: CompanySearchRow[] = q.trim()
    ? (await dbAll(
        `SELECT *,
                (SELECT COUNT(*) FROM reviews WHERE company_id = c.id) as review_count
         FROM companies c
         WHERE c.name LIKE ?
         ORDER BY c.name ASC LIMIT 30`,
        like
      )) as CompanySearchRow[]
    : [];

  const hasResults = recruiters.length > 0 || companies.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <form action="/search" method="GET" className="mb-8 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={st("search.placeholder", dict)}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-lime-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-lime-600 px-6 py-3 font-medium text-white transition-colors hover:bg-lime-500"
        >
          {st("common.search", dict)}
        </button>
      </form>

      {q && !hasResults && (
        <p className="rounded-xl border border-slate-800 p-8 text-center text-slate-500">
          {st("search.noResults", dict, { q })}
        </p>
      )}

      {recruiters.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-300">
            {st("search.recruiters", dict, { n: recruiters.length })}
          </h2>
          <div className="space-y-3">
            {recruiters.map((r) => (
              <Link
                key={r.id}
                href={`/recruiters/${r.slug || r.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-lime-800/50 hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-200">{r.name}</h3>
                    {r.company_name && (
                      <p className="mt-0.5 text-sm text-slate-500">{r.company_name}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-lime-400">{st("search.reviews", dict, { n: r.review_count })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-300">
            {st("search.companies", dict, { n: companies.length })}
          </h2>
          <div className="space-y-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.slug || c.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-lime-800/50 hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-200">{c.name}</h3>
                    {c.description && (
                      <p className="mt-0.5 text-sm text-slate-500">{c.description}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-lime-400">{st("search.reviews", dict, { n: c.review_count })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
