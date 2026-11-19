import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { EmergeCertificateModal } from './EmergeCertificateModal';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const EmergePropView: React.FC = () => {
  const { challenge, resetChallenge, simulatePropPass, accountEquity, orderHistory } = useTrading();
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [selectedCapital, setSelectedCapital] = useState<number>(challenge.initialBalance);
  const [selectedPhase, setSelectedPhase] = useState<'1-PHASE' | '2-PHASE' | 'INSTANT_FUNDED'>(challenge.accountType);

  const handleApplyChallenge = () => {
    resetChallenge(selectedPhase, selectedCapital);
  };

  const handleSimulatePass = () => {
    simulatePropPass();
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#06b6d4', '#6366f1'],
      });
    } catch {
      // Confetti fallback
    }
    setTimeout(() => {
      setIsCertificateOpen(true);
    }, 600);
  };

  // Calculations for Drawdown & Profit Target
  const profitTargetPct = challenge.profitTargetPct;
  const currentProfitPct = Number(((challenge.currentProfit / challenge.initialBalance) * 100).toFixed(2));
  const profitProgressPct = Math.min(100, Math.max(0, (challenge.currentProfit / challenge.profitTargetAmount) * 100));

  // Daily Drawdown: starting equity vs current equity
  const dailyDrawdownUSD = Math.max(0, challenge.dailyStartingEquity - accountEquity);
  const dailyDrawdownPct = Number(((dailyDrawdownUSD / challenge.dailyStartingEquity) * 100).toFixed(2));
  const dailyRemainingBufferUSD = Math.max(0, challenge.maxDailyLossAmount - dailyDrawdownUSD);

  // Overall Trailing Drawdown
  const totalDrawdownUSD = Math.max(0, challenge.initialBalance - accountEquity);
  const totalDrawdownPct = Number(((totalDrawdownUSD / challenge.initialBalance) * 100).toFixed(2));
  const totalRemainingBufferUSD = Math.max(0, challenge.maxTotalLossAmount - totalDrawdownUSD);

  const consistencyStats = useMemo(() => {
    const winningTrades = orderHistory.filter((o) => o.profit > 0);
    const totalWinProfit = winningTrades.reduce((sum, o) => sum + o.profit, 0);
    if (totalWinProfit <= 0) {
      return { passed: true, label: '0.0% (READY)' };
    }
    const maxSingle = Math.max(...winningTrades.map((o) => o.profit));
    const pct = (maxSingle / totalWinProfit) * 100;
    const passed = pct <= 50;
    return {
      passed,
      label: `${passed ? 'PASSED' : 'ALERT'} (${pct.toFixed(1)}%)`,
    };
  }, [orderHistory]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#17130a] via-[#10141d] to-[#0c1424] border border-amber-500/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Emerge Profit • EmergeFX Prop Evaluation Suite</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Institutional Funded Evaluation Desk
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time evaluation compliance tracker. Pass the algorithmic evaluation on ThinkMarkets DXtrade, cTrader, or MetaTrader 5 and unlock up to $200,000 in funded capital with 90% profit splits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleSimulatePass}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider rounded-xl transition shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Verify Milestone & Certificate</span>
            </button>
            {challenge.status === 'PASSED' && (
              <button
                onClick={() => setIsCertificateOpen(true)}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Challenge Configuration Bar */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          <div className="text-xs text-slate-400">
            <span className="text-slate-500 block text-[10px] uppercase">Challenge Model</span>
            <div className="flex gap-1 mt-1 overflow-x-auto no-scrollbar">
              {(['1-PHASE', '2-PHASE', 'INSTANT_FUNDED'] as const).map((ph) => (
                <button
                  key={ph}
                  onClick={() => setSelectedPhase(ph)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap min-h-[38px] ${
                    selectedPhase === ph ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {ph.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            <span className="text-slate-500 block text-[10px] uppercase">Account Size</span>
            <div className="flex gap-1 mt-1 overflow-x-auto no-scrollbar">
              {[10000, 25000, 50000, 100000, 200000].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setSelectedCapital(cap)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap min-h-[38px] ${
                    selectedCapital === cap ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ${cap / 1000}k
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleApplyChallenge}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Apply / Reset Challenge</span>
        </button>
      </div>

      {/* Primary Metrics: Drawdown & Profit Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono tabular-nums">
        {/* Metric 1: Profit Target */}
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Profit Target ({profitTargetPct}%)
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              challenge.status === 'PASSED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
            }`}>
              {challenge.status}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">
                ${challenge.currentProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">
                Target: ${challenge.profitTargetAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              +{currentProfitPct}% achieved of {profitTargetPct}% target
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${profitProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$0.00</span>
              <span>{profitProgressPct.toFixed(1)}% Completed</span>
              <span>${challenge.profitTargetAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Daily Loss Limit (4%) */}
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Daily Loss Limit ({challenge.maxDailyLossPct}%)
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              dailyDrawdownPct >= challenge.maxDailyLossPct * 0.75
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {dailyDrawdownPct >= challenge.maxDailyLossPct * 0.75 ? 'CAUTION' : 'SAFE'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100">
                ${dailyRemainingBufferUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">
                Max Loss: ${challenge.maxDailyLossAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Remaining daily buffer before rule breach
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (dailyDrawdownUSD / challenge.maxDailyLossAmount) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Today Loss: ${dailyDrawdownUSD.toFixed(2)}</span>
              <span>Used: {dailyDrawdownPct.toFixed(1)}%</span>
              <span>Ceiling: ${challenge.maxDailyLossAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Max Total Drawdown (8%) */}
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Max Trailing Drawdown ({challenge.maxTotalLossPct}%)
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              totalDrawdownPct >= challenge.maxTotalLossPct * 0.75
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {totalDrawdownPct >= challenge.maxTotalLossPct * 0.75 ? 'CAUTION' : 'SAFE'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100">
                ${totalRemainingBufferUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">
                Max Loss: ${challenge.maxTotalLossAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Overall drawdown buffer from starting balance
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalDrawdownUSD / challenge.maxTotalLossAmount) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>D/D: ${totalDrawdownUSD.toFixed(2)}</span>
              <span>Buffer Left: {Math.max(0, 100 - (totalDrawdownUSD / challenge.maxTotalLossAmount) * 100).toFixed(1)}%</span>
              <span>Floor: ${(challenge.initialBalance - challenge.maxTotalLossAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Rules Checklist & Account Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Rules Checklist */}
        <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Emerge Compliance & Rule Checker</span>
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-[#111622] border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-200 font-semibold">Minimum Trading Days</div>
                  <div className="text-[11px] text-slate-400">Requires at least 5 distinct trading sessions</div>
                </div>
              </div>
              <span className="text-emerald-400 font-bold">{challenge.daysTraded} / {challenge.minTradingDays} Days</span>
            </div>

            <div className="p-3 bg-[#111622] border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-200 font-semibold">Algorithmic & EA Trading</div>
                  <div className="text-[11px] text-slate-400">EasyWay2Trade and custom EAs 100% permitted</div>
                </div>
              </div>
              <span className="text-emerald-400 font-bold">ALLOWED</span>
            </div>

            <div className="p-3 bg-[#111622] border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-200 font-semibold">Weekend & Overnight Holding</div>
                  <div className="text-[11px] text-slate-400">Positions may remain open across sessions</div>
                </div>
              </div>
              <span className="text-emerald-400 font-bold">PERMITTED</span>
            </div>

            <div className="p-3 bg-[#111622] border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-200 font-semibold">Consistency Score Guard</div>
                  <div className="text-[11px] text-slate-400">No single trade accounts for &gt;50% of total profits</div>
                </div>
              </div>
              <span className={`${consistencyStats.passed ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>
                {consistencyStats.label}
              </span>
            </div>
          </div>
        </div>

        {/* Credentials & Account Allocation Details */}
        <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Funded Account Allocation Status</span>
          </h4>

          <div className="p-4 bg-[#111622] border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Account ID:</span>
              <span className="text-slate-100 font-bold">{challenge.challengeNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Trading Broker & Server:</span>
              <span className="text-cyan-300 font-semibold">{challenge.platform}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Profit Split Once Funded:</span>
              <span className="text-emerald-400 font-bold">90% Trader / 10% Prop Firm</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Payout Cycle:</span>
              <span className="text-slate-200">Bi-Weekly On-Demand Crypto / Bank Wire</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${challenge.status === 'PASSED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {challenge.status === 'PASSED' ? 'EVALUATION PASSED • FUNDED CONTRACT READY' : 'ACTIVE IN EVALUATION'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] leading-relaxed">
            💡 EasyWay2Trade bots (Endgame EA and Shadow River) are pre-configured with the exact risk presets for this Emerge account size.
          </div>
        </div>
      </div>

      {/* Official Certificate Modal */}
      <EmergeCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        accountNumber={challenge.challengeNumber}
        fundedAmount={challenge.initialBalance}
      />
    </div>
  );
};
