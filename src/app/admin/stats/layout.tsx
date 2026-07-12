import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Stats",
  description: "Site-wide statistics for Stinkout — users, reviews, recruiters, and monthly trends.",
  robots: { index: false, follow: false },
};

export default function AdminStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
