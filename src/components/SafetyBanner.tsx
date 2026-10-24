import { ShieldAlert, Lock, AlertCircle, PhoneCall, ExternalLink } from 'lucide-react';

export const SafetyBanner = () => {
  return (
    <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-900/40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Privacy & Safety Warning */}
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-800/60 text-emerald-300 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Security & Privacy Notice
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-emerald-200">Zero Credential Policy</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
              <strong>DO NOT paste real OTPs, UPI PINs, passwords, or full card details.</strong>{' '}
              UPI Safety Coach analyzes language structure, phishing links, and deception patterns. Your real PIN is strictly private and should never be entered on any website or shared with any caller.
            </p>
          </div>
        </div>

        {/* Emergency Quick Action */}
        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center pl-11 lg:pl-0">
          <a
            href="tel:1930"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-emerald-200" />
            <span>Cybercrime: 1930</span>
          </a>
          <a
            href="https://cybercrime.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors border border-slate-700/60"
          >
            <span>cybercrime.gov.in</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
