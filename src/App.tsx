import { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Send,
  Trash2,
  PlusCircle,
  Sparkles,
  PhoneCall,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Info,
  Layers,
  BookOpen,
  ArrowRight,
  AlertOctagon,
  CheckSquare,
} from 'lucide-react';
import { ChatMessage, SampleScenario, ScamVerdict, AnalysisResult } from './types.ts';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios.ts';
import { analyzeMessageInstant } from './services/scamDetectionEngine.ts';
import { Header } from './components/Header.tsx';
import { SafetyBanner } from './components/SafetyBanner.tsx';
import { VerdictBadge } from './components/VerdictBadge.tsx';
import { AnalysisCard } from './components/AnalysisCard.tsx';
import { ScanningAnimation } from './components/ScanningAnimation.tsx';
import { SampleScenariosBar } from './components/SampleScenariosBar.tsx';
import { GoldenRulesModal } from './components/GoldenRulesModal.tsx';
import { CybercrimeModal } from './components/CybercrimeModal.tsx';
import { TestBenchModal } from './components/TestBenchModal.tsx';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'SMS' | 'WhatsApp' | 'Phone Call' | 'QR Code' | 'Email' | 'Other'>('SMS');
  const [isLoading, setIsLoading] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Modals state
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [cybercrimeModalOpen, setCybercrimeModalOpen] = useState(false);
  const [testBenchModalOpen, setTestBenchModalOpen] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const channels: Array<'SMS' | 'WhatsApp' | 'Phone Call' | 'QR Code' | 'Email' | 'Other'> = [
    'SMS',
    'WhatsApp',
    'Phone Call',
    'QR Code',
    'Email',
    'Other',
  ];

  // Quick preset pills for immediate testing
  const quickPills = [
    { title: 'SBI KYC Block SMS', id: 'typo-kyc-sbi' },
    { title: 'OLX "Scan QR to Receive"', id: 'qr-olx-inversion' },
    { title: 'Electricity Disconnection at 9:30 PM', id: 'electricity-bill-disconnection' },
    { title: 'PhonePe ₹4,999 Reward Link', id: 'fake-phonepe-cashback' },
    { title: 'ICICI Bank Manager OTP Call', id: 'icici-otp-cancel-charge' },
    { title: 'Genuine HDFC Credit Alert', id: 'legitimate-hdfc-credit' },
  ];

  // Auto scroll when new analysis is added
  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleAnalyze = async (textToAnalyze?: string, channelToUse?: string) => {
    const text = (textToAnalyze ?? inputText).trim();
    const ch = channelToUse ?? selectedChannel;

    if (!text) return;

    setActiveError(null);
    setIsLoading(true);

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: ch,
      content: text,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    if (!textToAnalyze) {
      setInputText('');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const response = await fetch('/api/analyze-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          channel: ch,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let analysisResult: AnalysisResult;

      if (response.ok) {
        const data = await response.json();
        if (
          data.success &&
          data.analysis &&
          ['LIKELY SCAM', 'SUSPICIOUS', 'LIKELY LEGITIMATE', 'UNCERTAIN'].includes(data.analysis.verdict)
        ) {
          const score = typeof data.analysis.riskScore === 'number'
            ? Math.min(100, Math.max(0, data.analysis.riskScore))
            : 50;
          analysisResult = {
            ...data.analysis,
            riskScore: score,
            riskCategory: data.analysis.riskCategory || (score >= 75 ? 'Very high risk' : score >= 50 ? 'High risk' : score >= 25 ? 'Some warning signs' : 'Low detected risk'),
            riskLevel: data.analysis.riskLevel || (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'),
            warningSigns: Array.isArray(data.analysis.warningSigns) ? data.analysis.warningSigns : [],
            suspiciousPhrases: Array.isArray(data.analysis.suspiciousPhrases) ? data.analysis.suspiciousPhrases : [],
            recommendedActions: Array.isArray(data.analysis.recommendedActions) ? data.analysis.recommendedActions : [],
          };
        } else {
          analysisResult = analyzeMessageInstant(text, ch);
        }
      } else {
        // Fallback to advanced deterministic heuristic engine if server has issues
        analysisResult = analyzeMessageInstant(text, ch);
      }

      const botMessageId = `bot-${Date.now()}`;
      const newBotMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: analysisResult.summary,
        analysis: analysisResult,
      };

      setMessages((prev) => [...prev, newBotMessage]);
    } catch (err: any) {
      console.warn('API call encountered an issue, using fallback detector:', err);
      const fallbackResult = analyzeMessageInstant(text, ch);
      const botMessageId = `bot-${Date.now()}`;
      const newBotMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: fallbackResult.summary,
        analysis: fallbackResult,
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario: SampleScenario, autoSubmit = true) => {
    setInputText(scenario.fullText);
    const mappedChannel = channels.includes(scenario.channel as any)
      ? (scenario.channel as any)
      : 'Other';
    setSelectedChannel(mappedChannel);

    if (autoSubmit) {
      handleAnalyze(scenario.fullText, mappedChannel);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Clear all conversation history in this session?')) {
        setMessages([]);
        setActiveError(null);
      }
    }
  };

  const handleAnalyzeAnother = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToDetector = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToSamples = () => {
    document.getElementById('sample-scenarios')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Header */}
      <Header
        onOpenRules={() => setRulesModalOpen(true)}
        onOpenHelpline={() => setCybercrimeModalOpen(true)}
        onOpenTestBench={() => setTestBenchModalOpen(true)}
        onScrollToDetector={scrollToDetector}
        onScrollToSamples={scrollToSamples}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white p-6 sm:p-8 shadow-sm border border-emerald-800/40">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-700/50 text-emerald-200 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>UPI Payment &amp; Cyber Fraud Protection</span>
                <span className="text-emerald-400 font-mono">· India</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Check Suspicious UPI Requests, QR Codes, Calls &amp; SMS
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Before you scan a QR code, approve a payment request, or click an unknown link, check if it's a scam. Find out what fraudsters are trying to do before you lose your money.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={scrollToDetector}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Check a Message Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTestBenchModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center gap-2 border border-emerald-500/50 shadow-sm cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-300" />
                  <span>Test Common Scams (16 Tests)</span>
                </button>
                <button
                  onClick={() => setRulesModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors flex items-center gap-2 border border-white/10 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-emerald-300" />
                  <span>The 5 Golden Rules</span>
                </button>
              </div>
            </div>

            {/* Visual illustration slot */}
            <div className="lg:col-span-4 hidden lg:flex justify-end">
              <div className="relative w-64 h-44 rounded-xl overflow-hidden border border-emerald-700/60 shadow-lg bg-emerald-900/40">
                <img
                  src="/src/assets/images/cyber_safety_illustration_1792771567507.jpg"
                  alt="Cyber safety illustration"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                  <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    NPCI &amp; Cybercrime Safe Practice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Zero-Credential Disclaimer Banner */}
        <SafetyBanner />

        {/* Workspace: 2-Column Split Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Detector & Conversation Area (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Input & Detector Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Check a Message or Payment Request
                    </h2>
                    <p className="text-xs text-slate-500">
                      Paste any suspicious SMS, WhatsApp message, phone call details, or payment request
                    </p>
                  </div>
                </div>

                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Clear current session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Channel Selector */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Where did you receive this?
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {channels.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        selectedChannel === ch
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Input Box */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  rows={4}
                  placeholder="Example: 'Dear customer your SBI account will be blocked today due to pending KYC. Click http://sbi-kyc.apk to unblock' or 'OLX buyer asking me to scan QR to receive 10,000'..."
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                  <div className="text-[11px] text-slate-400">
                    Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono">Enter</kbd> to check
                  </div>

                  <div className="flex items-center gap-2">
                    {inputText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isLoading || !inputText.trim()}
                      onClick={() => handleAnalyze()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking for scam signs...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Check Message Safety</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Pills for instant test selection */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Quick Test Scenarios:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPills.map((pill) => {
                    const scenario = SAMPLE_SCENARIOS.find((s) => s.id === pill.id);
                    if (!scenario) return null;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => handleSelectScenario(scenario, true)}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors border border-slate-200/60"
                      >
                        {pill.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Conversation Stream & Analysis Cards */}
            {isLoading && <ScanningAnimation />}

            {messages.length === 0 && !isLoading && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white/60">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ready to check message safety
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Paste an SMS, WhatsApp message, payment request, or call details above, or click any sample below to see how scams are caught.
                </p>
              </div>
            )}

            {/* Render previous messages */}
            <div className="space-y-6">
              {messages.map((msg, index) => {
                if (msg.role === 'user') {
                  return (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-900 text-xs sm:text-sm space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-emerald-800">
                          Checked Message ({msg.channel || 'General'})
                        </span>
                        <span className="font-mono text-[11px]">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-800 font-mono whitespace-pre-wrap leading-relaxed text-xs sm:text-sm bg-white p-3 rounded-lg border border-slate-200/60">
                        {msg.content}
                      </p>
                    </div>
                  );
                }

                if (msg.isError) {
                  return (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3"
                    >
                      <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="font-bold block">Check Failed</strong>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          {msg.errorMessage || 'An error occurred while evaluating the message.'}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (msg.analysis) {
                  return (
                    <div key={msg.id} className="space-y-3">
                      <AnalysisCard analysis={msg.analysis} />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleAnalyzeAnother}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Check Another Message</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* Right Column: Quick Rules & Emergency Hotline Widget (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Emergency Hotline Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Cybercrime Emergency
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  24x7 Helpline
                </span>
              </div>
              <div>
                <a
                  href="tel:1930"
                  className="text-3xl font-black tracking-tight text-white hover:text-emerald-300 transition-colors inline-flex items-center gap-2"
                >
                  <PhoneCall className="w-6 h-6 text-emerald-400" />
                  1930
                </a>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  National Cyber Crime Reporting Helpline. Call within <strong>2 hours</strong> to halt fund transfer.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="https://cybercrime.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                >
                  <span>File Complaint on cybercrime.gov.in</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <button
                  onClick={() => setCybercrimeModalOpen(true)}
                  className="w-full text-center py-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-medium"
                >
                  View Bank Freeze Numbers &amp; Golden Hours &rarr;
                </button>
              </div>
            </div>

            {/* UPI Golden Rules Summary Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  UPI Safety Cardinal Rules
                </h3>
                <button
                  onClick={() => setRulesModalOpen(true)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                  <strong className="text-emerald-950 font-bold block mb-0.5">
                    1. PIN is Only for Sending Money
                  </strong>
                  <p className="text-slate-600 leading-normal">
                    You never type your UPI PIN to receive money, lottery prizes, or OLX payments.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 font-bold block mb-0.5">
                    2. QR Code Scans Always Debit
                  </strong>
                  <p className="text-slate-600 leading-normal">
                    Scanning a QR code on Google Pay, PhonePe, or Paytm initiates an outgoing payment.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 font-bold block mb-0.5">
                    3. No AnyDesk / RustDesk
                  </strong>
                  <p className="text-slate-600 leading-normal">
                    Customer support representatives will never ask you to install remote screen-sharing tools.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 font-bold block mb-0.5">
                    4. Check 6-Char SMS Header
                  </strong>
                  <p className="text-slate-600 leading-normal">
                    Real bank alerts come from headers like AX-SBIINB or VM-HDFCBK, never 10-digit mobile numbers.
                  </p>
                </div>
              </div>
            </div>

            {/* Verdict Legend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evaluation Verdict Scale
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="font-semibold text-slate-800">LIKELY SCAM:</span>
                  <span className="text-slate-500">High probability of fraud. Do not proceed.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-800">SUSPICIOUS:</span>
                  <span className="text-slate-500">Irregular indicators. Severe caution.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">LIKELY LEGITIMATE:</span>
                  <span className="text-slate-500">Standard pattern. Verify inside bank app.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">UNCERTAIN:</span>
                  <span className="text-slate-500">Insufficient evidence. Never share OTP.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Clickable Sample Scenarios Bench */}
        <SampleScenariosBar onSelectScenario={handleSelectScenario} />

        {/* Awareness / FAQ Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Frequently Asked Questions on Digital Payments &amp; Cyber Fraud
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="font-bold text-slate-900 block text-sm">
                Can someone debit money from my account simply with my UPI ID or phone number?
              </strong>
              <p className="text-slate-600 leading-relaxed">
                No. Knowing your UPI ID or mobile number only allows someone to send money to you or send a collect request. Money can NEVER leave your account without you explicitly entering your confidential UPI PIN.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="font-bold text-slate-900 block text-sm">
                What should I do if an OLX buyer sends a QR code to "verify" my account?
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Refuse immediately. No verification, pre-authorization, or QR scan is required to receive payment. This is the single most common classifieds scam in India.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="font-bold text-slate-900 block text-sm">
                I clicked a suspicious link from an SMS. Is my phone compromised?
              </strong>
              <p className="text-slate-600 leading-relaxed">
                If you did not download an APK file or type any passwords/OTPs into the website, you are generally safe. Clear your browser data, do not install any downloaded files, and monitor your bank account via your official bank app.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="font-bold text-slate-900 block text-sm">
                What are the "Golden Hours" after cyber fraud?
              </strong>
              <p className="text-slate-600 leading-relaxed">
                The first 2 to 3 hours after fraudulent debit are critical. Calling 1930 immediately enables police and bank nodal officers to trace the destination account and place a freeze lien before the money is withdrawn at an ATM.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">UPI Safety Coach</span>
            <span>·</span>
            <span>National Cyber Crime &amp; NPCI Safety Awareness</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a
              href="tel:1930"
              className="text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Cybercrime Helpline: 1930
            </a>
            <span>·</span>
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-800 transition-colors"
            >
              cybercrime.gov.in
            </a>
            <span>·</span>
            <button
              onClick={() => setRulesModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              UPI Rules
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Disclaimer: UPI Safety Coach is an educational cybersecurity advisory tool. It processes analyses securely without storing your personal banking information. No automated system can guarantee 100% scam immunity. Always verify critical transactions with your official bank.
        </div>
      </footer>

      {/* Modals */}
      <GoldenRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />
      <CybercrimeModal
        isOpen={cybercrimeModalOpen}
        onClose={() => setCybercrimeModalOpen(false)}
      />
      <TestBenchModal
        isOpen={testBenchModalOpen}
        onClose={() => setTestBenchModalOpen(false)}
        onLoadScenarioIntoChat={(text, channel) => {
          setInputText(text);
          setSelectedChannel(channel as any);
          handleAnalyze(text, channel);
          scrollToDetector();
        }}
      />
    </div>
  );
}
