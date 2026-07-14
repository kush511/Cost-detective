import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisCard } from '../components/AnalysisCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Navbar } from '../components/Navbar';
import { ProgressTracker } from '../components/ProgressTracker';
import { Sidebar } from '../components/Sidebar';
import { api, getApiErrorMessage } from '../services/api';
import { subscribeToProgress } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { normalizeReport, saveLastReport } from '../utils/report';
import type { ProgressUpdate } from '../types';

interface RegionItem {
  name: string;
  description: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [region, setRegion] = useState('');
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<ProgressUpdate>({ analysisId: '', step: 'Ready to begin analysis', progress: 0 });
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRegions() {
      try {
        const response = await api.get<RegionItem[]>('/regions');

        if (!active) {
          return;
        }

        setRegions(response.data);
        setRegion((currentRegion) => currentRegion || response.data[0]?.name || '');
      } catch (loadError) {
        if (active) {
          setError(getApiErrorMessage(loadError, 'Unable to load AWS regions.'));
        }
      } finally {
        if (active) {
          setLoadingRegions(false);
        }
      }
    }

    loadRegions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSocketConnected(true);
    const cleanup = subscribeToProgress((update) => {
      setProgress(update);
    });

    return () => {
      setSocketConnected(false);
      cleanup();
    };
  }, []);

  async function handleAnalyze() {
    if (!region) {
      setError('Please select a region first.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/analyze', { region });
      const normalizedReport = normalizeReport(response.data);
      saveLastReport(normalizedReport);
      navigate('/report', { state: { report: normalizedReport } });
    } catch (analysisError) {
      setError(getApiErrorMessage(analysisError, 'Analysis failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#16283f_0%,#07111f_45%,#02050b_100%)] text-white">
      <Navbar />

      <div className="mx-auto flex max-w-7xl gap-0 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />

        <main className="flex-1 space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.34em] text-accent-500">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold">{user?.email ? `Analyze AWS costs for ${user.email}` : 'Analyze your AWS costs'}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Select a region, run the AWS CLI scan, and review AI-powered optimization recommendations with live progress updates.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-glow backdrop-blur-xl">
              <h3 className="text-xl font-semibold text-white">Start a new analysis</h3>
              <p className="mt-2 text-sm text-slate-400">Scan EC2, EBS, RDS, Lambda, S3, IAM, VPC, CloudWatch, load balancers, and Elastic IPs.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300" htmlFor="region">
                    AWS Region
                  </label>
                  <select
                    id="region"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-accent-500"
                  >
                    {loadingRegions ? <option>Loading regions...</option> : null}
                    {!loadingRegions && !regions.length ? <option>No regions available</option> : null}
                    {regions.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name} - {item.description}
                      </option>
                    ))}
                  </select>
                </div>

                {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={submitting || loadingRegions || !region}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-500 via-cyan-400 to-gold-400 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Running analysis...' : 'Run Analysis'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <AnalysisCard title="AWS Profile" value={user?.email || 'Signed In'} subtitle="JWT-secured session" tone="accent" />
              <AnalysisCard title="Socket Status" value={socketConnected ? 'Connected' : 'Offline'} subtitle="Live progress stream" tone="gold" />
            </div>
          </section>

          <ProgressTracker progress={progress.progress} currentStep={progress.step} connected={socketConnected} />

          <section className="grid gap-6 md:grid-cols-3">
            <AnalysisCard title="Current Region" value={region || 'Not selected'} subtitle="Select a region before running analysis" />
            <AnalysisCard title="Scan Mode" value="AWS CLI" subtitle="No AWS SDK used" />
            <AnalysisCard title="Storage" value="PostgreSQL" subtitle="History retained per user" />
          </section>
        </main>
      </div>
    </div>
  );
}