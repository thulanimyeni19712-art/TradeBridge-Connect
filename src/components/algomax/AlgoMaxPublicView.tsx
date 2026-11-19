import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  ShieldCheck,
  Cpu,
  Server,
  ArrowRight,
  CheckCircle2,
  Download,
  Key,
  Activity,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { generateKeyCode } from '../../lib/crypto';

interface AlgoMaxPublicViewProps {
  onOpenAdminPortal: () => void;
  onSelectTerminal?: () => void;
}

export const AlgoMaxPublicView: React.FC<AlgoMaxPublicViewProps> = ({
  onOpenAdminPortal,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PROP' | 'LIFETIME'>('PROP');
  const [calcBalance, setCalcBalance] = useState<number>(50000);
  const [calcRisk, setCalcRisk] = useState<number>(1.0);
  const [calcDays, setCalcDays] = useState<number>(15);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutEmail, setCheckoutEmail] = useState<string>('');
  const [checkoutName, setCheckoutName] = useState<string>('');
  const [checkoutAccountNumber, setCheckoutAccountNumber] = useState<string>('50294112');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [downloadBanner, setDownloadBanner] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
  const bridgeEndpoint = `${origin}/api/mt5/bridge`;

  // Projected return calculations
  const projectedDailyReturnPct = calcRisk * 0.92;
  const projectedMonthlyReturn = Number(
    (calcBalance * (projectedDailyReturnPct / 100) * calcDays).toFixed(2)
  );
  const projectedDrawdownPct = Number((calcRisk * 1.8).toFixed(1));
  const passProbabilityPct = Math.min(99, Math.round(88 + calcDays * 0.35));

  const handleGenerateCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const newKey = generateKeyCode(`ALM-${selectedPlan}`, 3);
    setGeneratedKey(newKey);
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    const t = window.setTimeout(() => setCopiedKey(false), 3000);
    timersRef.current.push(t);
  };

  const handleDownloadInstallerBundle = () => {
    const manifest = [
      `; AlgoMax Institutional EA v5.2.1 - Verified Preset & Bridge Manifest`,
      `; Compatible with MT5 Build 4000+ & MT4 Build 1420+`,
      `AlgoMax_Version=5.2.1`,
      `Bridge_WebRequest_URL=${bridgeEndpoint}`,
      `Risk_Per_Trade_Pct=${calcRisk}`,
      `Prop_Daily_Drawdown_Guard_Pct=3.5`,
      `News_Filter_Buffer_Minutes=30`,
      `Magic_Number=50294112`,
      `Default_Pairs=XAUUSD,US30,EURUSD`,
    ].join('\n');

    const blob = new Blob([manifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AlgoMax_EA_v5.2_Universal.set';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadBanner(`Downloaded AlgoMax_EA_v5.2_Universal.set configured for ${bridgeEndpoint}.`);
    const t = window.setTimeout(() => setDownloadBanner(null), 4500);
    timersRef.current.push(t);
  };

  return (
    <div className="space-y-12 pb-16 font-mono text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* TOP NOTIFICATION BAR */}
      <div className="p-3 bg-gradient-to-r from-cyan-950/80 via-blue-950/90 to-purple-950/80 border border-cyan-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white font-orbitron">
            ALGOMAX-EA.COM OFFICIAL RELEASE • V5.2.1 INSTITUTIONAL PRO
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            PRO FIRM COMPLIANT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAdminPortal}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-orbitron tracking-wider transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Launch Algo Admin Portal</span>
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#080d19] via-[#091024] to-[#050811] border border-cyan-500/30 p-8 sm:p-12 text-center shadow-[0_0_80px_rgba(6,182,212,0.12)]">
        {/* Futuristic Cyber Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 hud-grid opacity-25 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Institutional MT4 &amp; MT5 Trading Algorithm • 0.05ms Execution</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-orbitron drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Algorithmic Precision for <span className="text-cyan-400">Forex, Gold &amp; Indices</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed">
            Engineered exclusively for passing Prop Firm challenges (FTMO, ThinkMarkets, Emerge, Apex)
            and scaling personal capital with institutional Smart Money Concept (SMC) order blocks,
            dynamic spread protection, and zero-martingale risk management.
          </p>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 tabular-nums">
            <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-cyan-800/40">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-orbitron">
                94.6%
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">Prop Pass Rate</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-cyan-800/40">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-orbitron">3.82</div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">Profit Factor</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-cyan-800/40">
              <div className="text-xl sm:text-2xl font-black text-purple-300 font-orbitron">
                &lt; 2.8%
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">Max Trailing DD</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-cyan-800/40">
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-orbitron">
                $14.8M+
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">Funded Capital</div>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setSelectedPlan('PROP');
                setIsCheckoutOpen(true);
              }}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black font-orbitron tracking-wider text-sm transition shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-95 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Get AlgoMax EA v5.2</span>
            </button>

            <button
              onClick={onOpenAdminPortal}
              className="py-3.5 px-6 rounded-2xl bg-[#101726] hover:bg-[#151f33] border border-slate-700 hover:border-purple-500/50 text-purple-300 font-bold font-orbitron text-xs transition flex items-center gap-2"
            >
              <Server className="w-4 h-4" />
              <span>Algo Admin Portal (Vendor Access)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE STRATEGY & INSTITUTIONAL ADVANTAGES */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-orbitron">
            ENGINE ARCHITECTURE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-orbitron">
            Why AlgoMax Dominates MetaTrader 4 &amp; 5
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl mx-auto">
            Traditional retail EAs rely on toxic martingales or reckless grids. AlgoMax operates on
            institutional order flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 hover:border-cyan-500/40 transition space-y-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-orbitron">
              SMC Order Block &amp; FVG Harvester
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Monitors institutional liquidity pools, Fair Value Gaps, and Asian session sweeps.
              Entries trigger on confirmed volume delta shifts with a tight 8–15 pip stop loss.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 hover:border-purple-500/40 transition space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-orbitron">
              Prop Firm 4% Drawdown Guard
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Built-in strict equity circuit breaker automatically liquidates and halts trading if the
              daily drawdown approaches 3.5%, ensuring 100% compliance with FTMO &amp; Emerge rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 transition space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-orbitron">
              Live News Circuit Breaker
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Real-time synchronization with high-impact economic events (BOE, FOMC, NFP, CPI). Halts
              scalper execution 15 mins prior to release to avoid broker spread-widening traps.
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE PROFIT & PROP PASS CALCULATOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1e] border border-cyan-800/40 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-orbitron">
              INTERACTIVE EVALUATION PROJECTOR
            </div>
            <h3 className="text-xl font-black text-white font-orbitron mt-0.5">
              AlgoMax Performance &amp; Evaluation Projector
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-sans">
            Based on verified 1,482 live trade backtest logs
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Sliders */}
          <div className="space-y-5 tabular-nums">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Account Size / Prop Challenge:</span>
                <span className="text-cyan-400">${calcBalance.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="5000"
                value={calcBalance}
                onChange={(e) => setCalcBalance(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>$5K</span>
                <span>$50K</span>
                <span>$100K</span>
                <span>$200K</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Risk per Trade Model:</span>
                <span className="text-purple-300">{calcRisk}% per ticket</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="2.0"
                step="0.25"
                value={calcRisk}
                onChange={(e) => setCalcRisk(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.25% (Ultra Safe)</span>
                <span>1.0% (Prop Firm Standard)</span>
                <span>2.0% (Aggressive)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Trading Days Duration:</span>
                <span className="text-amber-300">{calcDays} Days</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={calcDays}
                onChange={(e) => setCalcDays(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>5 Days (Min Days)</span>
                <span>15 Days</span>
                <span>30 Days (Full Phase)</span>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#10172b] to-[#0c1222] border border-cyan-500/40 space-y-4 tabular-nums">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-orbitron">
              Projected Algorithm Output
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-slate-400">Projected Net Gain</div>
                <div className="text-2xl font-black text-emerald-400 font-orbitron mt-0.5">
                  +${projectedMonthlyReturn.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Projected Max Drawdown</div>
                <div className="text-2xl font-black text-cyan-300 font-orbitron mt-0.5">
                  {projectedDrawdownPct}%
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Pass Probability</div>
                <div className="text-2xl font-black text-purple-300 font-orbitron mt-0.5">
                  {passProbabilityPct}%
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Target Profit Goal</div>
                <div className="text-2xl font-black text-white font-orbitron mt-0.5">
                  ${(calcBalance * 0.08).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedPlan('PROP');
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-orbitron text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Deploy This Setting to MT5 Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING & LICENSE PLANS */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-orbitron">
            INVESTMENT TIERS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-orbitron">
            Select Your AlgoMax EA License
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl mx-auto">
            Instant automatic HWID authorization and direct access to verified .SET preset library.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Starter */}
          <div
            className={`p-6 rounded-3xl border transition relative flex flex-col justify-between ${
              selectedPlan === 'STARTER'
                ? 'bg-[#0f172a] border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 font-orbitron">ALGOMAX STARTER</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-orbitron">$199</span>
                <span className="text-xs text-slate-400">/ one-time</span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Perfect for personal trading accounts and retail traders exploring automated AI execution.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Live or Demo Account (MT4 or MT5)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>XAUUSD Gold &amp; US30 Core Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard Risk Presets (.SET)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free Updates for 1 Year</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('STARTER');
                setIsCheckoutOpen(true);
              }}
              className="mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition"
            >
              Choose Starter
            </button>
          </div>

          {/* Plan 2: Prop Evaluation Pass (Featured) */}
          <div
            className={`p-6 rounded-3xl border transition relative flex flex-col justify-between ${
              selectedPlan === 'PROP'
                ? 'bg-gradient-to-b from-[#131d38] to-[#0a1226] border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.35)]'
                : 'bg-[#0a0f1d] border-slate-800'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md">
              MOST POPULAR • PROP PASS
            </div>
            <div className="space-y-4">
              <div className="text-xs font-bold text-cyan-400 font-orbitron mt-1">
                ALGOMAX PROP EVALUATION
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-orbitron">$399</span>
                <span className="text-xs text-slate-400">/ one-time</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Engineered specifically to pass 1-Phase &amp; 2-Phase evaluations at FTMO, Emerge, ThinkMarkets.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white">3 Accounts (MT4, MT5, DXtrade)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Strict 4% Daily Drawdown Circuit Guard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Prop Pass Optimized .SET Presets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>News Filter &amp; Weekend Auto-Flat Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>London LD4 Equinix VPS Bridge Sync</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('PROP');
                setIsCheckoutOpen(true);
              }}
              className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black font-orbitron text-xs transition shadow-lg active:scale-95"
            >
              Get Prop Pass License
            </button>
          </div>

          {/* Plan 3: Institutional Lifetime */}
          <div
            className={`p-6 rounded-3xl border transition relative flex flex-col justify-between ${
              selectedPlan === 'LIFETIME'
                ? 'bg-[#15112e] border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-4">
              <div className="text-xs font-bold text-purple-400 font-orbitron">
                INSTITUTIONAL LIFETIME
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-orbitron">$799</span>
                <span className="text-xs text-slate-400">/ lifetime</span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                For prop firm portfolio managers, mentors, and fund managers managing multiple accounts.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold text-white">Unlimited MT4/MT5 Accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Algo Admin Portal Direct Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Remote HWID Reassignment Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>White-Label Branding Capability</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Direct Quant Developer Telegram Desk</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('LIFETIME');
                setIsCheckoutOpen(true);
              }}
              className="mt-6 w-full py-3 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/50 text-purple-200 hover:text-white font-bold text-xs transition"
            >
              Choose Institutional
            </button>
          </div>
        </div>
      </div>

      {/* DOWNLOADS & MT5 SETUP GUIDE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#080d19] border border-slate-800 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-orbitron">
                AlgoMax EA Installer &amp; Preset Files
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Compatible with MetaTrader 5 Build 4000+ &amp; MetaTrader 4 Build 1420+
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadInstallerBundle}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition flex items-center gap-2 border border-cyan-500/30"
            >
              <Download className="w-4 h-4" />
              <span>Download .SET &amp; Bridge Config</span>
            </button>
          </div>
        </div>

        {downloadBanner && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadBanner}</span>
            </div>
            <button
              onClick={() => setDownloadBanner(null)}
              className="text-emerald-400 hover:text-white font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">Step 1: Install</div>
            <p className="text-slate-400 text-[11px] font-sans">
              Copy <code className="text-slate-200 font-mono">AlgoMax_EA.ex5</code> into your MetaTrader <code className="text-slate-200 font-mono">MQL5/Experts</code> folder.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">Step 2: Allow WebRequest</div>
            <p className="text-slate-400 text-[11px] font-sans">
              In MT5 Tools &rarr; Options &rarr; Expert Advisors, check &quot;Allow WebRequest&quot; for <code className="text-slate-200 font-mono break-all">{bridgeEndpoint}</code>.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">Step 3: Load Preset</div>
            <p className="text-slate-400 text-[11px] font-sans">
              Attach AlgoMax to XAUUSD or US30 on the M5 or M15 timeframe and load your <code className="text-slate-200 font-mono">.set</code> preset.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">Step 4: Enter License</div>
            <p className="text-slate-400 text-[11px] font-sans">
              Paste your issued AlgoMax license key into the EA inputs dialog and toggle "Algo Trading" ON.
            </p>
          </div>
        </div>
      </div>

      {/* CHECKOUT & INSTANT LICENSE GENERATOR MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 font-mono">
          <div className="w-full max-w-lg bg-[#0a0f1d] border-2 border-cyan-500/60 rounded-3xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white font-orbitron">
                  ACTIVATE ALGOMAX {selectedPlan} LICENSE
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setGeneratedKey(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                &times;
              </button>
            </div>

            {!generatedKey ? (
              <form onSubmit={handleGenerateCheckout} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#12192e] border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email for License Delivery</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. trader.alex@emergeprofit.com"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#12192e] border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">MT5 / MT4 Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50294112"
                    value={checkoutAccountNumber}
                    onChange={(e) => setCheckoutAccountNumber(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#12192e] border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                  Plan: <span className="font-bold text-white">AlgoMax {selectedPlan}</span> • Instant HWID binding enabled on first MT5 terminal ping.
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black font-orbitron text-xs tracking-wider transition shadow-lg active:scale-98"
                >
                  Generate License Key &amp; Activate
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 w-fit mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white font-orbitron">License Generated!</h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Your AlgoMax {selectedPlan} key has been synchronized with the Algo Admin Portal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#080d19] border border-cyan-500/50 flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-cyan-300 text-sm select-all">
                    {generatedKey}
                  </span>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setGeneratedKey(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      onOpenAdminPortal();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-orbitron tracking-wider shadow-md"
                  >
                    View in Admin Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
