import React, { useMemo } from 'react';
import {
  MarketPrice,
  OrderHistoryItem,
  OrderSide,
  PendingOrder,
  Position,
  RobotStrategy,
  TerminalInstance,
  TradingSignal,
  WebhookLog,
} from '../../types/trading';
import { Activity, ArrowDownRight, ArrowUpRight, Bot, Gauge, Radio, Zap } from 'lucide-react';

interface MarketSentimentGaugeProps {
  selectedSymbol: string;
  price?: MarketPrice;
  signals: TradingSignal[];
  robots: RobotStrategy[];
  positions: Position[];
  pendingOrders: PendingOrder[];
  orderHistory: OrderHistoryItem[];
  webhookLogs: WebhookLog[];
  terminals: TerminalInstance[];
  ticksPerSecond: number;
  masterAutoTrading: boolean;
  onQuickOrder?: (side: OrderSide) => void;
}

const normalizeSymbol = (sym: string): string =>
  sym
    .trim()
    .toUpperCase()
    .replace(/(\.PRO|\.RAW|\.ECN|M)$/i, '')
    .replace(/[\/\-_\s]/g, '');

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

interface SentimentMetrics {
  normalizedSymbol: string;
  buyPressurePct: number;
  sellPressurePct: number;
  regimeLabel: string;
  regimeTone: 'emerald' | 'cyan' | 'amber' | 'rose';
  signalFrequencyScore: number; // 0..100 (50 neutral, >50 buy, <50 sell)
  botActivityScore: number; // 0..100
  priceMomentumScore: number; // 0..100
  symbolSignalsCount: number;
  deskSignalsCount: number;
  symbolBuySignals: number;
  symbolSellSignals: number;
  signalsPerMin: number;
  matchingBotsCount: number;
  activeBotsForSymbol: number;
  onlineAutoNodes: number;
  totalActiveEAs: number;
  buyLots: number;
  sellLots: number;
  webhookBurstCount: number;
  change24h: number;
  rangePositionPct: number;
}

