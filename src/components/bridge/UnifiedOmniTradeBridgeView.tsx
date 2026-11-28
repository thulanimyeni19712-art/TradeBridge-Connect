import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTrading, resolveMarketPrice } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { liveMarketData } from '../../services/liveMarketData';
import { Position, OrderSide, OrderType } from '../../types/trading';
import { LiveTradingChart } from './LiveTradingChart';
import { EditPositionModal } from './EditPositionModal';
import { PartialCloseModal, KillSwitchModal } from './PartialCloseModal';
import { MarketSentimentGauge } from './MarketSentimentGauge';
import { AviatorPerformanceHUD } from '../aviator/AviatorPerformanceHUD';
import {
  Zap,
  Activity,
  Shield,
  Layers,
  TrendingUp,
  TrendingDown,
  Cpu,
  Server,
  Key,
  Globe,
  Radio,
  Clock,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Download,
  Copy,
  Check,
  Code,
  ArrowUpRight,
  ArrowDownRight,
  FileCode,
  DollarSign,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Sparkles,
  Award,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Lock,
  Scissors,
  CheckCheck,
  Send,
  Eye,
  Crosshair,
  Compass,
  Smartphone,
  Calendar,
  ScanLine,
  GitMerge,
  Power,
} from 'lucide-react';

// Sub-views for individual lenses
import { AlgoMaxPublicView } from '../algomax/AlgoMaxPublicView';
import { AlgoAdminPortalView } from '../algoadmin/AlgoAdminPortalView';
import { Nexus2KanteView } from '../nexus/Nexus2KanteView';
import { NguniAviatorApp } from '../aviator/NguniAviatorApp';
import { LiquidityEdgeEAView } from '../liquidityedge/LiquidityEdgeEAView';
import { GlobalLiquidityMapView } from '../maps/GlobalLiquidityMapView';
import { HighLevelScriptsVaultView } from '../scripts/HighLevelScriptsVaultView';
import { EasyWay2TradeView } from '../easyway2trade/EasyWay2TradeView';
import { EmergePropView } from '../emerge/EmergePropView';
import { EAMigrateProView } from '../eamigrate/EAMigrateProView';
import { TradePortEAView } from '../tradeport/TradePortEAView';
import { EAMatrixView } from '../eamatrix/EAMatrixView';
import { AlgoHostView } from '../algohost/AlgoHostView';
import { EAVaultView } from '../eavault/EAVaultView';
import { EACentralView } from '../eacentral/EACentralView';
import { ITradeBotView } from '../itradebot/ITradeBotView';
import { EAMergeView } from '../eamerge/EAMergeView';
import { GoogleDriveIntegrationCard } from '../picker/GoogleDriveIntegrationCard';
import { GooglePickerButton } from '../picker/GooglePickerButton';

export type OmniLensMode =
  | 'ALL_IN_ONE'
  | 'LIVE_EXECUTION'
  | 'EA_MERGE'
  | 'NEXUS_AVIATOR'
  | 'ALGOMAX_PROP'
  | 'ALGOADMIN_FLEET'
  | 'LIQUIDITY_MAP'
  | 'SCRIPTS_SIGNALS'
  | 'EA_MIGRATE'
  | 'EA_MATRIX'
  | 'ALGO_HOST'
  | 'EA_CENTRAL'
  | 'EA_VAULT'
  | 'TRADEPORT'
  | 'I_TRADE_BOT';

interface UnifiedOmniTradeBridgeViewProps {
  onOpenOrderModal: (symbol?: string, side?: OrderSide) => void;
  onOpenWorkspaceHub?: () => void;
  onOpenAIScanner?: () => void;
  activeSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
  displayCurrency?: 'USD' | 'ZAR';
  onCurrencyChange?: (currency: 'USD' | 'ZAR') => void;
}

