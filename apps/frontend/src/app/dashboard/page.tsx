'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  Flame,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Trophy,
  Brain,
  Zap,
  Play,
  Pause,
  Square,
  Plus,
  RefreshCw,
  Camera,
  Activity,
  UserCheck
} from 'lucide-react';
import { GATE_CSE_SYLLABUS } from '@gate-warroom/shared';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Focus Session Modal State
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(GATE_CSE_SYLLABUS[0].name);
  const [selectedTopic, setSelectedTopic] = useState(GATE_CSE_SYLLABUS[0].units[0].topics[0].name);
  const [sessionType, setSessionType] = useState('Pomodoro');
  const [duration, setDuration] = useState(25);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  
  // Timer Running State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [interruptions, setInterruptions] = useState(0);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [verificationLevel, setVerificationLevel] = useState(2); // 1: Manual, 2: Timer, 3: Alerts, 4: Webcam
  const [webcamActive, setWebcamActive] = useState(false);

  // Attention Check Alert
  const [attentionCheckOpen, setAttentionCheckOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = async () => {
    try {
      const uData = await api.get('/users/me');
      setUser(uData);

      const dStats = await api.get('/analytics/dashboard');
      setStats(dStats);

      const fData = await api.get('/feed/personal');
      setFeed(fData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    fetchDashboardData();

    // Setup Socket.IO listener for real-time activities and reactions
    const socket = getSocket(user?.userId);
    
    // Join personal group room on socket load
    if (user?.userId) {
      api.get('/groups/my').then((groups) => {
        groups.forEach((g: any) => {
          socket.emit('group:join', { groupId: g.groupId });
        });
      });
    }

    socket.on('feed:new-activity', (newActivity: any) => {
      setFeed((prev) => [newActivity, ...prev.slice(0, 29)]);
    });

    socket.on('feed:reaction-updated', (data: { activityId: string; reactions: any[] }) => {
      setFeed((prev) =>
        prev.map((act) =>
          act.activityId === data.activityId ? { ...act, reactions: data.reactions } : act
        )
      );
    });

    socket.on('streak:updated', (data: { currentStreak: number }) => {
      setStats((prev: any) => (prev ? { ...prev, currentStreak: data.currentStreak } : prev));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    });

    return () => {
      socket.off('feed:new-activity');
      socket.off('feed:reaction-updated');
      socket.off('streak:updated');
    };
  }, [router, user?.userId]);

  // Handle syllabus topic dependency mapping
  useEffect(() => {
    const matchedSubject = GATE_CSE_SYLLABUS.find((s) => s.name === selectedSubject);
    if (matchedSubject) {
      setSelectedTopic(matchedSubject.units[0].topics[0].name);
    }
  }, [selectedSubject]);

  // Timer Ticker Logic
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          // Trigger random attention check at Level 3 or 4
          if ((verificationLevel === 3 || verificationLevel === 4) && prev > 10 && Math.random() < 0.005) {
            setAttentionCheckOpen(true);
          }

          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timeLeft, verificationLevel]);

  const handleStartSession = async () => {
    try {
      const session = await api.post('/sessions/start', {
        subject: selectedSubject,
        topic: selectedTopic,
        duration,
        verificationLevel,
        isManualLog: verificationLevel === 1,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        notes,
      });

      setActiveSession(session);
      setTimeLeft(duration * 60);
      setTimerRunning(true);
      setInterruptions(0);
      if (verificationLevel === 4) {
        setWebcamActive(true);
      }
    } catch (err) {
      alert('Failed to initialize session on backend.');
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    setTimerRunning(false);

    // Ask user for focus rating
    const focusRating = prompt('How focused were you? (1-10)', '8') || '8';
    
    try {
      await api.patch(`/sessions/${activeSession.sessionId}/stop`, {
        duration: Math.max(1, Math.round((duration * 60 - timeLeft) / 60)),
        interruptions,
        productivityScore: parseFloat(focusRating),
        notes: notes + ` [Focus score logged: ${focusRating}]`,
      });

      setSessionModalOpen(false);
      setActiveSession(null);
      setWebcamActive(false);
      confetti({ particleCount: 50, spread: 60 });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to complete session logging.');
    }
  };

  const handleReact = async (activityId: string, emoji: string) => {
    try {
      await api.post(`/feed/${activityId}/react`, { emoji });
      // Socket will broadcast, but update locally immediately for snappy responsiveness
      setFeed((prev) =>
        prev.map((act) => {
          if (act.activityId === activityId) {
            const hasReacted = act.reactions.some(
              (r: any) => r.userId === user.userId && r.emoji === emoji
            );
            const filtered = act.reactions.filter(
              (r: any) => !(r.userId === user.userId && r.emoji === emoji)
            );
            return {
              ...act,
              reactions: hasReacted
                ? filtered
                : [...filtered, { userId: user.userId, emoji }],
            };
          }
          return act;
        })
      );
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const triggerResetCron = async () => {
    setRefreshing(true);
    try {
      await api.post('/analytics/trigger-reset', {});
      await fetchDashboardData();
      alert('Simulated transition to next study day! Stale streaks and Study Debt recalculated.');
    } catch (err) {
      alert('Failed to execute daily reset simulator.');
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="font-semibold text-sm">Deploying War Room Stats...</p>
        </div>
      </div>
    );
  }

  const accountabilityBadge = (score: number) => {
    if (score >= 96) return { label: '🤖 Machine', style: 'bg-cyan-950/40 text-cyan-400 border-cyan-400/30' };
    if (score >= 81) return { label: '🔥 Beast', style: 'bg-orange-950/40 text-orange-400 border-orange-500/30' };
    if (score >= 61) return { label: '⚡ Consistent', style: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' };
    if (score >= 41) return { label: '✅ Active', style: 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30' };
    if (score >= 21) return { label: '😴 Sleeping', style: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30' };
    return { label: '👻 Ghost', style: 'bg-rose-950/40 text-rose-400 border-rose-500/30' };
  };

  const accBadge = accountabilityBadge(stats.accountabilityScore);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">War Room Dashboard</h2>
          <p className="text-slate-400 text-xs font-semibold">Your daily performance checks are live.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={triggerResetCron}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer active:translate-y-[1px] disabled:opacity-50"
            title="Evaluate daily stats change without waiting for midnight"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Simulate Daily Reset</span>
          </button>
          
          <button
            onClick={() => setSessionModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:translate-y-[1px] transition-all cursor-pointer text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Focus Session</span>
          </button>
        </div>
      </div>

      {/* Header Statistics Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Estimated Rank Card */}
        <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/40 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projected Rank</span>
            <Trophy className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-indigo-400 leading-tight">
              AIR {stats.estimatedRankMin} - {stats.estimatedRankMax}
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">Based on current readiness ({user?.readinessScore}%)</span>
          </div>
        </div>

        {/* Streaks Card */}
        <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/40 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Streak</span>
            <Flame className="w-4 h-4 text-orange-500 animate-flame" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-amber-500 leading-tight">
              {stats.currentStreak} Days 🔥
            </h3>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mt-1">
              <span>Longest: {stats.longestStreak} days</span>
              {stats.isStreakAtRisk && <span className="text-rose-400 animate-pulse">Streak at risk!</span>}
            </div>
          </div>
        </div>

        {/* Accountability Score */}
        <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/40 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accountability Rating</span>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${accBadge.style}`}>
              {accBadge.label}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-100 leading-tight">
              {stats.accountabilityScore}%
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">Daily study, mock and revision adherence</span>
          </div>
        </div>

        {/* Trust Score */}
        <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/40 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Integrity</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-400 leading-tight">
              {stats.trustScore}%
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">Impacted by focus timers vs manual entries</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's targets vs Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Targets & Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Target Card */}
          <div className="p-6 rounded-2xl glass border-indigo-500/10 bg-[#070d19]/30 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Today's Focus Status</h3>
                <span className="text-[10px] text-slate-500 font-bold">Log 15 mins to secure your streak</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">{stats.completedHoursToday}h</span>
                <span className="text-xs text-slate-400 font-bold"> / {stats.dailyGoal}h target</span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.completedHoursToday / stats.dailyGoal) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 mt-2">
                <span>{Math.round((stats.completedHoursToday / stats.dailyGoal) * 100)}% Completed</span>
                {stats.dailyDebt > 0 ? (
                  <span className="text-amber-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Study Debt: {stats.dailyDebt}h today
                  </span>
                ) : (
                  <span className="text-emerald-400">Target Cleared! 🎉</span>
                )}
              </div>
            </div>

            {/* Stats Subgrid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-900">
              <div className="text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Weekly Consistency</span>
                <span className="text-lg font-black text-slate-200">{stats.weeklyConsistency}%</span>
              </div>
              <div className="text-center border-x border-slate-900">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Monthly Consistency</span>
                <span className="text-lg font-black text-slate-200">{stats.monthlyConsistency}%</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Accumulated Debt</span>
                <span className={`text-lg font-black ${stats.accumulatedDebt > 5 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {stats.accumulatedDebt} hrs
                </span>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/20">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-400 mb-3 block">Top Strength Subjects</h4>
              <div className="space-y-2">
                {stats.strongSubjects.slice(0, 3).map((sub: any) => (
                  <div key={sub.subjectName} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-350">{sub.subjectName}</span>
                    <span className="font-extrabold text-emerald-400">{sub.completion}% Done</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/20">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-400 mb-3 block">Top Weakness Subjects</h4>
              <div className="space-y-2">
                {stats.weakSubjects.slice(0, 3).map((sub: any) => (
                  <div key={sub.subjectName} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-350">{sub.subjectName}</span>
                    <span className="font-extrabold text-indigo-400">{sub.completion}% Done</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mock summaries */}
          <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/20">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 block">Last Mock Results</h4>
            {stats.lastMocks.length === 0 ? (
              <p className="text-slate-500 text-xs font-semibold">No mocks logged yet. Start measuring your targets!</p>
            ) : (
              <div className="space-y-3">
                {stats.lastMocks.map((mock: any) => (
                  <div key={mock.mockId} className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-950/30 border border-slate-900">
                    <div>
                      <p className="font-bold text-slate-200">{mock.platform}</p>
                      <span className="text-[10px] text-slate-500 font-semibold">{new Date(mock.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-indigo-400">{mock.marks} / 100</p>
                      <span className="text-[10px] text-slate-500 font-extrabold">Accuracy: {mock.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Feed & Revisions */}
        <div className="space-y-6">
          
          {/* Active Feed */}
          <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/30 flex flex-col h-[400px]">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> War Room Live Feed
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {feed.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-12">No activity logged in the warroom.</p>
              ) : (
                feed.map((act) => (
                  <div key={act.activityId} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs space-y-2">
                    <p className="text-slate-350 font-medium leading-relaxed">{act.description}</p>
                    
                    {/* Reactions buttons */}
                    <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-slate-900/60">
                      {['🔥', '⚡', '🚀', '🫡', '💪', '💀'].map((emoji) => {
                        const count = act.reactions.filter((r: any) => r.emoji === emoji).length;
                        const userReacted = act.reactions.some(
                          (r: any) => r.userId === user.userId && r.emoji === emoji
                        );
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(act.activityId, emoji)}
                            className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                              userReacted
                                ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 font-extrabold shadow-sm shadow-indigo-500/10'
                                : 'border-slate-850 bg-slate-950 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="font-bold">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Spaced Revisions alerts */}
          <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/30">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" /> Upcoming Revisions
            </h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center p-3 rounded-lg bg-rose-950/10 border border-rose-500/20 text-rose-400">
                <span className="font-bold">Overdue revisions</span>
                <span className="font-black px-2 py-0.5 rounded bg-rose-600/20 border border-rose-500/20">
                  {stats.overdueRevisions} topics
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed pt-1">
                Clear overdue revision tasks inside the **Revision Queue** to reclaim your Accountability Rating.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOCUS TIMER MODAL OVERLAY */}
      {sessionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="w-full max-w-lg glass-card rounded-2xl p-8 border-indigo-500/20 relative">
            
            {/* Attention Check Modal overlay */}
            {attentionCheckOpen && (
              <div className="absolute inset-0 bg-[#020617]/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
                <h3 className="text-xl font-black text-rose-400">ATTENTION CHECK!</h3>
                <p className="text-slate-400 text-xs max-w-xs font-semibold leading-relaxed">
                  Click the button within 15 seconds to verify you are at your desk and studying.
                </p>
                <button
                  onClick={() => setAttentionCheckOpen(false)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  Confirm Desk Presence
                </button>
              </div>
            )}

            {!activeSession ? (
              // Setup session form
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white">Focus Session Setup</h3>
                  <button onClick={() => setSessionModalOpen(false)} className="text-slate-500 hover:text-slate-200">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                      >
                        {GATE_CSE_SYLLABUS.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Topic</label>
                      <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                      >
                        {GATE_CSE_SYLLABUS.find((s) => s.name === selectedSubject)?.units.flatMap((u) => u.topics).map((t) => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Format</label>
                      <select
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                      >
                        <option value="Pomodoro">Pomodoro (Focus & rest)</option>
                        <option value="Deep Work">Deep Work (Max immersion)</option>
                        <option value="Custom">Custom Timer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={25}>25 Minutes</option>
                        <option value={50}>50 Minutes</option>
                        <option value={90}>90 Minutes</option>
                        <option value={120}>120 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Integrity Level</label>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      {[
                        { level: 1, label: 'Manual', desc: 'Self log (30% trust)' },
                        { level: 2, label: 'Timer', desc: 'Focus timer (70% trust)' },
                        { level: 3, label: 'Checks', desc: 'Alert check (85% trust)' },
                        { level: 4, label: 'Webcam', desc: 'Video checks (100% trust)' },
                      ].map((ver) => (
                        <button
                          key={ver.level}
                          onClick={() => setVerificationLevel(ver.level)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                            verificationLevel === ver.level
                              ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 font-extrabold shadow-sm'
                              : 'border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-350'
                          }`}
                        >
                          <span className="font-extrabold">{ver.label}</span>
                          <span className="text-[8px] text-slate-500 leading-tight mt-1">{ver.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. SQL, PYQs, Theory"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Notes / Log Goals</label>
                    <textarea
                      placeholder="Specify your study goals for this session..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 font-semibold h-20 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartSession}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 transition-all active:translate-y-[1px] cursor-pointer mt-4"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Deploy Focus System</span>
                </button>
              </div>
            ) : (
              // Active timer view
              <div className="space-y-6 text-center">
                <div>
                  <h3 className="text-lg font-black text-white">{selectedSubject}</h3>
                  <p className="text-indigo-400 text-xs font-bold mt-1">{selectedTopic}</p>
                </div>

                {/* Webcam Mock View */}
                {webcamActive && (
                  <div className="w-full h-44 rounded-xl bg-slate-900 border border-indigo-500/20 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-rose-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                      <Camera className="w-3 h-3" /> Live Webcam Feed
                    </div>
                    <div className="text-center space-y-2">
                      <UserCheck className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                      <p className="text-[10px] text-slate-500 font-bold max-w-xs px-6">
                        Level 4 camera feed active. Face detection is monitoring studying state.
                      </p>
                    </div>
                  </div>
                )}

                {/* Big Timer */}
                <div className="text-5xl md:text-7xl font-black text-white font-mono leading-none">
                  {formatTime(timeLeft)}
                </div>

                {/* Counter checks */}
                <div className="flex justify-center gap-8 text-xs font-bold text-slate-400">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Distractions</span>
                    <button
                      onClick={() => setInterruptions((prev) => prev + 1)}
                      className="px-4 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-200 mt-1 cursor-pointer font-black text-rose-400"
                    >
                      Count: {interruptions}
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Format</span>
                    <span className="inline-block mt-2.5 font-extrabold text-slate-200">{sessionType}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 pt-4 border-t border-slate-900">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-300 cursor-pointer"
                  >
                    {timerRunning ? <Pause className="w-4 h-4 fill-slate-300" /> : <Play className="w-4 h-4 fill-slate-300" />}
                    <span>{timerRunning ? 'Pause' : 'Resume'}</span>
                  </button>

                  <button
                    onClick={handleCompleteSession}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:translate-y-[1px] transition-all"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop & Log</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
