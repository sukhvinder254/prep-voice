
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "./Navigation";

export const metadata: Metadata = {
  title: {
    default: "PrepVoice — Your AI Interview Coach",
    template: "%s | PrepVoice",
  },
  description:
    "Practice interviews out loud, improve your communication, and get personalized AI feedback with PrepVoice.",
  applicationName: "PrepVoice",
  keywords: [
    "PrepVoice",
    "AI interview preparation",
    "mock interview",
    "interview practice",
    "AI interview coach",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f7ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-[#f8f7ff] text-gray-800">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Navigation />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
