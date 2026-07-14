interface AnalysisCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'accent' | 'gold';
}

const toneClasses = {
  default: 'from-slate-900 to-slate-800 border-slate-800',
  accent: 'from-emerald-950/70 to-slate-900 border-emerald-500/20',
  gold: 'from-amber-950/70 to-slate-900 border-amber-500/20',
};

export function AnalysisCard({ title, value, subtitle, tone = 'default' }: AnalysisCardProps) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-glow ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}