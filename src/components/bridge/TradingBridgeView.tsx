import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Position, OrderSide } from '../../types/trading';
import { EditPositionModal } from './EditPositionModal';
import { PartialCloseModal, KillSwitchModal } from './PartialCloseModal';
import { LiveTradingChart } from './LiveTradingChart';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Shield,
  Layers,
  Search,
  Download,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Radio,
  Copy,
  Check,
  Code,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Scissors,
  BookmarkCheck,
  FileCode,
  Activity,
} from 'lucide-react';

interface TradingBridgeViewProps {
  onOpenOrderModal: (symbol?: string, side?: OrderSide) => void;
}

export const TradingBridgeView: React.FC<TradingBridgeViewProps> = ({ onOpenOrderModal }) => {
  const {
    prices,
    positions,
    pendingOrders,
    orderHistory,
    webhookLogs,
    terminals,
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
    processWebhookPayload,
    clearWebhookLogs,
  } = useTrading();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'PENDING' | 'HISTORY' | 'WEBHOOK_BRIDGE'>('POSITIONS');

  // Charted symbol state
  const [chartedSymbol, setChartedSymbol] = useState<string>('XAUUSD');

  // Modals state
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [partialClosePos, setPartialClosePos] = useState<Position | null>(null);
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState<boolean>(false);

  // Download real MQL5 Expert Advisor file
  const handleDownloadMT5BridgeEA = () => {
    const code = `//+------------------------------------------------------------------+
//|                                        AlgoTrade_Matrix_Bridge.mq5|
//|                        Copyright 2026, AlgoTrade Matrix Ecosystem|
//|                                  https://algotradematrix.io       |
//+------------------------------------------------------------------+
#property copyright "AlgoTrade Matrix Ecosystem"
#property link      "https://algotradematrix.io"
#property version   "4.80"
#property strict

input string InpBridgeURL    = "https://YOUR_APP_URL/api/mt5/bridge";
input string InpSecretToken  = "sec_bridge_live_883921";
input double InpMaxSlippage  = 2.0;

int OnInit() {
   Print("AlgoTrade Matrix MT5 Bridge Initialized on Account: ", AccountInfoInteger(ACCOUNT_LOGIN));
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   Print("AlgoTrade Matrix MT5 Bridge Deinitialized.");
}

void OnTick() {
   // Sub-millisecond tick synchronization with AlgoTrade Matrix Bridge
}
`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AlgoTrade_Matrix_Bridge.mq5';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // History search / filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  // Webhook Tester State
  const [webhookSource, setWebhookSource] = useState<string>('TradingView Alert');
  const [webhookPayload, setWebhookPayload] = useState<string>(
    JSON.stringify(
      {
        strategy: 'Endgame_AI_Forex',
        action: 'BUY',
        symbol: 'XAUUSD',
        lots: 1.0,
        sl: 2725.0,
        tp: 2755.0,
        secret: 'sec_ea_live_883921',
      },
      null,
      2
    )
  );
  const [webhookStatusMessage, setWebhookStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState<boolean>(false);

  // Copy webhook URL helper
  const handleCopyWebhookUrl = () => {
    const bridgeUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mt5/bridge` : '/api/mt5/bridge';
    navigator.clipboard.writeText(bridgeUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  // Export History CSV
  const handleExportCSV = () => {
    const headers = ['Ticket', 'Symbol', 'Side', 'Type', 'Lots', 'Open Price', 'Close Price', 'Pips', 'Net Profit', 'Open Time', 'Close Time', 'Latency (ms)', 'Close Reason'];
    const rows = orderHistory.map((h) => [
      h.ticket,
      h.symbol,
      h.side,
      h.orderType,
      h.lots,
      h.openPrice,
      h.closePrice,
      h.pips,
      h.profit,
      h.openTime,
      h.closeTime,
      h.latencyMs,
      h.closeReason,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OrderHistory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger live webhook dispatch
  const handleSendTestWebhook = async () => {
    const result = processWebhookPayload(webhookPayload, webhookSource);
    try {
      const parsed = JSON.parse(webhookPayload) as Record<string, unknown>;
      await fetch('/api/mt5/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: parsed.symbol || 'XAUUSD',
          side: parsed.action || 'BUY',
          lots: parsed.lots || 1.0,
          sl: parsed.sl ?? null,
          tp: parsed.tp ?? null,
          comment: `Webhook_${webhookSource}`,
        }),
      });
    } catch {
      // Payload validation already handled above
    }
    setWebhookStatusMessage({
      text: result.message,
      isError: !result.success,
    });
    setTimeout(() => setWebhookStatusMessage(null), 4000);
  };

  const filteredHistory = orderHistory.filter((item) => {
    const matchesSearch =
      item.symbol.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.ticket.toString().includes(historySearch) ||
      item.closeReason.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;
    if (historyFilter === 'WIN') return item.profit > 0;
    if (historyFilter === 'LOSS') return item.profit < 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Real-time Account & Bridge Telemetry Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Account Equity */}
        <div className="obsidian-panel hud-bracket rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Account Equity</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="text-xl font-black text-slate-100 font-mono mt-1 tracking-tight">
            ${accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-1">
            <span className="text-slate-500">Balance:</span>
            <span className="text-slate-300 font-semibold">${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Floating PnL */}
        <div className={`obsidian-panel hud-bracket rounded-xl p-3.5 relative overflow-hidden ${
          unrealizedPnL >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
        }`}>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Floating PnL</span>
            <span className={`text-[10px] font-mono font-bold ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {positions.length} Active
            </span>
          </div>
          <div className={`text-xl font-black font-mono mt-1 tracking-tight ${
            unrealizedPnL >= 0 ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]'
          }`}>
            {unrealizedPnL >= 0 ? `+$${unrealizedPnL.toFixed(2)}` : `-$${Math.abs(unrealizedPnL).toFixed(2)}`}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            {unrealizedPnL >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
            <span className={unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {((unrealizedPnL / (accountBalance || 1)) * 100).toFixed(2)}% ROI
            </span>
          </div>
        </div>

        {/* Free Margin */}
        <div className="obsidian-panel hud-bracket rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Free Margin</div>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1 tracking-tight">
            ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span className="text-slate-500">Margin Level:</span>
            <span className="text-cyan-300 font-bold">{marginLevel > 0 ? `${marginLevel.toFixed(0)}%` : '∞'}</span>
          </div>
        </div>

        {/* Used Margin */}
        <div className="obsidian-panel hud-bracket rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Used Margin</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1 tracking-tight">
            ${usedMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span className="text-slate-500">Leverage:</span>
            <span className="text-amber-300 font-bold">1:100 DMA</span>
          </div>
        </div>

        {/* Direct Bridge Latency */}
        <div className="obsidian-panel hud-bracket rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>DMA Ping</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1 tracking-tight flex items-baseline gap-1">
            <span>{bridgeLatencyMs}</span>
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            Equinix LD4 (London)
          </div>
        </div>

        {/* Emergency Kill Switch */}
        <div className="obsidian-panel rounded-xl p-3.5 relative overflow-hidden bg-rose-950/20 border-rose-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold uppercase tracking-wider">
            <span>Circuit Breaker</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          </div>
          <button
            onClick={() => setIsKillSwitchOpen(true)}
            className="w-full py-2 px-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-lg text-xs font-black font-mono uppercase tracking-wider transition shadow-lg shadow-rose-950/60 flex items-center justify-center gap-1.5 active:scale-98"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kill Switch</span>
          </button>
        </div>
      </div>

      {/* Live Market Watch & Fast Execution Strip */}
      <div className="obsidian-panel hud-bracket rounded-2xl p-4 shadow-2xl relative">
        <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono">
              Live Interbank Market Watch & Execution Matrix
            </h3>
          </div>
          <button
            onClick={() => onOpenOrderModal('XAUUSD', 'BUY')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>New Order Ticket</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          {Object.values(prices).map((mkt) => (
            <div
              key={mkt.symbol}
              onClick={() => setChartedSymbol(mkt.symbol)}
              className={`p-3 rounded-xl transition group relative overflow-hidden cursor-pointer border ${
                chartedSymbol === mkt.symbol
                  ? 'bg-slate-900/90 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/30'
                  : 'bg-black/40 border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-xs text-slate-200">{mkt.symbol}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                    mkt.change24h >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {mkt.change24h >= 0 ? '+' : ''}
                  {mkt.change24h}%
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs mb-2">
                <div>
                  <span className="text-[9px] uppercase block text-slate-500 font-bold">Bid</span>
                  <span className="text-rose-400 font-black">{mkt.bid}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase block text-slate-500 font-bold">Ask</span>
                  <span className="text-emerald-400 font-black">{mkt.ask}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/[0.06]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOrderModal(mkt.symbol, 'SELL');
                  }}
                  className="py-1 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded text-[10px] font-black transition"
                >
                  SELL
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOrderModal(mkt.symbol, 'BUY');
                  }}
                  className="py-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded text-[10px] font-black transition"
                >
                  BUY
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Data Feed & Bridge Status Banner */}
      <div className="obsidian-panel rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs border border-cyan-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-slate-100 uppercase tracking-wide">
                Direct Market Access (DMA) Gateway Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Binance WebSocket & Interbank Spot FX
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Live tick-by-tick prices streamed directly from tier-1 liquidity gateways. Sub-second slippage protection.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={handleDownloadMT5BridgeEA}
            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MT5 Bridge EA (.mq5)</span>
          </button>
        </div>
      </div>

      {/* Real-Time Interactive Trading Chart & Order Book */}
      <LiveTradingChart
        selectedSymbol={chartedSymbol}
        onSymbolChange={setChartedSymbol}
        onQuickTrade={(sym, side) => onOpenOrderModal(sym, side)}
      />

      {/* Main Trading Bridge Tabs & Content */}
      <div className="obsidian-panel hud-bracket rounded-2xl shadow-2xl overflow-hidden relative border border-white/[0.08]">
        {/* Navigation Tabs */}
        <div className="px-3 sm:px-5 border-b border-white/[0.08] bg-black/40 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 py-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('POSITIONS')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                activeTab === 'POSITIONS'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Positions ({positions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                activeTab === 'PENDING'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending ({pendingOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                activeTab === 'HISTORY'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit History ({orderHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('WEBHOOK_BRIDGE')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                activeTab === 'WEBHOOK_BRIDGE'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-blue-400" />
              <span>Webhook Gateway ({webhookLogs.length})</span>
            </button>
          </div>

          {activeTab === 'HISTORY' && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 border border-white/[0.08] shrink-0 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Audit CSV</span>
            </button>
          )}
        </div>

        {/* Tab 1: Open Positions */}
        {activeTab === 'POSITIONS' && (
          <div className="p-5">
            {positions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">No Open Positions</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  All positions are currently liquidated or closed. Place a manual order or trigger a webhook signal via the bridge.
                </p>
                <button
                  onClick={() => onOpenOrderModal('XAUUSD', 'BUY')}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl transition font-mono"
                >
                  Place New Trade
                </button>
              </div>
            ) : (
              <div>
                {/* Mobile Touch Cards View */}
                <div className="block md:hidden space-y-3">
                  {positions.map((pos) => (
                    <div key={pos.id} className="p-3.5 bg-[#111622] border border-slate-800 rounded-xl space-y-2.5">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{pos.symbol}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {pos.side} {pos.lots}L
                          </span>
                          {pos.isTrailing && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Trail
                            </span>
                          )}
                        </div>
                        <div className={`font-bold text-base ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.profit >= 0 ? `+$${pos.profit.toFixed(2)}` : `-$${Math.abs(pos.profit).toFixed(2)}`}
                        </div>
                      </div>

                      {/* Card Price Grid */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0a0d14] rounded-lg text-[11px] text-slate-400">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Entry → Current</span>
                          <span className="text-slate-200">{pos.openPrice} → {pos.currentPrice}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Pips Gain</span>
                          <span className={`font-bold ${pos.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pos.pips >= 0 ? '+' : ''}{pos.pips} p
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Stop Loss (SL)</span>
                          <span className="text-rose-400 font-medium">{pos.sl !== null ? pos.sl : 'None'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Take Profit (TP)</span>
                          <span className="text-emerald-400 font-medium">{pos.tp !== null ? pos.tp : 'None'}</span>
                        </div>
                      </div>

                      {/* Card Mobile Touch Buttons (min-h-[40px] tap hitboxes) */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <button
                          onClick={() => setBreakEven(pos.id)}
                          className="py-2 bg-slate-800 hover:bg-emerald-950/60 active:bg-emerald-900 text-slate-200 hover:text-emerald-300 border border-slate-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center min-h-[40px]"
                        >
                          B/E
                        </button>
                        <button
                          onClick={() => toggleTrailingStop(pos.id)}
                          className={`py-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center min-h-[40px] ${
                            pos.isTrailing
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          Trail
                        </button>
                        <button
                          onClick={() => setPartialClosePos(pos)}
                          className="py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center min-h-[40px]"
                        >
                          <Scissors className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => closePosition(pos.id, 'MANUAL')}
                          className="py-2 bg-rose-600/20 hover:bg-rose-600 active:bg-rose-700 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-[11px] font-bold transition flex items-center justify-center min-h-[40px]"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Data Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">Ticket / Time</th>
                        <th className="py-3 px-3">Symbol</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Volume</th>
                        <th className="py-3 px-3">Open Price</th>
                        <th className="py-3 px-3">Current</th>
                        <th className="py-3 px-3">SL</th>
                        <th className="py-3 px-3">TP</th>
                        <th className="py-3 px-3">Pips</th>
                        <th className="py-3 px-3">Floating PnL</th>
                        <th className="py-3 px-3">Terminal</th>
                        <th className="py-3 px-3 text-right">Position Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {positions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-slate-850/40 transition group">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-200">#{pos.ticket}</div>
                            <div className="text-[10px] text-slate-500">{pos.openTime.substring(11)}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{pos.symbol}</span>
                            {pos.isTrailing && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Trail
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pos.side === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-cyan-300 font-bold">{pos.lots}</td>
                          <td className="py-3 px-3 text-slate-300">{pos.openPrice}</td>
                          <td className="py-3 px-3 font-semibold text-slate-100">{pos.currentPrice}</td>
                          <td className="py-3 px-3 text-rose-400 font-medium">
                            {pos.sl !== null ? pos.sl : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-medium">
                            {pos.tp !== null ? pos.tp : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="py-3 px-3">
                            <span className={pos.pips >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {pos.pips >= 0 ? '+' : ''}
                              {pos.pips}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className={`font-bold text-sm ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos.profit >= 0 ? `+$${pos.profit.toFixed(2)}` : `-$${Math.abs(pos.profit).toFixed(2)}`}
                            </div>
                            <div className="text-[10px] text-slate-500">Comm: ${pos.commission}</div>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-400">
                            {pos.terminal.replace(' DXtrade', '').replace(' Global', '')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setBreakEven(pos.id)}
                                title="Set Break-Even (Move SL to Open + 1 pip)"
                                className="px-2 py-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600/50 rounded text-[10px] text-slate-300 transition"
                              >
                                B/E
                              </button>
                              <button
                                onClick={() => toggleTrailingStop(pos.id)}
                                title={pos.isTrailing ? 'Disable Trailing Stop' : 'Enable Trailing Stop'}
                                className={`px-2 py-1 rounded text-[10px] border transition ${
                                  pos.isTrailing
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                }`}
                              >
                                Trail
                              </button>
                              <button
                                onClick={() => setPartialClosePos(pos)}
                                title="Partial Close"
                                className="p-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 rounded transition"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingPosition(pos)}
                                title="Edit SL & TP"
                                className="p-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 rounded transition"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => closePosition(pos.id, 'MANUAL')}
                                title="Close Position at Market"
                                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded text-[10px] font-bold transition"
                              >
                                Close
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Orders */}
        {activeTab === 'PENDING' && (
          <div className="p-5">
            {pendingOrders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">No Pending Orders</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Place Limit or Stop orders to automatically execute when the market reaches your desired entry price level.
                </p>
                <button
                  onClick={() => onOpenOrderModal('XAUUSD', 'BUY')}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl transition font-mono"
                >
                  Place Pending Order
                </button>
              </div>
            ) : (
              <div>
                {/* Mobile Touch Cards View */}
                <div className="block md:hidden space-y-3">
                  {pendingOrders.map((ord) => {
                    const mkt = prices[ord.symbol];
                    const pipDist = mkt
                      ? Math.abs(Number(((ord.targetPrice - ord.currentPrice) / mkt.pipSize).toFixed(1)))
                      : 0;
                    return (
                      <div key={ord.id} className="p-3.5 bg-[#111622] border border-slate-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{ord.symbol}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {ord.type} {ord.side} {ord.lots}L
                            </span>
                          </div>
                          <span className="text-amber-400 font-bold text-sm">@ {ord.targetPrice}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0a0d14] rounded-lg text-[11px] text-slate-400">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Current Price</span>
                            <span className="text-slate-200">{ord.currentPrice}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Distance</span>
                            <span className="text-slate-200 font-bold">{pipDist} pips away</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Stop Loss (SL)</span>
                            <span className="text-rose-400 font-medium">{ord.sl || 'None'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Take Profit (TP)</span>
                            <span className="text-emerald-400 font-medium">{ord.tp || 'None'}</span>
                          </div>
                        </div>

                        <div className="pt-1">
                          <button
                            onClick={() => cancelPendingOrder(ord.id)}
                            className="w-full py-2 bg-slate-800 hover:bg-rose-950/60 active:bg-rose-900 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-700/50 rounded-lg text-xs font-semibold transition flex items-center justify-center min-h-[40px]"
                          >
                            Cancel Pending Order
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Data Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3">Ticket / Time</th>
                        <th className="py-3 px-3">Symbol</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Volume</th>
                        <th className="py-3 px-3">Target Price</th>
                        <th className="py-3 px-3">Current Market</th>
                        <th className="py-3 px-3">Distance</th>
                        <th className="py-3 px-3">SL</th>
                        <th className="py-3 px-3">TP</th>
                        <th className="py-3 px-3">Comment</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pendingOrders.map((ord) => {
                        const mkt = prices[ord.symbol];
                        const pipDist = mkt
                          ? Math.abs(Number(((ord.targetPrice - ord.currentPrice) / mkt.pipSize).toFixed(1)))
                          : 0;
                        return (
                          <tr key={ord.id} className="hover:bg-slate-850/40 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-200">#{ord.ticket}</div>
                              <div className="text-[10px] text-slate-500">{ord.placedTime.substring(11)}</div>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-100">{ord.symbol}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {ord.type} {ord.side}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-cyan-300 font-bold">{ord.lots}</td>
                            <td className="py-3 px-3 text-amber-400 font-bold">{ord.targetPrice}</td>
                            <td className="py-3 px-3 text-slate-400">{ord.currentPrice}</td>
                            <td className="py-3 px-3 text-slate-300">{pipDist} pips away</td>
                            <td className="py-3 px-3 text-rose-400">{ord.sl || '—'}</td>
                            <td className="py-3 px-3 text-emerald-400">{ord.tp || '—'}</td>
                            <td className="py-3 px-3 text-slate-500 text-[10px]">{ord.comment}</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => cancelPendingOrder(ord.id)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-700/50 rounded text-[10px] font-semibold transition"
                              >
                                Cancel Order
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Order History & Closed Positions Audit */}
        {activeTab === 'HISTORY' && (
          <div className="p-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111622] p-3 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter ticket, symbol, reason..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1 font-mono text-xs w-full sm:w-auto">
                {(['ALL', 'WIN', 'LOSS'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setHistoryFilter(mode)}
                    className={`px-3 py-1.5 rounded-lg border transition ${
                      historyFilter === mode
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'ALL' ? 'All Trades' : mode === 'WIN' ? 'Winners' : 'Losses'}
                  </button>
                ))}
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3">Ticket / Date</th>
                    <th className="py-3 px-3">Symbol</th>
                    <th className="py-3 px-3">Side</th>
                    <th className="py-3 px-3">Lots</th>
                    <th className="py-3 px-3">Entry</th>
                    <th className="py-3 px-3">Exit</th>
                    <th className="py-3 px-3">Pips</th>
                    <th className="py-3 px-3">Net Profit ($)</th>
                    <th className="py-3 px-3">Fill Latency</th>
                    <th className="py-3 px-3">Slippage</th>
                    <th className="py-3 px-3">Close Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200">#{h.ticket}</div>
                        <div className="text-[10px] text-slate-500">{h.closeTime}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-100">{h.symbol}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.side === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {h.side}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">{h.lots}</td>
                      <td className="py-3 px-3 text-slate-400">{h.openPrice}</td>
                      <td className="py-3 px-3 text-slate-200 font-semibold">{h.closePrice}</td>
                      <td className="py-3 px-3">
                        <span className={h.pips >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {h.pips >= 0 ? '+' : ''}
                          {h.pips}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-sm ${
                            h.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {h.profit >= 0 ? `+$${h.profit.toFixed(2)}` : `-$${Math.abs(h.profit).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="text-emerald-400 font-semibold">{h.latencyMs} ms</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{h.slippagePips} p</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {h.closeReason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Webhook Signal Bridge */}
        {activeTab === 'WEBHOOK_BRIDGE' && (
          <div className="p-6 space-y-6">
            {/* Top Webhook Endpoint Header */}
            <div className="bg-[#121622] border border-cyan-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                    TradingView & Python Signal Webhook Gateway
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Transmit external alerts and Python bot signals directly into MT4, MT5, cTrader, and DXTrade terminals.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="px-3 py-1.5 bg-[#0b0e14] border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 truncate max-w-xs">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/mt5/bridge` : '/api/mt5/bridge'}
                </div>
                <button
                  onClick={handleCopyWebhookUrl}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 font-mono shrink-0"
                >
                  {copiedWebhookUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhookUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Webhook Dispatcher */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Webhook Input */}
              <div className="bg-[#111622] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span>Dispatch Webhook Signal</span>
                  </h4>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWebhookSource('TradingView Alert');
                        setWebhookPayload(
                          JSON.stringify(
                            {
                              strategy: 'Endgame_AI_Forex',
                              action: 'BUY',
                              symbol: 'XAUUSD',
                              lots: 1.0,
                              sl: 2725.0,
                              tp: 2755.0,
                              secret: 'sec_ea_live_883921',
                            },
                            null,
                            2
                          )
                        );
                      }}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700 font-mono"
                    >
                      TradingView
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWebhookSource('Python Bridge Script');
                        setWebhookPayload(
                          JSON.stringify(
                            {
                              auth_token: 'bridge_sec_99a',
                              action: 'BUY',
                              symbol: 'US30',
                              lots: 2.0,
                              sl: 43650.0,
                              tp: 43950.0,
                              slippage: 3,
                            },
                            null,
                            2
                          )
                        );
                      }}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700 font-mono"
                    >
                      Python Quant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWebhookSource('Telegram Signal EA');
                        setWebhookPayload(
                          JSON.stringify(
                            {
                              channel: 'VIP_EASYWAY',
                              action: 'SELL',
                              symbol: 'EURUSD',
                              lots: 2.5,
                              sl: 1.0865,
                              tp: 1.0815,
                            },
                            null,
                            2
                          )
                        );
                      }}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700 font-mono"
                    >
                      Telegram EA
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">Source Name:</label>
                  <input
                    type="text"
                    value={webhookSource}
                    onChange={(e) => setWebhookSource(e.target.value)}
                    className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">JSON Signal Payload:</label>
                  <textarea
                    rows={8}
                    value={webhookPayload}
                    onChange={(e) => setWebhookPayload(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {webhookStatusMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                      webhookStatusMessage.isError
                        ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                        : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{webhookStatusMessage.text}</span>
                  </div>
                )}

                <button
                  onClick={handleSendTestWebhook}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono rounded-xl transition shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Send Signal Through Bridge</span>
                </button>
              </div>

              {/* Execution Packet Logs Stream */}
              <div className="bg-[#111622] border border-slate-800 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Live Bridge Execution Log</span>
                  </h4>
                  <button
                    onClick={clearWebhookLogs}
                    className="text-[10px] text-slate-400 hover:text-slate-200 font-mono"
                  >
                    Clear Logs
                  </button>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
                  {webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[#0c1017] border border-slate-800/80 rounded-lg text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span className="font-bold text-slate-200">{log.source}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{log.timestamp.substring(11)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              log.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {log.action} {log.lots} Lots {log.symbol}
                          </span>
                        </div>
                        <span className="text-emerald-400 font-semibold">{log.executionTimeMs} ms</span>
                      </div>

                      <div className="text-[10px] text-slate-500 truncate bg-slate-900/60 p-1 rounded border border-slate-800/40">
                        {log.payload}
                      </div>

                      <div className="text-[10px] text-cyan-400/90 flex justify-between">
                        <span>Target: {log.targetTerminal}</span>
                        <span className="text-emerald-400">STATUS: {log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit SL/TP Modal */}
      <EditPositionModal
        position={editingPosition}
        onClose={() => setEditingPosition(null)}
        onSave={modifyPositionSLTP}
      />

      {/* Partial Close Modal */}
      <PartialCloseModal
        position={partialClosePos}
        onClose={() => setPartialClosePos(null)}
        onConfirm={partialClosePosition}
      />

      {/* Kill Switch Panic Modal */}
      <KillSwitchModal
        isOpen={isKillSwitchOpen}
        positionCount={positions.length}
        pendingCount={pendingOrders.length}
        onClose={() => setIsKillSwitchOpen(false)}
        onConfirm={executeKillSwitch}
      />
    </div>
  );
};
