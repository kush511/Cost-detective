export interface User {
  id: number;
  email: string;
}

export interface AnalysisIssue {
  resourceName?: string;
  service?: string;
  severity?: 'High' | 'Medium' | 'Low' | string;
  issue?: string;
  description?: string;
  reason?: string;
  estimatedSavings?: string;
  fixCommand?: string;
  recommendation?: string;
}

export interface AnalysisSummary {
  summary?: string;
  executiveSummary?: string;
  healthScore?: number;
  estimatedMonthlySavings?: string;
  estimatedAnnualSavings?: string;
  totalIssues?: number;
  issues?: AnalysisIssue[];
}

export interface AnalysisResponse {
  analysisId?: string;
  region: string;
  resources: Record<string, unknown[]>;
  warnings?: string[];
  analysis: AnalysisSummary;
  resourcesScanned?: number;
  issuesFound?: number;
  estimatedMonthlySavings?: string;
  estimatedAnnualSavings?: string;
  healthScore?: number;
  createdAt?: string;
  historyId?: string | null;
}

export interface HistoryEntry {
  id: string;
  region: string;
  resourcesScanned: number;
  issuesFound: number;
  estimatedMonthlySavings: string;
  estimatedAnnualSavings: string;
  healthScore: number;
  createdAt: string;
}

export interface StoredReport extends AnalysisResponse {
  analysisId: string;
  region: string;
  resources: Record<string, unknown[]>;
  warnings: string[];
  analysis: AnalysisSummary;
  resourcesScanned: number;
  issuesFound: number;
  estimatedMonthlySavings: string;
  estimatedAnnualSavings: string;
  healthScore: number;
  createdAt: string;
  summary: string;
  historyId: string | null;
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface ProgressUpdate {
  analysisId: string;
  step: string;
  progress: number;
}