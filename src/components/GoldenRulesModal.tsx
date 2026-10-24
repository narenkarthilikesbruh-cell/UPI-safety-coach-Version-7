import { X, ShieldCheck, AlertTriangle, KeyRound, QrCode, MonitorSmartphone, BellRing, PhoneCall } from 'lucide-react';

interface GoldenRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoldenRulesModal = ({ isOpen, onClose }: GoldenRulesModalProps) => {
  if (!isOpen) return null;

  const rules = [
    {
      icon: KeyRound,
      number: '01',
      title: 'UPI PIN is ONLY for Sending Money',
      highlight: 'NEVER enter your UPI PIN to receive money, cashback, or rewards.',
      description:
        'A UPI PIN is an authorization signature required strictly to deduct funds from your account. Receiving money via UPI is completely automatic and requires ZERO interaction or PIN entry.',
    },
    {
      icon: QrCode,
      number: '02',
      title: 'Scanning a QR Code Debits Your Account',
      highlight: 'You NEVER need to scan a QR code to receive a payment.',
      description:
        'Common OLX & buyer scam: Scammers send a QR code claiming "Scan this to accept my payment". Scanning any QR code inside GPay, PhonePe, or Paytm initiates an outgoing payment.',
    },
    {
      icon: MonitorSmartphone,
      number: '03',
      title: 'Never Install Screen-Sharing Apps for "Support"',
      highlight: 'Beware of AnyDesk, TeamViewer QuickSupport, RustDesk, or unknown .apk files.',
      description:
        'Fraudsters posing as bank managers or utility agents trick victims into downloading remote access software. This allows them to view your screen in real time and steal OTPs.',
    },
    {
      icon: BellRing,
      number: '04',
      title: 'Beware of "Collect Requests" on Payment Apps',
      highlight: 'Never approve or tap "Pay" on unexpected payment requests.',
      description:
        'Scammers initiate a UPI Collect Request disguised with remark text like "PhonePe Cashback ₹4,999 Approved". Tapping Pay and typing your PIN transfers that amount to the thief.',
    },
    {
      icon: ShieldCheck,
      number: '05',
      title: 'Check Authorized 6-Character SMS Headers (DLT)',
      highlight: 'Official bank SMS NEVER comes from ordinary 10-digit mobile numbers.',
      description:
        'Under TRAI regulations, genuine Indian bank SMS comes with standardized headers such as VK-HDFCBK, AX-SBIINB, or JM-ICICIB. An SMS from +91-98xxxxxx claiming your KYC is blocked is a scam.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-800 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">The 5 Golden Rules of UPI Safety</h3>
              <p className="text-xs text-emerald-200">Endorsed by NPCI & Cybercrime Security Standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Crucial Rule to Remember Every Day:</strong>
              If anyone online asks you to enter your UPI PIN to claim money, sell an item, or receive a refund, end the conversation immediately.
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.number}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-800 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          RULE {rule.number}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{rule.title}</h4>
                      </div>
                      <p className="text-xs font-semibold text-rose-700 bg-rose-50/80 px-2 py-1 rounded inline-block">
                        {rule.highlight}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Emergency helpline: <strong className="text-slate-800">1930</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            I Understand & Got It
          </button>
        </div>
      </div>
    </div>
  );
};
