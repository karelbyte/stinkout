import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Review",
  description: "Report an unethical recruiter or bad hiring practice. Your review helps others avoid the same experience.",
  openGraph: { title: "Submit a Review — Stinkout", description: "Report an unethical recruiter or bad hiring practice." },
  alternates: { canonical: "/review" },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
