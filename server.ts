import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '1mb' }));

// Initialize Google GenAI client securely on the server
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Health Check
app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    aiConfigured: hasKey,
    timestamp: new Date().toISOString(),
  });
});

// Helper to determine risk category from numerical score
function computeRiskCategory(score: number): string {
  if (score >= 75) return 'Very high risk';
  if (score >= 50) return 'High risk';
  if (score >= 25) return 'Some warning signs';
  return 'Low detected risk';
}

function computeRiskLevel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

// API Scam Analysis Endpoint
app.post('/api/analyze-scam', async (req, res) => {
  try {
    const { message, channel, additionalNotes } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Please provide a message, SMS, email, or situation description to analyze.',
      });
    }

    if (message.length > 6000) {
      return res.status(400).json({
        error: 'Message is too long. Please shorten to under 6,000 characters.',
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please verify your GEMINI_API_KEY in the Secrets settings.',
      });
    }

    const channelInfo = channel ? `Source: ${channel}` : 'Source: General';
    const notesInfo = additionalNotes ? `Additional Context: ${additionalNotes}` : '';

    const systemInstruction = `You are a real-world Indian digital payment security expert protecting people from UPI, bank, and online payment fraud across India (Google Pay, PhonePe, Paytm, BHIM, NetBanking, SMS, WhatsApp).

CORE PRINCIPLE — CHANNEL INDEPENDENCE:
You MUST evaluate the message content consistently. The selected channel (SMS, WhatsApp, Email, Phone Call, QR Code, Other) must NEVER flip the verdict or risk score of identical text.
- If a message asks to click an unverified link, download an APK, call a mobile number, scan a QR code to receive money, or pay urgent fees, it is a HIGH-RISK SCAM (75-95%) whether received on SMS, WhatsApp, Email, or Other.
- Do NOT assume a message is a safe bank alert (5% risk) just because the channel is 'SMS'. Fraudsters send millions of fake SMS messages every day.
- Genuine bank alerts have NO external download links, NO requests to call personal mobile numbers, NO promises of unexpected lotteries or refunds, and standard masked account numbers.

WRITING STYLE — SOUND HUMAN, NOT LIKE AN AI:
- Talk like a friendly, experienced banking security officer speaking directly to an everyday user.
- NEVER sound like a robotic AI assistant. NEVER use machine-like phrases like "This communication exhibits critical markers of digital financial fraud", "As an AI model", "heuristic threat evaluation", or "adversarial prompt injection".
- Write clear, punchy, simple explanations that any person can immediately understand and act upon.
- Give practical next steps: exactly what to click, what not to click, and who to call.

EVALUATION RULES:
1. Context over keywords:
   - Genuine bank alerts (standard debits/credits with masked numbers and official dispute shortcodes like "SMS BLOCK to 5676712") are LIKELY LEGITIMATE (Risk Score: 0-15).
   - Genuine OTP messages with standard warnings ("Do not share OTP with anyone") are LIKELY LEGITIMATE (Risk Score: 0-15).
   - Casual chats between friends ("Hey bro UPI me 400 for lunch") are LIKELY LEGITIMATE (Risk Score: 0-20).
   - Fake credits, unrequested refunds, fake lotteries, and messages with personal contact numbers or unverified links are LIKELY SCAM (Risk Score: 75-100).

2. Critical scam traps:
   - Scanning QR code or typing UPI PIN to receive money (Inversion scam — PIN is ONLY for paying).
   - Threats of account blockage / power cut / parcel return with links or mobile numbers.
   - Demands to install AnyDesk, TeamViewer, RustDesk, or .apk files.
   - Fake customer care or bank manager asking for OTP or CVV.

3. Risk Score Scale (0 to 100):
   - 0–24: "Low detected risk"
   - 25–49: "Some warning signs"
   - 50–74: "High risk"
   - 75–100: "Very high risk"

4. Verdicts (Must be exactly one):
   - "LIKELY SCAM"
   - "SUSPICIOUS"
   - "LIKELY LEGITIMATE"
   - "UNCERTAIN"

5. Exact Suspicious Phrases:
   - Extract the exact short phrases from the text that indicate danger (e.g. ["account blocked today", "http://sbi-kyc.apk", "scan QR to receive"]). Return empty array if legitimate.`;

    const contents = `Check this message for payment or banking fraud:

${channelInfo}
${notesInfo}

Message content to check:
"""
${message}
"""`;

    const generateWithRetry = async () => {
      // Prioritize reliable, fast models
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let lastErr: any = null;

      for (const modelName of modelsToTry) {
        try {
          return await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.1,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  verdict: {
                    type: Type.STRING,
                    description: "Must be exactly one of: 'LIKELY SCAM', 'SUSPICIOUS', 'LIKELY LEGITIMATE', 'UNCERTAIN'",
                  },
                  riskScore: {
                    type: Type.INTEGER,
                    description: "Calculated risk score from 0 to 100 based strictly on evidence.",
                  },
                  riskCategory: {
                    type: Type.STRING,
                    description: "Must be exactly one of: 'Low detected risk', 'Some warning signs', 'High risk', 'Very high risk', 'Uncertain — more verification needed'",
                  },
                  riskLevel: {
                    type: Type.STRING,
                    description: "Must be exactly one of: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNCERTAIN'",
                  },
                  scamType: {
                    type: Type.STRING,
                    description: "Specific classification of the fraud or alert type (e.g. 'UPI QR Code Refund Inversion Scam', 'Fake Bank KYC Suspension Phishing', 'Legitimate Bank Transaction Notification')",
                  },
                  summary: {
                    type: Type.STRING,
                    description: "A direct, 1-2 sentence executive assessment explaining the situation.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Clear explanation in plain English distinguishing confirmed facts from suspicions.",
                  },
                  warningSigns: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of specific evidence-based warning signs detected.",
                  },
                  suspiciousPhrases: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of exact quoted phrases extracted from the submitted text that indicated risk.",
                  },
                  recommendedActions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Step-by-step immediate next steps the user should take right now.",
                  },
                  goldenRuleViolation: {
                    type: Type.STRING,
                    description: "If a fundamental UPI/banking safety rule was violated, state the rule clearly. Leave empty if not applicable.",
                  },
                  cybercrimeReportingNeeded: {
                    type: Type.BOOLEAN,
                    description: "True if reporting to 1930 / cybercrime.gov.in is recommended.",
                  },
                  confidenceScore: {
                    type: Type.INTEGER,
                    description: "Confidence percentage (integer from 0 to 100).",
                  },
                  limitations: {
                    type: Type.STRING,
                    description: "Explanation of analysis boundaries and what could not be independently verified.",
                  },
                },
                required: [
                  'verdict',
                  'riskScore',
                  'riskCategory',
                  'riskLevel',
                  'scamType',
                  'summary',
                  'explanation',
                  'warningSigns',
                  'recommendedActions',
                  'confidenceScore',
                ],
              },
            },
          });
        } catch (err: any) {
          lastErr = err;
          console.warn(`Model ${modelName} encountered error, trying next available model:`, err?.message || err);
        }
      }
      throw lastErr || new Error('All Gemini models failed to respond.');
    };

    const response = await generateWithRetry();

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No analysis text received from Gemini model.');
    }

    const parsedData = JSON.parse(responseText);

    // Sanitize and validate fields
    const score = typeof parsedData.riskScore === 'number' ? Math.min(100, Math.max(0, parsedData.riskScore)) : 50;
    parsedData.riskScore = score;
    if (!parsedData.riskCategory) {
      parsedData.riskCategory = computeRiskCategory(score);
    }
    if (!parsedData.riskLevel) {
      parsedData.riskLevel = computeRiskLevel(score);
    }
    if (!Array.isArray(parsedData.suspiciousPhrases)) {
      parsedData.suspiciousPhrases = [];
    }
    parsedData.isAiAnalyzed = true;

    return res.json({
      success: true,
      analysis: parsedData,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing message with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to complete scam analysis. Please try again.',
    });
  }
});

// Serve frontend in development and production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UPI Safety Coach server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
