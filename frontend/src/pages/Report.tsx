import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnalysisCard } from '../components/AnalysisCard';
import { IssueCard } from '../components/IssueCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { api, getApiErrorMessage } from '../services/api';
import { getLastReport, getSummaryText, normalizeReport } from '../utils/report';
import type { StoredReport } from '../types';

export function Report() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [report, setReport] = useState<StoredReport | null>((location.state as { report?: StoredReport } | null)?.report || getLastReport());
  const [loading, setLoading] = useState(Boolean(params.id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) {
      return;
    }

    let active = true;

    async function loadReport() {
      try {
        const response = await api.get(`/history/${params.id}`);
        const normalizedReport = normalizeReport(response.data);

        if (active) {
          setReport(normalizedReport);
        }
      } catch (loadError) {
        if (active) {
          setError(getApiErrorMessage(loadError, 'Unable to load report.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#16283f_0%,#07111f_45%,#02050b_100%)] text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-glow">
            <LoadingSpinner label="Loading report..." />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#16283f_0%,#07111f_45%,#02050b_100%)] text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center shadow-glow">
            <p className="text-slate-300">No report available.</p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-6 rounded-2xl bg-accent-500 px-5 py-3 font-semibold text-slate-950"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const issues = report.analysis.issues || [];
  const summary = getSummaryText(
    report.analysis.summary,
    getSummaryText(report.analysis.executiveSummary, report.summary || 'Analysis complete.')
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#16283f_0%,#07111f_45%,#02050b_100%)] text-white">
      <Navbar />

      <div className="mx-auto flex max-w-7xl gap-0 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />

        <main className="flex-1 space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-accent-500">Optimization report</p>
                <h2 className="mt-3 text-3xl font-semibold">{report.region}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{summary}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-accent-500 hover:text-accent-500"
              >
                View History
              </button>
            </div>
          </section>

          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <AnalysisCard title="Health Score" value={report.healthScore} tone="accent" />
            <AnalysisCard title="Monthly Savings" value={report.estimatedMonthlySavings} tone="gold" />
            <AnalysisCard title="Annual Savings" value={report.estimatedAnnualSavings} />
            <AnalysisCard title="Resources Scanned" value={report.resourcesScanned} />
            <AnalysisCard title="Issues Found" value={report.issuesFound} />
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Report details</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">AI recommendations</h3>
              </div>
              <p className="text-sm text-slate-400">{report.warnings?.length ? `${report.warnings.length} scan warnings` : 'No scan warnings'}</p>
            </div>

            {!issues.length ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">No optimization opportunities found.</div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <IssueCard key={`${issue.resourceName || issue.issue || 'issue'}-${index}`} issue={issue} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}