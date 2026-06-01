'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Settings, Save, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [targetRank, setTargetRank] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [dailyStudyTarget, setDailyStudyTarget] = useState(6.0);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const u = await api.get('/users/me');
        setName(u.name);
        setCollege(u.college);
        setTargetRank(u.targetRank.toString());
        setTargetScore(u.targetScore.toString());
        setDailyStudyTarget(u.dailyStudyTarget);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await api.put('/users/me', {
        name,
        college,
        targetRank: Number(targetRank),
        targetScore: Number(targetScore),
        dailyStudyTarget: Number(dailyStudyTarget),
      });

      setSuccess(true);
      confetti({ particleCount: 30 });
      // Clear alert after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Unable to update settings in database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="font-semibold text-sm">Opening Configuration Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-500" /> Settings & Targets
        </h2>
        <p className="text-slate-400 text-xs font-semibold">Fine-tune your daily commitment thresholds and goals.</p>
      </div>

      <div className="max-w-xl glass-card rounded-2xl p-6 border-slate-850 bg-[#070d19]/25">
        
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs font-bold mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Configuration updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">College Classification</label>
            <input
              type="text"
              required
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Rank (AIR)</label>
              <input
                type="number"
                required
                value={targetRank}
                onChange={(e) => setTargetRank(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Score</label>
              <input
                type="number"
                required
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Daily Study Target: <span className="text-indigo-400 font-extrabold">{dailyStudyTarget} Hours</span>
            </label>
            <input
              type="range"
              min={1}
              max={16}
              step={0.5}
              value={dailyStudyTarget}
              onChange={(e) => setDailyStudyTarget(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-900 rounded-lg appearance-none cursor-pointer h-2"
            />
            <div className="flex justify-between text-[8px] font-bold text-slate-500">
              <span>1 Hr</span>
              <span>6 Hrs</span>
              <span>12 Hrs</span>
              <span>16 Hrs</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:translate-y-[1px] transition-all cursor-pointer text-xs mt-6"
          >
            {saving ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
}
