import { ShieldAlert, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { ScamVerdict, RiskLevel } from '../types.ts';

interface VerdictBadgeProps {
  verdict: ScamVerdict;
  riskLevel?: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge = ({ verdict, riskLevel, size = 'md' }: VerdictBadgeProps) => {
  const getVerdictConfig = () => {
    switch (verdict) {
      case 'LIKELY SCAM':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          indicator: 'bg-rose-600',
          icon: ShieldAlert,
          title: 'Likely Scam',
        };
      case 'SUSPICIOUS':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          indicator: 'bg-amber-500',
          icon: AlertTriangle,
          title: 'Suspicious / High Caution',
        };
      case 'LIKELY LEGITIMATE':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          indicator: 'bg-emerald-600',
          icon: ShieldCheck,
          title: 'Likely Legitimate',
        };
      case 'UNCERTAIN':
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          indicator: 'bg-slate-500',
          icon: HelpCircle,
          title: 'Uncertain / Verify',
        };
    }
  };

  const config = getVerdictConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5 font-semibold',
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border font-medium ${sizeClasses[size]} ${config.bg}`}
    >
      <Icon className={size === 'lg' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} />
      <span className="tracking-tight">{config.title}</span>
      {riskLevel && (
        <span className="text-xs opacity-75 font-mono">
          ({riskLevel} RISK)
        </span>
      )}
    </div>
  );
};
