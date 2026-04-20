import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { MusicProvider } from "../lib/music-context";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "WArk",
  description: "Autonomous Development Environment",
  manifest: "/manifest.json",
  icons: {
    icon: "/fav.svg",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <MusicProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <Header />
              <div className="flex-1 min-h-0 overflow-hidden relative">
                {children}
              </div>
            </div>
          </MusicProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
