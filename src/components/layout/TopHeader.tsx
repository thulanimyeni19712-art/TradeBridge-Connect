import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import {
  Zap,
  Plus,
  AlertTriangle,
  Server,
  ChevronDown,
  Layers,
  Search,
  Shield,
  Volume2,
  VolumeX,
  KeyRound,
} from 'lucide-react';
import { RunningTicker } from './RunningTicker';
import {
  speechNotifier,
  useSpeechNotifications,
} from '../../services/speechNotificationService';
import { liveMarketData } from '../../services/liveMarketData';

interface TopHeaderProps {
  onOpenOrderModal: () => void;
  onOpenKillSwitch: () => void;
  onOpenBrokerModal: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenEcosystemDrawer?: () => void;
  onSelectSymbol?: (symbol: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenBrandStudio?: () => void;
  displayCurrency?: 'USD' | 'ZAR';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenOrderModal,
  onOpenKillSwitch,
  onOpenBrokerModal,
  onToggleSidebar,
  onOpenEcosystemDrawer,
  onSelectSymbol,
  onOpenCommandPalette,
  onOpenBrandStudio,
  displayCurrency = 'USD',
}) => {
  const {
    accountBalance,
    accountEquity,
    unrealizedPnL,
    bridgeLatencyMs,
    prices,
    mt5Credentials,
  } = useTrading();
  const { brand, accent } = useBrand();
  const speech = useSpeechNotifications();

  const brandWords = (brand.brandName || 'APEX SOVEREIGN').trim().split(/\s+/);
  const brandLead = brandWords[0] || 'APEX';
  const brandRest = brandWords.slice(1).join(' ');

  const primaryBroker = mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0];
  const drawdownPct =
    accountBalance > 0
      ? Math.max(0, ((accountBalance - accountEquity) / accountBalance) * 100)
      : 0;
  const shieldIntactPct = Math.max(0, 100 - (drawdownPct / 3.5) * 100);

  const fxMult = displayCurrency === 'ZAR' ? liveMarketData.usdZarRate : 1;
  const symPrefix = displayCurrency === 'ZAR' ? 'R' : '$';
  const equityDisplay = accountEquity * fxMult;
  const pnlDisplay = unrealizedPnL * fxMult;

  const spotGold = prices['XAUUSD'];

  return (
    <header className="sticky top-0 z-40 bg-[#090C12]/72 backdrop-blur-2xl border-b border-white/[0.1]">
      {/* Continuous Live Quotes Strip */}
      <RunningTicker onSelectSymbol={onSelectSymbol} />

      {/* 3-Zone Institutional Header */}
      <div className="px-3 sm:px-6 flex items-center justify-between gap-3 h-14">
        {/* Zone 1: Brand + Command Deck Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenEcosystemDrawer || onToggleSidebar}
            className="p-2 rounded-lg bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] text-slate-300 hidden md:flex lg:hidden items-center justify-center min-h-[38px] min-w-[38px] transition"
            title="Open Modules Drawer"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenBrandStudio}
            className="flex items-center gap-2.5 text-left group shrink-0"
            title="Customize Brand & Full Ownership"
          >
            <div className={`w-8 h-8 rounded-lg bg-[#0F141E] border ${accent.borderClass} flex items-center justify-center ${accent.textClass} shrink-0 transition group-hover:scale-105`}>
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white font-display whitespace-nowrap">
                {brandLead}{' '}
                {brandRest && <span className={accent.textClass}>{brandRest}</span>}
              </span>
              <span className="hidden sm:inline text-[11px] font-mono text-slate-500 whitespace-nowrap">
                Sovereign OS
              </span>
            </div>
          </button>

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] text-slate-400 hover:text-white transition text-xs ml-1 whitespace-nowrap shrink-0"
              title="Open Command Deck (⌘K / Ctrl+K)"
            >
              <Search className={`w-3.5 h-3.5 ${accent.textClass}`} />
              <span className="text-[11px]">Quick Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#090C12] text-[10px] text-slate-400 font-mono border border-white/[0.08]">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Zone 2: Capital Shield & Primary Broker (Desktop) / Gold Quote (Mobile) */}
        <div className="flex sm:hidden items-center gap-1.5 bg-[#0F141E] px-2.5 py-1 rounded-lg border border-white/[0.08] text-[11px] font-mono tabular-nums">
          <span className="font-semibold text-slate-400">XAU</span>
          <span className="font-bold text-slate-100">
            {spotGold ? spotGold.bid.toFixed(1) : '--'}
          </span>
          <span
            className={`text-[10px] font-semibold ${
              spotGold && spotGold.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {spotGold && spotGold.change24h >= 0 ? '+' : ''}
            {spotGold ? spotGold.change24h.toFixed(1) : '0.0'}%
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-3 bg-[#0F141E] px-3.5 py-1.5 rounded-lg border border-white/[0.08] text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Shield</span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                shieldIntactPct >= 60 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {shieldIntactPct.toFixed(0)}%
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <button
            type="button"
            onClick={onOpenBrokerModal}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-slate-200">
              {primaryBroker ? primaryBroker.brokerName : 'IC Markets'}
            </span>
            <span className="text-slate-500 font-mono text-[11px] tabular-nums">
              #{primaryBroker ? primaryBroker.login : '50294112'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{bridgeLatencyMs.toFixed(1)} ms</span>
            <span className="text-slate-500">LD4</span>
          </div>
        </div>

        {/* Zone 3: Equity, PnL & Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider hidden sm:block">
              Floating PnL
            </span>
            <span
              className={`font-semibold text-xs sm:text-sm font-mono tabular-nums ${
                pnlDisplay >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {pnlDisplay >= 0
                ? `+${symPrefix}${pnlDisplay.toLocaleString('en-US', {
                    maximumFractionDigits: 1,
                  })}`
                : `-${symPrefix}${Math.abs(pnlDisplay).toLocaleString('en-US', {
                    maximumFractionDigits: 1,
                  })}`}
            </span>
          </div>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">
              Equity ({displayCurrency})
            </span>
            <span className="font-semibold text-white text-xs sm:text-sm font-mono tabular-nums">
              {symPrefix}
              {equityDisplay.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              speechNotifier.updateSettings({ enabled: !speech.settings.enabled })
            }
            title={
              !speech.isSupported
                ? 'Speech synthesis unavailable in this browser'
                : speech.settings.enabled
                ? 'Mute Voice Dispatch Alerts'
                : 'Enable Voice Dispatch Alerts'
            }
            className={`p-2 rounded-lg border transition flex items-center gap-1.5 min-h-[38px] shrink-0 ${
              speech.settings.enabled
                ? speech.isSpeaking
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300'
                  : 'bg-[#0F141E] hover:bg-[#141B29] border-white/[0.08] text-emerald-400'
                : 'bg-[#0F141E] hover:bg-[#141B29] border-white/[0.08] text-slate-500'
            }`}
          >
            {speech.settings.enabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden xl:inline text-[11px] font-medium">
              {speech.settings.enabled
                ? speech.isSpeaking
                  ? 'Speaking'
                  : 'Voice ON'
                : 'Muted'}
            </span>
          </button>

          {onOpenBrandStudio && (
            <button
              type="button"
              onClick={onOpenBrandStudio}
              title="Brand & Full Ownership Studio"
              className="p-2 bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] text-slate-300 hover:text-white rounded-lg transition hidden sm:flex items-center gap-1.5 shrink-0 min-h-[38px] whitespace-nowrap"
            >
              <KeyRound className={`w-3.5 h-3.5 ${accent.textClass}`} />
              <span className="hidden xl:inline text-[11px] font-medium">Owner Studio</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenOrderModal}
            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1 min-h-[38px] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Trade</span>
          </button>

          <button
            type="button"
            onClick={onOpenKillSwitch}
            title="Global Emergency Kill Switch"
            className="p-2 bg-rose-600/15 hover:bg-rose-600 active:scale-95 text-rose-400 hover:text-white border border-rose-500/35 rounded-lg transition hidden sm:flex items-center justify-center shrink-0 min-h-[38px] min-w-[38px]"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
