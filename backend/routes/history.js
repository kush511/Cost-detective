const express = require('express');
const { getAnalysisById, getAnalysisHistory } = require('../services/historyService');

const router = express.Router();

router.get('/history', async (req, res) => {
  try {
    const history = await getAnalysisHistory();
    return res.status(200).json(history);
  } catch (error) {
    console.error('Failed to fetch analysis history:', error);
    return res.status(503).json({
      success: false,
      message: 'Failed to fetch analysis history.',
    });
  }
});

router.get('/history/:id', async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found.',
      });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Failed to fetch analysis by ID:', error);
    return res.status(503).json({
      success: false,
      message: 'Failed to fetch analysis by ID.',
    });
  }
});

module.exports = router;