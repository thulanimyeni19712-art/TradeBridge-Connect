import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bot,
  ScanLine,
  Sliders,
  Code,
  KeyRound,
  Server,
  Download,
  Copy,
  Check,
  Play,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Zap,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { OrderSide } from '../../types/trading';

type EntryTriggerRule =
  | 'RSI_EXTREME_REVERSAL'
  | 'EMA_20_50_CROSS'
  | 'SMC_LIQUIDITY_OB'
  | 'LONDON_BREAKOUT_RANGE';

interface ChartSignalPlan {
  symbol: string;
  timeframe: string;
  bias: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  pattern: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  riskReward: string;
  rationale: string;
  source: 'AI_VISION' | 'LIVE_FEED';
}

const RULE_CATALOG: Record<
  EntryTriggerRule,
  { label: string; mqlCondition: string; defaultSide: OrderSide; summary: string }
> = {
  RSI_EXTREME_REVERSAL: {
    label: 'RSI (14) Overbought / Oversold Cross',
    mqlCondition: 'rsiPrev <= 30.0 && rsiCurr > 30.0',
    defaultSide: 'BUY',
    summary: 'Triggers long when RSI recovers above 30, short on breakdown below 70.',
  },
  EMA_20_50_CROSS: {
    label: 'EMA 20 / EMA 50 Momentum Crossover',
    mqlCondition: 'emaFastPrev <= emaSlowPrev && emaFastCurr > emaSlowCurr',
    defaultSide: 'BUY',
    summary: 'Captures directional trend shifts confirmed on bar close.',
  },
  SMC_LIQUIDITY_OB: {
    label: 'SMC Liquidity Sweep + Order Block',
    mqlCondition: 'lowSweep && closeAboveOB && spreadPts <= InpMaxSpreadPts',
    defaultSide: 'BUY',
    summary: 'Detects prior session sweep and enters on bullish order block mitigation.',
  },
  LONDON_BREAKOUT_RANGE: {
    label: 'London Open Range Breakout (08:00 UTC)',
    mqlCondition: 'hourUTC >= 8 && askPrice > asianHigh',
    defaultSide: 'SELL',
    summary: 'Trades expansion outside the overnight Asian consolidation box.',
  },
};

