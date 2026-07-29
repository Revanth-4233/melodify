import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { PlayerProvider } from "@/components/Player";

export const metadata: Metadata = {
  title: "Melodify - Music Catalog Insights Platform",
  description: "Search, save, and analyze your personal music library with AI-powered insights. Built with iTunes Search API integration.",
  keywords: "music, catalog, albums, analytics, AI insights, library, iTunes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PlayerProvider>
            {children}
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
