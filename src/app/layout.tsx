import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://stinkout.vercel.app"),
  title: { default: "Stinkout — Expose Unethical Recruiters", template: "%s — Stinkout" },
  description: "Community-driven platform to report and expose unethical recruiters and hiring practices. Help others avoid bad hiring experiences.",
  openGraph: {
    title: "Stinkout — Expose Unethical Recruiters",
    description: "Community-driven platform to report and expose unethical recruiters and hiring practices.",
    siteName: "Stinkout",
    type: "website",
    locale: "en_US",
    images: [{ url: "/fly.png", width: 800, height: 600, alt: "Stinkout" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stinkout — Expose Unethical Recruiters",
    description: "Community-driven platform to report and expose unethical recruiters and hiring practices.",
    images: ["/fly.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <Script id="i18n-init" strategy="beforeInteractive">
            {`try{var l=localStorage.getItem('lang');if(l)document.documentElement.lang=l}catch(e){}`}
          </Script>
        </head>
        <body suppressHydrationWarning className="flex min-h-full flex-col bg-[var(--bg-body)] text-slate-100">
          <ThemeProvider>
            <I18nProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </I18nProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
