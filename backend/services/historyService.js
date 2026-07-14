const { randomUUID } = require('crypto');
const { query } = require('../database/db');

function normalizeAnalysisRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    region: row.region,
    resourcesScanned: row.resources_scanned,
    issuesFound: row.issues_found,
    estimatedMonthlySavings: row.estimated_monthly_savings,
    estimatedAnnualSavings: row.estimated_annual_savings,
    healthScore: row.health_score,
    createdAt: row.created_at,
    analysisResult: row.analysis_result,
  };
}

async function saveAnalysis(record) {
  async function insertAnalysis(id) {
    const result = await query(
      `
        INSERT INTO analyses (
          id,
          user_id,
          region,
          resources_scanned,
          issues_found,
          estimated_monthly_savings,
          estimated_annual_savings,
          health_score,
          analysis_result
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING *
      `,
      [
        id,
        record.userId,
        record.region,
        record.resourcesScanned,
        record.issuesFound,
        record.estimatedMonthlySavings,
        record.estimatedAnnualSavings,
        record.healthScore,
        JSON.stringify(record.analysisResult),
      ]
    );

    return normalizeAnalysisRow(result.rows[0]);
  }

  try {
    return await insertAnalysis(record.id || randomUUID());
  } catch (error) {
    if (error?.code === '23505') {
      return insertAnalysis(randomUUID());
    }

    throw error;
  }
}

async function getAnalysisHistory(userId) {
  const result = await query(
    `
      SELECT
        id,
        user_id,
        region,
        resources_scanned,
        issues_found,
        estimated_monthly_savings,
        estimated_annual_savings,
        health_score,
        created_at
      FROM analyses
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    region: row.region,
    resourcesScanned: row.resources_scanned,
    issuesFound: row.issues_found,
    estimatedMonthlySavings: row.estimated_monthly_savings,
    estimatedAnnualSavings: row.estimated_annual_savings,
    healthScore: row.health_score,
    createdAt: row.created_at,
  }));
}

async function getAnalysisById(id) {
  const result = await query(
    `
      SELECT
        id,
        user_id,
        region,
        resources_scanned,
        issues_found,
        estimated_monthly_savings,
        estimated_annual_savings,
        health_score,
        analysis_result,
        created_at
      FROM analyses
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return normalizeAnalysisRow(result.rows[0]);
}

module.exports = {
  saveAnalysis,
  getAnalysisHistory,
  getAnalysisById,
};