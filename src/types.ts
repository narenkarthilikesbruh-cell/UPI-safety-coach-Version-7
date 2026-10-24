export type ScamVerdict = 'LIKELY SCAM' | 'SUSPICIOUS' | 'LIKELY LEGITIMATE' | 'UNCERTAIN';

export type RiskCategory =
  | 'Low detected risk'
  | 'Some warning signs'
  | 'High risk'
  | 'Very high risk'
  | 'Uncertain — more verification needed';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN';

export interface AnalysisResult {
  verdict: ScamVerdict;
  riskScore: number; // 0 - 100 transparent score
  riskCategory: RiskCategory;
  riskLevel: RiskLevel; // Backward compatibility
  scamType: string;
  summary: string;
  explanation: string;
  warningSigns: string[];
  suspiciousPhrases?: string[]; // Exact quoted phrases from the submitted text
  recommendedActions: string[];
  goldenRuleViolation?: string;
  cybercrimeReportingNeeded?: boolean;
  confidenceScore: number;
  limitations?: string; // Scope and verification boundaries
  isAiAnalyzed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  channel?: string;
  content: string;
  analysis?: AnalysisResult;
  isError?: boolean;
  errorMessage?: string;
}

export interface SampleScenario {
  id: string;
  title: string;
  category:
    | 'Typos & Hinglish'
    | 'QR Code Inversion'
    | 'Fake Refund'
    | 'OTP Phishing'
    | 'KYC Threat'
    | 'Job Fraud'
    | 'Legitimate Alert'
    | 'Impersonation';
  channel: 'SMS' | 'WhatsApp' | 'Phone Call' | 'QR Code' | 'Email' | 'Payment App';
  label: string;
  expectedVerdict: ScamVerdict;
  snippet: string;
  fullText: string;
  explanationSummary: string;
}
