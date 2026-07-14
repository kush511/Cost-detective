import { NavLink } from 'react-router-dom';

export function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-accent-500/15 text-accent-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950/60 px-4 py-6 lg:block">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Navigation</p>
        <div className="mt-4 space-y-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-panel-900 to-panel-950 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Live Engine</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Scans AWS resources with the CLI, streams live progress over Socket.io, and stores every completed analysis in PostgreSQL.
        </p>
      </div>
    </aside>
  );
}