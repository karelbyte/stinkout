import { dbAll } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://stinkout.vercel.app";

export default async function sitemap() {
  const recruiters = await dbAll<{ slug: string }>(
    "SELECT slug FROM recruiters WHERE slug IS NOT NULL"
  );
  const companies = await dbAll<{ slug: string }>(
    "SELECT slug FROM companies WHERE slug IS NOT NULL"
  );

  const staticPages = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE}/reviews`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE}/top`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.4 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
  ];

  const recruiterPages = recruiters.map((r) => ({
    url: `${BASE}/recruiters/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const companyPages = companies.map((c) => ({
    url: `${BASE}/companies/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...recruiterPages, ...companyPages];
}
