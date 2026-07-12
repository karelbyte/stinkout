import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Reviews",
  description: "Browse community-submitted reviews of recruiters and hiring practices. Search and filter to find experiences that matter to you.",
  openGraph: { title: "All Reviews — Stinkout", description: "Browse community-submitted reviews of recruiters and hiring practices." },
  alternates: { canonical: "/reviews" },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
