'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Sparkles, ShieldCheck, CheckSquare, BarChart, ArrowRight, Bookmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SyllabusPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [subjectDetails, setSubjectDetails] = useState<any>(null);
  const [overall, setOverall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSyllabusData = async () => {
    try {
      const subs = await api.get('/syllabus/subjects');
      setSubjects(subs);
      
      const overallData = await api.get('/syllabus/progress');
      setOverall(overallData);

      if (subs.length > 0 && !selectedSubjectName) {
        setSelectedSubjectName(subs[0].subjectName);
      }
    } catch (err) {
      console.error('Failed to load syllabus:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectTopics = async (subjectName: string) => {
    try {
      const details = await api.get(`/syllabus/subject/${subjectName}/topics`);
      setSubjectDetails(details);
    } catch (err) {
      console.error('Failed to load subject details:', err);
    }
  };

  useEffect(() => {
    fetchSyllabusData();
  }, []);

  useEffect(() => {
    if (selectedSubjectName) {
      fetchSubjectTopics(selectedSubjectName);
    }
  }, [selectedSubjectName]);

  const handleStatusChange = async (topicId: string, newStatus: string) => {
    setUpdating(topicId);
    try {
      await api.patch(`/syllabus/${topicId}/status`, {
        subjectName: selectedSubjectName,
        status: newStatus,
      });
      
      if (newStatus === 'Mastered') {
        confetti({ particleCount: 30, spread: 40 });
      }

      // Refresh topic details and overall subjects summary
      await fetchSubjectTopics(selectedSubjectName);
      const subs = await api.get('/syllabus/subjects');
      setSubjects(subs);
      const overallData = await api.get('/syllabus/progress');
      setOverall(overallData);
    } catch (err) {
      alert('Syllabus status update failed.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mastered': return 'bg-emerald-950/30 text-emerald-400 border-emerald-500/35';
      case 'Revised Twice': return 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30';
      case 'Revised Once': return 'bg-teal-950/30 text-teal-400 border-teal-550/25';
      case 'Practiced': return 'bg-indigo-950/30 text-indigo-400 border-indigo-500/25';
      case 'Learning': return 'bg-yellow-950/30 text-yellow-400 border-yellow-500/25';
      default: return 'bg-slate-900/60 text-slate-500 border-slate-800';
    }
  };

  if (loading || !subjects) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <p className="font-semibold text-sm">Compiling GATE Syllabus Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Syllabus Tracker</h2>
          <p className="text-slate-400 text-xs font-semibold">Coordinate your completion metrics and review health benchmarks.</p>
        </div>

        {overall && (
          <div className="flex bg-[#070d19]/45 border border-slate-850 px-4 py-2 rounded-xl text-center text-xs font-bold gap-6">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Syllabus Done</span>
              <span className="text-indigo-400 font-black block mt-0.5">{overall.completion}%</span>
            </div>
            <div className="border-l border-slate-900 pl-6">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Confidence</span>
              <span className="text-teal-400 font-black block mt-0.5">{overall.confidence}%</span>
            </div>
            <div className="border-l border-slate-900 pl-6">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Mastery Score</span>
              <span className="text-emerald-400 font-black block mt-0.5">{overall.mastery}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Subjects list on left, details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Subject Selector List */}
        <div className="space-y-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">GATE CSE Subjects</span>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {subjects.map((sub) => (
              <button
                key={sub.subjectName}
                onClick={() => setSelectedSubjectName(sub.subjectName)}
                className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  selectedSubjectName === sub.subjectName
                    ? 'bg-indigo-950/30 border-indigo-500 text-indigo-400 font-extrabold shadow-sm'
                    : 'border-slate-850 bg-[#070d19]/25 text-slate-400 hover:text-slate-200'
                }`}
              >
                <p className="text-xs truncate">{sub.subjectName}</p>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 border border-slate-950">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${sub.completionPercentage}%` }} />
                </div>
                <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 mt-1">
                  <span>{sub.completionPercentage}% Done</span>
                  <span>Mastery: {sub.masteryPercentage}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Subject units and topic statuses */}
        {selectedSubjectName && subjectDetails ? (
          <div className="lg:col-span-3 space-y-6">
            
            {/* Subject overview panel */}
            <div className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-100">{subjectDetails.subjectName}</h3>
                <span className="text-[10px] text-slate-500 font-bold">Interactive status update. Recomputes dashboard readiness.</span>
              </div>

              {/* Progress meters */}
              <div className="flex gap-5 text-xs font-bold text-center">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Completion</span>
                  <span className="text-indigo-400 font-black block mt-0.5">
                    {subjects.find((s) => s.subjectName === selectedSubjectName)?.completionPercentage}%
                  </span>
                </div>
                <div className="border-l border-slate-900 pl-5">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Confidence</span>
                  <span className="text-teal-400 font-black block mt-0.5">
                    {subjects.find((s) => s.subjectName === selectedSubjectName)?.confidencePercentage}%
                  </span>
                </div>
                <div className="border-l border-slate-900 pl-5">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Mastery</span>
                  <span className="text-emerald-400 font-black block mt-0.5">
                    {subjects.find((s) => s.subjectName === selectedSubjectName)?.masteryPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Units list */}
            <div className="space-y-4">
              {subjectDetails.unitsProgress.map((unit: any) => (
                <div key={unit.unitId} className="p-5 rounded-2xl glass border-slate-850 bg-[#070d19]/25 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-extrabold text-sm text-slate-200">{unit.unitName}</h4>
                  </div>

                  {/* Topics breakdown */}
                  <div className="space-y-3.5">
                    {unit.topics.map((topic: any) => {
                      const status = subjectDetails.topicStatuses[topic.topicId] || 'Not Started';
                      return (
                        <div key={topic.topicId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-xl bg-slate-950/30 border border-slate-900/60 text-xs">
                          
                          <div className="space-y-1 max-w-lg">
                            <p className="font-extrabold text-slate-200 text-sm">{topic.name}</p>
                            
                            {/* Subtopics tags */}
                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {topic.subtopics.map((st: string) => (
                                  <span key={st} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-[9px] text-slate-400 font-bold">
                                    {st}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Status toggle selector */}
                          <div className="flex items-center gap-2 shrink-0">
                            {updating === topic.topicId ? (
                              <div className="w-5 h-5 rounded-full border-2 border-indigo-400/20 border-t-indigo-400 animate-spin" />
                            ) : (
                              <select
                                value={status}
                                onChange={(e) => handleStatusChange(topic.topicId, e.target.value)}
                                className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase focus:outline-none transition-all cursor-pointer ${getStatusColor(status)}`}
                              >
                                <option value="Not Started" className="bg-[#020617] text-slate-500 font-bold">Not Started</option>
                                <option value="Learning" className="bg-[#020617] text-yellow-400 font-bold">Learning</option>
                                <option value="Practiced" className="bg-[#020617] text-indigo-400 font-bold">Practiced</option>
                                <option value="Revised Once" className="bg-[#020617] text-teal-400 font-bold">Revised Once</option>
                                <option value="Revised Twice" className="bg-[#020617] text-cyan-400 font-bold">Revised Twice</option>
                                <option value="Mastered" className="bg-[#020617] text-emerald-400 font-bold">Mastered</option>
                              </select>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="lg:col-span-3 p-12 text-center rounded-2xl border border-slate-850 bg-[#070d19]/10">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-xs font-semibold">Select a subject on the left panel to examine topics progress.</p>
          </div>
        )}
      </div>

    </div>
  );
}
