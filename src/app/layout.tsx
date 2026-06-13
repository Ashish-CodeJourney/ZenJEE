import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ZenJEE — Mental Wellness for Exam Warriors",
    template: "%s | ZenJEE",
  },
  description:
    "AI-powered mental wellness companion for JEE, NEET, CUET, CAT, GATE, and UPSC aspirants.",
  keywords: ["mental wellness", "JEE", "NEET", "exam stress", "mindfulness", "AI companion"],
  authors: [{ name: "ZenJEE" }],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
                     focus:bg-zen-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg
                     focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        <div id="main-content" role="main">
          {children}
        </div>
      </body>
    </html>
  );
}
