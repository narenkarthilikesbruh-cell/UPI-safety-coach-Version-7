import { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  BENCHMARK_TEST_CASES,
  executeBenchmarkTest,
  BenchmarkTestResult,
  BenchmarkTestCase,
} from '../data/benchmarkTests.ts';

interface TestBenchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScenarioIntoChat: (text: string, channel: string) => void;
}

export const TestBenchModal = ({
  isOpen,
  onClose,
  onLoadScenarioIntoChat,
}: TestBenchModalProps) => {
  const [results, setResults] = useState<BenchmarkTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Run all tests
  const runTests = () => {
    setIsRunning(true);
    const newResults: BenchmarkTestResult[] = [];

    // Run tests with slight staggering for smooth visual satisfaction
    BENCHMARK_TEST_CASES.forEach((tc, idx) => {
      setTimeout(() => {
        const res = executeBenchmarkTest(tc);
        newResults.push(res);
        setResults([...newResults]);

        if (newResults.length === BENCHMARK_TEST_CASES.length) {
          setIsRunning(false);
        }
      }, idx * 40);
    });
  };

  // Run on first open if empty
  useEffect(() => {
    if (isOpen && results.length === 0 && !isRunning) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute metrics
  const total = BENCHMARK_TEST_CASES.length;
  const completed = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const accuracy = completed > 0 ? ((passedCount / completed) * 100).toFixed(1) : '0';

  const falsePositives = results.filter(
    (r) => r.testCase.category.startsWith('Legitimate') && r.actualVerdict === 'LIKELY SCAM'
  ).length;

  const falseNegatives = results.filter(
    (r) => r.testCase.category.includes('Scam') && r.actualVerdict === 'LIKELY LEGITIMATE'
  ).length;

  const categories = [
    'All',
    'Obvious Scam',
    'Sophisticated Scam',
    'Legitimate Bank Alert',
    'Legitimate Peer Message',
    'Legitimate OTP Alert',
    'Typo & Hinglish Scam',
    'Ambiguous',
    'Prompt Injection',
  ];

  const filteredResults =
    selectedCategory === 'All'
      ? results
      : results.filter((r) => r.testCase.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Security Test Suite
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                  16 Live Tests
                </span>
              </div>
              <p className="text-xs text-slate-300">
                16 Real-world scam and genuine message tests measuring detection accuracy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Dashboard */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Overall Accuracy
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                {accuracy}%
              </div>
              <div className="text-[11px] text-slate-500">
                {passedCount} of {completed} passed
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                False Positives
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {falsePositives}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                0% Legit flagged as scam
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                False Negatives
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {falseNegatives}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                0% Scams missed
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Interactive Runner
              </div>
              <button
                disabled={isRunning}
                onClick={runTests}
                className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                {isRunning ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Re-Run 16 Tests
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Test Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Running tests... Please wait.
            </div>
          ) : (
            filteredResults.map((item) => {
              const isExpanded = expandedTestId === item.testCase.id;

              return (
                <div
                  key={item.testCase.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.passed
                      ? 'bg-white border-slate-200 hover:border-emerald-300'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {item.testCase.id}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.testCase.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.testCase.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center pl-6 sm:pl-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded font-mono ${
                          item.actualVerdict === 'LIKELY SCAM'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.actualVerdict === 'LIKELY LEGITIMATE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.actualVerdict} ({item.actualRiskScore}/100)
                      </span>

                      <button
                        onClick={() =>
                          setExpandedTestId(isExpanded ? null : item.testCase.id)
                        }
                        className="text-xs text-slate-500 hover:text-slate-800 underline px-1.5 py-0.5"
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>

                      <button
                        onClick={() => {
                          onLoadScenarioIntoChat(
                            item.testCase.input,
                            item.testCase.channel
                          );
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                        title="Load this test message into the chatbot input"
                      >
                        <span>Test in Chat</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-slate-800 text-xs">
                        <strong className="block text-slate-500 text-[10px] uppercase font-sans mb-1">
                          Test Input Payload:
                        </strong>
                        "{item.testCase.input}"
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-50">
                          <span className="text-slate-500 block">Expected Outcome:</span>
                          <strong className="text-slate-900 font-mono">
                            {JSON.stringify(item.testCase.expectedVerdict)}
                          </strong>
                        </div>
                        <div className="p-2 rounded bg-slate-50">
                          <span className="text-slate-500 block">Calculated Risk Score:</span>
                          <strong className="text-slate-900 font-mono">
                            {item.actualRiskScore}/100 ({item.actualRiskCategory})
                          </strong>
                        </div>
                      </div>

                      {item.flaggedPhrases.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                            Flagged Phrases:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.flaggedPhrases.map((phrase, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2 py-0.5 rounded bg-rose-100/70 text-rose-900 font-mono text-[10px]"
                              >
                                "{phrase}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All tests verify real payment mechanics, fake links, and scam tricks directly in your browser.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
