import { useState, useEffect } from 'react';
import { Shield, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface ScanningAnimationProps {
  onComplete?: () => void;
}

export const ScanningAnimation = ({ onComplete }: ScanningAnimationProps) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Scanning message for known fraud patterns...',
    'Checking links, phone numbers & sender details...',
    'Checking for reverse QR code or UPI PIN traps...',
    'Preparing safety advice...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        onComplete?.();
        return prev;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [steps.length, onComplete]);

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm my-4 animate-in fade-in duration-150">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700">
          <Shield className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Checking Message Safety
          </h4>
          <p className="text-xs text-slate-500">
            Scanning for payment traps, fake bank links, and urgency tricks
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs transition-opacity duration-150 ${
                isDone
                  ? 'text-emerald-800 font-medium'
                  : isCurrent
                  ? 'text-slate-800 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                )}
              </div>
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
