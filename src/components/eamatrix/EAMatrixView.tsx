import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Smartphone,
  Cpu,
  ShieldCheck,
  Server,
  KeyRound,
  Activity,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Link2,
  Users,
  ArrowUpRight,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { OrderSide } from '../../types/trading';

interface MentorStrategy {
  id: string;
  mentorCode: string;
  name: string;
  author: string;
  pair: string;
  timeframe: string;
  monthlyReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  subscribers: number;
  verifiedDays: number;
  defaultSide: OrderSide;
  curve: Array<{ day: string; equity: number }>;
}

const MATRIX_MENTORS: MentorStrategy[] = [
  {
    id: 'm-gold',
    mentorCode: 'MTX-GOLD-901',
    name: 'London Sweep Matrix XAU',
    author: 'QuantDesk LD4',
    pair: 'XAUUSD',
    timeframe: 'M15',
    monthlyReturnPct: 14.8,
    maxDrawdownPct: 4.1,
    winRatePct: 74.2,
    profitFactor: 2.38,
    subscribers: 1284,
    verifiedDays: 312,
    defaultSide: 'BUY',
    curve: [
      { day: 'W1', equity: 10000 },
      { day: 'W2', equity: 10340 },
      { day: 'W3', equity: 10710 },
      { day: 'W4', equity: 10590 },
      { day: 'W5', equity: 11080 },
      { day: 'W6', equity: 11480 },
    ],
  },
  {
    id: 'm-us30',
    mentorCode: 'MTX-NY4-442',
    name: 'NY Open Momentum Core',
    author: 'Apex Index Lab',
    pair: 'US30',
    timeframe: 'M5',
    monthlyReturnPct: 18.4,
    maxDrawdownPct: 6.3,
    winRatePct: 68.5,
    profitFactor: 2.12,
    subscribers: 942,
    verifiedDays: 245,
    defaultSide: 'BUY',
    curve: [
      { day: 'W1', equity: 10000 },
      { day: 'W2', equity: 10490 },
      { day: 'W3', equity: 10280 },
      { day: 'W4', equity: 10940 },
      { day: 'W5', equity: 11420 },
      { day: 'W6', equity: 11840 },
    ],
  },
  {
    id: 'm-eur',
    mentorCode: 'MTX-FX-718',
    name: 'Precision Mean-Reversion FX',
    author: 'Zurich Algo Guild',
    pair: 'EURUSD',
    timeframe: 'H1',
    monthlyReturnPct: 8.6,
    maxDrawdownPct: 2.4,
    winRatePct: 79.1,
    profitFactor: 2.64,
    subscribers: 1640,
    verifiedDays: 428,
    defaultSide: 'SELL',
    curve: [
      { day: 'W1', equity: 10000 },
      { day: 'W2', equity: 10180 },
      { day: 'W3', equity: 10390 },
      { day: 'W4', equity: 10510 },
      { day: 'W5', equity: 10690 },
      { day: 'W6', equity: 10860 },
    ],
  },
];

