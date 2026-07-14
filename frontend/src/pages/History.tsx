import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisCard } from '../components/AnalysisCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { api, getApiErrorMessage } from '../services/api';
import type { HistoryEntry } from '../types';

export function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const response = await api.get<HistoryEntry[]>('/history');

        if (!active) {
          return;
        }

        setItems(response.data);
      } catch (loadError) {
        if (active) {
          setError(getApiErrorMessage(loadError, 'Unable to load history.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#16283f_0%,#07111f_45%,#02050b_100%)] text-white">
      <Navbar />

      <div className="mx-auto flex max-w-7xl gap-0 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />

        <main className="flex-1 space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.34em] text-accent-500">Saved reports</p>
            <h2 className="mt-3 text-3xl font-semibold">Analysis history</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Review previous AWS cost optimization reports stored for your account.</p>
          </section>

          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow">
              <LoadingSpinner label="Loading history..." />
            </div>
          ) : null}

          {!loading && !items.length ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-400 shadow-glow">
              No analyses yet.
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/history/${item.id}`)}
                className="text-left"
              >
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-glow transition hover:-translate-y-0.5 hover:border-accent-500/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{item.region}</h3>
                    </div>
                    <span className="rounded-full bg-accent-500/15 px-3 py-1 text-xs font-semibold text-accent-500">
                      Health {item.healthScore}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <AnalysisCard title="Resources" value={item.resourcesScanned} />
                    <AnalysisCard title="Issues" value={item.issuesFound} />
                    <AnalysisCard title="Monthly Savings" value={item.estimatedMonthlySavings} />
                    <AnalysisCard title="Annual Savings" value={item.estimatedAnnualSavings} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}