'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CalendarDays, AlertTriangle, CheckCircle, Heart, Plus, Brain, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RevisionsPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual Add Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [subjectName, setSubjectName] = useState('Databases');
  const [adding, setAdding] = useState(false);

  const fetchQueueData = async () => {
    try {
      const q = await api.get('/revisions/queue');
      setQueue(q);

      const h = await api.get('/revisions/health');
      setHealth(h);
    } catch (err) {
      console.error('Failed to load revision queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  const handleComplete = async (revisionId: string) => {
    setActionLoading(revisionId);
    try {
      await api.post(`/revisions/${revisionId}/complete`, {});
      confetti({ particleCount: 30, spread: 35 });
      await fetchQueueData();
    } catch (err) {
      alert('Failed to complete revision card.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/revisions/add', {
        topicId: topicName.toLowerCase().replace(/\s+/g, '-'),
        subjectId: subjectName.toLowerCase().replace(/\s+/g, '-'),
      });
      setTopicName('');
      setShowAddForm(false);
      await fetchQueueData();
      alert('Topic added to spaced repetition queue! First check scheduled for tomorrow.');
    } catch (err) {
      alert('Failed to add topic. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const formatDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 3600000));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due Today';
    if (days === 1) return 'Due Tomorrow';
    return `Due in ${days} days`;
  };

  if (loading || !health) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="font-semibold text-sm">Synchronizing Revision Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Revision Queue</h2>
          <p className="text-slate-400 text-xs font-semibold">Spaced repetition logs to fight the forgetting curve.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer shadow-lg shadow-indigo-600/20 active:translate-y-[1px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Revision Target</span>
        </button>
      </div>

      {/* Manual add form overlay */}
      {showAddForm && (
        <div className="p-5 rounded-2xl border border-indigo-500/10 bg-[#070d19]/45 max-w-md">
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-200 text-sm uppercase">Add Spaced Topic</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Classification</label>
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
              >
                <option value="Databases">Databases</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Theory of Computation">Theory of Computation</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Discrete Mathematics">Discrete Mathematics</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic Title</label>
              <input
                type="text"
                required
                placeholder="e.g. DFA Minimization / SQL Joins"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
              />
            </div>

            <button type="submit" disabled={adding} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center">
              {adding ? <div className="w-4 h-4 rounded-full border border-white/20 border-t-white animate-spin" /> : 'Enqueue Study Card'}
            </button>
          </form>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Spaced items list */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Your Spaced Logs</span>
          
          {queue.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-850 bg-[#070d19]/10">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Your revision queue is empty. Complete focus timer sessions or click **Add Revision Target** to schedule repetition loops.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => {
                const isOverdue = item.status === 'OVERDUE';
                const daysLeft = formatDaysLeft(item.nextRevisionDate);

                return (
                  <div
                    key={item.revisionId}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      isOverdue
                        ? 'border-rose-500/20 bg-rose-950/5 hover:border-rose-500/40 shadow-sm shadow-rose-900/5'
                        : 'border-slate-850 bg-[#070d19]/20 hover:border-slate-800'
                    }`}
                  >
                    
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase">
                            <CalendarDays className="w-3 h-3" /> Scheduled
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Interval: {item.interval} days
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-200 truncate capitalize">
                        {item.topicId.replace(/-/g, ' ')}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate">
                        Subject: {item.subjectId.replace(/-/g, ' ')}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="text-right shrink-0 flex items-center gap-4">
                      <div>
                        <p className={`font-black text-xs ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-slate-350'}`}>
                          {daysLeft}
                        </p>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Cleared: {item.completedCount} times</span>
                      </div>

                      {actionLoading === item.revisionId ? (
                        <div className="w-8 h-8 rounded-full border border-indigo-400/20 border-t-indigo-400 animate-spin" />
                      ) : (
                        <button
                          onClick={() => handleComplete(item.revisionId)}
                          className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 flex items-center justify-center text-emerald-400 hover:text-emerald-300 cursor-pointer hover:border-emerald-500/30 transition-all"
                          title="Complete Revision Task"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Health meters */}
        <div className="space-y-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Health Overview</span>
          
          <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/25 text-center space-y-4">
            <Heart className="w-10 h-10 text-rose-500 mx-auto fill-rose-500/20 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Revision Health Rating</span>
              <h3 className="text-3xl font-black text-slate-100 mt-1">{health.revisionHealthScore}%</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed px-4">
              Your health rating is dragged down by <span className="text-rose-400 font-extrabold">{health.overdueCount} overdue</span> spaced repetition logs. Clear tasks daily.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
