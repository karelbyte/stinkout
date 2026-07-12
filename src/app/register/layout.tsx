import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Stinkout and help expose unethical recruiters. Share your experience and ratify others.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
