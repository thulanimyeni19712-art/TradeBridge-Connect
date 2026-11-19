import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Zap,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Layers,
  Search,
  Shield,
  Activity,
  Terminal,
} from 'lucide-react';

import { RunningTicker } from './RunningTicker';

interface TopHeaderProps {
  onOpenOrderModal: () => void;
  onOpenKillSwitch: () => void;
  onOpenBrokerModal: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenEcosystemDrawer?: () => void;
  onSelectSymbol?: (symbol: string) => void;
  onOpenCommandPalette?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenOrderModal,
  onOpenKillSwitch,
  onOpenBrokerModal,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenEcosystemDrawer,
  onSelectSymbol,
  onOpenCommandPalette,
}) => {
  const {
    accountBalance,
    accountEquity,
    unrealizedPnL,
    bridgeLatencyMs,
    prices,
    mt5Credentials,
    ticksPerSecond,
  } = useTrading();

  const primaryBroker = mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0];
  const drawdownPct =
    accountBalance > 0
      ? Math.max(0, ((accountBalance - accountEquity) / accountBalance) * 100)
      : 0;
  const shieldIntactPct = Math.max(0, 100 - (drawdownPct / 3.5) * 100);

  // Spotlight pair for mobile quick view
  const spotGold = prices['XAUUSD'];

  return (
    <header className="sticky top-0 z-40 bg-[#05070d]/95 backdrop-blur-xl border-b border-white/[0.08] font-mono shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
      {/* Real-Time Running Ticker Component (Live continuous price updates for XAUUSD, EURUSD, BTCUSD, etc.) */}
      <RunningTicker onSelectSymbol={onSelectSymbol} />

      {/* Main Bar: Compact, High-Density & Institutional */}
      <div className="px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
        {/* Left: Brand Identity & Desktop Collapse Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenEcosystemDrawer || onToggleSidebar}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hidden md:block lg:hidden min-h-[40px] min-w-[40px] transition"
            title="Open Suite Navigation"
          >
            <Layers className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#060912] rounded-[9px] flex items-center justify-center text-cyan-400">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-wider text-white uppercase whitespace-nowrap font-orbitron">
                  Titan <span className="text-cyan-400 text-glow-cyan">Quant</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  DMA v5.2
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden lg:block font-sans">
                Autonomous Capital Preservation • Direct DMA Bridge
              </p>
            </div>
          </div>

          {/* Quick Command Bar Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c1220] hover:bg-[#121a2e] border border-slate-700/60 text-slate-300 hover:text-white transition text-xs shadow-inner ml-2"
              title="Open Command Deck (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 text-[11px]">Command Deck</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 font-bold border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Center: Live Capital Shield Horizon Meter (Desktop) OR Mobile Spotlight Ticker */}
        {/* Mobile Spotlight: Gold Price & 24h Change */}
        <div className="flex sm:hidden items-center gap-1.5 bg-[#0e1320] px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] truncate tabular-nums">
          <span className="font-bold text-slate-400">XAU</span>
          <span className="font-bold text-slate-100">{spotGold ? spotGold.bid.toFixed(1) : '--'}</span>
          <span
            className={`text-[10px] font-bold ${
              spotGold && spotGold.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {spotGold && spotGold.change24h >= 0 ? '+' : ''}
            {spotGold ? spotGold.change24h.toFixed(1) : '0.0'}%
          </span>
        </div>

        {/* Desktop Institutional Capital Shield Horizon Meter */}
        <div className="hidden lg:flex items-center gap-3 bg-[#0a0f1d] px-3.5 py-1.5 rounded-2xl border border-cyan-500/25 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">CAPITAL SHIELD</span>
                <span className={`font-bold tabular-nums ${shieldIntactPct >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {shieldIntactPct.toFixed(0)}% INTACT
                </span>
              </div>
              <div className="text-slate-500 font-mono text-[9px] tabular-nums">
                3.5% Loss Cutoff · {drawdownPct.toFixed(1)}% Used Today
              </div>
            </div>
          </div>

          <span className="text-slate-700">|</span>

          {/* Active MT5 Broker Tag */}
          <button
            onClick={onOpenBrokerModal}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition text-xs"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200">
              {primaryBroker ? primaryBroker.brokerName : 'IC Markets'}
            </span>
            <span className="text-emerald-400 text-[10px] font-bold font-mono tabular-nums">
              #{primaryBroker ? primaryBroker.login : '50294112'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <span className="text-slate-700">|</span>

          {/* Equinix LD4 Latency badge */}
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{bridgeLatencyMs.toFixed(1)} ms</span>
            <span className="text-slate-500 text-[9px]">LD4</span>
          </div>
        </div>

        {/* Right: Live Equity, Floating PnL & Action Triggers */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Floating PnL Badge */}
          <div className="flex flex-col text-right">
            <span className="text-slate-400 text-[9px] uppercase tracking-wider hidden sm:block">Floating PnL</span>
            <span
              className={`font-bold text-xs sm:text-sm font-mono tabular-nums ${
                unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {unrealizedPnL >= 0 ? `+$${unrealizedPnL.toFixed(1)}` : `-$${Math.abs(unrealizedPnL).toFixed(1)}`}
            </span>
          </div>

          {/* Live Equity on Tablets/Desktop */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-slate-400 text-[9px] uppercase tracking-wider">Equity</span>
            <span className="font-bold text-white text-xs sm:text-sm font-mono tabular-nums">
              ${accountEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Quick Order Ticket Launcher Button (Thumb Friendly >= 44px on mobile) */}
          <button
            onClick={onOpenOrderModal}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-1 min-h-[40px] sm:min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Trade</span>
          </button>

          {/* Emergency Panic Liquidate Button (Desktop/Tablet) */}
          <button
            onClick={onOpenKillSwitch}
            title="Global Emergency Kill Switch"
            className="p-2 sm:p-2.5 bg-rose-600/20 hover:bg-rose-600 active:scale-95 text-rose-400 hover:text-white border border-rose-500/40 rounded-xl transition hidden sm:flex items-center justify-center shrink-0 min-h-[40px] min-w-[40px]"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
};