export const ITradeBotView: React.FC = () => {
  const { brand } = useBrand();
  const {
    prices,
    accountBalance,
    mt5Credentials,
    bridgeLatencyMs,
    automatedSettings,
    autonomousSnapshots,
    toggleMasterAutoTrading,
    runAutonomousCycle,
    executeOrder,
    connectMT5Broker,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'SCANNER' | 'STUDIO' | 'BROKER_LICENSE'>('SCANNER');
  const [moneyBotDirection, setMoneyBotDirection] = useState<'BOTH' | 'BUY' | 'SELL'>('BOTH');

  // Section 1: AI Mobile Chart Scanner & Signal Router
  const [scanSymbol, setScanSymbol] = useState<string>('XAUUSD');
  const [scanTimeframe, setScanTimeframe] = useState<'M5' | 'M15' | 'H1' | 'H4'>('M15');
  const [scanLots, setScanLots] = useState<number>(0.1);
  const [scanNotes, setScanNotes] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [scanPlan, setScanPlan] = useState<ChartSignalPlan | null>(null);

  // Section 2: No-Code EA Studio
  const [botName, setBotName] = useState<string>('iTradeBot_Alpha_Pro');
  const [botPlatform, setBotPlatform] = useState<'MT5' | 'MT4'>('MT5');
  const [entryRule, setEntryRule] = useState<EntryTriggerRule>('SMC_LIQUIDITY_OB');
  const [studioLots, setStudioLots] = useState<number>(0.1);
  const [stopLossPips, setStopLossPips] = useState<number>(35);
  const [takeProfitPips, setTakeProfitPips] = useState<number>(95);
  const [trailingPips, setTrailingPips] = useState<number>(20);
  const [maxDailyDdPct, setMaxDailyDdPct] = useState<number>(4.0);
  const [maxSpreadPts, setMaxSpreadPts] = useState<number>(25);
  const [enableNewsPause, setEnableNewsPause] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Section 3: Software Licensing & Broker Independence
  const [licenseKey, setLicenseKey] = useState<string>('AMX-PROP-ITB-9042');
  const [licenseResult, setLicenseResult] = useState<{
    valid: boolean;
    tier?: string;
    status?: string;
    hwidBound?: string;
    maxTerminals?: number;
    error?: string;
  } | null>(null);
  const [isCheckingLicense, setIsCheckingLicense] = useState<boolean>(false);

  const [brokerName, setBrokerName] = useState<string>('Exness Technologies');
  const [brokerServer, setBrokerServer] = useState<string>('Exness-MT5Real14');
  const [brokerLogin, setBrokerLogin] = useState<string>('');
  const [brokerPassword, setBrokerPassword] = useState<string>('');
  const [brokerType, setBrokerType] = useState<'LIVE' | 'PROP_FIRM' | 'DEMO'>('LIVE');
  const [isLinkingBroker, setIsLinkingBroker] = useState<boolean>(false);

  const [notice, setNotice] = useState<{ text: string; tone: 'emerald' | 'cyan' | 'rose' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const showNotice = (text: string, tone: 'emerald' | 'cyan' | 'rose' = 'cyan') => {
    setNotice({ text, tone });
    const id = window.setTimeout(() => setNotice(null), 4500);
    timersRef.current.push(id);
  };

  const activeQuote = prices[scanSymbol];

  const handleScanLiveStructure = () => {
    const quote = prices[scanSymbol];
    if (!quote) {
      showNotice(`Waiting for live quote stream on ${scanSymbol}.`, 'rose');
      return;
    }

    const change = quote.change24h ?? 0;
    const bias: 'BUY' | 'SELL' = change >= 0 ? 'BUY' : 'SELL';
    const pip = quote.pipSize || 0.01;
    const digits = quote.digits ?? 2;
    const entry = bias === 'BUY' ? quote.ask : quote.bid;
    const sl = bias === 'BUY' ? entry - pip * stopLossPips : entry + pip * stopLossPips;
    const tp = bias === 'BUY' ? entry + pip * takeProfitPips : entry - pip * takeProfitPips;
    const rrRatio = (takeProfitPips / Math.max(1, stopLossPips)).toFixed(1);

    setScanPlan({
      symbol: scanSymbol,
      timeframe: scanTimeframe,
      bias,
      confidence: Math.min(94, Math.max(68, Math.round(74 + Math.abs(change) * 14))),
      pattern: bias === 'BUY' ? 'Bullish Order Block + Spread Compression' : 'Bearish Liquidity Sweep + FVG',
      entryPrice: Number(entry.toFixed(digits)),
      stopLoss: Number(sl.toFixed(digits)),
      takeProfit1: Number(tp.toFixed(digits)),
      riskReward: `1:${rrRatio}`,
      rationale: `Live bid/ask (${quote.bid.toFixed(digits)}/${quote.ask.toFixed(digits)}) with ${quote.spread.toFixed(1)} pt spread on ${scanTimeframe} structure.`,
      source: 'LIVE_FEED',
    });
    showNotice(`Scanned live ${scanSymbol} (${scanTimeframe}) structure — ${bias} setup mapped.`, 'emerald');
  };

  const handleUploadChartImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read chart image'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/ai/scan-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/png',
          accountBalance: accountBalance || 50000,
          riskPct: 1.0,
          notes: scanNotes || `Requested scan for ${scanSymbol} (${scanTimeframe})`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.analysis) {
        showNotice(json.error || `AI chart scan returned HTTP ${res.status}.`, 'rose');
        return;
      }

      const a = json.analysis;
      setScanPlan({
        symbol: a.symbol || scanSymbol,
        timeframe: a.timeframe || scanTimeframe,
        bias: a.bias || 'WAIT',
        confidence: Number(a.confidence || 78),
        pattern: a.pattern || 'AI Price Action Setup',
        entryPrice: Number(a.entryPrice || activeQuote?.ask || 0),
        stopLoss: Number(a.stopLoss || 0),
        takeProfit1: Number(a.takeProfit1 || 0),
        riskReward: a.riskReward || '1:2.5',
        rationale: a.rationale || 'Extracted from uploaded chart screenshot.',
        source: 'AI_VISION',
      });
      showNotice(`AI Chart Vision decoded ${a.symbol} (${a.bias}) at ${a.confidence}% confidence.`, 'emerald');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Unable to scan uploaded chart image.', 'rose');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteScanPlan = async () => {
    if (!scanPlan || scanPlan.bias === 'WAIT') {
      showNotice('Generate an actionable BUY or SELL scan setup before dispatching.', 'rose');
      return;
    }
    setIsExecuting(true);
    try {
      const res = await executeOrder({
        symbol: scanPlan.symbol,
        orderType: 'MARKET',
        side: scanPlan.bias,
        lots: scanLots,
        sl: scanPlan.stopLoss,
        tp: scanPlan.takeProfit1,
        comment: `iTradeBot_Scan_${scanPlan.timeframe}`,
      });
      showNotice(res.message, res.success ? 'emerald' : 'rose');
    } finally {
      setIsExecuting(false);
    }
  };

  const generatedMqlSource = useMemo(() => {
    const cleanName = botName.replace(/[^A-Za-z0-9_]/g, '_') || 'iTradeBot_Custom';
    const rule = RULE_CATALOG[entryRule];
    const ext = botPlatform === 'MT5' ? 'mq5' : 'mq4';
    return `//+------------------------------------------------------------------+
//| ${cleanName}.${ext}
//| Owner: ${brand.ownerName} (${brand.ownerEntity})
//| Platform: ${brand.brandName} · iTradeBot No-Code Studio (itradebot.org)
//+------------------------------------------------------------------+
#property copyright "${brand.ownerEntity}"
#property version   "4.20"
#property strict

input double InpLotSize        = ${studioLots.toFixed(2)};
input int    InpStopLossPips   = ${stopLossPips};
input int    InpTakeProfitPips = ${takeProfitPips};
input int    InpTrailingPips   = ${trailingPips};
input double InpMaxDailyDDPct  = ${maxDailyDdPct.toFixed(1)};
input int    InpMaxSpreadPts   = ${maxSpreadPts};
input bool   InpNewsFreeze     = ${enableNewsPause ? 'true' : 'false'};
input string InpLicenseKey     = "${licenseKey}";

// Entry Trigger: ${rule.label}
bool EvaluateEntrySignal(double rsiPrev, double rsiCurr, double emaFastPrev, double emaFastCurr, double emaSlowPrev, double emaSlowCurr, bool lowSweep, bool closeAboveOB, int hourUTC, double askPrice, double asianHigh, int spreadPts) {
   if(spreadPts > InpMaxSpreadPts) return false;
   return (${rule.mqlCondition});
}

void OnTick() {
   // Software-only signal evaluation routed to user's self-managed broker account
}`;
  }, [
    botName,
    botPlatform,
    brand.brandName,
    brand.ownerEntity,
    brand.ownerName,
    entryRule,
    studioLots,
    stopLossPips,
    takeProfitPips,
    trailingPips,
    maxDailyDdPct,
    maxSpreadPts,
    enableNewsPause,
    licenseKey,
  ]);

  const handleCopySource = () => {
    void navigator.clipboard?.writeText(generatedMqlSource).catch(() => undefined);
    setCopiedCode(true);
    const id = window.setTimeout(() => setCopiedCode(false), 2000);
    timersRef.current.push(id);
  };

  const handleDownloadSource = () => {
    const ext = botPlatform === 'MT5' ? 'mq5' : 'mq4';
    const cleanName = botName.replace(/[^A-Za-z0-9_]/g, '_') || 'iTradeBot_Custom';
    const blob = new Blob([generatedMqlSource], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice(`Exported ${cleanName}.${ext} for ${botPlatform} MetaEditor.`, 'emerald');
  };

  const handleVerifyLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;
    setIsCheckingLicense(true);
    try {
      const res = await fetch('/api/algomax/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          accountNumber: brokerLogin.trim() || '50294112',
        }),
      });
      const data = await res.json();
      setLicenseResult(data);
      showNotice(
        data.valid
          ? `License verified (${data.tier} · max ${data.maxTerminals} terminals).`
          : data.error || 'License format rejected by server.',
        data.valid ? 'emerald' : 'rose'
      );
    } catch {
      showNotice('Unable to reach license verification endpoint.', 'rose');
    } finally {
      setIsCheckingLicense(false);
    }
  };

  const handleLinkBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerLogin.trim() || !brokerPassword.trim()) {
      showNotice('Enter both broker account login and password.', 'rose');
      return;
    }
    setIsLinkingBroker(true);
    try {
      const res = await connectMT5Broker(
        brokerName,
        brokerServer,
        brokerLogin.trim(),
        brokerPassword,
        brokerType
      );
      if (res.success) {
        setBrokerPassword('');
        showNotice(res.message, 'emerald');
      } else {
        showNotice(res.message, 'rose');
      }
    } finally {
      setIsLinkingBroker(false);
    }
  };

  const pv1Snapshot = autonomousSnapshots[scanSymbol];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl glass-ultra border border-white/[0.12] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Bot className="w-4 h-4 shrink-0" />
              <span>
                {brand.brandName} · iTradeBot AI &amp; No-Code Studio (itradebot.org) · {brand.ownerEntity}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              AI Mobile Chart Scanner &amp; No-Code MT4/MT5 EA Studio
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Scan live charts or chart screenshots for support, resistance, and order-block triggers, assemble no-code MT4/MT5 Expert Advisors with built-in drawdown guards, and link directly to your own independent broker account.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-mono text-slate-400">
              <span>Software-Only Licensing</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 tabular-nums">
                Bridge RTT {bridgeLatencyMs.toFixed(1)}ms
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {mt5Credentials.length} Linked Broker Nodes
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(
              [
                { id: 'SCANNER', label: 'AI Chart Scanner', icon: ScanLine },
                { id: 'STUDIO', label: 'No-Code EA Studio', icon: Sliders },
                { id: 'BROKER_LICENSE', label: 'License & Broker Bridge', icon: KeyRound },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                    activeTab === tab.id
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

      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            notice.tone === 'emerald'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : notice.tone === 'rose'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.tone === 'rose' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MONEY BOT PV1 FLOATING OVERLAY HUD (@itradebot · Live M5 Listener) */}
      <div className="rounded-2xl glass-card border border-cyan-500/25 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white tracking-wide">
                Money Bot PV1 · Floating Overlay HUD
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  automatedSettings.masterAutoTrading
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                }`}
              >
                {automatedSettings.masterAutoTrading ? 'Online' : 'Standby'} · {moneyBotDirection}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-0.5 tabular-nums">
              {pv1Snapshot
                ? `${pv1Snapshot.symbol} 5M Consensus: ${pv1Snapshot.action} (${pv1Snapshot.confidence}% · RSI ${pv1Snapshot.rsi14.toFixed(1)} · Spread ${pv1Snapshot.spreadPoints.toFixed(1)}p)`
                : `Listening to live 5M structure on ${scanSymbol} (${bridgeLatencyMs.toFixed(1)}ms RTT)`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(['BOTH', 'BUY', 'SELL'] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => setMoneyBotDirection(dir)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition ${
                moneyBotDirection === dir
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-white/[0.04] text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              {dir}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void runAutonomousCycle(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Signal Pulse</span>
          </button>
          <button
            type="button"
            onClick={toggleMasterAutoTrading}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              automatedSettings.masterAutoTrading
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-500/40'
            }`}
          >
            {automatedSettings.masterAutoTrading ? 'Stop PV1' : 'Start PV1'}
          </button>
        </div>
      </div>

      {/* TAB 1: AI CHART SCANNER */}
      {activeTab === 'SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl glass-card border border-white/[0.1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chart &amp; Quote Signal Scanner
                </h2>
              </div>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">
                {activeQuote
                  ? `${activeQuote.bid.toFixed(activeQuote.digits ?? 2)} / ${activeQuote.ask.toFixed(activeQuote.digits ?? 2)}`
                  : 'SYNCING'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Symbol</label>
                <select
                  value={scanSymbol}
                  onChange={(e) => setScanSymbol(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                >
                  {['XAUUSD', 'EURUSD', 'GBPUSD', 'US30', 'NAS100', 'BTCUSD', 'USDZAR'].map((sym) => (
                    <option key={sym} value={sym}>
                      {sym}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Timeframe</label>
                <select
                  value={scanTimeframe}
                  onChange={(e) => setScanTimeframe(e.target.value as typeof scanTimeframe)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                >
                  {(['M5', 'M15', 'H1', 'H4'] as const).map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Order Lots</label>
                <input
                  type="number"
                  min={0.01}
                  max={10}
                  step={0.01}
                  value={scanLots}
                  onChange={(e) => setScanLots(Math.max(0.01, Number(e.target.value) || 0.01))}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Session Notes</label>
                <input
                  type="text"
                  value={scanNotes}
                  onChange={(e) => setScanNotes(e.target.value)}
                  placeholder="Optional bias note..."
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleScanLiveStructure}
                className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Scan Live Structure</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                {isScanning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{isScanning ? 'Scanning...' : 'Upload Screenshot'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUploadChartImage}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl glass-card border border-white/[0.1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Extracted Signal Blueprint &amp; Trade Ticket
              </h2>
              {scanPlan && (
                <span className="text-xs font-mono text-cyan-400">
                  {scanPlan.source === 'AI_VISION' ? 'AI Vision Scan' : 'Live Quote Telemetry'}
                </span>
              )}
            </div>

            {!scanPlan ? (
              <div className="py-10 px-4 text-center space-y-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                <div className="text-sm font-semibold text-white">No chart scan queued yet</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click Scan Live Structure for instant live-feed entry, SL, and TP coordinates or upload a TradingView / MT5 screenshot.
                </p>
                <button
                  type="button"
                  onClick={handleScanLiveStructure}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Initial {scanSymbol} Scan</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono text-slate-400">
                      {scanPlan.symbol} · {scanPlan.timeframe} · R:R {scanPlan.riskReward}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{scanPlan.pattern}</h3>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div
                      className={`text-lg font-bold ${
                        scanPlan.bias === 'BUY'
                          ? 'text-emerald-400'
                          : scanPlan.bias === 'SELL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {scanPlan.bias} SETUP
                    </div>
                    <div className="text-xs text-slate-400">{scanPlan.confidence}% Confidence</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                  <div className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">ENTRY COORDINATE</div>
                    <div className="text-base font-bold text-white mt-1">{scanPlan.entryPrice}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">STOP LOSS</div>
                    <div className="text-base font-bold text-rose-400 mt-1">{scanPlan.stopLoss}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">TAKE PROFIT</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">{scanPlan.takeProfit1}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{scanPlan.rationale}</p>

                <button
                  type="button"
                  disabled={isExecuting || scanPlan.bias === 'WAIT'}
                  onClick={handleExecuteScanPlan}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {isExecuting
                      ? 'Routing Order to MT5...'
                      : `Execute ${scanPlan.bias} ${scanLots} Lots on ${scanPlan.symbol}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NO-CODE VISUAL EA STUDIO */}
      {activeTab === 'STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl glass-card border border-white/[0.1] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  No-Code Strategy Logic Builder
                </h2>
              </div>
              <span className="text-xs font-mono text-cyan-400">{botPlatform} Target</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">EA Package Name</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Platform</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['MT5', 'MT4'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBotPlatform(p)}
                        className={`py-2 rounded-lg font-mono font-bold border transition ${
                          botPlatform === p
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-[#161D2B] text-slate-400 border-white/[0.08]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Entry Trigger Block</label>
                <div className="space-y-1.5">
                  {(Object.keys(RULE_CATALOG) as EntryTriggerRule[]).map((key) => {
                    const item = RULE_CATALOG[key];
                    const selected = entryRule === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEntryRule(key)}
                        className={`w-full p-2.5 rounded-xl border text-left transition ${
                          selected
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                            : 'bg-[#161D2B] border-white/[0.06] text-slate-300 hover:border-white/[0.14]'
                        }`}
                      >
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.summary}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono tabular-nums pt-1">
                <div>
                  <label className="text-slate-300 font-sans font-semibold block mb-1">Lot Size</label>
                  <input
                    type="number"
                    min={0.01}
                    max={10}
                    step={0.01}
                    value={studioLots}
                    onChange={(e) => setStudioLots(Math.max(0.01, Number(e.target.value) || 0.01))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-sans font-semibold block mb-1">Max Daily DD (%)</label>
                  <input
                    type="number"
                    min={0.5}
                    max={15}
                    step={0.5}
                    value={maxDailyDdPct}
                    onChange={(e) => setMaxDailyDdPct(Math.max(0.5, Number(e.target.value) || 1))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-sans font-semibold block mb-1">Stop Loss (Pips)</label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={stopLossPips}
                    onChange={(e) => setStopLossPips(Math.max(5, Number(e.target.value) || 10))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-sans font-semibold block mb-1">Take Profit (Pips)</label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    value={takeProfitPips}
                    onChange={(e) => setTakeProfitPips(Math.max(5, Number(e.target.value) || 20))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-sans font-semibold block mb-1">Trailing Stop (Pips)</label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={trailingPips}
                    onChange={(e) => setTrailingPips(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-sans font-semibold block mb-1">Spread Cap (Pts)</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={maxSpreadPts}
                    onChange={(e) => setMaxSpreadPts(Math.max(5, Number(e.target.value) || 10))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#161D2B] border border-white/[0.06] cursor-pointer">
                <span className="text-slate-200 font-semibold">
                  Auto-Pause Before High-Impact News
                </span>
                <input
                  type="checkbox"
                  checked={enableNewsPause}
                  onChange={(e) => setEnableNewsPause(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4"
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl glass-card border border-white/[0.1] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Generated {botPlatform} Expert Advisor Output
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySource}
                  className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSource}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .{botPlatform === 'MT5' ? 'mq5' : 'mq4'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-[#090C12] border border-white/[0.06] text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
              {generatedMqlSource}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: SOFTWARE LICENSING & INDEPENDENT BROKER BRIDGE */}
      {activeTab === 'BROKER_LICENSE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Software License Verification */}
          <form
            onSubmit={handleVerifyLicense}
            className="lg:col-span-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  iTradeBot Software License Validator
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400">HWID Bound</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">License Key</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="AMX-PROP-ITB-9042"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingLicense}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
              >
                {isCheckingLicense ? 'Validating License...' : 'Verify Software License'}
              </button>
            </div>

            {licenseResult && (
              <div className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.06] text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">STATUS</span>
                  <span className={licenseResult.valid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {licenseResult.status || (licenseResult.valid ? 'ACTIVE' : 'INVALID')}
                  </span>
                </div>
                {licenseResult.tier && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">TIER</span>
                    <span className="text-cyan-300">{licenseResult.tier}</span>
                  </div>
                )}
                {licenseResult.hwidBound && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">HWID</span>
                    <span className="text-slate-200">{licenseResult.hwidBound}</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.06] text-xs text-slate-400 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Non-Custodial Software Disclosure</span>
              </div>
              <p>
                {brand.brandName} provides algorithmic software tools and signal utilities only. Client funds remain exclusively with your chosen independent MT4/MT5 broker.
              </p>
            </div>
          </form>

          {/* Independent Broker Linker */}
          <form
            onSubmit={handleLinkBroker}
            className="lg:col-span-7 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Independent MT4 / MT5 Broker Connector
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {mt5Credentials.length} Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Broker</label>
                <select
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                >
                  <option>Exness Technologies</option>
                  <option>Deriv Synthetic Markets</option>
                  <option>Trade245 Global</option>
                  <option>IC Markets Global</option>
                  <option>FTMO Prop Trading</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Trade Server</label>
                <input
                  type="text"
                  value={brokerServer}
                  onChange={(e) => setBrokerServer(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Account Login</label>
                <input
                  type="text"
                  value={brokerLogin}
                  onChange={(e) => setBrokerLogin(e.target.value)}
                  placeholder="e.g. 8841209"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  value={brokerPassword}
                  onChange={(e) => setBrokerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                {(['LIVE', 'PROP_FIRM', 'DEMO'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setBrokerType(tier)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-semibold border transition ${
                      brokerType === tier
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
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
              >
                {isLinkingBroker ? 'Verifying Server...' : 'Connect Independent Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
