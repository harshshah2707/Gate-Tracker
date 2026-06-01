'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Trophy,
  Plus,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  Activity,
  HeartCrack,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import confetti from 'canvas-confetti';

export default function MocksPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [platform, setPlatform] = useState('MadeEasy Mocks');
  const [marks, setMarks] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [rank, setRank] = useState('');
  
  // Mistake Categories State
  const [calculationErrors, setCalculationErrors] = useState(0);
  const [conceptualGaps, setConceptualGaps] = useState(0);
  const [sillyMistakes, setSillyMistakes] = useState(0);
  const [timeManagement, setTimeManagement] = useState(0);
  const [improvementAreas, setImprovementAreas] = useState('');

  const [logging, setLogging] = useState(false);

  const fetchMockData = async () => {
    try {
      const hist = await api.get('/mocks/history');
      setHistory(hist);

      const anal = await api.get('/mocks/analysis');
      setAnalysis(anal);
    } catch (err) {
      console.error('Failed to load mock tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMockData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    try {
      const payload = {
        platform,
        marks: parseFloat(marks),
        accuracy: parseFloat(accuracy),
        rank: rank ? parseInt(rank) : null,
        mistakeCategories: {
          'Calculation Errors': Number(calculationErrors),
          'Conceptual Gaps': Number(conceptualGaps),
          'Silly Mistakes': Number(sillyMistakes),
          'Time Management': Number(timeManagement),
        },
        improvementAreas: improvementAreas.split(',').map((i) => i.trim()).filter(Boolean),
        subjectPerformance: {},
      };

      await api.post('/mocks', payload);
      
      confetti({ particleCount: 80, spread: 60 });
      setPlatform('MadeEasy Mocks');
      setMarks('');
      setAccuracy('');
      setRank('');
      setCalculationErrors(0);
      setConceptualGaps(0);
      setSillyMistakes(0);
      setTimeManagement(0);
      setImprovementAreas('');
      setShowLogForm(false);
      
      await fetchMockData();
    } catch (err) {
      alert('Failed to log mock test result.');
    } finally {
      setLogging(false);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="font-semibold text-sm">Aggregating Mock Diagnostic Metrics...</p>
        </div>
      </div>
    );
  }

  // Prep Chart Data
  const lineChartData = analysis.marksHistory.map((m: any) => ({
    name: new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    Marks: m.marks,
    Accuracy: m.accuracy,
  }));

  const barChartData = Object.entries(analysis.mistakeBreakdown).map(([key, val]) => ({
    name: key,
    Mistakes: val,
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981'];

  return (
    <div className="space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Mock performance</h2>
          <p className="text-slate-400 text-xs font-semibold">Track score improvement curves and mistake diagnostic categories.</p>
        </div>

        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer shadow-lg shadow-indigo-600/20 active:translate-y-[1px]"
        >
          <Plus className="w-4 h-4" />
          <span>Log Mock Exam</span>
        </button>
      </div>

      {/* Log Form Overlay */}
      {showLogForm && (
        <div className="p-6 rounded-2xl border border-indigo-500/10 bg-[#070d19]/45 max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-200 text-sm uppercase">Log Mock Result</h3>
              <button type="button" onClick={() => setShowLogForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                >
                  <option value="MadeEasy Mocks">MadeEasy Mocks</option>
                  <option value="Ace Academy Mocks">Ace Academy Mocks</option>
                  <option value="GATE Overflow Mocks">GATE Overflow</option>
                  <option value="PhysicsWallah Mocks">PhysicsWallah</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks Scored (/100)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 68.25"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 84.5"
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Rank (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 142"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-900 pt-3">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Mistake Breakdown (Count)</label>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold">Calculation Errors</span>
                  <input
                    type="number"
                    min={0}
                    value={calculationErrors}
                    onChange={(e) => setCalculationErrors(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-850 text-center font-bold text-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold">Conceptual Gaps</span>
                  <input
                    type="number"
                    min={0}
                    value={conceptualGaps}
                    onChange={(e) => setConceptualGaps(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-850 text-center font-bold text-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold">Silly Mistakes</span>
                  <input
                    type="number"
                    min={0}
                    value={sillyMistakes}
                    onChange={(e) => setSillyMistakes(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-850 text-center font-bold text-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-semibold">Time Pressures</span>
                  <input
                    type="number"
                    min={0}
                    value={timeManagement}
                    onChange={(e) => setTimeManagement(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-850 text-center font-bold text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Improvement Key Areas (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Cache Mapping proofs, DFA states reduction"
                value={improvementAreas}
                onChange={(e) => setImprovementAreas(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 font-semibold"
              />
            </div>

            <button type="submit" disabled={logging} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center">
              {logging ? <div className="w-5 h-5 rounded-full border border-white/20 border-t-white animate-spin" /> : 'Register Mock Logs'}
            </button>
          </form>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-850 bg-[#070d19]/30 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Average Score</span>
          <span className="text-2xl font-black text-indigo-400 mt-1 block">{analysis.avgMarks} / 100</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-850 bg-[#070d19]/30 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Average Accuracy</span>
          <span className="text-2xl font-black text-teal-400 mt-1 block">{analysis.avgAccuracy}%</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-850 bg-[#070d19]/30 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Mock Logs</span>
          <span className="text-2xl font-black text-slate-200 mt-1 block">{analysis.totalMocks} Exams</span>
        </div>
      </div>

      {/* Recharts Analytics Graphs */}
      {mounted && analysis.totalMocks > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Progress Improvement Line Chart */}
          <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/10">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 block">Marks & Accuracy Trends</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="Marks" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Accuracy" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mistakes Frequencies Bar Chart */}
          <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/10">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 block">Mistakes Categories Frequencies</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Bar dataKey="Mistakes" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* History log logs */}
      <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/25">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 block">Mock History Log</h4>
        
        {history.length === 0 ? (
          <p className="text-slate-500 text-xs py-4 text-center font-semibold">Log a mock exam above to populate history records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase font-black tracking-widest text-[9px]">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Platform</th>
                  <th className="py-2.5 text-center">Score</th>
                  <th className="py-2.5 text-center">Accuracy</th>
                  <th className="py-2.5 text-center">Rank</th>
                  <th className="py-2.5">Mistakes breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {history.map((mock) => {
                  const parsedMistakes = JSON.parse(mock.mistakeCategories as string);
                  const mistakeSummary = Object.entries(parsedMistakes)
                    .filter(([_, val]) => Number(val) > 0)
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(', ');

                  return (
                    <tr key={mock.mockId} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(mock.date).toLocaleDateString()}</td>
                      <td className="py-3 text-slate-200 font-bold">{mock.platform}</td>
                      <td className="py-3 text-center text-indigo-400 font-black">{mock.marks}</td>
                      <td className="py-3 text-center text-teal-400 font-black">{mock.accuracy}%</td>
                      <td className="py-3 text-center text-amber-500 font-bold">{mock.rank || '-'}</td>
                      <td className="py-3 text-xs text-slate-500 truncate max-w-xs">{mistakeSummary || 'None recorded'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
