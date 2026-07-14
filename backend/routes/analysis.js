const express = require('express');
const { randomUUID } = require('crypto');
const { analyzeInfrastructure, getHealthStatus, listAvailableRegions } = require('../services/awsScanner');
const { analyzeAwsResources } = require('../services/aiAnalyzer');
const { emitProgressStep } = require('../socket/socket');
const { saveAnalysis } = require('../services/historyService');

const router = express.Router();

const PROGRESS_STEPS = [
  { progress: 0, step: 'Starting analysis...' },
  { progress: 5, step: 'Checking AWS connection...' },
  { progress: 15, step: 'Scanning EC2 instances...' },
  { progress: 25, step: 'Scanning EBS volumes...' },
  { progress: 35, step: 'Scanning Elastic IPs and load balancers...' },
  { progress: 45, step: 'Scanning RDS databases...' },
  { progress: 55, step: 'Scanning Lambda functions...' },
  { progress: 65, step: 'Scanning VPCs...' },
  { progress: 75, step: 'Scanning CloudWatch alarms...' },
  { progress: 82, step: 'Scanning S3 buckets and IAM roles...' },
  { progress: 90, step: 'Preparing AI request...' },
  { progress: 95, step: 'Waiting for AI response...' },
  { progress: 98, step: 'Processing AI recommendations...' },
];

function countScannedResources(resources = {}) {
  return Object.values(resources).reduce((total, value) => {
    if (Array.isArray(value)) {
      return total + value.length;
    }

    return total;
  }, 0);
}

function getIssuesFound(analysis = {}) {
  if (Array.isArray(analysis.issues)) {
    return analysis.issues.length;
  }

  if (Array.isArray(analysis.findings)) {
    return analysis.findings.length;
  }

  return Number(analysis.totalIssues || analysis.issueCount || 0);
}

function normalizeHealthScore(analysis = {}) {
  const value = analysis.healthScore ?? analysis.overallInfrastructureHealthScore ?? analysis.overallHealthScore;
  const score = Number(value);

  return Number.isFinite(score) ? score : 0;
}

function getMonthlySavings(analysis = {}) {
  return analysis.estimatedMonthlySavings || analysis.monthlySavings || '$0';
}

function getAnnualSavings(analysis = {}) {
  return analysis.estimatedAnnualSavings || analysis.annualSavings || '$0';
}

function startProgressEmitter(analysisId) {
  let index = 0;

  emitProgressStep(analysisId, PROGRESS_STEPS[0].step, PROGRESS_STEPS[0].progress);

  const timer = setInterval(() => {
    const nextStep = PROGRESS_STEPS[index + 1];
    if (!nextStep) {
      emitProgressStep(analysisId, 'Finalizing report...', 99);
      clearInterval(timer);
      return;
    }

    index += 1;
    emitProgressStep(analysisId, nextStep.step, nextStep.progress);
  }, 1500);

  return () => clearInterval(timer);
}

router.get('/health', async (req, res) => {
  try {
    const result = await getHealthStatus();
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify AWS connectivity.',
    });
  }
});

router.get('/regions', async (req, res) => {
  try {
    const regions = await listAvailableRegions();
    return res.status(200).json(regions);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load AWS regions.',
    });
  }
});

router.post('/analyze', async (req, res) => {
  const analysisId = randomUUID();
  const stopProgress = startProgressEmitter(analysisId);

  try {
    const region = typeof req.body?.region === 'string' ? req.body.region.trim() : '';

    if (!region) {
      stopProgress();
      emitProgressStep(analysisId, 'Region is required.', 0);
      return res.status(400).json({
        success: false,
        message: 'Region is required.',
      });
    }

    const result = await analyzeInfrastructure(region);
    if (result.statusCode !== 200) {
      stopProgress();
      emitProgressStep(analysisId, 'Analysis failed.', 0);
      return res.status(result.statusCode).json(result.body);
    }

    const aiResult = await analyzeAwsResources(result.body);

    if (!aiResult.success) {
      stopProgress();
      emitProgressStep(analysisId, 'AI analysis failed.', 0);
      return res.status(aiResult.statusCode || 502).json({
        success: false,
        message: aiResult.message || 'Failed to analyze AWS resources.',
      });
    }

    const finalReport = {
      analysisId,
      region: result.body.region,
      resources: result.body.resources,
      warnings: result.body.warnings || [],
      analysis: aiResult.analysis,
    };

    emitProgressStep(analysisId, 'Saving report...', 99);

    let savedAnalysis = null;
    try {
      savedAnalysis = await saveAnalysis({
        id: analysisId,
        region: finalReport.region,
        resourcesScanned: countScannedResources(finalReport.resources),
        issuesFound: getIssuesFound(finalReport.analysis),
        estimatedMonthlySavings: getMonthlySavings(finalReport.analysis),
        estimatedAnnualSavings: getAnnualSavings(finalReport.analysis),
        healthScore: normalizeHealthScore(finalReport.analysis),
        analysisResult: finalReport,
      });
    } catch (storageError) {
      console.error('Failed to save analysis report:', storageError);
    }

    stopProgress();
    emitProgressStep(analysisId, 'Analysis complete.', 100);

    return res.status(200).json({
      success: true,
      analysisId,
      historyId: savedAnalysis?.id || null,
      ...finalReport,
    });
  } catch (error) {
    stopProgress();
    console.error('Failed to analyze AWS infrastructure:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze AWS infrastructure.',
    });
  }
});

module.exports = router;