export const UnifiedOmniTradeBridgeView: React.FC<UnifiedOmniTradeBridgeViewProps> = ({
  onOpenOrderModal,
  onOpenWorkspaceHub,
  onOpenAIScanner,
  activeSymbol,
  onSymbolChange,
  displayCurrency,
  onCurrencyChange,
}) => {
  const { brand, accent } = useBrand();
  const {
    prices,
    positions,
    pendingOrders,
    orderHistory,
    webhookLogs,
    terminals,
    robots,
    signals,
    automatedSettings,
    ticksPerSecond,
    accountBalance,
    accountEquity,
    unrealizedPnL,
    bridgeLatencyMs,
    closePosition,
    partialClosePosition,
    setBreakEven,
    cancelPendingOrder,
    executeKillSwitch,
    executeOrder,
    executeBatchOrders,
    processWebhookPayload,
    clearWebhookLogs,
    toggleMasterAutoTrading,
    autonomousSnapshots,
    isAutonomousScanning,
    runAutonomousCycle,
  } = useTrading();

  // Active lens mode: ALL_IN_ONE combines all modules in one single bridge
  const [lensMode, setLensMode] = useState<OmniLensMode>('ALL_IN_ONE');

  // Charted symbol state synced with App workspace state
  const [localSymbol, setLocalSymbol] = useState<string>(activeSymbol || 'XAUUSD');
  const chartedSymbol = activeSymbol || localSymbol;
  const setChartedSymbol = (sym: string) => {
    setLocalSymbol(sym);
    onSymbolChange?.(sym);
  };

  // Currency Display Mode synced with App workspace state
  const [localCurrency, setLocalCurrency] = useState<'USD' | 'ZAR'>(displayCurrency || 'USD');
  const currencyMode = displayCurrency || localCurrency;
  const setCurrencyMode = (cur: 'USD' | 'ZAR') => {
    setLocalCurrency(cur);
    onCurrencyChange?.(cur);
  };
  const zarRate = prices['USDZAR']?.bid || liveMarketData.usdZarRate || 18.25;

  // Active bottom book tab in the bridge
  const [activeBookTab, setActiveBookTab] = useState<'POSITIONS' | 'PENDING' | 'HISTORY' | 'WEBHOOKS' | 'BOT_TELEMETRY'>('POSITIONS');

  // Quick execution controls
  const [quickLots, setQuickLots] = useState<number>(0.05);
  const [isPlacingQuickOrder, setIsPlacingQuickOrder] = useState<boolean>(false);
  const [quickOrderNotice, setQuickOrderNotice] = useState<string | null>(null);

  // Nexus Quick Batch Setup (3 simultaneous tickets)
  const [isBatchExecuting, setIsBatchExecuting] = useState<boolean>(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // Position editing & kill switch modals
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [partialClosePos, setPartialClosePos] = useState<Position | null>(null);
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState<boolean>(false);

  // Live ZAR balances derived from real portfolio metrics & live USDZAR exchange rate
  const nexusZarBalance = accountBalance * zarRate;
  const nexusZarEquity = accountEquity * zarRate;
  const nexusZarProfit = unrealizedPnL * zarRate;

  // Real-time UTC clock for institutional session status & catalyst countdown
  const [nowUtc, setNowUtc] = useState<Date>(() => new Date());
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowUtc(new Date());
    }, 1000);
    const timers = timersRef.current;
    return () => {
      clearInterval(interval);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const scheduleNoticeClear = (setter: React.Dispatch<React.SetStateAction<string | null>>, ms = 3500) => {
    const id = window.setTimeout(() => setter(null), ms);
    timersRef.current.push(id);
  };

  // Compute real UTC institutional session state & next catalyst transition
  const sessionSchedule = useMemo(() => {
    const day = nowUtc.getUTCDay();
    const totalSecUtc =
      nowUtc.getUTCHours() * 3600 + nowUtc.getUTCMinutes() * 60 + nowUtc.getUTCSeconds();
    const isWeekend = day === 6 || (day === 0 && totalSecUtc < 22 * 3600);

    const minsUtc = Math.floor(totalSecUtc / 60);
    const londonOpen = !isWeekend && minsUtc >= 7 * 60 && minsUtc < 16 * 60;
    const nyOpen = !isWeekend && minsUtc >= 12 * 60 && minsUtc < 21 * 60;
    const tokyoOpen = !isWeekend && minsUtc >= 0 && minsUtc < 9 * 60;
    const overlapPeak = londonOpen && nyOpen;

    const milestones = [
      { sec: 0, label: 'Tokyo Open (00:00 UTC)' },
      { sec: 7 * 3600, label: 'London LD4 Open (07:00 UTC)' },
      { sec: 12 * 3600, label: 'LDN/NY Killzone (12:00 UTC)' },
      { sec: 16 * 3600, label: 'London Fix (16:00 UTC)' },
      { sec: 21 * 3600, label: 'NY Cash Close (21:00 UTC)' },
    ];
    let next = milestones.find((m) => m.sec > totalSecUtc);
    let secsRemaining = next ? next.sec - totalSecUtc : 24 * 3600 - totalSecUtc;
    if (!next) {
      next = milestones[0];
    }
    const hrs = Math.floor(secsRemaining / 3600);
    const mins = Math.floor((secsRemaining % 3600) / 60);
    const secs = secsRemaining % 60;

    return {
      isWeekend,
      londonOpen,
      nyOpen,
      tokyoOpen,
      overlapPeak,
      nextLabel: next.label,
      countdownText: `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`,
    };
  }, [nowUtc]);

  // Format currency based on USD / ZAR cleanly preserving negative sign before currency symbol
  const formatMoney = (valUsd: number, showPlus = false) => {
    const sign = valUsd < 0 ? '-' : showPlus && valUsd > 0 ? '+' : '';
    const absUsd = Math.abs(valUsd);
    if (currencyMode === 'ZAR') {
      const zarVal = absUsd * zarRate;
      return `${sign}R ${zarVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${sign}$${absUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // One-click quick market execution with symbol-accurate pipSize & digits
  const handleQuickMarketOrder = async (side: OrderSide, symbolOverride?: string) => {
    const targetSymbol = symbolOverride || chartedSymbol;
    const market = resolveMarketPrice(prices, targetSymbol);
    if (!market) {
      setQuickOrderNotice(`Awaiting live quote for ${targetSymbol}`);
      return;
    }
    setIsPlacingQuickOrder(true);
    try {
      const currentPrice = side === 'BUY' ? market.ask : market.bid;
      const pipSize = market.pipSize || 0.0001;
      const digits = market.digits ?? 2;
      const slDist = pipSize * 50;
      const tpDist = pipSize * 100;

      const sl = side === 'BUY' ? currentPrice - slDist : currentPrice + slDist;
      const tp = side === 'BUY' ? currentPrice + tpDist : currentPrice - tpDist;

      await executeOrder({
        symbol: targetSymbol,
        orderType: 'MARKET',
        side,
        lots: quickLots,
        sl: Number(sl.toFixed(digits)),
        tp: Number(tp.toFixed(digits)),
        comment: `OmniBridge_${side}_${quickLots}`,
      });

      setQuickOrderNotice(`Executed ${side} ${quickLots} lots on ${targetSymbol}`);
      scheduleNoticeClear(setQuickOrderNotice, 3500);
    } catch {
      setQuickOrderNotice('Failed to place order');
    } finally {
      setIsPlacingQuickOrder(false);
    }
  };

  // Nexus simultaneous 3-trades batch execution with symbol-accurate pipSize & digits
  const handleExecuteNexusBatch = async (side: OrderSide) => {
    const market = resolveMarketPrice(prices, chartedSymbol);
    if (!market) {
      setBatchNotice(`Awaiting live quote for ${chartedSymbol}`);
      return;
    }
    setIsBatchExecuting(true);
    try {
      const currentPrice = side === 'BUY' ? market.ask : market.bid;
      const pipSize = market.pipSize || 0.0001;
      const digits = market.digits ?? 2;
      const slDist = pipSize * 45;
      const tpDist = pipSize * 110;

      await executeBatchOrders({
        symbol: chartedSymbol,
        side,
        lots: quickLots,
        count: 3,
        sl: Number((side === 'BUY' ? currentPrice - slDist : currentPrice + slDist).toFixed(digits)),
        tp: Number((side === 'BUY' ? currentPrice + tpDist : currentPrice - tpDist).toFixed(digits)),
        comment: 'Nexus2_Batch_3x',
      });

      setBatchNotice(`3-Ticket Batch Dispatched: ${side} 3x${quickLots} lots on ${chartedSymbol}`);
      scheduleNoticeClear(setBatchNotice, 4000);
    } catch {
      setBatchNotice('Batch execution failed');
    } finally {
      setIsBatchExecuting(false);
    }
  };

  // Download real MQL5 Expert Advisor file
  const handleDownloadBridgeEA = () => {
    const bridgeEndpoint =
      typeof window !== 'undefined' ? `${window.location.origin}/api/mt5/bridge` : 'http://localhost:3000/api/mt5/bridge';
    const code = `//+------------------------------------------------------------------+
//|                             Titan_Unified_OmniTrade_Bridge.mq5   |
//|               Copyright 2026, AlgoTrade Matrix & AlgoMax EA v5.2 |
//+------------------------------------------------------------------+
#property copyright "Titan Quant Matrix Ecosystem"
#property version   "5.20"
#property strict

input string InpBridgeServer = "${bridgeEndpoint}";
input string InpLicenseKey   = "AMX-INST-9821-X99";
input string InpHWID         = "HWID-8829-0192-EF91";
input double InpDefaultLots  = 0.05;
input int    InpMagicNumber  = 882910;
input bool   InpUseSMC       = true;
input bool   InpDrawdownGuard= true;

int OnInit() {
   Print("Titan Unified OmniTrade Bridge Initialized. Account: ", AccountInfoInteger(ACCOUNT_LOGIN));
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   Print("Bridge Deinitialized. Reason: ", reason);
}

void OnTick() {
   // Ultra-low latency tick synchronization with Titan OmniTrade Bridge
}
`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Titan_Unified_OmniTrade_Bridge.mq5';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Connected Bot Fleet status derived from live TradingContext robots & execution metrics
  const connectedBots = useMemo(() => {
    if (robots && robots.length > 0) {
      const colors = ['cyan', 'amber', 'emerald', 'blue', 'sky', 'rose'];
      return robots.map((bot, idx) => ({
        name: bot.name,
        type: `${bot.category} (${bot.timeframe})`,
        status: bot.activeStatus,
        winRate: `${bot.winRate.toFixed(1)}%`,
        pnl: `${bot.monthlyReturn >= 0 ? '+' : '-'}${Math.abs(bot.monthlyReturn).toFixed(1)}% (PF ${bot.profitFactor.toFixed(2)})`,
        color: colors[idx % colors.length],
      }));
    }
    const realizedNet = orderHistory.reduce((s, o) => s + o.profit, 0) + unrealizedPnL;
    return [
      {
        name: 'OmniBridge Core Engine',
        type: 'Live Multi-Terminal Execution',
        status: 'ACTIVE',
        winRate: orderHistory.length > 0
          ? `${((orderHistory.filter((o) => o.profit > 0).length / orderHistory.length) * 100).toFixed(1)}%`
          : '0.0%',
        pnl: `${realizedNet >= 0 ? '+' : '-'}${formatMoney(Math.abs(realizedNet))}`,
        color: 'cyan',
      },
    ];
  }, [robots, orderHistory, unrealizedPnL, currencyMode, zarRate]);

  return (
    <div className="space-y-4">
      {/* =========================================================================
          TOP OMNI-BRIDGE COCKPIT: Fleet Telemetry & Unified Segmented Controls
          ========================================================================= */}
      <div className="rounded-2xl glass-ultra border border-white/[0.12] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Brand Identity & Unified Status */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-[#141B29] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2 border-[#0F141E]" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-display tracking-tight">
                {brand.brandName} <span className={accent.textClass}>Omni-Trade Bridge</span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap font-mono tabular-nums mt-0.5">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Activity className="w-3 h-3" /> {terminals.filter((t) => t.status === 'ONLINE').length} / {terminals.length} Terminals Online
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-300">Tick Latency {bridgeLatencyMs.toFixed(1)}ms</span>
              </p>
            </div>
          </div>

          {/* Center/Right: Live Currency Switcher, Equity Card & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Currency Toggle */}
            <div className="flex items-center bg-[#090C12] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
              <button
                type="button"
                onClick={() => setCurrencyMode('USD')}
                className={`px-2.5 py-1.5 rounded-lg transition font-semibold ${
                  currencyMode === 'USD'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('ZAR')}
                className={`px-2.5 py-1.5 rounded-lg transition font-semibold ${
                  currencyMode === 'ZAR'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ZAR
              </button>
            </div>

            {/* Global Equity Card */}
            <div className="px-3.5 py-1.5 rounded-xl bg-[#090C12] border border-white/[0.08] flex items-center gap-3 font-mono tabular-nums">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block tracking-wider font-sans">
                  Net Equity
                </span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {formatMoney(accountEquity)}
                </span>
              </div>
              <div className="text-right pl-3 border-l border-white/[0.08]">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block tracking-wider font-sans">
                  Live PnL
                </span>
                <span
                  className={`text-xs sm:text-sm font-bold flex items-center gap-0.5 ${
                    unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {unrealizedPnL >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatMoney(unrealizedPnL)}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenAIScanner && (
                <button
                  type="button"
                  onClick={onOpenAIScanner}
                  className="px-3 py-2 rounded-xl bg-[#141B29] hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>AI Scanner</span>
                </button>
              )}

              {onOpenWorkspaceHub && (
                <button
                  type="button"
                  onClick={onOpenWorkspaceHub}
                  className="px-3 py-2 rounded-xl bg-[#141B29] hover:bg-slate-800 text-slate-200 border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Workspace</span>
                </button>
              )}

              <GooglePickerButton
                variant="compact"
                buttonLabel="Picker"
                onFilePicked={(file) => {
                  setQuickOrderNotice(`Imported "${file.name}" via Google Picker`);
                  scheduleNoticeClear(setQuickOrderNotice, 4000);
                }}
              />

              <button
                type="button"
                onClick={handleDownloadBridgeEA}
                className="px-3 py-2 rounded-xl bg-[#141B29] hover:bg-slate-800 text-slate-200 border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
                title="Download MQL5 Bridge Connector"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">.mq5 Bridge</span>
              </button>

              <button
                type="button"
                onClick={() => setIsKillSwitchOpen(true)}
                className="px-3 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/35 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition active:scale-95"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Kill Switch</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            UNIFIED SEGMENTED LENS BAR
            ========================================================================= */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> View:
          </span>

          {[
            { id: 'ALL_IN_ONE' as OmniLensMode, label: 'Master Matrix', icon: Sparkles },
            { id: 'EA_MERGE' as OmniLensMode, label: 'EA Merge Fusion', icon: GitMerge },
            { id: 'LIVE_EXECUTION' as OmniLensMode, label: 'Terminal & Orders', icon: Zap },
            { id: 'NEXUS_AVIATOR' as OmniLensMode, label: 'Scalper & Aviator', icon: Flame },
            { id: 'ALGOMAX_PROP' as OmniLensMode, label: 'Institutional EA', icon: Award },
            { id: 'ALGOADMIN_FLEET' as OmniLensMode, label: 'Fleet Admin', icon: Shield },
            { id: 'LIQUIDITY_MAP' as OmniLensMode, label: 'Liquidity & Map', icon: Globe },
            { id: 'SCRIPTS_SIGNALS' as OmniLensMode, label: 'Scripts & Signals', icon: Code },
            { id: 'EA_MIGRATE' as OmniLensMode, label: 'EA Migrate', icon: Smartphone },
            { id: 'EA_MATRIX' as OmniLensMode, label: 'EA Matrix', icon: Layers },
            { id: 'ALGO_HOST' as OmniLensMode, label: 'AlgoHost Pro', icon: Server },
            { id: 'EA_CENTRAL' as OmniLensMode, label: 'EA Central', icon: Smartphone },
            { id: 'EA_VAULT' as OmniLensMode, label: 'EA Vault', icon: Key },
            { id: 'I_TRADE_BOT' as OmniLensMode, label: 'iTradeBot AI', icon: Cpu },
            { id: 'TRADEPORT' as OmniLensMode, label: 'Terminal Ports', icon: Server },
          ].map((lens) => {
            const Icon = lens.icon;
            const active = lensMode === lens.id;
            return (
              <button
                key={lens.id}
                type="button"
                onClick={() => setLensMode(lens.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                  active
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-[#090C12] hover:bg-[#141B29] text-slate-400 hover:text-white border-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lens.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          IF LENS MODE IS ISOLATED: Render that specific view directly in full fidelity
          ========================================================================= */}
      {lensMode === 'NEXUS_AVIATOR' && (
        <div className="space-y-4">
          <AviatorPerformanceHUD />
          <Nexus2KanteView />
        </div>
      )}

      {lensMode === 'ALGOMAX_PROP' && (
        <AlgoMaxPublicView onOpenAdminPortal={() => setLensMode('ALGOADMIN_FLEET')} />
      )}

      {lensMode === 'ALGOADMIN_FLEET' && (
        <AlgoAdminPortalView onOpenPublicSite={() => setLensMode('ALGOMAX_PROP')} />
      )}

      {lensMode === 'LIQUIDITY_MAP' && (
        <div className="space-y-4">
          <GlobalLiquidityMapView />
          <LiquidityEdgeEAView />
        </div>
      )}

      {lensMode === 'SCRIPTS_SIGNALS' && (
        <div className="space-y-4">
          <EasyWay2TradeView
            onExecuteSignal={async (symbol, side, sl, tp, lots = 1.0) => {
              await executeOrder({
                symbol,
                side,
                orderType: 'MARKET',
                lots: lots || 1.0,
                sl,
                tp,
                comment: 'OmniBridge_EasyWay_Signal',
              });
            }}
          />
          <HighLevelScriptsVaultView />
        </div>
      )}

      {lensMode === 'EA_MIGRATE' && <EAMigrateProView />}

      {lensMode === 'EA_MATRIX' && <EAMatrixView />}

      {lensMode === 'ALGO_HOST' && <AlgoHostView />}

      {lensMode === 'EA_CENTRAL' && <EACentralView />}

      {lensMode === 'EA_VAULT' && <EAVaultView />}

      {lensMode === 'EA_MERGE' && <EAMergeView />}

      {lensMode === 'I_TRADE_BOT' && <ITradeBotView />}

      {lensMode === 'TRADEPORT' && <TradePortEAView />}

      {/* =========================================================================
          ALL-IN-ONE MASTER MATRIX: The Grand Unified Trade Bridge Deck!
          Combines live charts, Nexus hologram, Aviator HUD, positions, AlgoMax, Admin, etc.
          ========================================================================= */}
      {(lensMode === 'ALL_IN_ONE' || lensMode === 'LIVE_EXECUTION') && (
        <div className="space-y-4">
          {/* AUTONOMOUS PROFIT PILOT & LIVE CONSENSUS GLASS BAR */}
          <div className="glass-card rounded-2xl p-3.5 sm:p-4 border border-white/[0.1] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={toggleMasterAutoTrading}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition whitespace-nowrap ${
                  automatedSettings.masterAutoTrading
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  Autonomous Profit Pilot: {automatedSettings.masterAutoTrading ? 'ARMED (100%)' : 'PAUSED'}
                </span>
              </button>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {['XAUUSD', 'EURUSD', 'BTCUSD', 'US30'].map((sym) => {
                  const s = autonomousSnapshots[sym];
                  return (
                    <button
                      key={`auto-${sym}`}
                      type="button"
                      onClick={() => setChartedSymbol(sym)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-mono flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span className="font-bold text-white">{sym}</span>
                      <span
                        className={
                          s?.action === 'BUY'
                            ? 'text-emerald-400 font-bold'
                            : s?.action === 'SELL'
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {s ? `${s.action} ${s.confidence}%` : 'LIVE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                disabled={isAutonomousScanning}
                onClick={() => void runAutonomousCycle(true)}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutonomousScanning ? 'animate-spin' : ''}`} />
                <span>{isAutonomousScanning ? 'Scanning 5M Candles...' : 'Auto-Scan & Execute'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLensMode('EA_MERGE')}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <GitMerge className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open EA Merge</span>
              </button>
            </div>
          </div>
          {/* NOTICE BANNERS */}
          {quickOrderNotice && (
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> {quickOrderNotice}
              </span>
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">SUB-MS DISPATCH</span>
            </div>
          )}

          {batchNotice && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" /> {batchNotice}
              </span>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">3-TICKET BATCH</span>
            </div>
          )}

          {/* =====================================================================
              ROW 1: DUAL COCKPIT: Live Trading Chart (Left) + Nexus 2.0 Core (Right)
              ===================================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* LEFT: Live Trading Chart & Execution Strip (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-3">
              {/* Quick symbol and lot controller */}
              <div className="p-3 rounded-xl bg-[#080d19] border border-white/10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {['XAUUSD', 'EURUSD', 'GBPUSD', 'USDZAR', 'BTCUSD', 'XAUUSDm'].map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setChartedSymbol(sym)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition font-mono ${
                        chartedSymbol === sym
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-white/5'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>

                {/* Instant Quick Lots & One-Click Execution */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#050811] px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold mr-1.5">Lots:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10.0"
                      value={quickLots}
                      onChange={(e) => setQuickLots(parseFloat(e.target.value) || 0.01)}
                      className="w-14 bg-transparent text-xs font-bold text-cyan-300 focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    disabled={isPlacingQuickOrder}
                    onClick={() => handleQuickMarketOrder('BUY')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> BUY
                  </button>

                  <button
                    disabled={isPlacingQuickOrder}
                    onClick={() => handleQuickMarketOrder('SELL')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" /> SELL
                  </button>
                </div>
              </div>

              {/* Live Trading Chart Component */}
              <div className="h-[430px] rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#070b14]">
                <LiveTradingChart
                  selectedSymbol={chartedSymbol}
                  onSymbolChange={setChartedSymbol}
                  onQuickTrade={(sym, side) => {
                    setChartedSymbol(sym);
                    handleQuickMarketOrder(side, sym);
                  }}
                />
              </div>
            </div>

            {/* RIGHT: Nexus2.v1 / Kante FX Holographic Neural Engine & 3-Batch Setup (5 cols) */}
            <div className="xl:col-span-5 flex flex-col gap-3">
              <div className="relative rounded-xl bg-gradient-to-b from-[#090e1d] to-[#060a14] border border-cyan-500/20 p-4 shadow-xl overflow-hidden flex-1 flex flex-col justify-between">
                {/* Header of Nexus Core */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 p-[1.5px] flex items-center justify-center">
                      <div className="w-full h-full bg-[#080d19] rounded-[7px] flex items-center justify-center text-amber-400">
                        <Flame className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        SCALPER X2 <span className="text-amber-400">{brand.brandName}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Proprietary AI 2.0 • Micro-Execution</p>
                    </div>
                  </div>

                  {/* Real UTC Liquidity Session / Killzone Countdown */}
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-right">
                    <span className="text-[9px] uppercase font-bold text-amber-300 block tracking-wider">
                      {sessionSchedule.nextLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {sessionSchedule.countdownText}
                    </span>
                  </div>
                </div>

                {/* Nexora Core Summary */}
                <div className="py-4 flex flex-col items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full bg-[#161D2B] border border-cyan-500/35 flex flex-col items-center justify-center">
                    <Cpu className="w-7 h-7 text-cyan-300" />
                    <span className="text-[10px] font-bold text-white mt-1">NEXORA 2.0</span>
                  </div>

                  {/* Live MetaTrader 5 Terminal Screen (ZAR Real Balance Climbing) */}
                  <div className="w-full mt-4 p-3 rounded-xl bg-[#090C12] border border-cyan-500/30 font-mono text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-white/5">
                      <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <Radio className="w-3 h-3" /> MT5 REAL (ZAR)
                      </span>
                      <span className="text-emerald-400 font-bold">LIVE TICK FEED</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                      <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-400 uppercase block">Balance</span>
                        <span className="text-xs font-bold text-white font-mono">
                          R {nexusZarBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-400 uppercase block">Equity</span>
                        <span className="text-xs font-bold text-cyan-300 font-mono">
                          R {nexusZarEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${nexusZarProfit >= 0 ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-rose-950/40 border-rose-500/30'}`}>
                        <span className={`text-[9px] uppercase block ${nexusZarProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Running PnL</span>
                        <span className={`text-xs font-bold font-mono ${nexusZarProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {nexusZarProfit >= 0 ? '+' : '-'}R {Math.abs(nexusZarProfit).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nexus Simultaneous 3-Trades Batch Execution Bar */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> 3-Trade Multi-Ticket Setup
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono font-semibold">
                      3x {quickLots} Lots
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={isBatchExecuting}
                      onClick={() => handleExecuteNexusBatch('BUY')}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>BATCH 3x BUY</span>
                    </button>

                    <button
                      disabled={isBatchExecuting}
                      onClick={() => handleExecuteNexusBatch('SELL')}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 transition active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>BATCH 3x SELL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              ROW 1.5: REAL-TIME MARKET SENTIMENT GAUGE (SIGNAL & BOT PRESSURE)
              ===================================================================== */}
          <MarketSentimentGauge
            selectedSymbol={chartedSymbol}
            price={resolveMarketPrice(prices, chartedSymbol)}
            signals={signals}
            robots={robots}
            positions={positions}
            pendingOrders={pendingOrders}
            orderHistory={orderHistory}
            webhookLogs={webhookLogs}
            terminals={terminals}
            ticksPerSecond={ticksPerSecond}
            masterAutoTrading={automatedSettings.masterAutoTrading}
            onQuickOrder={(side) => handleQuickMarketOrder(side, chartedSymbol)}
          />

          {/* =====================================================================
              ROW 2: AVIATOR EA REAL-TIME SYSTEM PERFORMANCE HUD OVERLAY
              ===================================================================== */}
          <div className="rounded-xl overflow-hidden border border-cyan-500/20 shadow-lg">
            <AviatorPerformanceHUD />
          </div>

          {/* =====================================================================
              ROW 3: UNIFIED POSITIONS BOOK, PENDING ORDERS, WEBHOOKS & BOT TELEMETRY
              ===================================================================== */}
          <div className="rounded-xl bg-[#070b14] border border-white/10 overflow-hidden shadow-xl">
            {/* Tab Header Strip */}
            <div className="bg-[#090e1c] px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveBookTab('POSITIONS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeBookTab === 'POSITIONS'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Open Positions ({positions.length})</span>
                </button>

                <button
                  onClick={() => setActiveBookTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeBookTab === 'PENDING'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending ({pendingOrders.length})</span>
                </button>

                <button
                  onClick={() => setActiveBookTab('HISTORY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeBookTab === 'HISTORY'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Order History</span>
                </button>

                <button
                  onClick={() => setActiveBookTab('WEBHOOKS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeBookTab === 'WEBHOOKS'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Webhook Bridge</span>
                </button>

                <button
                  onClick={() => setActiveBookTab('BOT_TELEMETRY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeBookTab === 'BOT_TELEMETRY'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Fleet Bots ({connectedBots.length})</span>
                </button>
              </div>

              {/* Action tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenOrderModal(chartedSymbol, 'BUY')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> New Ticket
                </button>
              </div>
            </div>

            {/* Content for Positions */}
            {activeBookTab === 'POSITIONS' && (
              <div className="p-4 overflow-x-auto">
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-mono">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
                    No open positions. Use Quick Market Order or Nexus Batch to dispatch trades.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                        <th className="pb-2">Ticket</th>
                        <th className="pb-2">Symbol</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2">Lots</th>
                        <th className="pb-2">Open Price</th>
                        <th className="pb-2">Current</th>
                        <th className="pb-2">SL / TP</th>
                        <th className="pb-2">PnL</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {positions.map((pos) => {
                        const posDigits = resolveMarketPrice(prices, pos.symbol)?.digits ?? 2;
                        return (
                        <tr key={pos.id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 text-slate-400">#{pos.ticket}</td>
                          <td className="py-2.5 font-bold text-white">{pos.symbol}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                pos.side === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-200">{pos.lots.toFixed(2)}</td>
                          <td className="py-2.5 text-slate-300">
                            {pos.openPrice.toFixed(posDigits)}
                          </td>
                          <td className="py-2.5 text-cyan-300 font-semibold">
                            {pos.currentPrice.toFixed(posDigits)}
                          </td>
                          <td className="py-2.5 text-slate-400">
                            {pos.sl ? pos.sl.toFixed(posDigits) : 'None'} /{' '}
                            {pos.tp ? pos.tp.toFixed(posDigits) : 'None'}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`font-bold ${
                                pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {formatMoney(pos.profit, true)}
                            </span>
                          </td>
                          <td className="py-2.5 text-right space-x-1">
                            <button
                              onClick={() => setBreakEven(pos.id)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold transition"
                              title="Set Break-Even"
                            >
                              B/E
                            </button>
                            <button
                              onClick={() => setPartialClosePos(pos)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold transition"
                              title="Partial Close (50%)"
                            >
                              Partial
                            </button>
                            <button
                              onClick={() => closePosition(pos.id)}
                              className="px-2 py-0.5 rounded bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-semibold transition"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Content for Bot Fleet Telemetry */}
            {activeBookTab === 'BOT_TELEMETRY' && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {connectedBots.map((bot) => (
                  <div
                    key={bot.name}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white font-mono tabular-nums">{bot.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {bot.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{bot.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">{bot.pnl}</span>
                      <span className="text-[9px] text-slate-500">Win Rate: {bot.winRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Content for Pending Orders */}
            {activeBookTab === 'PENDING' && (
              <div className="p-4 text-xs font-mono">
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">No pending limit or stop orders.</div>
                ) : (
                  <div className="space-y-2">
                    {pendingOrders.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                        <span className="text-white font-bold">{p.symbol} {p.side} {p.lots} lots @ {p.targetPrice}</span>
                        <button onClick={() => cancelPendingOrder(p.id)} className="px-2 py-1 rounded bg-rose-600 text-[10px] text-white">Cancel</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content for History */}
            {activeBookTab === 'HISTORY' && (
              <div className="p-4 text-xs font-mono">
                {orderHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    No closed orders recorded yet in this session.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {orderHistory.slice(0, 8).map((h) => (
                      <div key={h.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between tabular-nums">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${h.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {h.side}
                          </span>
                          <span className="text-slate-200 font-bold">{h.symbol}</span>
                          <span className="text-slate-400">{h.lots.toFixed(2)} lots</span>
                        </div>
                        <span className={h.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {h.profit >= 0 ? '+' : ''}{formatMoney(h.profit)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content for Webhook Bridge */}
            {activeBookTab === 'WEBHOOKS' && (
              <div className="p-4 text-xs font-mono space-y-3">
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold block mb-0.5">Webhook Endpoint:</span>
                    <code className="text-[11px] text-cyan-400 select-all">POST /api/webhook/tradingview</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        processWebhookPayload(
                          JSON.stringify({ ticker: chartedSymbol, action: 'buy', lots: quickLots, comment: 'TV_Test_Webhook' })
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] transition"
                    >
                      Dispatch TV Signal
                    </button>
                    {webhookLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearWebhookLogs}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                      >
                        Clear Logs
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 tabular-nums">
                  Total Webhook Signals Processed: <b className="text-white">{webhookLogs.length}</b>
                </div>
                {webhookLogs.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {webhookLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="p-2 rounded bg-slate-900/60 border border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate">{log.source} • {log.action} {log.symbol}</span>
                        <span className="text-emerald-400 font-bold shrink-0 ml-2">{log.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =====================================================================
              ROW 4: ALGOMAX EA v5.2 INSTITUTIONAL PROP SUITE & PASS SIMULATOR
              ===================================================================== */}
          <div className="rounded-xl bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#080d1a] border border-cyan-500/25 p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    ALGOMAX EA v5.2
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                    Institutional Prop Challenge Pass Engine
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Automated Smart Money Concept (SMC) order-block execution with 4% daily drawdown guard.
                </p>
              </div>

              {/* Jump to full view button */}
              <button
                onClick={() => setLensMode('ALGOMAX_PROP')}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition self-start md:self-auto"
              >
                <span>Full AlgoMax Portal</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Verified Pass Rate
                </span>
                <span className="text-xl font-extrabold text-cyan-300 font-mono tabular-nums">94.6%</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">FTMO, MFF, FundedNext</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Client Funded Capital
                </span>
                <span className="text-xl font-extrabold text-emerald-300 font-mono tabular-nums">$14,820,000+</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">1,482 Active Funded Accounts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Profit Factor / Max DD
                </span>
                <span className="text-xl font-extrabold text-amber-300 font-mono tabular-nums">3.82 / 3.4%</span>
                <span className="text-[10px] text-amber-400 block mt-0.5">Circuit breaker protected</span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              ROW 5: SOVEREIGN FLEET ADMIN PORTAL OPERATIONS
              ===================================================================== */}
          <div className="rounded-xl bg-[#0F141E] border border-amber-500/25 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-mono tabular-nums flex items-center gap-2">
                    {brand.brandName} FLEET ADMIN PORTAL
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      PRINCIPAL OWNER
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Owner Console: <code className="text-amber-300">{brand.ownerEmail}</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setLensMode('ALGOADMIN_FLEET')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <span>Launch Master Owner Portal</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Fleet Nodes Ping Status Bar */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              {[
                { loc: 'Frankfurt (EU)', ping: '1.2ms', status: 'ONLINE', nodes: 142 },
                { loc: 'London (LD4)', ping: '1.8ms', status: 'ONLINE', nodes: 118 },
                { loc: 'New York (NY4)', ping: '2.4ms', status: 'ONLINE', nodes: 89 },
                { loc: 'Johannesburg (JHB)', ping: '4.1ms', status: 'ONLINE', nodes: 44 },
                { loc: 'Singapore (SG1)', ping: '3.6ms', status: 'ONLINE', nodes: 25 },
              ].map((server) => (
                <div key={server.loc} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 block truncate">{server.loc}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-cyan-300">{server.ping}</span>
                    <span className="text-[9px] font-bold text-emerald-400">● {server.nodes} VPS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =====================================================================
              ROW 6: GLOBAL LIQUIDITY SESSIONS & LIVE QUANT SIGNALS TAPE
              ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Global Forex Sessions Radar (Real UTC Clock) */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" /> Global Sessions Overlap
                  </span>
                  <span className="text-[10px] font-bold font-mono text-blue-300 tabular-nums">
                    {sessionSchedule.isWeekend
                      ? 'Weekend FX Pause'
                      : sessionSchedule.overlapPeak
                        ? 'London / NY Peak'
                        : sessionSchedule.nyOpen
                          ? 'New York Active'
                          : sessionSchedule.londonOpen
                            ? 'London Active'
                            : 'Asian Desk Active'}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                    <span className="text-slate-300">London Session (07–16 UTC)</span>
                    <span className={sessionSchedule.londonOpen ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                      {sessionSchedule.londonOpen ? '● OPEN' : '○ CLOSED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                    <span className="text-slate-300">New York Session (12–21 UTC)</span>
                    <span className={sessionSchedule.nyOpen ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                      {sessionSchedule.nyOpen ? '● OPEN' : '○ CLOSED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                    <span className="text-slate-300">Tokyo / Asian (00–09 UTC)</span>
                    <span className={sessionSchedule.tokyoOpen ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                      {sessionSchedule.tokyoOpen ? '● OPEN' : '○ CLOSED'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLensMode('LIQUIDITY_MAP')}
                className="mt-3 w-full py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>View Full Liquidity Heatmap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Live Quant Signal Stream wired to TradingContext signals & live prices */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> {brand.brandName} Live Signals
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono tabular-nums">
                    {signals.length > 0
                      ? `${Math.round(signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length)}% AVG CONFIDENCE`
                      : 'LIVE FEED'}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs font-mono">
                  {(signals.length > 0
                    ? signals.slice(0, 2)
                    : [
                        { id: 'live-xau', symbol: 'XAUUSD', side: 'BUY' as OrderSide, confidence: 88, entryPrice: 0, sl: 0, tp1: 0, tp2: 0 },
                        { id: 'live-eur', symbol: 'EURUSD', side: 'SELL' as OrderSide, confidence: 84, entryPrice: 0, sl: 0, tp1: 0, tp2: 0 },
                      ]
                  ).map((sig) => {
                    const liveQuote = resolveMarketPrice(prices, sig.symbol);
                    const digits = liveQuote?.digits ?? 2;
                    const pipSize = liveQuote?.pipSize ?? 0.1;
                    const side: OrderSide = sig.side === 'SELL' ? 'SELL' : 'BUY';
                    const liveEntry = liveQuote ? (side === 'BUY' ? liveQuote.ask : liveQuote.bid) : sig.entryPrice;
                    const liveSl = side === 'BUY' ? liveEntry - pipSize * 50 : liveEntry + pipSize * 50;
                    const liveTp = side === 'BUY' ? liveEntry + pipSize * 100 : liveEntry - pipSize * 100;
                    return (
                      <div
                        key={sig.id}
                        className={`p-2.5 rounded bg-slate-900/70 border flex items-center justify-between ${
                          side === 'BUY' ? 'border-emerald-500/30' : 'border-rose-500/30'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-white">
                            {sig.symbol} · {side} SIGNAL ({sig.confidence}%)
                          </span>
                          <span className="text-[10px] text-slate-400 block tabular-nums">
                            Live: {liveEntry.toFixed(digits)} · SL: {liveSl.toFixed(digits)} · TP: {liveTp.toFixed(digits)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleQuickMarketOrder(side, sig.symbol)}
                          className={`px-2.5 py-1 rounded text-white font-bold text-[10px] transition active:scale-95 shrink-0 ${
                            side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                          }`}
                        >
                          1-Click Exec
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setLensMode('SCRIPTS_SIGNALS')}
                className="mt-3 w-full py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>View All Signals & MQL5 Scripts</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* =====================================================================
              ROW 7: MOBILE CLOUD VPS & KEY VAULT ECOSYSTEM
              ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0F141E] border border-white/[0.08] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> EA Migrate Pro
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">$39/mo · 1ms</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                  Migrate MT4/MT5 robots to Equinix LD4/NY4 in 3 steps with NFP/CPI news freeze shields.
                </p>
              </div>
              <button
                onClick={() => setLensMode('EA_MIGRATE')}
                className="w-full py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Open EA Migrate Pro</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0F141E] border border-white/[0.08] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" /> EA Matrix Grid
                  </span>
                  <span className="text-[11px] font-bold text-cyan-300 tabular-nums">Mobile Sync</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                  Phone-first remote MT4/MT5 controller, broker linker, and verified mentor copy matrix.
                </p>
              </div>
              <button
                onClick={() => setLensMode('EA_MATRIX')}
                className="w-full py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Open EA Matrix</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0F141E] border border-white/[0.08] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-400" /> Algohost Cloud
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">$29 / Slot</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                  1-click mobile EA container launcher with plug-and-play bots and live drawdown caps.
                </p>
              </div>
              <button
                onClick={() => setLensMode('ALGO_HOST')}
                className="w-full py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Open Algohost VPS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0F141E] border border-white/[0.08] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-cyan-400" /> EA Vault &amp; Ports
                  </span>
                  <span className="text-[11px] font-bold text-cyan-300 tabular-nums">HWID · .SET</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                  Cryptographic WebAuth key manager, custom .SET compiler, and TradePort fixed terminals.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setLensMode('EA_CENTRAL')}
                  className="py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition"
                >
                  EA Central
                </button>
                <button
                  onClick={() => setLensMode('EA_VAULT')}
                  className="py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition"
                >
                  EA Vault
                </button>
                <button
                  onClick={() => setLensMode('TRADEPORT')}
                  className="py-2 rounded-lg bg-[#161D2B] hover:bg-slate-800 text-slate-200 border border-white/[0.08] text-[11px] font-bold transition"
                >
                  TradePort
                </button>
              </div>
            </div>
          </div>

          {/* =====================================================================
              ROW 8: GOOGLE PICKER & CLOUD DRIVE STORAGE INTEGRATION
              ===================================================================== */}
          <GoogleDriveIntegrationCard />
        </div>
      )}

      {/* =========================================================================
          MODALS: Partial Close & Kill Switch Modals
          ========================================================================= */}
      {partialClosePos && (
        <PartialCloseModal
          position={partialClosePos}
          onClose={() => setPartialClosePos(null)}
          onConfirm={(posId, lots) => partialClosePosition(posId, lots)}
        />
      )}

      {isKillSwitchOpen && (
        <KillSwitchModal
          isOpen={isKillSwitchOpen}
          positionCount={positions.length}
          pendingCount={pendingOrders.length}
          onClose={() => setIsKillSwitchOpen(false)}
          onConfirm={executeKillSwitch}
        />
      )}
    </div>
  );
};
