import type { AnalysisResponse, StoredReport } from '../types';

const LAST_REPORT_KEY = 'cloud-cost-last-report';

export function countScannedResources(resources: Record<string, unknown[]> = {}) {
  return Object.values(resources).reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
}

export function getIssuesCount(analysis: AnalysisResponse['analysis']) {
  if (Array.isArray(analysis.issues)) {
    return analysis.issues.length;
  }

  return Number(analysis.totalIssues || 0);
}

export function getSummaryText(summary: unknown, fallback = '') {
  if (typeof summary === 'string') {
    return summary;
  }

  if (summary && typeof summary === 'object') {
    const summaryObject = summary as Record<string, unknown>;
    const candidate =
      summaryObject.summary ||
      summaryObject.executiveSummary ||
      summaryObject.overview ||
      summaryObject.description ||
      summaryObject.message;

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
}

export function normalizeReport(payload: Partial<AnalysisResponse> & Record<string, unknown>): StoredReport {
  const savedReport = (payload.analysisResult as AnalysisResponse & Record<string, unknown>) || null;
  const sourceReport = savedReport || payload;
  const analysisResult = (sourceReport.analysis as AnalysisResponse['analysis']) || {};
  const resources = (sourceReport.resources as Record<string, unknown[]>) || (payload.resources as Record<string, unknown[]>) || {};

  const summary = getSummaryText(analysisResult.summary, getSummaryText(analysisResult.executiveSummary, String(sourceReport.summary || '')));

  return {
    analysisId: String(sourceReport.analysisId || payload.analysisId || payload.id || ''),
    region: String(sourceReport.region || payload.region || ''),
    resources,
    warnings: (sourceReport.warnings as string[]) || (payload.warnings as string[]) || [],
    analysis: analysisResult,
    resourcesScanned: Number(sourceReport.resourcesScanned || payload.resourcesScanned || countScannedResources(resources)),
    issuesFound: Number(sourceReport.issuesFound || payload.issuesFound || getIssuesCount(analysisResult)),
    estimatedMonthlySavings: String(sourceReport.estimatedMonthlySavings || payload.estimatedMonthlySavings || analysisResult.estimatedMonthlySavings || '$0'),
    estimatedAnnualSavings: String(sourceReport.estimatedAnnualSavings || payload.estimatedAnnualSavings || analysisResult.estimatedAnnualSavings || '$0'),
    healthScore: Number(sourceReport.healthScore || payload.healthScore || analysisResult.healthScore || 0),
    createdAt: String(sourceReport.createdAt || payload.createdAt || ''),
    summary,
    historyId: (sourceReport.historyId as string | null | undefined) || (payload.historyId as string | null | undefined) || null,
  };
}

export function saveLastReport(report: StoredReport) {
  localStorage.setItem(LAST_REPORT_KEY, JSON.stringify(report));
}

export function getLastReport() {
  const rawReport = localStorage.getItem(LAST_REPORT_KEY);

  if (!rawReport) {
    return null;
  }

  try {
    return JSON.parse(rawReport) as StoredReport;
  } catch {
    return null;
  }
}