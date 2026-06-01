'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { GATE_CSE_SYLLABUS } from '@gate-warroom/shared';
import { ArrowRight, ArrowLeft, Check, Compass, ShieldAlert, Sparkles, Award } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [college, setCollege] = useState('');
  const [currentYear, setCurrentYear] = useState(3);
  const [graduationYear, setGraduationYear] = useState(2027);

  const [targetRank, setTargetRank] = useState(100);
  const [targetScore, setTargetScore] = useState(850);
  const [currentPreparationLevel, setCurrentPreparationLevel] = useState('Just Started');
  const [dailyStudyTarget, setDailyStudyTarget] = useState(6.0);

  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);

  const [coachingResources, setCoachingResources] = useState<string[]>([]);
  const [mockPlatforms, setMockPlatforms] = useState<string[]>([]);

  // Calculation Results
  const [results, setResults] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    } else {
      router.push('/auth');
    }
  }, [router]);

  const subjectList = GATE_CSE_SYLLABUS.map((s) => s.name);

  const toggleStrong = (subject: string) => {
    if (strongSubjects.includes(subject)) {
      setStrongSubjects(strongSubjects.filter((s) => s !== subject));
    } else {
      setStrongSubjects([...strongSubjects, subject]);
      setWeakSubjects(weakSubjects.filter((s) => s !== subject)); // mutual exclusivity
    }
  };

  const toggleWeak = (subject: string) => {
    if (weakSubjects.includes(subject)) {
      setWeakSubjects(weakSubjects.filter((s) => s !== subject));
    } else {
      setWeakSubjects([...weakSubjects, subject]);
      setStrongSubjects(strongSubjects.filter((s) => s !== subject)); // mutual exclusivity
    }
  };

  const toggleResource = (resource: string) => {
    if (coachingResources.includes(resource)) {
      setCoachingResources(coachingResources.filter((r) => r !== resource));
    } else {
      setCoachingResources([...coachingResources, resource]);
    }
  };

  const toggleMock = (platform: string) => {
    if (mockPlatforms.includes(platform)) {
      setMockPlatforms(mockPlatforms.filter((p) => p !== platform));
    } else {
      setMockPlatforms([...mockPlatforms, platform]);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const payload = {
        name: user.name,
        email: user.email,
        college,
        graduationYear: Number(graduationYear),
        currentYear: Number(currentYear),
        targetRank: Number(targetRank),
        targetScore: Number(targetScore),
        currentPreparationLevel,
        strongSubjects,
        weakSubjects,
        dailyStudyTarget: Number(dailyStudyTarget),
        coachingResources,
        mockPlatforms,
      };

      const result = await api.post('/users/onboarding', payload);
      setResults(result);

      // Update user cache in localStorage to marked as onboarded
      const updatedUser = { ...user, isOnboarded: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setStep(5); // Go to results screen
    } catch (err) {
      alert('Onboarding submission failed. Check server connection.');
    } finally {
      setCalculating(false);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl glass-card rounded-2xl p-8 border-slate-800/80 shadow-2xl relative z-10">
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-1 mb-8 overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* STEP 1: ACADEMICS */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Academic Profile</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Let's coordinate where you are currently starting from.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Undergrad College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Bombay / DTU / Self Study"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Year of Study</label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-semibold"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year (Final)</option>
                    <option value={5}>Passout / Drop</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!college}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white cursor-pointer text-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TARGETS */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">GATE Targets</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Specify your target goals and consistency baselines.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Rank (AIR)</label>
                  <input
                    type="number"
                    min={1}
                    value={targetRank}
                    onChange={(e) => setTargetRank(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Score (/1000)</label>
                  <input
                    type="number"
                    min={100}
                    max={1000}
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Preparation Level</label>
                <select
                  value={currentPreparationLevel}
                  onChange={(e) => setCurrentPreparationLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-semibold"
                >
                  <option value="Not Started">Not Started (0% complete)</option>
                  <option value="Just Started">Just Started (10-30% complete)</option>
                  <option value="Halfway">Halfway Done (40-60% complete)</option>
                  <option value="Revision Phase">Revision Phase (70-90% complete)</option>
                  <option value="Ready">Complete & Ready (Mocking Phase)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daily Available Study Time: <span className="text-indigo-400 font-extrabold">{dailyStudyTarget} Hours</span>
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
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>1 Hr (Amateur)</span>
                  <span>6 Hrs (Standard)</span>
                  <span>12 Hrs (Beast)</span>
                  <span>16 Hrs (Machine)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-slate-950/80 border border-slate-850 hover:bg-slate-900 text-slate-400 cursor-pointer text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer text-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBJECT SELECTION */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Subject Diagnostic</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Select your strongest and weakest subjects from the GATE syllabus.</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-2">GATE Subject Name</th>
                    <th className="py-2 text-center w-24">Strong 💪</th>
                    <th className="py-2 text-center w-24">Weak ⚠️</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-semibold text-slate-300">
                  {subjectList.map((subject) => {
                    const isStrong = strongSubjects.includes(subject);
                    const isWeak = weakSubjects.includes(subject);
                    return (
                      <tr key={subject} className="hover:bg-slate-950/30 transition-colors">
                        <td className="py-3 font-bold text-sm text-slate-200">{subject}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleStrong(subject)}
                            className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition-colors cursor-pointer ${
                              isStrong ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-800 hover:border-emerald-500'
                            }`}
                          >
                            {isStrong && <Check className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleWeak(subject)}
                            className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition-colors cursor-pointer ${
                              isWeak ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-800 hover:border-rose-500'
                            }`}
                          >
                            {isWeak && <Check className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-slate-950/80 border border-slate-850 hover:bg-slate-900 text-slate-400 cursor-pointer text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer text-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESOURCES */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Study Resources</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Select the tools and resources you are leveraging.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Coaching Resources / Materials</label>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                  {['MadeEasy', 'Ace Academy', 'GO Classes', 'Unacademy', 'Standard Textbooks', 'Self Study YouTube'].map((res) => {
                    const selected = coachingResources.includes(res);
                    return (
                      <button
                        key={res}
                        onClick={() => toggleResource(res)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          selected ? 'bg-indigo-950/30 border-indigo-500 text-indigo-400 font-extrabold' : 'border-slate-800 bg-slate-950/40 text-slate-400'
                        }`}
                      >
                        {res}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mock Test Series Platforms</label>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                  {['MadeEasy Mocks', 'Ace Mocks', 'GATE Overflow (TIFR/GATE)', 'Testbook', 'PhysicsWallah'].map((plat) => {
                    const selected = mockPlatforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        onClick={() => toggleMock(plat)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          selected ? 'bg-indigo-950/30 border-indigo-500 text-indigo-400 font-extrabold' : 'border-slate-800 bg-slate-950/40 text-slate-400'
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-slate-950/80 border border-slate-850 hover:bg-slate-900 text-slate-400 cursor-pointer text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer text-sm shadow-xl shadow-emerald-600/20 active:translate-y-[1px] transition-all"
              >
                {calculating ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Generate Diagnosis & Enlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ONBOARDING RESULTS (DIAGNOSIS & ROADMAP) */}
        {step === 5 && results && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-black text-white">Diagnosis Complete</h2>
            </div>

            {/* Score & Rank Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Readiness Score</span>
                <span className="text-3xl font-black text-indigo-400">{results.readinessScore}/100</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Estimated AIR Range</span>
                <span className="text-2xl font-black text-amber-400">
                  {results.estimatedRankMin} - {results.estimatedRankMax}
                </span>
              </div>
            </div>

            {/* Preparation Gap Analysis */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-xs font-semibold leading-relaxed flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-200 mb-1">Preparation Gap Analysis</h4>
                <p className="text-slate-400">{results.preparationGapAnalysis}</p>
              </div>
            </div>

            {/* 90-Day Roadmap Carousel */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Personalized 90-Day Study Roadmap
              </h4>

              <div className="space-y-3">
                {results.roadmap90Days.map((phase: any, index: number) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-900 bg-slate-950/50 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-indigo-400">{phase.phase}</span>
                      <span className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded">
                        {phase.duration}
                      </span>
                    </div>
                    <p className="text-slate-300 font-extrabold mb-2 text-sm">{phase.focus}</p>
                    <ul className="space-y-1 text-slate-400 list-disc list-inside">
                      {phase.milestones.map((ms: string, mi: number) => (
                        <li key={mi}>{ms}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleFinish}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer text-sm shadow-xl shadow-indigo-600/30 transition-all active:translate-y-[1px]"
              >
                <span>Enter the War Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
