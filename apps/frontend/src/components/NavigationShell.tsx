'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Flame,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Award,
  Users,
  LogOut,
  Trophy,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { api } from '@/lib/api';

interface NavigationShellProps {
  children: React.ReactNode;
}

export default function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on landing or auth page, do not render navigation shell
  const isAuthPage = pathname.startsWith('/auth');
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isLandingPage = pathname === '/';

  useEffect(() => {
    if (isAuthPage || isOnboardingPage || isLandingPage) return;

    // Fetch user & stats
    const fetchUserData = async () => {
      try {
        const userData = await api.get('/users/me');
        setUser(userData);
        
        const dashboardData = await api.get('/analytics/dashboard');
        setStats(dashboardData);
      } catch (err) {
        console.error('Failed to load user in shell:', err);
      }
    };

    fetchUserData();
  }, [pathname, isAuthPage, isOnboardingPage, isLandingPage]);

  if (isAuthPage || isOnboardingPage || isLandingPage) {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'War Room', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Syllabus Tracker', path: '/syllabus', icon: BookOpen },
    { name: 'Revision Queue', path: '/revisions', icon: CalendarDays },
    { name: 'Mock Tests', path: '/mocks', icon: Trophy },
    { name: 'Study Groups', path: '/groups', icon: Users },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const getAccountabilityColor = (score: number) => {
    if (score >= 96) return 'text-cyan-400 border-cyan-400 bg-cyan-950/30';
    if (score >= 81) return 'text-orange-400 border-orange-400 bg-orange-950/30';
    if (score >= 61) return 'text-emerald-400 border-emerald-400 bg-emerald-950/30';
    if (score >= 41) return 'text-indigo-400 border-indigo-400 bg-indigo-950/30';
    if (score >= 21) return 'text-yellow-400 border-yellow-400 bg-yellow-950/30';
    return 'text-slate-400 border-slate-400 bg-slate-950/30';
  };

  const getAccountabilityLabel = (score: number) => {
    if (score >= 96) return '🤖 Machine';
    if (score >= 81) return '🔥 Beast';
    if (score >= 61) return '⚡ Consistent';
    if (score >= 41) return '✅ Active';
    if (score >= 21) return '😴 Sleeping';
    return '👻 Ghost';
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#070d19] border-r border-[#1e293b] shrink-0">
        {/* Header / Logo */}
        <div className="p-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white font-black text-xl tracking-wider">
              GW
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white uppercase">GATE WARROOM</h1>
              <span className="text-xs font-semibold text-indigo-400 tracking-widest">2026 CSE</span>
            </div>
          </div>
        </div>

        {/* User Mini Profile */}
        {user && stats && (
          <div className="p-4 mx-3 my-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.college}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-500 animate-flame" />
                <span className="font-extrabold text-amber-400">{user.currentStreak}d</span>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getAccountabilityColor(user.accountabilityScore)}`}>
                {getAccountabilityLabel(user.accountabilityScore)}
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-950/50 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.name === 'Revision Queue' && stats?.overdueRevisions > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-400 text-[10px] font-extrabold border border-rose-500/20">
                    {stats.overdueRevisions}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-[#1e293b]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 rounded-lg text-sm font-semibold hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Abduction / Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Shell Container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-[#070d19] border-b border-[#1e293b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded text-white font-black text-md">GW</div>
            <h1 className="font-extrabold text-xs tracking-wider uppercase">WARROOM</h1>
          </div>

          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-1 bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-500/20 text-xs">
                <Flame className="w-4 h-4 text-amber-500 animate-flame" />
                <span className="font-bold text-amber-400">{stats.currentStreak}d</span>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[60px] z-50 bg-[#020617]/95 backdrop-blur-md p-6 flex flex-col gap-4 border-b border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-md font-bold ${
                    pathname === item.path ? 'bg-indigo-950/50 text-indigo-400 border-l-4 border-indigo-500' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <hr className="border-slate-800 my-2" />
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 text-rose-400 text-md font-bold hover:bg-rose-950/20 rounded-lg"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#020617] p-6 pb-24 md:pb-6 relative">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#070d19] border-t border-[#1e293b] flex md:hidden items-center justify-around py-3 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
