import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/app/components/layout/Header";
import FloatingKanaSheet from "@/app/components/layout/FloatingKanaSheet";

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
        <div className="min-h-screen bg-[#F5EDED] text-[#3E3636] font-sans antialiased">
          <AppHeader />
          <main>
            {children}
          </main>
          <FloatingKanaSheet />
        </div>
      </body>
    </html>
  );
}