export const MarketSentimentGauge: React.FC<MarketSentimentGaugeProps> = ({
  selectedSymbol,
  price,
  signals,
  robots,
  positions,
  pendingOrders,
  orderHistory,
  webhookLogs,
  terminals,
  ticksPerSecond,
  masterAutoTrading,
  onQuickOrder,
}) => {
  const metrics: SentimentMetrics = useMemo(() => {
    const targetNorm = normalizeSymbol(selectedSymbol);

    // 1. Signal frequency & directional pressure for selected symbol
    const symbolSignals = signals.filter(
      (s) => normalizeSymbol(s.symbol) === targetNorm
    );
    const symbolWebhooks = webhookLogs.filter(
      (w) => normalizeSymbol(w.symbol) === targetNorm
    );

    let weightedBuySignals = 0;
    let weightedSellSignals = 0;
    let symbolBuySignals = 0;
    let symbolSellSignals = 0;

    symbolSignals.forEach((sig) => {
      const statusWeight =
        sig.status === 'ACTIVE' ? 1.25 : sig.status === 'TRIGGERED' ? 1.0 : 0.4;
      const confWeight = clamp(sig.confidence / 100, 0.3, 1.0) * statusWeight;
      if (sig.side === 'BUY') {
        symbolBuySignals += 1;
        weightedBuySignals += confWeight;
      } else {
        symbolSellSignals += 1;
        weightedSellSignals += confWeight;
      }
    });

    symbolWebhooks.slice(0, 20).forEach((hook, idx) => {
      const recencyWeight = Math.max(0.25, 1 - idx * 0.05) * (hook.status === 'FAILED' ? 0.2 : 0.85);
      if (hook.action === 'BUY') {
        weightedBuySignals += recencyWeight;
      } else {
        weightedSellSignals += recencyWeight;
      }
    });

    // Blend subtle desk-wide signal bias if symbol has low sample count
    let deskBuy = 0;
    let deskSell = 0;
    signals.forEach((sig) => {
      const w = (sig.confidence / 100) * (sig.status === 'ACTIVE' ? 1 : 0.5);
      if (sig.side === 'BUY') deskBuy += w;
      else deskSell += w;
    });

    const symbolSignalTotal = weightedBuySignals + weightedSellSignals;
    const deskTotal = deskBuy + deskSell;

    const symbolSignalRatio =
      symbolSignalTotal > 0 ? weightedBuySignals / symbolSignalTotal : 0.5;
    const deskSignalRatio = deskTotal > 0 ? deskBuy / deskTotal : 0.5;

    // Weight symbol signals heavily when present; retain slight desk context
    const signalConfidenceWeight = clamp(symbolSignalTotal / 2.5, 0.25, 1);
    const blendedSignalRatio =
      symbolSignalRatio * signalConfidenceWeight +
      deskSignalRatio * (1 - signalConfidenceWeight);
    const signalFrequencyScore = Math.round(clamp(blendedSignalRatio * 100, 5, 95));

    // Real-time signals/min cadence combining symbol signal density, webhook bursts & live tick throughput
    const activeSymbolSignals = symbolSignals.filter((s) => s.status !== 'EXPIRED').length;
    const signalsPerMin = Number(
      (
        activeSymbolSignals * 2.4 +
        symbolWebhooks.length * 1.1 +
        (ticksPerSecond > 0 ? Math.min(ticksPerSecond * 0.35, 6.5) : 0) +
        (masterAutoTrading ? 1.8 : 0.4)
      ).toFixed(1)
    );

    // 2. Bot activity & order flow pressure for selected symbol
    const matchingRobots = robots.filter((bot) =>
      bot.pairs.some(
        (pair) => pair.toUpperCase() === 'ALL' || normalizeSymbol(pair) === targetNorm
      )
    );
    const activeBots = matchingRobots.filter((b) => b.activeStatus === 'ACTIVE');
    const onlineAutoTerminals = terminals.filter(
      (t) => t.status === 'ONLINE' && t.autoTrading
    );
    const totalActiveEAs = onlineAutoTerminals.reduce(
      (acc, t) => acc + t.activeEAs,
      0
    );

    let buyLots = 0;
    let sellLots = 0;

    positions
      .filter((p) => normalizeSymbol(p.symbol) === targetNorm)
      .forEach((p) => {
        if (p.side === 'BUY') buyLots += p.lots * 1.4;
        else sellLots += p.lots * 1.4;
      });

    pendingOrders
      .filter((o) => normalizeSymbol(o.symbol) === targetNorm)
      .forEach((o) => {
        if (o.side === 'BUY') buyLots += o.lots * 0.85;
        else sellLots += o.lots * 0.85;
      });

    orderHistory
      .filter((h) => normalizeSymbol(h.symbol) === targetNorm)
      .slice(0, 12)
      .forEach((h, idx) => {
        const w = Math.max(0.2, 0.7 - idx * 0.05);
        if (h.side === 'BUY') buyLots += h.lots * w;
        else sellLots += h.lots * w;
      });

    // If no directional lots on selected symbol yet, project bot win-rate skew + auto-trading pulse
    const totalLots = buyLots + sellLots;
    const botStrengthFactor =
      activeBots.length > 0
        ? clamp(
            activeBots.reduce((sum, b) => sum + b.winRate, 0) /
              (activeBots.length * 100),
            0.4,
            0.9
          )
        : 0.5;

    let botActivityScore = 50;
    if (totalLots > 0) {
      const lotRatio = buyLots / totalLots;
      const intensityBoost = masterAutoTrading ? 1.05 : 0.92;
      botActivityScore = Math.round(
        clamp(50 + (lotRatio - 0.5) * 90 * intensityBoost, 8, 92)
      );
    } else {
      // Derive directional bias from active bots + signal direction when position book for pair is flat
      const biasDir = signalFrequencyScore >= 50 ? 1 : -1;
      botActivityScore = Math.round(
        clamp(
          50 + biasDir * (activeBots.length * 6 + (masterAutoTrading ? 8 : 2)) * botStrengthFactor,
          18,
          82
        )
      );
    }

    // 3. Live price micro-momentum (24h delta + intraday range placement)
    const change24h = price?.change24h ?? 0;
    let rangePositionPct = 50;
    if (price && price.high > price.low) {
      rangePositionPct = clamp(
        ((price.bid - price.low) / (price.high - price.low)) * 100,
        0,
        100
      );
    }
    const deltaScore = clamp(50 + change24h * 16, 10, 90);
    const priceMomentumScore = Math.round(
      clamp(deltaScore * 0.55 + rangePositionPct * 0.45, 5, 95)
    );

    // Composite weighted real-time Buy Pressure (0..100)
    const compositeBuy = Math.round(
      clamp(
        signalFrequencyScore * 0.42 +
          botActivityScore * 0.35 +
          priceMomentumScore * 0.23,
        4,
        96
      )
    );
    const compositeSell = 100 - compositeBuy;

    let regimeLabel = 'Neutral Equilibrium';
    let regimeTone: SentimentMetrics['regimeTone'] = 'amber';
    if (compositeBuy >= 68) {
      regimeLabel = 'Strong Buy Pressure';
      regimeTone = 'emerald';
    } else if (compositeBuy >= 56) {
      regimeLabel = 'Bullish Bias';
      regimeTone = 'cyan';
    } else if (compositeBuy <= 32) {
      regimeLabel = 'Strong Sell Pressure';
      regimeTone = 'rose';
    } else if (compositeBuy <= 44) {
      regimeLabel = 'Bearish Bias';
      regimeTone = 'rose';
    }

    return {
      normalizedSymbol: targetNorm,
      buyPressurePct: compositeBuy,
      sellPressurePct: compositeSell,
      regimeLabel,
      regimeTone,
      signalFrequencyScore,
      botActivityScore,
      priceMomentumScore,
      symbolSignalsCount: symbolSignals.length,
      deskSignalsCount: signals.length,
      symbolBuySignals,
      symbolSellSignals,
      signalsPerMin,
      matchingBotsCount: matchingRobots.length,
      activeBotsForSymbol: activeBots.length,
      onlineAutoNodes: onlineAutoTerminals.length,
      totalActiveEAs,
      buyLots: Number(buyLots.toFixed(2)),
      sellLots: Number(sellLots.toFixed(2)),
      webhookBurstCount: symbolWebhooks.length,
      change24h,
      rangePositionPct: Math.round(rangePositionPct),
    };
  }, [
    selectedSymbol,
    price,
    signals,
    robots,
    positions,
    pendingOrders,
    orderHistory,
    webhookLogs,
    terminals,
    ticksPerSecond,
    masterAutoTrading,
  ]);

  // SVG semicircular arc calculations
  const radius = 92;
  const cx = 130;
  const cy = 114;
  const circumference = Math.PI * radius; // semicircle length
  const buyFillLength = (metrics.buyPressurePct / 100) * circumference;
  // Needle angle: -90deg = 0% Buy (full Sell left), 0deg = 50% (top center), +90deg = 100% Buy (full Buy right)
  const needleAngleDeg = (metrics.buyPressurePct / 100) * 180 - 90;

  const toneAccent = {
    emerald: {
      text: 'text-emerald-400',
      stroke: '#10b981',
      bar: 'bg-emerald-500',
    },
    cyan: {
      text: 'text-cyan-400',
      stroke: '#06b6d4',
      bar: 'bg-cyan-500',
    },
    amber: {
      text: 'text-amber-400',
      stroke: '#f59e0b',
      bar: 'bg-amber-500',
    },
    rose: {
      text: 'text-rose-400',
      stroke: '#f43f5e',
      bar: 'bg-rose-500',
    },
  }[metrics.regimeTone];

  return (
    <section
      aria-label={`Market Sentiment Gauge for ${selectedSymbol}`}
      className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 sm:p-5"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#161D2B] border border-white/[0.08] flex items-center justify-center text-cyan-400 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-sans font-bold text-white tracking-tight">
                Market Sentiment Gauge
              </h3>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {selectedSymbol}
              </span>
              {price && (
                <>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {price.bid.toFixed(price.digits)} / {price.ask.toFixed(price.digits)}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Real-time buy/sell order-flow pressure from signal cadence, EA node activity &amp; tick momentum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-sans uppercase tracking-wider text-slate-500 block">
              Composite Regime
            </span>
            <span className={`text-xs font-sans font-bold ${toneAccent.text}`}>
              {metrics.regimeLabel}
            </span>
          </div>

          {onQuickOrder && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onQuickOrder('BUY')}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>BUY</span>
              </button>
              <button
                type="button"
                onClick={() => onQuickOrder('SELL')}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-sans font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>SELL</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Gauge + Real-Time Pressure Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-center">
        {/* Semicircular Precision Gauge (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <div
            className="w-full max-w-[270px] relative"
            role="meter"
            aria-label={`${selectedSymbol} buy pressure ${metrics.buyPressurePct}% versus sell pressure ${metrics.sellPressurePct}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metrics.buyPressurePct}
          >
            <svg viewBox="0 0 260 144" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="sentimentTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.32" />
                </linearGradient>
                <linearGradient id="sentimentActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="48%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Semicircle Track */}
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none"
                stroke="url(#sentimentTrackGrad)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Active Pressure Arc */}
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none"
                stroke="url(#sentimentActiveGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference - buyFillLength}
                className="transition-all duration-500 ease-out"
              />

              {/* Tick Marks (0, 25, 50, 75, 100) */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const rad = ((pct / 100) * 180 - 180) * (Math.PI / 180);
                const x1 = cx + Math.cos(rad) * (radius - 13);
                const y1 = cy + Math.sin(rad) * (radius - 13);
                const x2 = cx + Math.cos(rad) * (radius - 19);
                const y2 = cy + Math.sin(rad) * (radius - 19);
                return (
                  <line
                    key={pct}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(148, 163, 184, 0.4)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Center Pivot & Needle */}
              <g
                transform={`rotate(${needleAngleDeg} ${cx} ${cy})`}
                className="transition-transform duration-500 ease-out"
              >
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={cy - (radius - 18)}
                  stroke={toneAccent.stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle
                  cx={cx}
                  cy={cy - (radius - 18)}
                  r="3.2"
                  fill={toneAccent.stroke}
                />
              </g>
              <circle
                cx={cx}
                cy={cy}
                r="6"
                fill="#0F141E"
                stroke={toneAccent.stroke}
                strokeWidth="2.5"
              />

              {/* Scale End Labels */}
              <text
                x={cx - radius}
                y={cy + 20}
                textAnchor="middle"
                fill="#fb7185"
                fontSize="10"
                fontWeight="700"
                fontFamily="monospace"
              >
                SELL
              </text>
              <text
                x={cx}
                y={cy - radius - 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="700"
                fontFamily="monospace"
              >
                50% NEUTRAL
              </text>
              <text
                x={cx + radius}
                y={cy + 20}
                textAnchor="middle"
                fill="#34d399"
                fontSize="10"
                fontWeight="700"
                fontFamily="monospace"
              >
                BUY
              </text>
            </svg>

            {/* Numeric Gauge Center Readout */}
            <div className="flex items-baseline justify-center gap-3 -mt-2">
              <div className="text-center">
                <span className="text-[10px] font-sans text-slate-500 block uppercase">
                  Sell
                </span>
                <span className="text-base font-mono font-bold text-rose-400 tabular-nums">
                  {metrics.sellPressurePct}%
                </span>
              </div>
              <span className="text-slate-700 font-mono text-sm">/</span>
              <div className="text-center">
                <span className="text-[10px] font-sans text-slate-500 block uppercase">
                  Buy
                </span>
                <span className="text-2xl font-mono font-black text-emerald-400 tabular-nums">
                  {metrics.buyPressurePct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Balance Bar, 4-Col Hairline Telemetry & Driver Breakdown (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Split Buy vs Sell Pressure Balance Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-rose-400 font-bold">
                SELL PRESSURE {metrics.sellPressurePct}%
              </span>
              <span className="text-[11px] font-sans text-slate-400">
                {metrics.normalizedSymbol} Live Order-Flow Balance
              </span>
              <span className="text-emerald-400 font-bold">
                BUY PRESSURE {metrics.buyPressurePct}%
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-[#161D2B] overflow-hidden flex border border-white/[0.06]">
              <div
                className="h-full bg-rose-500/85 transition-all duration-500 ease-out"
                style={{ width: `${metrics.sellPressurePct}%` }}
              />
              <div className="w-[2px] h-full bg-[#090C12] shrink-0" />
              <div
                className="h-full bg-emerald-500/90 transition-all duration-500 ease-out"
                style={{ width: `${metrics.buyPressurePct}%` }}
              />
            </div>
          </div>

          {/* 4-Column Unboxed Hairline Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border-y border-white/[0.08] py-3">
            <div className="pr-3 pb-2 sm:pb-0">
              <span className="text-[10px] font-sans text-slate-500 flex items-center gap-1 uppercase">
                <Radio className="w-3 h-3 text-cyan-400" /> Signal Frequency
              </span>
              <div className="text-base font-mono font-bold text-white tabular-nums mt-0.5">
                {metrics.signalsPerMin}/min
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {metrics.symbolBuySignals}B · {metrics.symbolSellSignals}S ({metrics.symbolSignalsCount} pair / {metrics.deskSignalsCount} desk)
              </span>
            </div>

            <div className="sm:px-3 pb-2 sm:pb-0">
              <span className="text-[10px] font-sans text-slate-500 flex items-center gap-1 uppercase">
                <Bot className="w-3 h-3 text-amber-400" /> Bot Activity
              </span>
              <div className="text-base font-mono font-bold text-white tabular-nums mt-0.5">
                {metrics.activeBotsForSymbol} / {metrics.matchingBotsCount} EAs
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {metrics.onlineAutoNodes} auto nodes · {metrics.totalActiveEAs} instances
              </span>
            </div>

            <div className="sm:px-3 pt-2 sm:pt-0">
              <span className="text-[10px] font-sans text-slate-500 flex items-center gap-1 uppercase">
                <Zap className="w-3 h-3 text-emerald-400" /> Net Lot Flow
              </span>
              <div className="text-base font-mono font-bold text-white tabular-nums mt-0.5">
                {metrics.buyLots.toFixed(2)}B / {metrics.sellLots.toFixed(2)}S
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {metrics.webhookBurstCount} webhooks routed
              </span>
            </div>

            <div className="sm:pl-3 pt-2 sm:pt-0">
              <span className="text-[10px] font-sans text-slate-500 flex items-center gap-1 uppercase">
                <Activity className="w-3 h-3 text-amber-400" /> Tick Momentum
              </span>
              <div
                className={`text-base font-mono font-bold tabular-nums mt-0.5 ${
                  metrics.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.change24h >= 0 ? '+' : ''}
                {metrics.change24h.toFixed(2)}%
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {metrics.rangePositionPct}% intraday range · {ticksPerSecond} t/s
              </span>
            </div>
          </div>

          {/* 3-Driver Sentiment Breakdown Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {[
              {
                label: 'Signal Flow Bias',
                score: metrics.signalFrequencyScore,
                weight: '42% wt',
              },
              {
                label: 'Bot & Lot Activity',
                score: metrics.botActivityScore,
                weight: '35% wt',
              },
              {
                label: 'Price Momentum',
                score: metrics.priceMomentumScore,
                weight: '23% wt',
              },
            ].map((driver) => {
              const isBull = driver.score >= 50;
              return (
                <div key={driver.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-sans">
                    <span className="text-slate-300 font-medium">{driver.label}</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        isBull ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {driver.score}% {isBull ? 'BUY' : 'SELL'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#161D2B] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBull ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${driver.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block">
                    Model weight: {driver.weight}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
