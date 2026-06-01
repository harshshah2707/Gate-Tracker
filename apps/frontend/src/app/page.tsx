'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flame, ShieldCheck, Trophy, Brain, Zap, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.isOnboarded) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
        return;
      } catch (e) {
        // Clear corrupt state
        localStorage.clear();
      }
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Entering the War Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900/80 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white font-black text-xl">GW</div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white uppercase">GATE WARROOM</h1>
            <span className="text-[10px] font-bold text-indigo-400 tracking-wider">2026 CSE</span>
          </div>
        </div>

        <Link
          href="/auth"
          className="px-5 py-2.5 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/20"
        >
          Enter War Room
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 flex-1">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold text-indigo-400">
            <Zap className="w-4 h-4" /> 100% Free Accountability OS for GATE CSE
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
            Stop studying in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">isolation</span>.
          </h2>

          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
            An addiction-forming platform that combines Duolingo's habit loops, GitHub's consistency graphs, Strava's social pressure, and webcam/attention check verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link
              href="/auth"
              className="flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 hover:translate-y-[-2px] transition-all duration-300"
            >
              Start Onboarding <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-xs text-slate-500 font-bold">No ads. No paywalls. Pure consistency.</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl glass-card border-slate-800/80 hover:translate-y-[-4px] transition-all duration-300">
            <Flame className="w-8 h-8 text-amber-500 mb-4 animate-flame" />
            <h3 className="text-lg font-bold mb-2">No Zero Day System</h3>
            <p className="text-slate-400 text-sm">Log 15 minutes of verified study daily. Fail to do so, and your streak resets to zero at midnight.</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border-slate-800/80 hover:translate-y-[-4px] transition-all duration-300">
            <ShieldCheck className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Honest Trust Scores</h3>
            <p className="text-slate-400 text-sm">Focus timer checks and optional webcam verification build a public trust rating (0-100%).</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border-slate-800/80 hover:translate-y-[-4px] transition-all duration-300">
            <Users className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Friend Groups & Shaming</h3>
            <p className="text-slate-400 text-sm">Compare daily study hours. If a member hasn't logged a study session in 3 days, they are marked as "Ghosting".</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border-slate-800/80 hover:translate-y-[-4px] transition-all duration-300">
            <Brain className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Spaced Repetitions</h3>
            <p className="text-slate-400 text-sm">Input solved topics and let the system trigger automatic revision flags at 1/3/7/15/30 day intervals.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-slate-900/60 z-10 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-bold gap-4">
        <p>© 2026 GATE WARROOM. Created for CSE Aspirants to study consistently.</p>
        <div className="flex gap-6">
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-300 cursor-pointer">Syllabus Guide</span>
          <span className="hover:text-slate-300 cursor-pointer">Open Source</span>
        </div>
      </footer>
    </div>
  );
}
