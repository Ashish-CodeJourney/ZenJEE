import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ZenJEE — Mental Wellness for Exam Warriors",
    template: "%s | ZenJEE",
  },
  description:
    "AI-powered mental wellness companion for JEE, NEET, CUET, CAT, GATE, and UPSC aspirants. Journal your journey, track your mood, and get personalised coping support.",
  keywords: ["mental wellness", "JEE", "NEET", "exam stress", "mindfulness", "AI companion"],
  authors: [{ name: "ZenJEE" }],
  robots: { index: false, follow: false }, // private wellness app — not for indexing
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {/* Skip-to-main link for keyboard/screen reader users */}
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
