import { useState } from 'react';
import { Shield, PhoneCall, AlertCircle, BookOpen, Layers, Menu, X, CheckSquare } from 'lucide-react';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenHelpline: () => void;
  onOpenTestBench: () => void;
  onScrollToDetector: () => void;
  onScrollToSamples: () => void;
}

export const Header = ({
  onOpenRules,
  onOpenHelpline,
  onOpenTestBench,
  onScrollToDetector,
  onScrollToSamples,
}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark with Shield */}
        <div
          onClick={onScrollToDetector}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm overflow-hidden p-0.5 group-hover:bg-emerald-700 transition-colors">
            <img
              src="/src/assets/images/upi_shield_emblem_1792771567807.jpg"
              alt="UPI Safety Coach Shield"
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 tracking-tight leading-none">
              UPI Safety Coach
            </span>
            <span className="text-[10px] font-medium text-emerald-700 tracking-wider uppercase mt-0.5">
              UPI &amp; Payment Scam Guard
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop/Tablet) */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => {
              onScrollToDetector();
              setMobileMenuOpen(false);
            }}
            className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Check Message
          </button>
          <button
            onClick={() => {
              onScrollToSamples();
              setMobileMenuOpen(false);
            }}
            className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Sample Scenarios
          </button>
          <button
            onClick={() => {
              onOpenTestBench();
              setMobileMenuOpen(false);
            }}
            className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 text-left flex items-center gap-1.5 text-emerald-800 font-semibold"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Security Test Suite</span>
          </button>
          <button
            onClick={() => {
              onOpenRules();
              setMobileMenuOpen(false);
            }}
            className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 text-left"
          >
            UPI Golden Rules
          </button>
          <button
            onClick={() => {
              onOpenHelpline();
              setMobileMenuOpen(false);
            }}
            className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Cybercrime 1930
          </button>
        </nav>

        {/* Zone 3: Primary Action & Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenHelpline}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Cybercrime: 1930</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => {
              onScrollToDetector();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            Check Message
          </button>
          <button
            onClick={() => {
              onScrollToSamples();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            Sample Scenarios
          </button>
          <button
            onClick={() => {
              onOpenTestBench();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-emerald-800 bg-emerald-50"
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            Security Test Suite
          </button>
          <button
            onClick={() => {
              onOpenRules();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            UPI Golden Rules
          </button>
          <button
            onClick={() => {
              onOpenHelpline();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            Cybercrime 1930 Help
          </button>
        </div>
      )}
    </header>
  );
};