export const EAMatrixView: React.FC = () => {
  const { brand } = useBrand();
  const {
    prices,
    positions,
    terminals,
    mt5Credentials,
    accountBalance,
    accountEquity,
    unrealizedPnL,
    bridgeLatencyMs,
    automatedSettings,
    toggleMasterAutoTrading,
    toggleTerminalAutoTrading,
    connectMT5Broker,
    executeOrder,
    executeKillSwitch,
  } = useTrading();

  const [activeSection, setActiveSection] = useState<'REMOTE' | 'MENTORS' | 'LINKER'>('REMOTE');
  const [mobileBotRunning, setMobileBotRunning] = useState<boolean>(automatedSettings.masterAutoTrading);
  const [mobileSymbol, setMobileSymbol] = useState<string>('XAUUSD');
  const [mobileLots, setMobileLots] = useState<number>(0.05);
  const [selectedMentorId, setSelectedMentorId] = useState<string>(MATRIX_MENTORS[0].id);
  const [attachedMentorIds, setAttachedMentorIds] = useState<string[]>(['m-gold']);
  const [copyMultiplier, setCopyMultiplier] = useState<number>(1.0);
  const [equityFloorPct, setEquityFloorPct] = useState<number>(5.0);

  // Broker-independent credential linker state
  const [brokerName, setBrokerName] = useState<string>('Exness Technologies');
  const [brokerServer, setBrokerServer] = useState<string>('Exness-MT5Real14');
  const [brokerLogin, setBrokerLogin] = useState<string>('');
  const [brokerPassword, setBrokerPassword] = useState<string>('');
  const [accessScope, setAccessScope] = useState<'EXECUTION' | 'INVESTOR_READONLY'>('EXECUTION');
  const [accountTier, setAccountTier] = useState<'LIVE' | 'PROP_FIRM' | 'DEMO'>('LIVE');
  const [isLinkingBroker, setIsLinkingBroker] = useState<boolean>(false);

  // Feedback & confirmation state
  const [statusNotice, setStatusNotice] = useState<{ text: string; tone: 'emerald' | 'cyan' | 'rose' } | null>(null);
  const [confirmKill, setConfirmKill] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    setMobileBotRunning(automatedSettings.masterAutoTrading);
  }, [automatedSettings.masterAutoTrading]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const notify = (text: string, tone: 'emerald' | 'cyan' | 'rose' = 'cyan') => {
    setStatusNotice({ text, tone });
    const id = window.setTimeout(() => setStatusNotice(null), 4200);
    timersRef.current.push(id);
  };

  const selectedMentor = useMemo(
    () => MATRIX_MENTORS.find((m) => m.id === selectedMentorId) || MATRIX_MENTORS[0],
    [selectedMentorId]
  );

  const primaryAccount = useMemo(
    () => mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0],
    [mt5Credentials]
  );

  const handleToggleMobileMatrix = () => {
    toggleMasterAutoTrading();
    const nextState = !mobileBotRunning;
    setMobileBotRunning(nextState);
    notify(
      nextState
        ? 'EA Matrix Remote Armed: Mobile phone execution commands actively synced to MT4/MT5.'
        : 'EA Matrix Remote Paused: New automated entries suspended across linked nodes.',
      nextState ? 'emerald' : 'rose'
    );
  };

  const handleMobileRemoteTrade = async (side: OrderSide) => {
    const market = prices[mobileSymbol];
    if (!market) {
      notify(`Awaiting live tick feed for ${mobileSymbol}.`, 'rose');
      return;
    }
    setIsDispatching(true);
    try {
      const price = side === 'BUY' ? market.ask : market.bid;
      const pip = market.pipSize || 0.01;
      const digits = market.digits ?? 2;
      const sl = side === 'BUY' ? price - pip * 45 : price + pip * 45;
      const tp = side === 'BUY' ? price + pip * 110 : price - pip * 110;

      const res = await executeOrder({
        symbol: mobileSymbol,
        orderType: 'MARKET',
        side,
        lots: mobileLots,
        sl: Number(sl.toFixed(digits)),
        tp: Number(tp.toFixed(digits)),
        terminal: primaryAccount?.server || 'EAMatrix-MobileNode',
        comment: `EAMatrix_Phone_${side}`,
      });
      notify(res.message, res.success ? 'emerald' : 'rose');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleLinkBrokerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerLogin.trim() || !brokerPassword.trim()) {
      notify('Enter both MT4/MT5 Login ID and Password to link your broker node.', 'rose');
      return;
    }
    setIsLinkingBroker(true);
    try {
      const res = await connectMT5Broker(
        brokerName,
        brokerServer,
        brokerLogin.trim(),
        brokerPassword,
        accountTier
      );
      if (res.success) {
        notify(
          `${res.message} (${accessScope === 'INVESTOR_READONLY' ? 'Investor Read-Only telemetry' : 'Full EA Execution'} enabled).`,
          'emerald'
        );
        setBrokerPassword('');
      } else {
        notify(res.message, 'rose');
      }
    } finally {
      setIsLinkingBroker(false);
    }
  };

  const handleToggleAttachMentor = (mentor: MentorStrategy) => {
    const isAttached = attachedMentorIds.includes(mentor.id);
    if (isAttached) {
      setAttachedMentorIds((prev) => prev.filter((id) => id !== mentor.id));
      notify(`Detached ${mentor.mentorCode} (${mentor.name}) from Matrix copier.`, 'cyan');
    } else {
      setAttachedMentorIds((prev) => [...prev, mentor.id]);
      notify(
        `Attached ${mentor.mentorCode} at ${copyMultiplier.toFixed(1)}x lot scaling (DD Cap ${equityFloorPct}%).`,
        'emerald'
      );
    }
  };

  const handleRunMentorSignal = async (mentor: MentorStrategy) => {
    const market = prices[mentor.pair];
    if (!market) {
      notify(`Awaiting live market price for ${mentor.pair}.`, 'rose');
      return;
    }
    const scaledLots = Number(Math.max(0.01, Math.min(10, 0.05 * copyMultiplier)).toFixed(2));
    const price = mentor.defaultSide === 'BUY' ? market.ask : market.bid;
    const pip = market.pipSize || 0.01;
    const digits = market.digits ?? 2;
    const sl = mentor.defaultSide === 'BUY' ? price - pip * 40 : price + pip * 40;
    const tp = mentor.defaultSide === 'BUY' ? price + pip * 95 : price - pip * 95;

    const res = await executeOrder({
      symbol: mentor.pair,
      orderType: 'MARKET',
      side: mentor.defaultSide,
      lots: scaledLots,
      sl: Number(sl.toFixed(digits)),
      tp: Number(tp.toFixed(digits)),
      comment: `MatrixCopy_${mentor.mentorCode}`,
    });
    notify(`Copy Sync ${mentor.mentorCode}: ${res.message}`, res.success ? 'emerald' : 'rose');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>
                {brand.brandName} · EA Matrix Cloud (eamatrix.io) · {brand.ownerEntity}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              Mobile-First MT4/MT5 EA Matrix &amp; Mentor Copy Grid
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Run, monitor, and emergency-halt Expert Advisors directly from any phone with zero Windows PC or RDP setup. Connect any broker independently or mirror verified mentor strategies with strict equity floors.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-mono text-slate-400">
              <span>Zero PC / Zero RDP Required</span>
              <span>·</span>
              <span className="text-emerald-400 tabular-nums">
                Bridge RTT {bridgeLatencyMs.toFixed(1)}ms
              </span>
              <span>·</span>
              <span className="tabular-nums">
                {attachedMentorIds.length} Mentor Feeds Synced
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(
              [
                { id: 'REMOTE', label: 'Mobile Remote Deck', icon: Smartphone },
                { id: 'MENTORS', label: 'Mentor Copy Matrix', icon: Users },
                { id: 'LINKER', label: 'Broker Linker', icon: Link2 },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                    activeSection === tab.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-[#161D2B] text-slate-300 hover:text-white border-white/[0.08]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inline Notification Bar */}
      {statusNotice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            statusNotice.tone === 'emerald'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : statusNotice.tone === 'rose'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice.text}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-slate-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: MOBILE-FIRST REMOTE CONTROL MATRIX */}
      {activeSection === 'REMOTE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Simulated Phone Controller (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[360px] rounded-2xl bg-[#090C12] border border-white/[0.12] p-4 space-y-4">
              {/* Phone Top Notch / Carrier Strip */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-white/[0.06]">
                <span>EA MATRIX MOBILE</span>
                <span className={mobileBotRunning ? 'text-emerald-400' : 'text-amber-400'}>
                  {mobileBotRunning ? 'ENGINE ARMED' : 'STANDBY'}
                </span>
              </div>

              {/* Equity Display */}
              <div className="rounded-xl bg-[#0F141E] border border-white/[0.08] p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>LINKED EQUITY</span>
                  <span>{primaryAccount ? `#${primaryAccount.login}` : 'MT5-CLOUD'}</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono tabular-nums">
                  ${accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1">
                  <span className="text-slate-400">
                    Bal: ${accountBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className={unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {unrealizedPnL >= 0 ? '+' : '-'}${Math.abs(unrealizedPnL).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Master Phone Toggle */}
              <button
                onClick={handleToggleMobileMatrix}
                className={`w-full py-3 rounded-xl font-bold text-xs font-mono flex items-center justify-center gap-2 transition border ${
                  mobileBotRunning
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}
              >
                {mobileBotRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{mobileBotRunning ? 'PAUSE CLOUD EA MATRIX' : 'START CLOUD EA MATRIX'}</span>
              </button>

              {/* Phone Execution Pad */}
              <div className="rounded-xl bg-[#0F141E] border border-white/[0.08] p-3.5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>REMOTE ORDER PAD</span>
                  <span className="text-cyan-400 tabular-nums">
                    {prices[mobileSymbol]?.bid?.toFixed(prices[mobileSymbol]?.digits ?? 2) || '---'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mobileSymbol}
                    onChange={(e) => setMobileSymbol(e.target.value)}
                    className="bg-[#161D2B] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-mono text-white"
                  >
                    {['XAUUSD', 'US30', 'NAS100', 'EURUSD', 'GBPJPY', 'BTCUSD'].map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0.01}
                    max={10}
                    step={0.01}
                    value={mobileLots}
                    onChange={(e) => setMobileLots(Math.max(0.01, Number(e.target.value) || 0.01))}
                    className="bg-[#161D2B] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-mono text-white tabular-nums"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isDispatching}
                    onClick={() => handleMobileRemoteTrade('BUY')}
                    className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                  >
                    BUY MARKET
                  </button>
                  <button
                    disabled={isDispatching}
                    onClick={() => handleMobileRemoteTrade('SELL')}
                    className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition disabled:opacity-50"
                  >
                    SELL MARKET
                  </button>
                </div>
              </div>

              {/* Safe Two-Step Panic Flatten */}
              {!confirmKill ? (
                <button
                  onClick={() => setConfirmKill(true)}
                  className="w-full py-2.5 rounded-xl bg-[#161D2B] hover:bg-rose-950/50 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Emergency Close All ({positions.length})</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      executeKillSwitch();
                      setConfirmKill(false);
                      notify('All open positions flattened via EA Matrix emergency kill switch.', 'rose');
                    }}
                    className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Confirm Flatten
                  </button>
                  <button
                    onClick={() => setConfirmKill(false)}
                    className="py-2 rounded-xl bg-[#161D2B] text-slate-300 text-xs font-semibold border border-white/[0.08]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Terminal Grid & Execution Architecture (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Connected MT4/MT5 Matrix Nodes
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {terminals.length} Active Nodes
                </span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {terminals.map((term) => (
                  <div
                    key={term.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{term.name}</span>
                        <span className="text-xs font-mono text-cyan-400">
                          {term.platform} · #{term.accountNumber}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 tabular-nums">
                        {term.broker} · Ping {term.pingMs}ms · Multiplier {term.multiplier}x
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-mono font-semibold ${
                          term.autoTrading ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {term.autoTrading ? 'SYNCED' : 'PAUSED'}
                      </span>
                      <button
                        onClick={() => {
                          toggleTerminalAutoTrading(term.id);
                          notify(
                            `${term.name} ${term.autoTrading ? 'paused' : 'resumed'} cleanly.`,
                            term.autoTrading ? 'rose' : 'emerald'
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-200 whitespace-nowrap"
                      >
                        {term.autoTrading ? 'Pause Node' : 'Resume Node'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Mentor Feed Summary */}
            <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Verified Matrix Risk Guardrails
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSection('MENTORS')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Manage Mentors</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">EQUITY STOP FLOOR</div>
                  <div className="text-base font-bold text-white mt-1">{equityFloorPct.toFixed(1)}% Max DD</div>
                </div>
                <div className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">COPY LOT SCALING</div>
                  <div className="text-base font-bold text-cyan-300 mt-1">{copyMultiplier.toFixed(1)}x Proportional</div>
                </div>
                <div className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">HOST INFRASTRUCTURE</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">Equinix 24/7 Cloud</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MENTOR & SIGNAL PROVIDER COPY MATRIX */}
      {activeSection === 'MENTORS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {MATRIX_MENTORS.map((mentor) => {
              const isAttached = attachedMentorIds.includes(mentor.id);
              const isSelected = selectedMentorId === mentor.id;
              return (
                <div
                  key={mentor.id}
                  onClick={() => setSelectedMentorId(mentor.id)}
                  className={`p-5 rounded-2xl bg-[#0F141E] border transition cursor-pointer space-y-4 ${
                    isSelected ? 'border-cyan-500/50' : 'border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-cyan-400">
                        {mentor.mentorCode} · {mentor.pair} · {mentor.timeframe}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{mentor.name}</h3>
                      <div className="text-xs text-slate-400">
                        {mentor.author} · {mentor.verifiedDays} verified days · {mentor.subscribers} linked traders
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAttachMentor(mentor);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                          isAttached
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                        }`}
                      >
                        {isAttached ? 'Attached' : 'Attach Mentor'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleRunMentorSignal(mentor);
                        }}
                        className="px-3 py-2 rounded-xl bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-white whitespace-nowrap"
                      >
                        Execute Signal
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-2 border-t border-white/[0.06] text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-slate-500 text-[10px]">MONTHLY</div>
                      <div className="text-emerald-400 font-bold">+{mentor.monthlyReturnPct}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">MAX DD</div>
                      <div className="text-amber-300 font-bold">{mentor.maxDrawdownPct}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">WIN RATE</div>
                      <div className="text-white font-bold">{mentor.winRatePct}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">PROFIT FACTOR</div>
                      <div className="text-cyan-300 font-bold">{mentor.profitFactor}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Audited Curve & Copy Scaling Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    {selectedMentor.name} Track Record
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 tabular-nums">
                  +{selectedMentor.monthlyReturnPct}% / mo
                </span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedMentor.curve}>
                    <defs>
                      <linearGradient id="matrixCurve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 150', 'dataMax + 150']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F141E',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#matrixCurve)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/[0.08] text-xs font-mono">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Copy Lot Multiplier
                    </span>
                    <span className="font-bold text-cyan-300 tabular-nums">{copyMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={copyMultiplier}
                    onChange={(e) => setCopyMultiplier(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Hard Equity Drawdown Floor
                    </span>
                    <span className="font-bold text-emerald-400 tabular-nums">{equityFloorPct.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={15.0}
                    step={0.5}
                    value={equityFloorPct}
                    onChange={(e) => setEquityFloorPct(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: BROKER-INDEPENDENT CREDENTIAL LINKER */}
      {activeSection === 'LINKER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleLinkBrokerAccount}
            className="lg:col-span-7 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Broker-Independent MT4 / MT5 Linker
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Encrypted Session Bridge</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Broker Institution</label>
                <select
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white"
                >
                  <option>Exness Technologies</option>
                  <option>IC Markets Global</option>
                  <option>Deriv Synthetic Markets</option>
                  <option>Pepperstone Group</option>
                  <option>FTMO Prop Trading</option>
                  <option>ThinkMarkets Global</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Trade Server Name</label>
                <input
                  type="text"
                  value={brokerServer}
                  onChange={(e) => setBrokerServer(e.target.value)}
                  placeholder="e.g. ICMarketsSC-Live02"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">MT4 / MT5 Account Login</label>
                <input
                  type="text"
                  value={brokerLogin}
                  onChange={(e) => setBrokerLogin(e.target.value)}
                  placeholder="e.g. 88392104"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  {accessScope === 'INVESTOR_READONLY' ? 'Investor (Read-Only) Password' : 'Master Trading Password'}
                </label>
                <input
                  type="password"
                  value={brokerPassword}
                  onChange={(e) => setBrokerPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setAccessScope('EXECUTION')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  accessScope === 'EXECUTION'
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                    : 'bg-[#161D2B] border-white/[0.06] text-slate-400'
                }`}
              >
                <Unlock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Full Execution Access</div>
                  <div className="text-[11px] text-slate-400">Allows mobile EA Matrix start/stop &amp; lot fills</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccessScope('INVESTOR_READONLY')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  accessScope === 'INVESTOR_READONLY'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-[#161D2B] border-white/[0.06] text-slate-400'
                }`}
              >
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Investor Read-Only Mode</div>
                  <div className="text-[11px] text-slate-400">Telemetry tracking &amp; track-record audit only</div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs">
                {(['LIVE', 'PROP_FIRM', 'DEMO'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setAccountTier(tier)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-semibold border transition ${
                      accountTier === tier
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-[#161D2B] text-slate-400 border-white/[0.08]'
                    }`}
                  >
                    {tier.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isLinkingBroker}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                {isLinkingBroker ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isLinkingBroker ? 'Authenticating Server...' : 'Verify & Link Broker Node'}</span>
              </button>
            </div>
          </form>

          {/* Linked Accounts List */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Linked Broker Credentials
              </h3>
              <span className="text-xs font-mono text-emerald-400 tabular-nums">
                {mt5Credentials.length} Active
              </span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {mt5Credentials.map((cred) => (
                <div key={cred.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{cred.brokerName}</span>
                      {cred.isPrimary && (
                        <span className="text-[10px] font-mono text-cyan-400">PRIMARY</span>
                      )}
                    </div>
                    <div className="text-slate-400 font-mono tabular-nums mt-0.5">
                      #{cred.login} · {cred.server} · {cred.accountType}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-white font-semibold">${cred.equity.toLocaleString()}</div>
                    <div className="text-[11px] text-emerald-400">{cred.pingMs}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
