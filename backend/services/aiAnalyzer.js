const axios = require('axios');

const REQUEST_TIMEOUT_MS = 120000;

function getInceptionConfig() {
  return {
    apiUrl: process.env.INCEPTION_API_URL || 'https://api.inceptionlabs.ai/v1/chat/completions',
    model: process.env.INCEPTION_MODEL || 'default',
    apiKey: process.env.INCEPTION_API_KEY || '',
  };
}

function buildAnalysisPrompt() {
  return [
    'You are an experienced AWS Cloud Architect and FinOps Engineer.',
    '',
    'Analyze the provided AWS infrastructure.',
    '',
    'Your job is to identify:',
    '- Over-provisioned resources',
    '- Idle resources',
    '- Underutilized resources',
    '- Cost optimization opportunities',
    '- Wrong instance types',
    '- Storage optimization opportunities',
    '- Networking inefficiencies',
    '- Security risks that may increase costs',
    '- Missing monitoring',
    '- Missing backups',
    '- Missing Auto Scaling',
    '- Publicly exposed resources',
    '- Unused Elastic IPs',
    '- Unattached EBS volumes',
    '- Idle Load Balancers',
    '- Expensive RDS configurations',
    '- Lambda optimization opportunities',
    '- S3 optimization opportunities',
    '',
    'For every issue provide:',
    '- Resource Name',
    '- AWS Service',
    '- Severity (High / Medium / Low)',
    '- Description',
    '- Why it matters',
    '- Estimated monthly savings',
    '- AWS CLI command to fix it',
    '- Best practice recommendation',
    '',
    'Finally provide:',
    '- Executive Summary',
    '- Total Issues',
    '- Estimated Monthly Savings',
    '- Estimated Annual Savings',
    '- Overall Infrastructure Health Score (0-100)',
    '',
    'Respond ONLY as valid JSON.',
    'Do not include markdown.',
    'Do not include explanations outside JSON.',
  ].join('\n');
}

function buildMessages(scanData) {
  return [
    {
      role: 'system',
      content: buildAnalysisPrompt(),
    },
    {
      role: 'user',
      content: `AWS infrastructure scan result:\n${JSON.stringify(scanData, null, 2)}`,
    },
  ];
}

function extractJsonString(content) {
  if (typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const firstObject = trimmed.indexOf('{');
  const lastObject = trimmed.lastIndexOf('}');
  if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1);
  }

  const firstArray = trimmed.indexOf('[');
  const lastArray = trimmed.lastIndexOf(']');
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    return trimmed.slice(firstArray, lastArray + 1);
  }

  return null;
}

function parseAiResponseContent(content) {
  if (content && typeof content === 'object') {
    return content;
  }

  if (typeof content !== 'string') {
    throw new Error('Empty AI response.');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Empty AI response.');
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const extractedJson = extractJsonString(trimmed);
    if (!extractedJson) {
      throw new Error('Failed to parse AI response.');
    }

    try {
      return JSON.parse(extractedJson);
    } catch (parseError) {
      throw new Error('Failed to parse AI response.');
    }
  }
}

function getInceptionErrorDetails(error) {
  const { apiKey } = getInceptionConfig();
  const status = error?.response?.status;
  const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Inception API request failed.';
  const normalizedMessage = String(message).toLowerCase();

  if (!apiKey) {
    return { statusCode: 401, message: 'Inception API key is missing.' };
  }

  if (error?.code === 'ECONNABORTED' || normalizedMessage.includes('timeout')) {
    return { statusCode: 504, message: 'Inception API request timed out.' };
  }

  if (status === 401 || normalizedMessage.includes('unauthorized') || normalizedMessage.includes('invalid api key')) {
    return { statusCode: 401, message: 'Invalid Inception API key.' };
  }

  if (status === 429 || normalizedMessage.includes('rate limit')) {
    return { statusCode: 429, message: 'Inception API rate limit exceeded.' };
  }

  if (status >= 500) {
    return { statusCode: 502, message: 'Inception API is currently unavailable.' };
  }

  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.code === 'EAI_AGAIN') {
    return { statusCode: 502, message: 'Network failure while calling Inception API.' };
  }

  return { statusCode: status || 502, message };
}

async function callInceptionApi(scanData) {
  const { apiUrl, model, apiKey } = getInceptionConfig();

  if (!apiKey) {
    return {
      success: false,
      statusCode: 401,
      message: 'Inception API key is missing.',
    };
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        model,
        temperature: 0.2,
        max_tokens: 4000,
        messages: buildMessages(scanData),
      },
      {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const messageContent = response?.data?.choices?.[0]?.message?.content || response?.data?.output_text || response?.data?.content;
    if (!messageContent) {
      return {
        success: false,
        statusCode: 502,
        message: 'Empty AI response.',
      };
    }

    const parsed = parseAiResponseContent(messageContent);
    return {
      success: true,
      analysis: parsed,
    };
  } catch (error) {
    const details = getInceptionErrorDetails(error);
    return {
      success: false,
      statusCode: details.statusCode,
      message: details.message,
    };
  }
}

async function analyzeAwsResources(scanData) {
  try {
    const aiResult = await callInceptionApi(scanData);

    if (!aiResult.success) {
      return aiResult;
    }

    return {
      success: true,
      analysis: aiResult.analysis,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 502,
      message: 'Failed to analyze AWS resources with Inception API.',
    };
  }
}

module.exports = {
  analyzeAwsResources,
  callInceptionApi,
  buildAnalysisPrompt,
};