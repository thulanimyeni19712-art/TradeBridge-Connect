import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Zap,
  Flame,
  Activity,
  Layers,
  Award,
  Server,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Code,
  Crosshair,
  Globe,
  Sparkles,
  Calendar,
  ScanLine,
  DollarSign,
  Volume2,
  Smartphone,
  KeyRound,
  GitMerge,
} from 'lucide-react';
import { MainNavTab } from './Sidebar';
import { OrderSide } from '../../types/trading';
import { speechNotifier } from '../../services/speechNotificationService';
import { useBrand } from '../../context/BrandContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: MainNavTab) => void;
  onQuickTrade: (symbol: string, side: OrderSide) => void;
  onOpenKillSwitch: () => void;
  onOpenBrokerModal: () => void;
  onOpenBrandStudio?: () => void;
  displayCurrency?: 'USD' | 'ZAR';
  onToggleCurrency?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onQuickTrade,
  onOpenKillSwitch,
  onOpenBrokerModal,
  onOpenBrandStudio,
  displayCurrency = 'USD',
  onToggleCurrency,
}) => {
  const { getModuleMeta, brand } = useBrand();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const actions = useMemo(
    () => [
      ...(onOpenBrandStudio
        ? [
            {
              id: 'action-brand-studio',
              category: 'Full Ownership & Rebrand',
              title: `Open Brand & Full Ownership Studio (${brand.brandName})`,
              subtext: 'Customize brand identity, legal entity, accent palette & all 19 page titles',
              icon: KeyRound,
              iconColor: 'text-amber-400 bg-amber-500/10',
              action: () => {
                onClose();
                onOpenBrandStudio();
              },
            },
          ]
        : []),
      {
        id: 'trade-gold-buy',
        category: 'DMA Execution',
        title: 'Buy Gold (XAUUSD) · 1.00 Lot Market',
        subtext: 'Open instant order ticket with Break-Even protection',
        icon: TrendingUp,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onQuickTrade('XAUUSD', 'BUY');
          onClose();
        },
      },
      {
        id: 'trade-gold-sell',
        category: 'DMA Execution',
        title: 'Sell Gold (XAUUSD) · 1.00 Lot Market',
        subtext: 'Open instant short order ticket on XAUUSD',
        icon: TrendingDown,
        iconColor: 'text-rose-400 bg-rose-500/10',
        action: () => {
          onQuickTrade('XAUUSD', 'SELL');
          onClose();
        },
      },
      {
        id: 'trade-btc-buy',
        category: 'DMA Execution',
        title: 'Buy Bitcoin (BTCUSD) · 1.00 Lot Market',
        subtext: 'Direct liquidity fill via WebSocket feed',
        icon: TrendingUp,
        iconColor: 'text-amber-400 bg-amber-500/10',
        action: () => {
          onQuickTrade('BTCUSD', 'BUY');
          onClose();
        },
      },
      {
        id: 'trade-nas100-buy',
        category: 'DMA Execution',
        title: 'Buy Nasdaq 100 (NAS100) · 1.00 Lot Market',
        subtext: 'US Tech index direct execution ticket',
        icon: TrendingUp,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onQuickTrade('NAS100', 'BUY');
          onClose();
        },
      },
      {
        id: 'trade-us30-buy',
        category: 'DMA Execution',
        title: 'Buy Dow Jones (US30) · 1.00 Lot Market',
        subtext: 'NY session Wall Street 30 execution ticket',
        icon: TrendingUp,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onQuickTrade('US30', 'BUY');
          onClose();
        },
      },
      {
        id: 'trade-cadjpy-buy',
        category: 'DMA Execution',
        title: 'Buy CADJPY.m · 0.05 Lot Market',
        subtext: 'Broker-suffixed FX cross execution ticket',
        icon: TrendingUp,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onQuickTrade('CADJPY.m', 'BUY');
          onClose();
        },
      },
      {
        id: 'nav-ai-scanner',
        category: getModuleMeta('AI_SCANNER').group,
        title: getModuleMeta('AI_SCANNER').label,
        subtext: getModuleMeta('AI_SCANNER').subtext,
        icon: ScanLine,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('AI_SCANNER');
          onClose();
        },
      },
      {
        id: 'nav-omni-bridge',
        category: getModuleMeta('BRIDGE').group,
        title: getModuleMeta('BRIDGE').label,
        subtext: getModuleMeta('BRIDGE').subtext,
        icon: Layers,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('BRIDGE');
          onClose();
        },
      },
      {
        id: 'nav-autotrade',
        category: getModuleMeta('AUTOTRADE').group,
        title: getModuleMeta('AUTOTRADE').label,
        subtext: getModuleMeta('AUTOTRADE').subtext,
        icon: Activity,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onSelectTab('AUTOTRADE');
          onClose();
        },
      },
      {
        id: 'nav-workspace',
        category: getModuleMeta('WORKSPACE').group,
        title: getModuleMeta('WORKSPACE').label,
        subtext: getModuleMeta('WORKSPACE').subtext,
        icon: Calendar,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onSelectTab('WORKSPACE');
          onClose();
        },
      },
      {
        id: 'nav-ea-launcher',
        category: getModuleMeta('EA_LAUNCHER').group,
        title: getModuleMeta('EA_LAUNCHER').label,
        subtext: getModuleMeta('EA_LAUNCHER').subtext,
        icon: Smartphone,
        iconColor: 'text-rose-400 bg-rose-500/10',
        action: () => {
          onSelectTab('EA_LAUNCHER');
          onClose();
        },
      },
      {
        id: 'nav-nexus',
        category: getModuleMeta('NEXUS').group,
        title: getModuleMeta('NEXUS').label,
        subtext: getModuleMeta('NEXUS').subtext,
        icon: Sparkles,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('NEXUS');
          onClose();
        },
      },
      {
        id: 'nav-aviator',
        category: getModuleMeta('AVIATOR').group,
        title: getModuleMeta('AVIATOR').label,
        subtext: getModuleMeta('AVIATOR').subtext,
        icon: Flame,
        iconColor: 'text-amber-400 bg-amber-500/10',
        action: () => {
          onSelectTab('AVIATOR');
          onClose();
        },
      },
      {
        id: 'nav-liquidity-edge',
        category: getModuleMeta('LIQUIDITY_EDGE').group,
        title: getModuleMeta('LIQUIDITY_EDGE').label,
        subtext: getModuleMeta('LIQUIDITY_EDGE').subtext,
        icon: Crosshair,
        iconColor: 'text-amber-400 bg-amber-500/10',
        action: () => {
          onSelectTab('LIQUIDITY_EDGE');
          onClose();
        },
      },
      {
        id: 'nav-algomax',
        category: getModuleMeta('ALGOMAX').group,
        title: getModuleMeta('ALGOMAX').label,
        subtext: getModuleMeta('ALGOMAX').subtext,
        icon: Zap,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('ALGOMAX');
          onClose();
        },
      },
      {
        id: 'nav-emerge',
        category: getModuleMeta('EMERGE').group,
        title: getModuleMeta('EMERGE').label,
        subtext: getModuleMeta('EMERGE').subtext,
        icon: Award,
        iconColor: 'text-amber-400 bg-amber-500/10',
        action: () => {
          onSelectTab('EMERGE');
          onClose();
        },
      },
      {
        id: 'nav-map',
        category: getModuleMeta('MAP').group,
        title: getModuleMeta('MAP').label,
        subtext: getModuleMeta('MAP').subtext,
        icon: Globe,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('MAP');
          onClose();
        },
      },
      {
        id: 'nav-scripts',
        category: getModuleMeta('SCRIPTS').group,
        title: getModuleMeta('SCRIPTS').label,
        subtext: getModuleMeta('SCRIPTS').subtext,
        icon: Code,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('SCRIPTS');
          onClose();
        },
      },
      {
        id: 'nav-eamatrix',
        category: getModuleMeta('EAMATRIX').group,
        title: getModuleMeta('EAMATRIX').label,
        subtext: getModuleMeta('EAMATRIX').subtext,
        icon: Smartphone,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('EAMATRIX');
          onClose();
        },
      },
      {
        id: 'nav-algohost',
        category: getModuleMeta('ALGOHOST').group,
        title: getModuleMeta('ALGOHOST').label,
        subtext: getModuleMeta('ALGOHOST').subtext,
        icon: Server,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onSelectTab('ALGOHOST');
          onClose();
        },
      },
      {
        id: 'nav-eacentral',
        category: getModuleMeta('EACENTRAL').group,
        title: getModuleMeta('EACENTRAL').label,
        subtext: getModuleMeta('EACENTRAL').subtext,
        icon: Smartphone,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('EACENTRAL');
          onClose();
        },
      },
      {
        id: 'nav-eamigrate',
        category: getModuleMeta('EAMIGRATE').group,
        title: getModuleMeta('EAMIGRATE').label,
        subtext: getModuleMeta('EAMIGRATE').subtext,
        icon: Smartphone,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onSelectTab('EAMIGRATE');
          onClose();
        },
      },
      {
        id: 'nav-tradeport',
        category: getModuleMeta('TRADEPORT').group,
        title: getModuleMeta('TRADEPORT').label,
        subtext: getModuleMeta('TRADEPORT').subtext,
        icon: Server,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('TRADEPORT');
          onClose();
        },
      },
      {
        id: 'nav-eamerge',
        category: getModuleMeta('EAMERGE').group,
        title: getModuleMeta('EAMERGE').label,
        subtext: getModuleMeta('EAMERGE').subtext,
        icon: GitMerge,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          onSelectTab('EAMERGE');
          onClose();
        },
      },
      {
        id: 'nav-itradebot',
        category: getModuleMeta('ITRADEBOT').group,
        title: getModuleMeta('ITRADEBOT').label,
        subtext: getModuleMeta('ITRADEBOT').subtext,
        icon: Sparkles,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('ITRADEBOT');
          onClose();
        },
      },
      {
        id: 'nav-algoadmin',
        category: getModuleMeta('ALGOADMIN').group,
        title: getModuleMeta('ALGOADMIN').label,
        subtext: getModuleMeta('ALGOADMIN').subtext,
        icon: Server,
        iconColor: 'text-cyan-400 bg-cyan-500/10',
        action: () => {
          onSelectTab('ALGOADMIN');
          onClose();
        },
      },
      ...(onToggleCurrency
        ? [
            {
              id: 'action-currency',
              category: 'Preferences',
              title: `Switch Display Currency to ${displayCurrency === 'USD' ? 'ZAR (R)' : 'USD ($)'}`,
              subtext: 'Updates header equity, PnL, and Bridge telemetry currency',
              icon: DollarSign,
              iconColor: 'text-cyan-400 bg-cyan-500/10',
              action: () => {
                onToggleCurrency();
                onClose();
              },
            },
          ]
        : []),
      {
        id: 'action-voice-test',
        category: 'Preferences',
        title: 'Test Voice Dispatch Speech Synthesis',
        subtext: 'Run calibration audio test for bot entry & market move alerts',
        icon: Volume2,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        action: () => {
          speechNotifier.testVoice();
          onClose();
        },
      },
      {
        id: 'action-broker',
        category: 'Connectivity',
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
        category: 'Emergency Defense',
        title: 'Panic Liquidate All Positions (Kill Switch)',
        subtext: 'Immediate close-all across connected terminals',
        icon: AlertTriangle,
        iconColor: 'text-rose-400 bg-rose-500/10',
        action: () => {
          onClose();
          onOpenKillSwitch();
        },
      },
    ],
    [
      brand.brandName,
      displayCurrency,
      getModuleMeta,
      onClose,
      onOpenBrandStudio,
      onOpenBrokerModal,
      onOpenKillSwitch,
      onQuickTrade,
      onSelectTab,
      onToggleCurrency,
    ]
  );

  const filtered = useMemo(
    () =>
      actions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.subtext.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      ),
    [actions, query]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? (prev + 1) % filtered.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0
            ? (prev - 1 + filtered.length) % filtered.length
            : 0
        );
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        const chosen = filtered[selectedIndex];
        if (chosen) chosen.action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-ultra border border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.1] bg-white/[0.04]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search modules, pairs (XAUUSD, BTC), currency, or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0F141E] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No actions match &ldquo;{query}&rdquo;. Try &ldquo;Gold&rdquo;,
              &ldquo;Scanner&rdquo;, &ldquo;ZAR&rdquo;, or &ldquo;Broker&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition border ${
                    isSelected
                      ? 'bg-[#141B29] border-cyan-500/40'
                      : 'border-transparent hover:bg-[#141B29]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${item.iconColor} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        {item.category}
                      </div>
                      <div
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-cyan-300' : 'text-slate-100'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtext}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 ml-2 transition ${
                      isSelected
                        ? 'text-cyan-400 translate-x-0.5'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/[0.08] bg-[#090C12] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>↑↓ Navigate · ↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
};
