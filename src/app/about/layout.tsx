import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Stinkout is a community-driven platform to expose unethical recruiters and hiring practices. Learn how we help job seekers stay informed.",
  openGraph: { title: "About — Stinkout", description: "Community-driven platform to expose unethical recruiters." },
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
