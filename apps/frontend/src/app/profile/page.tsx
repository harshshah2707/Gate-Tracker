'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User, Award, Calendar, BarChart2, Zap, Hourglass, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [whatIfHours, setWhatIfHours] = useState(6.0);
  const [whatIfScore, setWhatIfScore] = useState(70);
  const [whatIfCompletion, setWhatIfCompletion] = useState(50);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchProfileData = async () => {
      try {
        const u = await api.get('/users/me');
        setProfile(u);

        const s = await api.get(`/users/${u.userId}/stats`);
        setStats(s);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const runSimulation = async () => {
      setSimulating(true);
      try {
        const res = await api.post('/rank-projection/what-if', {
          dailyStudyHours: Number(whatIfHours),
          mockScore: Number(whatIfScore),
          syllabusCompletion: Number(whatIfCompletion),
        });
        setSimulationResult(res);
      } catch (err) {
        console.error('Failed to run rank simulation:', err);
      } finally {
        setSimulating(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      runSimulation();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [whatIfHours, whatIfScore, whatIfCompletion, profile]);

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="font-semibold text-sm">Loading Aspirant Record...</p>
        </div>
      </div>
    );
  }

  // Chart data formatting
  const chartData = stats.map((s) => ({
    name: new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    Hours: s.dailyStudyHours,
    Debt: s.dailyDebt,
  }));

  return (
    <div className="space-y-6">
      
      {/* Profile summary card */}
      <div className="p-6 rounded-2xl glass border-slate-850 bg-[#070d19]/25 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-indigo-950 border border-indigo-500/20 flex items-center justify-center font-black text-3xl text-indigo-400">
          {profile.name.charAt(0)}
        </div>
        
        <div className="space-y-1.5 text-center md:text-left flex-1">
          <h2 className="text-2xl font-black text-slate-100">{profile.name}</h2>
          <p className="text-slate-450 text-xs font-semibold">{profile.college} • Class of {profile.graduationYear}</p>
          <span className="inline-block text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-900">
            Aspirant Target: AIR {profile.targetRank}
          </span>
        </div>

        <div className="flex gap-6 text-center text-xs font-bold shrink-0">
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 min-w-[90px]">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Study Hours</span>
            <span className="text-lg font-black text-slate-200">{Math.round(profile.totalStudyHours)} hrs</span>
          </div>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 min-w-[90px]">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Current Streak</span>
            <span className="text-lg font-black text-amber-500">{profile.currentStreak} days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Study History Chart */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Study Consistency</span>
          
          <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/10">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 block flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-400" /> Daily Hours History (Last 30 Days)
            </h4>
            
            {stats.length === 0 ? (
              <p className="text-slate-500 text-xs py-12 text-center font-semibold">No study stats recorded yet. Start studying!</p>
            ) : (
              mounted && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Bar dataKey="Hours" fill="#6366f1" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right: Achievements Grid */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Achievements</span>
          
          <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/25 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-2 block flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500 animate-flame" /> Earned Medals ({profile.achievements?.length || 0})
            </h4>

            {profile.achievements?.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center font-semibold">Study hard to unlock consistency badges.</p>
            ) : (
              <div className="space-y-2">
                {profile.achievements?.map((ach: any) => (
                  <div key={ach.achievementId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/45 border border-slate-900 text-xs">
                    <div className="p-2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Zap className="w-4 h-4 fill-amber-500/10" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-200">{ach.achievementName}</p>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unlocked Category: {ach.achievementCategory}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What-If Simulator Card */}
          <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/25 space-y-4 mt-6">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" /> What-If AIR Simulator
            </h4>

            <div className="space-y-3 text-xs font-semibold">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-extrabold text-[10px]">
                  <span>DAILY STUDY TARGET</span>
                  <span className="text-indigo-400">{whatIfHours} Hours</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={16}
                  step={0.5}
                  value={whatIfHours}
                  onChange={(e) => setWhatIfHours(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-900 rounded appearance-none cursor-pointer h-1.5"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-extrabold text-[10px]">
                  <span>MOCK SCORES AVERAGE</span>
                  <span className="text-indigo-400">{whatIfScore} / 100</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={whatIfScore}
                  onChange={(e) => setWhatIfScore(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-900 rounded appearance-none cursor-pointer h-1.5"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-extrabold text-[10px]">
                  <span>SYLLABUS COMPLETION</span>
                  <span className="text-indigo-400">{whatIfCompletion}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={whatIfCompletion}
                  onChange={(e) => setWhatIfCompletion(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-900 rounded appearance-none cursor-pointer h-1.5"
                />
              </div>
            </div>

            {simulationResult && (
              <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/15 text-center space-y-1.5 mt-4">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Simulated Projection</span>
                <span className="text-2xl font-black text-slate-100">
                  AIR {simulationResult.estimatedRankMin} - {simulationResult.estimatedRankMax}
                </span>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-left mt-2 border-t border-slate-900 pt-2.5">
                  {simulationResult.analysis}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
