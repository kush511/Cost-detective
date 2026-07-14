const express = require('express');
const { analyzeInfrastructure, getHealthStatus, listAvailableRegions } = require('../services/awsScanner');
const { analyzeAwsResources } = require('../services/aiAnalyzer');

const router = express.Router();

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
  try {
    const region = typeof req.body?.region === 'string' ? req.body.region.trim() : '';

    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'Region is required.',
      });
    }

    const result = await analyzeInfrastructure(region);
    if (result.statusCode !== 200) {
      return res.status(result.statusCode).json(result.body);
    }

    const aiResult = await analyzeAwsResources(result.body);

    if (!aiResult.success) {
      return res.status(aiResult.statusCode || 502).json({
        success: false,
        message: aiResult.message || 'Failed to analyze AWS resources.',
      });
    }

    return res.status(200).json({
      success: true,
      region: result.body.region,
      resources: result.body.resources,
      warnings: result.body.warnings || [],
      analysis: aiResult.analysis,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze AWS infrastructure.',
    });
  }
});

module.exports = router;