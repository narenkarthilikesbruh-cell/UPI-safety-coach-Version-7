import { useState } from 'react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { SampleScenario } from '../types.ts';
import { Sparkles, MessageSquare, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SampleScenariosBarProps {
  onSelectScenario: (scenario: SampleScenario, autoSubmit?: boolean) => void;
}

export const SampleScenariosBar = ({ onSelectScenario }: SampleScenariosBarProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Typos & Hinglish',
    'QR Code Inversion',
    'Fake Refund',
    'OTP Phishing',
    'KYC Threat',
    'Job Fraud',
    'Legitimate Alert',
  ];

  const filteredScenarios =
    selectedCategory === 'All'
      ? SAMPLE_SCENARIOS
      : SAMPLE_SCENARIOS.filter((s) => s.category === selectedCategory);

  return (
    <div id="sample-scenarios" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Interactive Test Scenarios
            </h3>
            <span className="text-xs text-slate-500">· Click to test</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-world examples covering Hinglish, typos, QR codes, OTP requests, and authentic bank alerts
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredScenarios.map((scenario) => {
          const isLegit = scenario.expectedVerdict === 'LIKELY LEGITIMATE';
          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario, true)}
              className="group p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-slate-50/40 hover:bg-white flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {scenario.channel}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    {isLegit ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Legit Pattern
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Scam Test
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {scenario.title}
                </h4>

                <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 line-clamp-3 font-serif">
                  "{scenario.snippet}"
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Analyze this sample</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
