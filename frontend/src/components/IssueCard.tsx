import { useState } from 'react';
import type { AnalysisIssue } from '../types';

const severityStyles: Record<string, string> = {
  High: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
};

export function IssueCard({ issue }: { issue: AnalysisIssue }) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    if (!issue.fixCommand) {
      return;
    }

    await navigator.clipboard.writeText(issue.fixCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow transition hover:border-slate-700">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{issue.service || 'AWS Service'}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{issue.issue || 'Optimization issue'}</h3>
        </div>
        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[issue.severity || 'Low'] || severityStyles.Low}`}>
          {issue.severity || 'Low'}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Resource</p>
          <p className="mt-1 text-sm text-slate-200">{issue.resourceName || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estimated Savings</p>
          <p className="mt-1 text-sm text-accent-500">{issue.estimatedSavings || '$0/month'}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{issue.description || issue.reason || 'No description provided.'}</p>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recommendation</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{issue.recommendation || 'No recommendation provided.'}</p>
      </div>

      {issue.fixCommand ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AWS CLI Fix Command</p>
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:flex-row md:items-center md:justify-between">
            <code className="break-all text-xs text-slate-200">{issue.fixCommand}</code>
            <button
              type="button"
              onClick={copyCommand}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-accent-500 hover:text-accent-500"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}