import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import AppHeader from "@/app/components/layout/Header";
import FloatingKanaSheet from "@/app/components/layout/FloatingKanaSheet";
import BottomNav from "@/app/components/layout/BottomNav";
import SideNav from "@/app/components/layout/SideNav";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kotonoha — Master Japanese from N5 to N1",
  description:
    "A comprehensive JLPT preparation app with vocabulary, kanji, grammar, reading, and listening exercises in Japanese, English, and Myanmar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Japanese serif — Shippori Mincho (ink-brush weight) + Noto Serif JP fallback.
            Loaded via link rather than next/font: JP glyph sets are too large to self-host well. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Noto+Serif+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${dmSans.variable} ${dmSerif.variable} antialiased`}>
        <div className="min-h-screen bg-bg text-ink font-[family-name:var(--font-ui)]">
          <AppHeader />
          <SideNav />
          <main className="sm:pl-[4.5rem] pb-24 sm:pb-10">{children}</main>
          <FloatingKanaSheet />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
