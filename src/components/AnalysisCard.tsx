import { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle,
  Copy,
  ExternalLink,
  PhoneCall,
  Shield,
  Check,
  AlertTriangle,
  Info,
  Quote,
  Sparkles,
} from 'lucide-react';
import { AnalysisResult } from '../types.ts';
import { VerdictBadge } from './VerdictBadge.tsx';

interface AnalysisCardProps {
  analysis: AnalysisResult;
  originalText?: string;
}

export const AnalysisCard = ({ analysis, originalText }: AnalysisCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReport = () => {
    const reportText = `[UPI Safety Coach Analysis]
Verdict: ${analysis.verdict}
Risk Score: ${analysis.riskScore ?? 0}/100 (${analysis.riskCategory ?? analysis.riskLevel ?? 'Evaluated'})
Type: ${analysis.scamType}

Summary: ${analysis.summary}

Explanation: ${analysis.explanation}

${
  analysis.suspiciousPhrases && analysis.suspiciousPhrases.length > 0
    ? `Flagged Phrases From Message:\n${analysis.suspiciousPhrases.map((p) => `• "${p}"`).join('\n')}\n\n`
    : ''
}Warning Signs:
${analysis.warningSigns.map((w) => `• ${w}`).join('\n')}

Recommended Next Steps:
${analysis.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${
  analysis.goldenRuleViolation
    ? `Fundamental Rule Violated: ${analysis.goldenRuleViolation}\n`
    : ''
}
${
  analysis.limitations
    ? `Limitations & Verification Note: ${analysis.limitations}\n`
    : ''
}
Need Help? Call National Cyber Crime Helpline: 1930 or visit https://cybercrime.gov.in/
(Always verify with your bank directly; never share OTP or UPI PIN).`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isScamOrSuspicious =
    analysis.verdict === 'LIKELY SCAM' || analysis.verdict === 'SUSPICIOUS';

  const riskScore = typeof analysis.riskScore === 'number' ? analysis.riskScore : (analysis.verdict === 'LIKELY SCAM' ? 90 : analysis.verdict === 'SUSPICIOUS' ? 55 : 10);
  const riskCategory = analysis.riskCategory || (riskScore >= 75 ? 'Very high risk' : riskScore >= 50 ? 'High risk' : riskScore >= 25 ? 'Some warning signs' : 'Low detected risk');

  // Gauge bar color
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-rose-600 text-rose-700';
    if (score >= 50) return 'bg-amber-500 text-amber-700';
    if (score >= 25) return 'bg-amber-400 text-amber-800';
    return 'bg-emerald-600 text-emerald-700';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
      {/* Top Header Strip */}
      <div className="p-5 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-2.5">
          <VerdictBadge
            verdict={analysis.verdict}
            riskLevel={analysis.riskLevel}
            size="md"
          />
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Security Verdict
          </span>
        </div>
        <button
          onClick={handleCopyReport}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-emerald-300 transition-colors"
          title="Copy this security analysis to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Report</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Transparent Risk Score Gauge */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
              Evidence-Based Risk Score
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm font-mono text-slate-900">
                {riskScore} / 100
              </span>
              <span className="text-slate-400">·</span>
              <span className={`font-semibold text-xs ${getScoreColor(riskScore).split(' ')[1]}`}>
                {riskCategory}
              </span>
            </div>
          </div>
          {/* Visual bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getScoreColor(riskScore).split(' ')[0]}`}
              style={{ width: `${Math.min(100, Math.max(4, riskScore))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 (Low risk)</span>
            <span>25 (Some warnings)</span>
            <span>50 (High risk)</span>
            <span>75-100 (Very high risk)</span>
          </div>
        </div>

        {/* Scam Classification & Executive Summary */}
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
            Scam Type
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">
            {analysis.scamType}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            {analysis.summary}
          </p>
        </div>

        {/* Golden Rule Violation Callout */}
        {analysis.goldenRuleViolation && (
          <div className="p-3.5 bg-amber-50/90 rounded-lg border border-amber-200 flex items-start gap-3 text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-semibold block text-amber-900 mb-0.5">
                Golden UPI Safety Rule
              </strong>
              {analysis.goldenRuleViolation}
            </div>
          </div>
        )}

        {/* Exact Suspicious Phrases Extracted */}
        {analysis.suspiciousPhrases && analysis.suspiciousPhrases.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-rose-500" />
              Suspicious Words in This Message
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.suspiciousPhrases.map((phrase, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono"
                >
                  <span className="text-rose-500 font-bold">"</span>
                  {phrase}
                  <span className="text-rose-500 font-bold">"</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Explanation Section */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Why This Is Suspicious
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {analysis.explanation}
          </p>
        </div>

        {/* Red Flags / Warning Signs */}
        {analysis.warningSigns && analysis.warningSigns.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              {isScamOrSuspicious ? 'Warning Signs Found' : 'Legitimate Signs Found'}
            </h4>
            <div className="space-y-1.5">
              {analysis.warningSigns.map((sign, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-md border border-slate-100"
                >
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">
                    {isScamOrSuspicious ? '✕' : '✓'}
                  </span>
                  <span className="leading-relaxed">{sign}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {analysis.recommendedActions && analysis.recommendedActions.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              What You Should Do Right Now
            </h4>
            <ul className="space-y-2">
              {analysis.recommendedActions.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-xs text-slate-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/80"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cybercrime Helpline Information Callout */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                Indian Cybercrime Helpline
              </div>
              <p className="text-xs text-slate-200">
                If money was deducted from your account, call within{' '}
                <strong className="text-white font-semibold">2 hours</strong> so banks and police can freeze the transfer.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:1930"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call 1930
              </a>
              <a
                href="https://cybercrime.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
              >
                cybercrime.gov.in
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Limitations & Verification Disclaimer */}
        {analysis.limitations && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
            <strong>Verification Note:</strong> {analysis.limitations}
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="pt-2 text-[11px] text-slate-400 leading-normal border-t border-slate-100">
          <strong>Safety Rule:</strong> Entering your UPI PIN or scanning a QR code is only for sending money, never receiving it. If you ever feel doubtful, check your passbook directly inside your official bank app.
        </div>
      </div>
    </div>
  );
};
