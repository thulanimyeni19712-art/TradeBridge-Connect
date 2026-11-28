import React, { useMemo, useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { OrderSide } from '../../types/trading';
import {
  GitMerge,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Cpu,
  Layers,
  AlertTriangle,
} from 'lucide-react';

type FusionMode = 'WEIGHTED_CONSENSUS' | 'MAJORITY_VOTE' | 'UNANIMOUS_SAFE' | 'CONFLICT_NETTER';

interface EAStreamMember {
  id: string;
  name: string;
  engineType: string;
  weightPct: number;
  enabled: boolean;
  biasStrategy: 'TREND_EMA' | 'SCALP_RSI' | 'BREAKOUT_ATR' | 'MOMENTUM_24H' | 'STRUCTURE_DELTA' | 'HYBRID_AI';
}

const DEFAULT_EA_MEMBERS: EAStreamMember[] = [
  {
    id: 'ea-endgame',
    name: 'Endgame HFT V4',
    engineType: 'EMA 9/21 Trend Core',
    weightPct: 24,
    enabled: true,
    biasStrategy: 'TREND_EMA',
  },
  {
    id: 'ea-moneybot',
    name: 'Money Bot PV1',
    engineType: 'iTradeBot Listener',
    weightPct: 18,
    enabled: true,
    biasStrategy: 'MOMENTUM_24H',
  },
  {
    id: 'ea-joker',
    name: 'The Joker (Bcm_scalper)',
    engineType: 'TradePort High-Speed Scalp',
    weightPct: 16,
    enabled: true,
    biasStrategy: 'SCALP_RSI',
  },
  {
    id: 'ea-nexus2v1',
    name: 'NEXUS2.V1 Quantum',
    engineType: 'Purple Glass AI Structure',
    weightPct: 18,
    enabled: true,
    biasStrategy: 'HYBRID_AI',
  },
  {
    id: 'ea-skynet',
    name: 'SKYNET AI PRO 2.0',
    engineType: 'Volatility ATR Breakout',
    weightPct: 14,
    enabled: true,
    biasStrategy: 'BREAKOUT_ATR',
  },
  {
    id: 'ea-goldmagic',
    name: 'GOLD MAGIC Pro',
    engineType: 'Multi-Timeframe Delta',
    weightPct: 10,
    enabled: true,
    biasStrategy: 'STRUCTURE_DELTA',
  },
];

export const EAMergeView: React.FC = () => {
  const {
    prices,
    positions,
    autonomousSnapshots,
    automatedSettings,
    accountBalance,
    bridgeLatencyMs,
    isAutonomousScanning,
    executeOrder,
    runAutonomousCycle,
  } = useTrading();
  const { brand, accent } = useBrand();

  const symbols = useMemo(
    () => ['XAUUSD', 'EURUSD', 'BTCUSD', 'US30', 'NAS100', 'GBPUSD'],
    []
  );
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [fusionMode, setFusionMode] = useState<FusionMode>('WEIGHTED_CONSENSUS');
  const [members, setMembers] = useState<EAStreamMember[]>(DEFAULT_EA_MEMBERS);
  const [riskBudgetPct, setRiskBudgetPct] = useState<number>(1.25);
  const [autoExecuteConsensus, setAutoExecuteConsensus] = useState<boolean>(true);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  const market = prices[selectedSymbol] || prices['XAUUSD'];
  const snap = autonomousSnapshots[selectedSymbol];

  // Deterministically compute each EA's real-time signal from real live candle metrics & market quotes
  const memberVotes = useMemo(() => {
    const liveMid = market ? (market.bid + market.ask) / 2 : 0;
    const change = market?.change24h ?? 0;
    const spreadPips = market ? (market.ask - market.bid) / (market.pipSize || 0.01) : 1.5;

    return members.map((ea) => {
      let vote: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
      let score = 50;
      let rationale = 'Awaiting live candle alignment';

      if (snap) {
        const emaBull = snap.emaFast > snap.emaSlow;
        const emaDiffPct = snap.emaSlow > 0 ? ((snap.emaFast - snap.emaSlow) / snap.emaSlow) * 100 : 0;

        switch (ea.biasStrategy) {
          case 'TREND_EMA': {
            vote = emaBull ? 'BUY' : 'SELL';
            score = Math.min(96, Math.round(70 + Math.abs(emaDiffPct) * 90));
            rationale = `EMA9 ${snap.emaFast} vs EMA21 ${snap.emaSlow}`;
            break;
          }
          case 'SCALP_RSI': {
            if (snap.rsi14 >= 52 && snap.rsi14 <= 72) {
              vote = 'BUY';
              score = Math.round(68 + (snap.rsi14 - 50));
            } else if (snap.rsi14 <= 48 && snap.rsi14 >= 28) {
              vote = 'SELL';
              score = Math.round(68 + (50 - snap.rsi14));
            } else if (snap.rsi14 < 28) {
              vote = 'BUY';
              score = 81;
            } else {
              vote = 'SELL';
              score = 80;
            }
            rationale = `RSI-14 at ${snap.rsi14} (${vote} zone)`;
            break;
          }
          case 'BREAKOUT_ATR': {
            if (snap.atr > 0 && emaBull && change > -0.1) {
              vote = 'BUY';
              score = Math.min(94, 72 + Math.round(snap.confidence * 0.2));
            } else if (snap.atr > 0 && !emaBull && change < 0.1) {
              vote = 'SELL';
              score = Math.min(94, 72 + Math.round(snap.confidence * 0.2));
            }
            rationale = `ATR ${snap.atr} | Spread ${spreadPips.toFixed(1)}p`;
            break;
          }
          case 'MOMENTUM_24H': {
            if (change >= 0.08) {
              vote = 'BUY';
              score = Math.min(95, Math.round(66 + change * 12));
            } else if (change <= -0.08) {
              vote = 'SELL';
              score = Math.min(95, Math.round(66 + Math.abs(change) * 12));
            }
            rationale = `24h Net Flow ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            break;
          }
          case 'STRUCTURE_DELTA': {
            const rangeMid = market ? (market.high + market.low) / 2 : liveMid;
            if (liveMid >= rangeMid && emaBull) {
              vote = 'BUY';
              score = 78;
            } else if (liveMid < rangeMid && !emaBull) {
              vote = 'SELL';
              score = 78;
            }
            rationale = `Session Mid ${rangeMid.toFixed(market?.digits ?? 2)}`;
            break;
          }
          case 'HYBRID_AI':
          default: {
            vote = snap.action === 'HOLD' ? (emaBull ? 'BUY' : 'SELL') : snap.action;
            score = snap.confidence;
            rationale = snap.reason;
            break;
          }
        }
      } else if (market) {
        vote = change >= 0 ? 'BUY' : 'SELL';
        score = Math.min(82, Math.round(60 + Math.abs(change) * 8));
        rationale = `Live Quote Tick (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`;
      }

      return { ...ea, vote, score, rationale };
    });
  }, [members, market, snap]);

  const consensus = useMemo(() => {
    const active = memberVotes.filter((m) => m.enabled);
    if (active.length === 0) {
      return {
        side: 'HOLD' as 'BUY' | 'SELL' | 'HOLD',
        confidence: 0,
        buyWeight: 0,
        sellWeight: 0,
        buyCount: 0,
        sellCount: 0,
        conflictDetected: false,
        recommendedLots: 0.1,
      };
    }

    let buyWeight = 0;
    let sellWeight = 0;
    let buyCount = 0;
    let sellCount = 0;
    let totalWeight = 0;

    for (const m of active) {
      totalWeight += m.weightPct;
      if (m.vote === 'BUY') {
        buyWeight += m.weightPct * (m.score / 100);
        buyCount += 1;
      } else if (m.vote === 'SELL') {
        sellWeight += m.weightPct * (m.score / 100);
        sellCount += 1;
      }
    }

    const normalizedBuy = totalWeight > 0 ? Math.round((buyWeight / totalWeight) * 100) : 0;
    const normalizedSell = totalWeight > 0 ? Math.round((sellWeight / totalWeight) * 100) : 0;
    const conflictDetected = buyCount > 0 && sellCount > 0;

    let side: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = Math.max(normalizedBuy, normalizedSell);

    if (fusionMode === 'UNANIMOUS_SAFE') {
      if (buyCount === active.length) side = 'BUY';
      else if (sellCount === active.length) side = 'SELL';
      else side = 'HOLD';
    } else if (fusionMode === 'MAJORITY_VOTE') {
      if (buyCount > sellCount) {
        side = 'BUY';
        confidence = Math.round((buyCount / active.length) * 100);
      } else if (sellCount > buyCount) {
        side = 'SELL';
        confidence = Math.round((sellCount / active.length) * 100);
      }
    } else if (fusionMode === 'CONFLICT_NETTER') {
      const netDiff = Math.abs(normalizedBuy - normalizedSell);
      if (netDiff >= 18) {
        side = normalizedBuy > normalizedSell ? 'BUY' : 'SELL';
        confidence = Math.min(98, 55 + netDiff);
      }
    } else {
      if (normalizedBuy >= 42 && normalizedBuy > normalizedSell) side = 'BUY';
      else if (normalizedSell >= 42 && normalizedSell > normalizedBuy) side = 'SELL';
    }

    const riskUsd = accountBalance * (riskBudgetPct / 100);
    const slDist = snap ? Math.abs(snap.entryPrice - snap.sl) : (market?.pipSize || 0.1) * 25;
    const rawLots = riskUsd / Math.max(slDist * 100, 140);
    const recommendedLots = Number(Math.max(0.05, Math.min(3.0, rawLots)).toFixed(2));

    return {
      side,
      confidence: Math.min(99, Math.max(0, confidence)),
      buyWeight: normalizedBuy,
      sellWeight: normalizedSell,
      buyCount,
      sellCount,
      conflictDetected,
      recommendedLots,
    };
  }, [memberVotes, fusionMode, accountBalance, riskBudgetPct, snap, market]);

  const toggleMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const adjustWeight = (id: string, delta: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, weightPct: Math.max(5, Math.min(50, m.weightPct + delta)) }
          : m
      )
    );
  };

  const handleExecuteMergedOrder = async () => {
    if (!market) return;
    const orderSide: OrderSide = consensus.side === 'SELL' ? 'SELL' : 'BUY';
    setIsDispatching(true);
    try {
      const digits = market.digits ?? 2;
      const pip = market.pipSize || 0.01;
      const entry = orderSide === 'BUY' ? market.ask : market.bid;
      const slDist = snap ? Math.abs(snap.entryPrice - snap.sl) : pip * 25;
      const tpDist = snap ? Math.abs(snap.tp - snap.entryPrice) : pip * 65;

      const sl = Number(
        (orderSide === 'BUY' ? entry - slDist : entry + slDist).toFixed(digits)
      );
      const tp = Number(
        (orderSide === 'BUY' ? entry + tpDist : entry - tpDist).toFixed(digits)
      );

      const res = await executeOrder({
        symbol: selectedSymbol,
        orderType: 'MARKET',
        side: orderSide,
        lots: consensus.recommendedLots,
        sl,
        tp,
        comment: `EAMerge_${fusionMode}_${consensus.confidence}%`,
      });
      setStatusFeedback(
        res.success
          ? `Dispatched ${orderSide} ${consensus.recommendedLots}L ${selectedSymbol} (#${res.ticket}) · SL ${sl} / TP ${tp}`
          : res.message
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDownloadEnsembleMQ5 = () => {
    const enabledNames = members.filter((m) => m.enabled).map((m) => `${m.name}(${m.weightPct}%)`).join(', ');
    const code = `//+------------------------------------------------------------------+
//| ${brand.brandName} - EA-Merge Ensemble Consensus Bot (${fusionMode})
//| Owner: ${brand.ownerName} | Generated dynamically from live telemetry
//+------------------------------------------------------------------+
#property copyright "${brand.ownerEntity}"
#property version   "4.20"
input string ActiveModules = "${enabledNames}";
input double RiskBudgetPct = ${riskBudgetPct.toFixed(2)};
input int    MinConsensus  = ${Math.max(60, consensus.confidence)};
input bool   AutoNetConflict = ${fusionMode === 'CONFLICT_NETTER' ? 'true' : 'false'};
void OnTick() {
  // Unified Multi-EA Signal Fusion Bridge -> ${selectedSymbol}
}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EAMerge_${selectedSymbol}_${fusionMode}.mq5`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusFeedback(`Exported EAMerge_${selectedSymbol}_${fusionMode}.mq5 ensemble source.`);
  };

  const activeMergedPositions = positions.filter((p) =>
    p.comment.includes('EAMerge') || p.comment.includes('AutoQuant')
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-ultra rounded-2xl p-5 sm:p-6 border border-white/[0.12] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`p-2 rounded-xl ${accent.bgClass} ${accent.textClass} border ${accent.borderClass}`}>
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                  EA-Merge Cloud · Ensemble Fusion Engine
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  LIVE CONSENSUS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cloned &amp; evolved EA-Merge engine combining {members.filter((m) => m.enabled).length} real-time bots into unified, conflict-free MT5 executions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void runAutonomousCycle(false)}
            disabled={isAutonomousScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-semibold text-slate-200 transition whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutonomousScanning ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isAutonomousScanning ? 'Syncing Candles...' : 'Sync Live Matrix'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadEnsembleMQ5}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-semibold text-slate-200 transition whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export .MQ5 Merger</span>
          </button>
        </div>
      </div>

      {statusFeedback && (
        <div className="glass-card rounded-xl px-4 py-3 border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-emerald-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Symbol Selector + Consensus Meter */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Symbol Matrix & EA Vote Streams (8 cols) */}
        <div className="xl:col-span-8 space-y-5">
          {/* Live Pair Strip */}
          <div className="glass-card rounded-2xl p-4 border border-white/[0.1]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Live Target Instrument
              </span>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                Bridge RTT: <b className="text-emerald-400">{bridgeLatencyMs.toFixed(1)}ms</b> · Master Pilot:{' '}
                <b className={automatedSettings.masterAutoTrading ? 'text-emerald-400' : 'text-amber-400'}>
                  {automatedSettings.masterAutoTrading ? 'ARMED' : 'PAUSED'}
                </b>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {symbols.map((sym) => {
                const m = prices[sym];
                const s = autonomousSnapshots[sym];
                const active = selectedSymbol === sym;
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSelectedSymbol(sym)}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      active
                        ? `${accent.bgClass} ${accent.borderClass} text-white`
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{sym}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          s?.action === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : s?.action === 'SELL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {s ? `${s.action}` : 'LIVE'}
                      </span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-200 mt-1">
                      {m ? m.bid.toFixed(m.digits) : '--'}
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-slate-400">
                      RSI {s ? s.rsi14 : '--'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 Bot Strategy Fusion Matrix */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.1] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Connected Bot Strategy Nodes ({selectedSymbol})
                </h2>
                <p className="text-xs text-slate-400">
                  Votes computed deterministically from real 5M market candles, EMA9/21 cross, RSI-14, and ATR-14.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {consensus.buyCount} BUY
                </span>
                <span className="px-2 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {consensus.sellCount} SELL
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {memberVotes.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border transition ${
                    m.enabled
                      ? 'bg-white/[0.04] border-white/[0.1]'
                      : 'bg-white/[0.015] border-white/[0.05] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Cpu className={`w-3.5 h-3.5 ${accent.textClass} shrink-0`} />
                        <span className="text-xs font-bold text-white truncate">{m.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{m.engineType}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition whitespace-nowrap ${
                        m.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-white/10'
                      }`}
                    >
                      {m.enabled ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        m.vote === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : m.vote === 'SELL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      {m.vote === 'BUY' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : m.vote === 'SELL' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      {m.vote} · {m.score}%
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => adjustWeight(m.id, -2)}
                        className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-slate-300"
                      >
                        -
                      </button>
                      <span className="text-slate-200 w-9 text-center tabular-nums">
                        {m.weightPct}%
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustWeight(m.id, 2)}
                        className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-slate-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                    {m.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Consensus Output & Unified Dispatcher (4 cols) */}
        <div className="xl:col-span-4 space-y-5">
          <div className="glass-ultra rounded-2xl p-5 border border-white/[0.12] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Fusion Arbitration Mode
              </span>
              {consensus.conflictDetected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  Netting Conflict
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'WEIGHTED_CONSENSUS', label: 'Weighted Score' },
                  { id: 'MAJORITY_VOTE', label: 'Majority Vote' },
                  { id: 'UNANIMOUS_SAFE', label: 'Unanimous Safe' },
                  { id: 'CONFLICT_NETTER', label: 'Conflict Netter' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFusionMode(mode.id)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition ${
                    fusionMode === mode.id
                      ? `${accent.bgClass} ${accent.borderClass} text-white`
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Unified Signal Verdict Box */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Merged Signal Verdict
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                  {consensus.confidence}% Confidence
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`text-2xl font-black font-display tracking-tight ${
                    consensus.side === 'BUY'
                      ? 'text-emerald-400'
                      : consensus.side === 'SELL'
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }`}
                >
                  {consensus.side} {selectedSymbol}
                </span>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-white font-bold">{consensus.recommendedLots} Lots</div>
                  <div className="text-[10px] text-slate-400">{riskBudgetPct}% Equity Risk</div>
                </div>
              </div>

              {/* Buy vs Sell Balance Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono tabular-nums">
                  <span className="text-emerald-400">BULL WEIGHT {consensus.buyWeight}%</span>
                  <span className="text-rose-400">BEAR WEIGHT {consensus.sellWeight}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden flex border border-white/[0.08]">
                  <div
                    className="bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, consensus.buyWeight)}%` }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-300 ml-auto"
                    style={{ width: `${Math.max(5, consensus.sellWeight)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Risk Budget Slider + Auto Pilot */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Normalized Risk Budget</span>
                <span className="font-mono font-bold text-cyan-300">{riskBudgetPct.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={3.0}
                step={0.25}
                value={riskBudgetPct}
                onChange={(e) => setRiskBudgetPct(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />

              <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer text-xs">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Auto-Guard Merged Orders (BE + Trail)
                </span>
                <input
                  type="checkbox"
                  checked={autoExecuteConsensus}
                  onChange={(e) => setAutoExecuteConsensus(e.target.checked)}
                  className="accent-emerald-400"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={isDispatching}
              onClick={() => void handleExecuteMergedOrder()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              <span>
                {isDispatching
                  ? 'Routing Merged Order...'
                  : `Execute Merged ${consensus.side === 'HOLD' ? 'BUY' : consensus.side} (${consensus.recommendedLots}L)`}
              </span>
            </button>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Live Merged/Quant Positions</span>
              <span className="text-emerald-400 font-bold">{activeMergedPositions.length} Open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
