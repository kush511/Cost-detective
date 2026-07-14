interface ProgressTrackerProps {
  progress: number;
  currentStep: string;
  connected?: boolean;
}

const steps = [
  'Connected to AWS',
  'Scanning EC2',
  'Scanning EBS',
  'Scanning RDS',
  'Running AI Analysis',
  'Saving Report',
  'Completed',
];

export function ProgressTracker({ progress, currentStep, connected = true }: ProgressTrackerProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Live Progress</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{currentStep}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
          {connected ? 'Socket Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-500 via-cyan-400 to-gold-400 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {steps.map((label, index) => {
          const threshold = (index / (steps.length - 1)) * 100;
          const done = progress >= threshold;
          const active = currentStep.toLowerCase().includes(label.toLowerCase().replace(' running ai analysis', '').replace(' saving report', '').replace(' completed', ''));

          return (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${done ? 'border-accent-500/30 bg-accent-500/10' : 'border-slate-800 bg-slate-950/60'} ${active ? 'ring-1 ring-accent-500/40' : ''}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-accent-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {done ? '✓' : index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-100">{label}</p>
                <p className="text-xs text-slate-500">{done ? 'Completed' : 'Pending'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}