import React, { useState } from 'react';
import { AviatorProvider } from '../../context/AviatorContext';
import { AviatorPredictorView } from './AviatorPredictorView';
import { AviatorSignalsView } from './AviatorSignalsView';
import { AviatorEATradeLabView } from './AviatorEATradeLabView';
import { AviatorInfinityConsoleView } from './AviatorInfinityConsoleView';
import { AviatorAnalyticsView } from './AviatorAnalyticsView';
import { AviatorBroadcastView } from './AviatorBroadcastView';
import { AviatorVIPView } from './AviatorVIPView';
import { AviatorGlobalStatusPanel } from './AviatorGlobalStatusPanel';
import {
  Flame,
  Radio,
  Cpu,
  ShieldCheck,
  BarChart3,
  Send,
  Crown,
  Sparkles,
  LayoutDashboard,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Minus,
  ChevronDown,
} from 'lucide-react';

export type AviatorSubTab =
  | 'PREDICTOR'
  | 'SIGNALS'
  | 'EA_LAB'
  | 'INFINITY'
  | 'ANALYTICS'
  | 'BROADCAST'
  | 'VIP';

export type AviatorViewLayout = 'DASHBOARD' | 'GRID';

const GRID_MINIMIZED_STORAGE_KEY = 'nguni_aviator_grid_minimized_v1';

type GridPanelId = 'PREDICTOR' | 'SIGNALS' | 'EA_LAB' | 'ANALYTICS' | 'INFINITY' | 'BROADCAST';

