"use client";

import Stopwatch from "../components/Stopwatch";
import Auth from "../components/Auth";
import { useAuth } from "../lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />
        <Auth />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12 md:py-24 landscape:py-4 selection:bg-white selection:text-black relative no-scrollbar overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Main Stopwatch Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl z-10">
        <Stopwatch />
      </div>

    </main>
  );
}
