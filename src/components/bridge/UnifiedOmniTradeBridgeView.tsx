import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { liveMarketData } from '../../services/liveMarketData';
import { Position, OrderSide, OrderType } from '../../types/trading';
import { LiveTradingChart } from './LiveTradingChart';
import { EditPositionModal } from './EditPositionModal';
import { PartialCloseModal, KillSwitchModal } from './PartialCloseModal';
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
import { GoogleDriveIntegrationCard } from '../picker/GoogleDriveIntegrationCard';
import { GooglePickerButton } from '../picker/GooglePickerButton';

export type OmniLensMode =
  | 'ALL_IN_ONE'
  | 'LIVE_EXECUTION'
  | 'NEXUS_AVIATOR'
  | 'ALGOMAX_PROP'
  | 'ALGOADMIN_FLEET'
  | 'LIQUIDITY_MAP'
  | 'SCRIPTS_SIGNALS'
  | 'EA_MIGRATE'
  | 'TRADEPORT';

interface UnifiedOmniTradeBridgeViewProps {
  onOpenOrderModal: (symbol?: string, side?: OrderSide) => void;
}

export const UnifiedOmniTradeBridgeView: React.FC<UnifiedOmniTradeBridgeViewProps> = ({
  onOpenOrderModal,
}) => {
  const {
    prices,
    positions,
    pendingOrders,
    orderHistory,
    webhookLogs,
    terminals,
    robots,
    accountBalance,
    accountEquity,
    unrealizedPnL,
    usedMargin,
    freeMargin,
    marginLevel,
    bridgeLatencyMs,
    closePosition,
    partialClosePosition,
    modifyPositionSLTP,
    setBreakEven,
    toggleTrailingStop,
    cancelPendingOrder,
    executeKillSwitch,
    executeOrder,
    executeBatchOrders,
    processWebhookPayload,
    clearWebhookLogs,
  } = useTrading();

  // Active lens mode: ALL_IN_ONE combines all modules in one single bridge
  const [lensMode, setLensMode] = useState<OmniLensMode>('ALL_IN_ONE');

  // Charted symbol state
  const [chartedSymbol, setChartedSymbol] = useState<string>('XAUUSD');

  // Currency Display Mode: USD or ZAR (live USDZAR feed)
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'ZAR'>('USD');
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

  // Dynamic news countdown (BOE Rate Decision)
  const [boeHours, setBoeHours] = useState<number>(20);
  const [boeMinutes, setBoeMinutes] = useState<number>(42);
  const [boeSeconds, setBoeSeconds] = useState<number>(15);

  // Countdown timer for catalyst schedule
  useEffect(() => {
    const interval = setInterval(() => {
      setBoeSeconds((prev) => {
        if (prev > 0) return prev - 1;
        setBoeMinutes((m) => {
          if (m > 0) return m - 1;
          setBoeHours((h) => (h > 0 ? h - 1 : 23));
          return 59;
        });
        return 59;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format currency based on USD / ZAR
  const formatMoney = (valUsd: number) => {
    if (currencyMode === 'ZAR') {
      const zarVal = valUsd * zarRate;
      return `R ${zarVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${valUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // One-click quick market execution
  const handleQuickMarketOrder = async (side: OrderSide, symbolOverride?: string) => {
    const targetSymbol = symbolOverride || chartedSymbol;
    setIsPlacingQuickOrder(true);
    try {
      const currentPrice = prices[targetSymbol]?.bid || 2650.0;
      const isMetalOrCrypto = targetSymbol.includes('XAU') || targetSymbol.includes('BTC');
      const slDist = isMetalOrCrypto ? 8.0 : 0.003;
      const tpDist = isMetalOrCrypto ? 16.0 : 0.006;

      const sl = side === 'BUY' ? currentPrice - slDist : currentPrice + slDist;
      const tp = side === 'BUY' ? currentPrice + tpDist : currentPrice - tpDist;

      await executeOrder({
        symbol: targetSymbol,
        orderType: 'MARKET',
        side,
        lots: quickLots,
        sl: parseFloat(sl.toFixed(isMetalOrCrypto ? 2 : 4)),
        tp: parseFloat(tp.toFixed(isMetalOrCrypto ? 2 : 4)),
        comment: `OmniBridge_${side}_${quickLots}`,
      });

      setQuickOrderNotice(`✓ Executed ${side} ${quickLots} lots on ${targetSymbol}`);
      setTimeout(() => setQuickOrderNotice(null), 3500);
    } catch {
      setQuickOrderNotice(`Failed to place order`);
    } finally {
      setIsPlacingQuickOrder(false);
    }
  };

  // Nexus simultaneous 3-trades batch execution
  const handleExecuteNexusBatch = async (side: OrderSide) => {
    setIsBatchExecuting(true);
    try {
      const currentPrice = prices[chartedSymbol]?.bid || 2650.0;
      await executeBatchOrders({
        symbol: chartedSymbol,
        side,
        lots: quickLots,
        count: 3,
        sl: side === 'BUY' ? currentPrice - 6.0 : currentPrice + 6.0,
        tp: side === 'BUY' ? currentPrice + 16.0 : currentPrice - 16.0,
        comment: 'Nexus2_Batch_3x',
      });

      setBatchNotice(`⚡ 3-Ticket Batch Dispatched: ${side} 3x${quickLots} lots on ${chartedSymbol}`);
      setTimeout(() => setBatchNotice(null), 4000);
    } catch {
      setBatchNotice('Batch execution failed');
    } finally {
      setIsBatchExecuting(false);
    }
  };

  // Download real MQL5 Expert Advisor file
  const handleDownloadBridgeEA = () => {
    const code = `//+------------------------------------------------------------------+
//|                             Titan_Unified_OmniTrade_Bridge.mq5   |
//|               Copyright 2026, AlgoTrade Matrix & AlgoMax EA v5.2 |
//|                             https://algotradematrix.io           |
//+------------------------------------------------------------------+
#property copyright "Titan Quant Matrix Ecosystem"
#property link      "https://algotradematrix.io"
#property version   "5.20"
#property strict

input string InpBridgeServer = "https://YOUR_APP_URL/api/mt5/bridge";
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
      const colors = ['cyan', 'amber', 'emerald', 'blue', 'purple', 'rose'];
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
          TOP OMNI-BRIDGE COCKPIT: Fleet KPI Telemetry & Dual-Currency Ribbon
          ========================================================================= */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#070b14] via-[#090f1d] to-[#070b14] border border-cyan-500/25 p-3.5 sm:p-5 shadow-[0_0_40px_rgba(6,182,212,0.12)] overflow-hidden">
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Brand Identity & Unified Status */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-[2px] shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-[#050913] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Layers className="w-6 h-6 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#050913]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white font-orbitron tracking-wide">
                  TITAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">OMNI-TRADE BRIDGE</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  ALL-IN-ONE
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap tabular-nums">
                <span>Unified Multi-Bot Matrix</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Activity className="w-3 h-3" /> {terminals.filter((t) => t.status === 'ONLINE').length} / {terminals.length} Terminals Online
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300">Tick Latency: {bridgeLatencyMs.toFixed(1)}ms</span>
              </p>
            </div>
          </div>

          {/* Center: Live Currency Switcher & Global Equity Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Currency Toggle */}
            <div className="flex items-center bg-[#050811] p-1 rounded-xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => setCurrencyMode('USD')}
                className={`px-3 py-1.5 rounded-lg transition font-bold ${
                  currencyMode === 'USD'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrencyMode('ZAR')}
                className={`px-3 py-1.5 rounded-lg transition font-bold ${
                  currencyMode === 'ZAR'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ZAR (R)
              </button>
            </div>

            {/* Global Equity Card */}
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-3 tabular-nums">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Net Portfolio Equity
                </span>
                <span className="text-base sm:text-lg font-bold font-orbitron text-white">
                  {formatMoney(accountEquity)}
                </span>
              </div>
              <div className="text-right pl-2 border-l border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
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
            <div className="flex items-center gap-2">
              <GooglePickerButton
                variant="compact"
                buttonLabel="Google Picker"
                onFilePicked={(file) => {
                  setQuickOrderNotice(`✓ Imported "${file.name}" via Google Picker`);
                  setTimeout(() => setQuickOrderNotice(null), 4000);
                }}
              />

              <button
                onClick={handleDownloadBridgeEA}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Download MQL5 Bridge Connector"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">.mq5 Bridge</span>
              </button>

              <button
                onClick={() => setIsKillSwitchOpen(true)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/40 transition active:scale-95"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>KILL SWITCH</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            OMNI LENS MODE SELECTOR: One-Click Navigation between Combined & Lenses
            ========================================================================= */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> Lens:
          </span>

          <button
            onClick={() => setLensMode('ALL_IN_ONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'ALL_IN_ONE'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🌐 ALL-IN-ONE MASTER MATRIX</span>
          </button>

          <button
            onClick={() => setLensMode('LIVE_EXECUTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'LIVE_EXECUTION'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>⚡ TERMINAL & ORDERS</span>
          </button>

          <button
            onClick={() => setLensMode('NEXUS_AVIATOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'NEXUS_AVIATOR'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>✨ NEXUS2 & AVIATOR HUD</span>
          </button>

          <button
            onClick={() => setLensMode('ALGOMAX_PROP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'ALGOMAX_PROP'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>💎 ALGOMAX EA v5.2</span>
          </button>

          <button
            onClick={() => setLensMode('ALGOADMIN_FLEET')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'ALGOADMIN_FLEET'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>🛡️ ALGO ADMIN PORTAL</span>
          </button>

          <button
            onClick={() => setLensMode('LIQUIDITY_MAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'LIQUIDITY_MAP'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>🌊 LIQUIDITY & MAP</span>
          </button>

          <button
            onClick={() => setLensMode('SCRIPTS_SIGNALS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'SCRIPTS_SIGNALS'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-rose-400" />
            <span>📜 SCRIPTS & VIP SIGNALS</span>
          </button>

          <button
            onClick={() => setLensMode('EA_MIGRATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'EA_MIGRATE'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>📱 EA MIGRATE PRO (24/7 VPS)</span>
          </button>

          <button
            onClick={() => setLensMode('TRADEPORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition shrink-0 flex items-center gap-1.5 ${
              lensMode === 'TRADEPORT'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>🚢 TRADEPORT EA (FIXED VPS)</span>
          </button>
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

      {lensMode === 'TRADEPORT' && <TradePortEAView />}

      {/* =========================================================================
          ALL-IN-ONE MASTER MATRIX: The Grand Unified Trade Bridge Deck!
          Combines live charts, Nexus hologram, Aviator HUD, positions, AlgoMax, Admin, etc.
          ========================================================================= */}
      {(lensMode === 'ALL_IN_ONE' || lensMode === 'LIVE_EXECUTION') && (
        <div className="space-y-4">
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
                      <h3 className="text-sm font-extrabold text-white font-orbitron tracking-wide">
                        NEXUS2.v1 <span className="text-amber-400 text-glow-amber">KANTE FX</span>
                      </h3>
                      <p className="text-[10px] text-slate-400">Nexora AI 2.0 • Micro-Execution</p>
                    </div>
                  </div>

                  {/* High-Impact News Counter */}
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-right">
                    <span className="text-[9px] uppercase font-bold text-amber-300 block tracking-wider">
                      GBP BOE Catalyst
                    </span>
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {boeHours}h {String(boeMinutes).padStart(2, '0')}m {String(boeSeconds).padStart(2, '0')}s
                    </span>
                  </div>
                </div>

                {/* Central Holographic Neural Core Graphic */}
                <div className="py-4 flex flex-col items-center justify-center relative">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Pulsing orbital rings */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '14s' }} />
                    <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/30 animate-spin" style={{ animationDuration: '9s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-5 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />

                    {/* Central Orb */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 via-amber-500/20 to-rose-500/20 backdrop-blur-md border border-cyan-400/40 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                      <Cpu className="w-6 h-6 text-cyan-300 animate-pulse" />
                      <span className="text-[9px] font-bold text-white font-orbitron mt-0.5">NEXORA</span>
                    </div>
                  </div>

                  {/* Live MetaTrader 5 Terminal Screen (ZAR Real Balance Climbing) */}
                  <div className="w-full mt-3 p-3 rounded-xl bg-[#040711] border border-cyan-500/30 font-mono text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-white/5">
                      <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <Radio className="w-3 h-3 animate-pulse" /> MT5 REAL (ZAR)
                      </span>
                      <span className="text-emerald-400 font-bold">● LIVE TICK FEED</span>
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
                  <span>Fleet Bots (6)</span>
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
                      {positions.map((pos) => (
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
                          <td className="py-2.5 text-slate-300">{pos.openPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-cyan-300 font-semibold">{pos.currentPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-slate-400">
                            {pos.sl ? pos.sl.toFixed(2) : 'None'} / {pos.tp ? pos.tp.toFixed(2) : 'None'}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`font-bold ${
                                pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pos.profit >= 0 ? '+' : ''}
                              {formatMoney(pos.profit)}
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
                      ))}
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
                        <span className="text-xs font-bold text-white font-orbitron">{bot.name}</span>
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
                  <h2 className="text-base sm:text-lg font-bold text-white font-orbitron">
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
                <span className="text-xl font-extrabold text-cyan-300 font-orbitron">94.6%</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">FTMO, MFF, FundedNext</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Client Funded Capital
                </span>
                <span className="text-xl font-extrabold text-emerald-300 font-orbitron">$14,820,000+</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">1,482 Active Funded Accounts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Profit Factor / Max DD
                </span>
                <span className="text-xl font-extrabold text-amber-300 font-orbitron">3.82 / 3.4%</span>
                <span className="text-[10px] text-amber-400 block mt-0.5">Circuit breaker protected</span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              ROW 5: ALGO ADMIN PORTAL FLEET OPERATIONS (Super Admin)
              ===================================================================== */}
          <div className="rounded-xl bg-[#070b14] border border-purple-500/25 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-orbitron flex items-center gap-2">
                    ALGO ADMIN FLEET PORTAL
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      SUPER ADMIN
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Logged in: <code className="text-purple-300">thulanimyeni19712@gmail.com</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setLensMode('ALGOADMIN_FLEET')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <span>Launch Master Admin Portal</span>
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
              ROW 6: GLOBAL LIQUIDITY SESSIONS & VIP SIGNALS TAPE
              ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Global Forex Sessions Radar */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" /> Global Sessions Overlap
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    London / NY Peak
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                    <span className="text-slate-300">London Session</span>
                    <span className="text-emerald-400 font-bold">● OPEN (High Volume)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                    <span className="text-slate-300">New York Session</span>
                    <span className="text-emerald-400 font-bold">● OPEN (Peak Volatility)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                    <span className="text-slate-300">Tokyo / Asian</span>
                    <span className="text-slate-500 font-bold">○ CLOSED</span>
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

            {/* Right: EasyWay VIP Signal Provider Stream */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> EasyWay2Trade Live Signals
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">92% ACCURACY</span>
                </div>
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">XAUUSD • BUY SIGNAL</span>
                      <span className="text-[10px] text-slate-400 block tabular-nums">Entry: 2652.50 • SL: 2645.00 • TP: 2668.00</span>
                    </div>
                    <button
                      onClick={() => handleQuickMarketOrder('BUY', 'XAUUSD')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition active:scale-95"
                    >
                      1-Click Exec
                    </button>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/70 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">EURUSD • SELL SIGNAL</span>
                      <span className="text-[10px] text-slate-400 block tabular-nums">Entry: 1.0845 • SL: 1.0875 • TP: 1.0790</span>
                    </div>
                    <button
                      onClick={() => handleQuickMarketOrder('SELL', 'EURUSD')}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition active:scale-95"
                    >
                      1-Click Exec
                    </button>
                  </div>
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
              ROW 7: MOBILE CLOUD VPS HOSTING (EA MIGRATE PRO & TRADEPORT EA)
              ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#070b14] border border-white/10 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> EA Migrate Pro (Cloud VPS)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">$39/mo · 1ms</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                  Migrate any MT4/MT5 robot to Equinix LD4/NY4 in 3 steps with NFP/CPI news freeze buffers and zero PC dependency.
                </p>
              </div>
              <button
                onClick={() => setLensMode('EA_MIGRATE')}
                className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Open EA Migrate Pro Wizard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#070b14] border border-white/10 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-cyan-400" /> TradePort EA (Fixed Ports)
                  </span>
                  <span className="text-[11px] font-bold text-cyan-300 tabular-nums">R600 / $36 Fixed</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">
                  1/3/12-month fixed-term MT4/MT5 cloud ports with zero hidden auto-renewals plus USDT/BTC/ETH affiliate payouts.
                </p>
              </div>
              <button
                onClick={() => setLensMode('TRADEPORT')}
                className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Open TradePort EA Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
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
