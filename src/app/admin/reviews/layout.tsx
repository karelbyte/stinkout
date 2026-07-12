import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Moderate reviews, manage users, and handle reports on Stinkout.",
  robots: { index: false, follow: false },
};

export default function AdminReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
