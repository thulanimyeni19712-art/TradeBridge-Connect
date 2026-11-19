import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  Flame,
  Activity,
  Layers,
  Award,
  Server,
  Key,
  Smartphone,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Code,
  Shield,
  Crosshair,
  Globe,
  Sparkles,
} from 'lucide-react';
import { MainNavTab } from './Sidebar';
import { OrderSide } from '../../types/trading';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: MainNavTab) => void;
  onQuickTrade: (symbol: string, side: OrderSide) => void;
  onOpenKillSwitch: () => void;
  onOpenBrokerModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onQuickTrade,
  onOpenKillSwitch,
  onOpenBrokerModal,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'trade-gold-buy',
      category: 'FAST DMA EXECUTION',
      title: 'Buy Gold (XAUUSD) - 1.00 Lot Market',
      subtext: 'Auto-armed Break-Even @ +12 pips',
      icon: TrendingUp,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      action: () => {
        onQuickTrade('XAUUSD', 'BUY');
        onClose();
      },
    },
    {
      id: 'trade-gold-sell',
      category: 'FAST DMA EXECUTION',
      title: 'Sell Gold (XAUUSD) - 1.00 Lot Market',
      subtext: 'Auto-armed Break-Even @ +12 pips',
      icon: TrendingDown,
      iconColor: 'text-rose-400 bg-rose-500/10',
      action: () => {
        onQuickTrade('XAUUSD', 'SELL');
        onClose();
      },
    },
    {
      id: 'trade-btc-buy',
      category: 'FAST DMA EXECUTION',
      title: 'Buy Bitcoin (BTCUSD) - 1.00 Lot Market',
      subtext: 'Direct liquidity fill via Binance WS gateway',
      icon: TrendingUp,
      iconColor: 'text-amber-400 bg-amber-500/10',
      action: () => {
        onQuickTrade('BTCUSD', 'BUY');
        onClose();
      },
    },
    {
      id: 'nav-omni-bridge',
      category: 'NAVIGATION',
      title: 'Titan Omni-Bridge (Master Combined Deck)',
      subtext: 'Every page, terminal, & bot unified into one institutional trade bridge',
      icon: Layers,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      action: () => {
        onSelectTab('BRIDGE');
        onClose();
      },
    },
    {
      id: 'nav-algomax',
      category: 'NAVIGATION',
      title: 'AlgoMax-EA.com Official Portal',
      subtext: 'Institutional MT4/MT5 AI Bot, Prop Evaluation Pass, Live Simulator',
      icon: Zap,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      action: () => {
        onSelectTab('ALGOMAX');
        onClose();
      },
    },
    {
      id: 'nav-algoadmin',
      category: 'NAVIGATION',
      title: 'AlgoAdminPortal.com (Master Admin)',
      subtext: 'Client license issuing, remote VPS fleet monitor, emergency freeze',
      icon: Server,
      iconColor: 'text-purple-400 bg-purple-500/10',
      action: () => {
        onSelectTab('ALGOADMIN');
        onClose();
      },
    },
    {
      id: 'nav-eamigrate',
      category: 'NAVIGATION',
      title: 'EAMigratePro.vercel.app (Mobile Cloud VPS)',
      subtext: 'Migrate MT4/MT5 EAs to 24/7 cloud, 1ms Equinix latency, zero PC required',
      icon: Smartphone,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      action: () => {
        onSelectTab('EAMIGRATE');
        onClose();
      },
    },
    {
      id: 'nav-tradeport',
      category: 'NAVIGATION',
      title: 'TradePortEA.com (Fixed-Term Mobile EA Hosting)',
      subtext: 'Fixed 1/3/12-month MT4/MT5 ports (R600 / $36) & tiered crypto payouts',
      icon: Server,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      action: () => {
        onSelectTab('TRADEPORT');
        onClose();
      },
    },
    {
      id: 'nav-nexus',
      category: 'NAVIGATION',
      title: 'Nexus2.v1 | KANTE FX (Nexora AI 2.0)',
      subtext: 'Powered by EA Converter, quick 3-trades setup, live ZAR climbing equity',
      icon: Sparkles,
      iconColor: 'text-purple-400 bg-purple-500/10',
      action: () => {
        onSelectTab('NEXUS');
        onClose();
      },
    },
    {
      id: 'nav-aviator',
      category: 'NAVIGATION',
      title: 'Nguni Aviator Pro v6 Crash Engine',
      subtext: 'Live radar, ELO tracking, odds arbitrage & 50-game analytics',
      icon: Flame,
      iconColor: 'text-amber-400 bg-amber-500/10',
      action: () => {
        onSelectTab('AVIATOR');
        onClose();
      },
    },
    {
      id: 'nav-liquidity-edge',
      category: 'NAVIGATION',
      title: 'Liquidity Edge EA (TikTok @liquidityedgeea)',
      subtext: '077 600 4742 • SMC Sweeps, Asian Grab, FVG & MT5 execution',
      icon: Crosshair,
      iconColor: 'text-amber-400 bg-amber-500/10',
      action: () => {
        onSelectTab('LIQUIDITY_EDGE');
        onClose();
      },
    },
    {
      id: 'nav-map',
      category: 'NAVIGATION',
      title: 'Google Maps Financial Exchanges & LD4/NY4 Radar',
      subtext: 'Real-time geospatial latency and exchange session maps',
      icon: Globe,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      action: () => {
        onSelectTab('MAP');
        onClose();
      },
    },
    {
      id: 'nav-bridge',
      category: 'NAVIGATION',
      title: 'Trading Bridge & DMA Order Book',
      subtext: 'Multi-terminal positions, live candlestick chart & ticket execution',
      icon: Zap,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      action: () => {
        onSelectTab('BRIDGE');
        onClose();
      },
    },
    {
      id: 'nav-autotrade',
      category: 'NAVIGATION',
      title: 'Autonomous Trading Hub & Equity Growth',
      subtext: 'Dual-engine zero-ruin capital preservation & compounding Recharts',
      icon: Activity,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      action: () => {
        onSelectTab('AUTOTRADE');
        onClose();
      },
    },
    {
      id: 'nav-emerge',
      category: 'NAVIGATION',
      title: 'Emerge Prop Firm Evaluation & Pass Engine',
      subtext: 'Drawdown guard, challenge rules & payout certificate generator',
      icon: Award,
      iconColor: 'text-purple-400 bg-purple-500/10',
      action: () => {
        onSelectTab('EMERGE');
        onClose();
      },
    },
    {
      id: 'nav-scripts',
      category: 'NAVIGATION',
      title: 'High-Level Scripts Vault',
      subtext: 'MQL5, MQL4, PineScript, Python production algorithms',
      icon: Code,
      iconColor: 'text-blue-400 bg-blue-500/10',
      action: () => {
        onSelectTab('SCRIPTS');
        onClose();
      },
    },
    {
      id: 'action-broker',
      category: 'CONNECTIVITY',
      title: 'Connect / Switch MT5 Broker Account',
      subtext: 'IC Markets, ThinkMarkets, FTMO, Pepperstone, Deriv',
      icon: Server,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      action: () => {
        onClose();
        onOpenBrokerModal();
      },
    },
    {
      id: 'action-killswitch',
      category: 'EMERGENCY DEFENSE',
      title: 'PANIC LIQUIDATE ALL POSITIONS (Kill Switch)',
      subtext: 'Instant atomic liquidation across all connected terminals',
      icon: AlertTriangle,
      iconColor: 'text-rose-400 bg-rose-500/10',
      action: () => {
        onClose();
        onOpenKillSwitch();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtext.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="w-full max-w-2xl bg-[#080c16] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden flex flex-col max-h-[80vh] hud-bracket">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#0d1322]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, pair (XAUUSD, BTC), or module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No actions match "{query}". Try "Gold", "Aviator", "Kill", or "Broker".
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#12192b] text-left transition group border border-transparent hover:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.iconColor} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {item.subtext}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-[#060910] flex items-center justify-between text-[10px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">ESC</span>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