const AviatorInnerApp: React.FC = () => {
  const [subTab, setSubTab] = useState<AviatorSubTab>('PREDICTOR');
  const [viewLayout, setViewLayout] = useState<AviatorViewLayout>('DASHBOARD');
  const [hoveredTab, setHoveredTab] = useState<AviatorSubTab | null>(null);
  const [minimizedPanels, setMinimizedPanels] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(GRID_MINIMIZED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const navItems: {
    id: AviatorSubTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    tooltip: string;
    badge?: string;
  }[] = [
    {
      id: 'PREDICTOR',
      label: 'PREDICTOR AI',
      icon: Flame,
      tooltip: 'Predictor AI: Real-time probability engine & atmospheric radar',
      badge: 'LIVE 5s',
    },
    {
      id: 'SIGNALS',
      label: 'SIGNALS RADAR',
      icon: Radio,
      tooltip: 'Signals Radar: Live multi-broker telemetry & crash risk alerts',
    },
    {
      id: 'EA_LAB',
      label: 'EA TRADE LAB',
      icon: Cpu,
      tooltip: 'EA Trade Lab: Automated hedging & algorithmic bet runner',
    },
    {
      id: 'INFINITY',
      label: 'INFINITY AUDITOR',
      icon: ShieldCheck,
      tooltip: 'Infinity Auditor: SHA-256 Provably Fair verification & seed audit',
      badge: 'VERIFIED',
    },
    {
      id: 'ANALYTICS',
      label: 'ANALYTICS & ELO',
      icon: BarChart3,
      tooltip: 'Analytics & ELO: 50-game win/loss ratios & historical distribution',
    },
    {
      id: 'BROADCAST',
      label: 'BROADCAST HUB',
      icon: Send,
      tooltip: 'Broadcast Hub: Telegram & Discord automated signal dispatcher',
    },
    {
      id: 'VIP',
      label: 'VIP ACCESS',
      icon: Crown,
      tooltip: 'VIP Access: Institutional tier privileges & high-roller odds arbitrage',
      badge: 'PRO',
    },
  ];

  const handleMaximizeFromGrid = (targetTab: AviatorSubTab) => {
    setSubTab(targetTab);
    setViewLayout('DASHBOARD');
  };

  const toggleMinimizePanel = (panelId: GridPanelId) => {
    setMinimizedPanels((prev) => {
      const next = { ...prev, [panelId]: !prev[panelId] };
      try {
        localStorage.setItem(GRID_MINIMIZED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const gridPanels: {
    id: GridPanelId;
    title: string;
    icon: React.FC<{ className?: string }>;
    iconColorClass: string;
    borderClass: string;
    expandIconColorClass: string;
    content: React.ReactNode;
    scrollClassName?: string;
  }[] = [
    {
      id: 'PREDICTOR',
      title: 'PREDICTOR AI & FLIGHT RADAR',
      icon: Flame,
      iconColorClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
      expandIconColorClass: 'text-amber-400',
      content: <AviatorPredictorView />,
    },
    {
      id: 'SIGNALS',
      title: 'SIGNALS RADAR TELEMETRY',
      icon: Radio,
      iconColorClass: 'text-emerald-400',
      borderClass: 'border-amber-500/30',
      expandIconColorClass: 'text-cyan-400',
      content: <AviatorSignalsView />,
    },
    {
      id: 'EA_LAB',
      title: 'AUTONOMOUS EA BOT LAB',
      icon: Cpu,
      iconColorClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/30',
      expandIconColorClass: 'text-cyan-400',
      content: <AviatorEATradeLabView />,
    },
    {
      id: 'ANALYTICS',
      title: 'ANALYTICS & 50-GAME RATIOS',
      icon: BarChart3,
      iconColorClass: 'text-cyan-400',
      borderClass: 'border-white/[0.08]',
      expandIconColorClass: 'text-cyan-400',
      content: <AviatorAnalyticsView />,
    },
    {
      id: 'INFINITY',
      title: 'INFINITY SHA-256 AUDITOR',
      icon: ShieldCheck,
      iconColorClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
      expandIconColorClass: 'text-emerald-400',
      content: <AviatorInfinityConsoleView />,
    },
    {
      id: 'BROADCAST',
      title: 'BROADCAST HUB & VIP ACCESS',
      icon: Send,
      iconColorClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      expandIconColorClass: 'text-blue-400',
      scrollClassName: 'space-y-4',
      content: (
        <>
          <AviatorBroadcastView />
          <div className="border-t border-white/[0.08] pt-4">
            <AviatorVIPView />
          </div>
        </>
      ),
    },
  ];

  const allMinimized = gridPanels.every((p) => Boolean(minimizedPanels[p.id]));

  const handleToggleAllPanels = () => {
    const nextState: Record<string, boolean> = {};
    const targetVal = !allMinimized;
    gridPanels.forEach((p) => {
      nextState[p.id] = targetVal;
    });
    setMinimizedPanels(nextState);
    try {
      localStorage.setItem(GRID_MINIMIZED_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="space-y-4">
      {/* Global Status Panel: Aggregate Signal Accuracy, Latency & Active Bots Across All Modules */}
      <AviatorGlobalStatusPanel
        onNavigateTab={(tab) => {
          setSubTab(tab);
          setViewLayout('DASHBOARD');
        }}
      />

      {/* Sub-Navigation Ribbon (Horizontal scrollable on mobile with layout toggle) */}
      <div className="bg-[#090C12]/95 backdrop-blur-md border-b border-white/[0.08] px-3 py-2 -mx-4 sm:-mx-6 sm:px-6 sticky top-14 sm:top-16 z-30 font-mono">
        <div className="flex items-center justify-between gap-3">
          {/* Sub-Tab Navigation Items */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 relative flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = subTab === item.id && viewLayout === 'DASHBOARD';
              const isHovered = hoveredTab === item.id;

              return (
                <div
                  key={item.id}
                  className="relative group shrink-0"
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <button
                    onClick={() => {
                      setSubTab(item.id);
                      setViewLayout('DASHBOARD');
                    }}
                    aria-label={item.tooltip}
                    className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F141E] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 transition-colors'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        · {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Hover-based Tooltip */}
                  {isHovered && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none transition-all duration-150">
                      <div className="relative px-3 py-1.5 rounded-lg bg-[#0F141E] border border-white/[0.12] text-slate-200 text-[11px] font-sans font-medium whitespace-nowrap shadow-lg flex items-center gap-1.5">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F141E] border-t border-l border-white/[0.12] rotate-45" />
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{item.tooltip}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Layout Toggle: Dashboard View vs Grid View */}
          <div className="flex items-center gap-1 bg-black/70 p-1 rounded-xl border border-amber-500/30 shrink-0">
            <button
              onClick={() => setViewLayout('DASHBOARD')}
              title="Dashboard View (Single Active Module)"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold transition flex items-center gap-1.5 ${
                viewLayout === 'DASHBOARD'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">DASHBOARD</span>
            </button>
            <button
              onClick={() => setViewLayout('GRID')}
              title="Grid View (Compact Multi-Module Monitoring)"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold transition flex items-center gap-1.5 ${
                viewLayout === 'GRID'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">GRID VIEW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main SubTab Stage: Single Module Dashboard vs Multi-Module Grid */}
      <div className="pt-2">
        {viewLayout === 'DASHBOARD' ? (
          <div>
            {subTab === 'PREDICTOR' && <AviatorPredictorView />}
            {subTab === 'SIGNALS' && <AviatorSignalsView />}
            {subTab === 'EA_LAB' && <AviatorEATradeLabView />}
            {subTab === 'INFINITY' && <AviatorInfinityConsoleView />}
            {subTab === 'ANALYTICS' && <AviatorAnalyticsView />}
            {subTab === 'BROADCAST' && <AviatorBroadcastView />}
            {subTab === 'VIP' && <AviatorVIPView />}
          </div>
        ) : (
          /* Multi-Module Compact Command Grid */
          <div className="space-y-6">
            {/* Grid View Banner */}
            <div className="p-4 bg-[#0F141E] border border-white/[0.08] rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <span>MULTI-MODULE RADAR COMMAND GRID</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Simultaneous real-time monitoring across all Nguni Aviator intelligence modules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 whitespace-nowrap tabular-nums">
                  {gridPanels.filter((p) => !minimizedPanels[p.id]).length}/{gridPanels.length} PANELS VISIBLE
                </span>
                <button
                  type="button"
                  onClick={handleToggleAllPanels}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/[0.1] transition flex items-center gap-1.5 text-[10px] font-bold whitespace-nowrap shrink-0"
                  title={allMinimized ? 'Restore all module panels' : 'Minimize all module panels'}
                >
                  {allMinimized ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Restore All</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Minimize All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              {gridPanels.map((panel) => {
                const PanelIcon = panel.icon;
                const isMinimized = Boolean(minimizedPanels[panel.id]);
                return (
                  <div
                    key={panel.id}
                    className={`obsidian-panel rounded-2xl p-4 border ${panel.borderClass} relative ${
                      isMinimized ? '' : 'space-y-3'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-2 ${
                        isMinimized ? '' : 'border-b border-white/[0.08] pb-2'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PanelIcon className={`w-4 h-4 shrink-0 ${panel.iconColorClass}`} />
                        <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider truncate">
                          {panel.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleMinimizePanel(panel.id)}
                          aria-expanded={!isMinimized}
                          aria-label={isMinimized ? `Restore ${panel.title}` : `Minimize ${panel.title}`}
                          title={isMinimized ? 'Restore module content' : 'Minimize module to header'}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition flex items-center gap-1 text-[10px] font-mono whitespace-nowrap shrink-0"
                        >
                          {isMinimized ? (
                            <>
                              <ChevronDown className="w-3 h-3 text-emerald-400" />
                              <span>Restore</span>
                            </>
                          ) : (
                            <>
                              <Minus className="w-3 h-3 text-slate-400" />
                              <span>Minimize</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMaximizeFromGrid(panel.id)}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition flex items-center gap-1 text-[10px] font-mono whitespace-nowrap shrink-0"
                          title="Maximize to Full Dashboard View"
                        >
                          <Maximize2 className={`w-3 h-3 ${panel.expandIconColorClass}`} />
                          <span>Expand</span>
                        </button>
                      </div>
                    </div>

                    <div
                      className={
                        isMinimized
                          ? 'hidden'
                          : `max-h-[580px] overflow-y-auto no-scrollbar pr-1 ${panel.scrollClassName || ''}`
                      }
                    >
                      {panel.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const NguniAviatorApp: React.FC = () => {
  return (
    <AviatorProvider>
      <AviatorInnerApp />
    </AviatorProvider>
  );
};
