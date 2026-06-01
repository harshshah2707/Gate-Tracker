'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Animated pulse icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-indigo-900/50 border border-indigo-500/40">
            <svg
              className="w-10 h-10 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">You&apos;re Offline</h1>
        <p className="text-slate-400 text-lg mb-2">
          GATE WARROOM needs internet to sync your progress.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Your data is safe. Reconnect to continue your streak and upload any pending sessions.
        </p>

        {/* Motivational box */}
        <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-6 mb-8">
          <p className="text-indigo-300 font-semibold text-sm uppercase tracking-widest mb-2">
            While you wait
          </p>
          <p className="text-white text-base leading-relaxed">
            The rankers don&apos;t stop when the wifi does. Use this time to review your notes, 
            solve problems on paper, or plan your next study block.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
