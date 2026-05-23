import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/app/components/layout/Header";
import FloatingKanaSheet from "@/app/components/layout/FloatingKanaSheet";
import BottomNav from "@/app/components/layout/BottomNav";
import SideNav from "@/app/components/layout/SideNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kotonoha — Master Japanese from N5 to N1",
  description: "A comprehensive JLPT preparation app with vocabulary, kanji, grammar, reading, and listening exercises in Japanese, English, and Myanmar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[#E1DCC9] text-[#1F150C] font-sans antialiased">
          <AppHeader />
          <SideNav />
          <main className="sm:pl-16 pb-20 sm:pb-0">
            {children}
          </main>
          <FloatingKanaSheet />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
