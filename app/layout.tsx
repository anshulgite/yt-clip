import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClipShort AI – Personal AI Video Clipper & Shorts Generator",
  description: "Personal AI Video Clipper: generate viral 9:16 vertical shorts with AI captions, waveform editor, and local FFmpeg export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} min-h-screen bg-[#0B0C15] text-[#F1F5F9] antialiased selection:bg-purple-600 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
