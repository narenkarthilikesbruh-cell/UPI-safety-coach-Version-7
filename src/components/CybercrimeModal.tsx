import { X, PhoneCall, ExternalLink, ShieldAlert, Clock, AlertTriangle, Building2, PhoneForwarded } from 'lucide-react';

interface CybercrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CybercrimeModal = ({ isOpen, onClose }: CybercrimeModalProps) => {
  if (!isOpen) return null;

  const banks = [
    { name: 'State Bank of India (SBI)', tollFree: '1800 1234 / 1800 2100', blockSms: 'SMS BLOCK <last 4 digits> to 567676' },
    { name: 'HDFC Bank', tollFree: '1800 202 6161 / 1800 258 3838', blockSms: 'SMS BLOCK to 5676712' },
    { name: 'ICICI Bank', tollFree: '1800 1080', blockSms: 'Use iMobile app or call toll-free' },
    { name: 'Axis Bank', tollFree: '1800 419 5959 / 1800 419 5577', blockSms: 'SMS BLOCK to 56161600' },
    { name: 'Punjab National Bank (PNB)', tollFree: '1800 180 2222 / 1800 103 2222', blockSms: 'SMS HOT to 5607040' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Indian Cybercrime Reporting & Emergency Protocol</h3>
              <p className="text-xs text-slate-300">National Cyber Crime Reporting Portal (MHA, Govt of India)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1930 Direct Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                National Helpline Number
              </span>
              <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                1930
                <span className="text-xs font-normal text-emerald-300 font-sans">
                  (Toll-Free, 24x7 all across India)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Citizen Financial Cyber Fraud Reporting & Management System (CFCFRMS)
              </p>
            </div>
            <a
              href="tel:1930"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors shrink-0"
            >
              <PhoneCall className="w-4 h-4" />
              Dial 1930 Now
            </a>
          </div>

          {/* Golden Hours Alert */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-950">
            <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed">
              <strong className="text-rose-900 font-bold block text-sm">
                The "Golden Hours" Rule (First 2 to 3 Hours)
              </strong>
              If money was debited from your bank or UPI wallet, report immediately within the first 2 hours by calling 1930. The cyber police portal coordinates directly with bank nodal officers to freeze the stolen funds inside the mule recipient account before the fraudster can withdraw cash from an ATM.
            </div>
          </div>

          {/* Official Portals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all bg-slate-50/50 group block"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  cybercrime.gov.in
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Ministry of Home Affairs portal to register formal FIRs and track cyber fraud complaints.
              </p>
            </a>

            <a
              href="https://sancharsaathi.gov.in/sfc/"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all bg-slate-50/50 group block"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  Chakshu Portal (DoT)
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Report suspicious fraud SMS numbers, WhatsApp spam, and imposter phone calls for SIM disconnection.
              </p>
            </a>
          </div>

          {/* Major Indian Bank Toll-Free Hotlines */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Major Bank Emergency Helplines (To freeze UPI / Card)
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              {banks.map((b) => (
                <div key={b.name} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50">
                  <span className="font-semibold text-slate-900">{b.name}</span>
                  <div className="text-slate-600 flex items-center gap-3">
                    <span className="font-mono text-emerald-700 font-medium">{b.tollFree}</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">{b.blockSms}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Keep transaction IDs (UTR) & screenshots ready when calling 1930.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
