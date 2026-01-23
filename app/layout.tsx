import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { MusicProvider } from "../lib/music-context";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "WArk",
  description: "Autonomous Development Environment",
  icons: {
    icon: "/fav.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <MusicProvider>
            <Header />
            {children}
          </MusicProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
