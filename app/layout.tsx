import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navigation from "./Navigation";

export const metadata: Metadata = {
  title: {
    default: "PrepVoice — Enterprise AI Interview Preparation",
    template: "%s | PrepVoice",
  },
  description:
    "Master high-stakes job interviews with real-time AI speech evaluation, company-specific mock scenarios, and personalized readiness analytics.",
  applicationName: "PrepVoice",
  keywords: [
    "PrepVoice",
    "AI interview preparation",
    "mock interview",
    "voice interview practice",
    "career readiness coach",
    "speech evaluation",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Navigation />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
