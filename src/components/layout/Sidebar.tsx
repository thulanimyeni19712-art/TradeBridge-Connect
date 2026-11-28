import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import {
  Zap,
  Activity,
  Code,
  Cpu,
  Award,
  Server,
  Key,
  KeyRound,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Globe,
  Sparkles,
  Layers,
  Calendar,
  ScanLine,
  Search,
  X,
  Cloud,
  Share2,
  GitMerge,
} from 'lucide-react';

export type MainNavTab =
  | 'WORKSPACE'
  | 'AI_SCANNER'
  | 'ALGOMAX'
  | 'ALGOADMIN'
  | 'NEXUS'
  | 'EA_LAUNCHER'
  | 'AVIATOR'
  | 'BRIDGE'
  | 'AUTOTRADE'
  | 'LIQUIDITY_EDGE'
  | 'MAP'
  | 'SCRIPTS'
  | 'EASYWAY'
  | 'EMERGE'
  | 'EACONNECT'
  | 'EAMATRIX'
  | 'ALGOHOST'
  | 'EACENTRAL'
  | 'EAVAULT'
  | 'EACONVERTER'
  | 'EAMIGRATE'
  | 'TRADEPORT'
  | 'ITRADEBOT'
  | 'EAMERGE';

interface SidebarProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenBrokerModal: () => void;
  onOpenBrandStudio?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onOpenBrokerModal,
  onOpenBrandStudio,
}) => {
  const {
    automatedSettings,
    challenge,
    mt5Credentials,
    bridgeLatencyMs,
    positions,
  } = useTrading();
  const { brand, accent, getModuleMeta } = useBrand();
  const [navFilter, setNavFilter] = useState('');

  const primaryBroker = mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0];

  const navGroups = useMemo(
    () => [
      {
        title: 'Command & AI',
        items: [
          {
            id: 'BRIDGE' as MainNavTab,
            ...getModuleMeta('BRIDGE'),
            icon: Layers,
            statusText: positions.length > 0 ? `${positions.length}` : undefined,
            statusTone: accent.textClass,
          },
          {
            id: 'AI_SCANNER' as MainNavTab,
            ...getModuleMeta('AI_SCANNER'),
            icon: ScanLine,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'AUTOTRADE' as MainNavTab,
            ...getModuleMeta('AUTOTRADE'),
            icon: Activity,
            statusText: automatedSettings.masterAutoTrading ? 'Live' : 'Paused',
            statusTone: automatedSettings.masterAutoTrading
              ? 'text-emerald-400'
              : 'text-rose-400',
          },
        ],
      },
      {
        title: 'Execution & Bots',
        items: [
          {
            id: 'EA_LAUNCHER' as MainNavTab,
            ...getModuleMeta('EA_LAUNCHER'),
            icon: Smartphone,
            statusText: '11 Builds',
            statusTone: 'text-rose-400',
          },
          {
            id: 'EAMERGE' as MainNavTab,
            ...getModuleMeta('EAMERGE'),
            icon: GitMerge,
            statusText: 'Fusion',
            statusTone: 'text-emerald-400',
          },
          {
            id: 'NEXUS' as MainNavTab,
            ...getModuleMeta('NEXUS'),
            icon: Sparkles,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'LIQUIDITY_EDGE' as MainNavTab,
            ...getModuleMeta('LIQUIDITY_EDGE'),
            icon: Crosshair,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'AVIATOR' as MainNavTab,
            ...getModuleMeta('AVIATOR'),
            icon: Zap,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'EASYWAY' as MainNavTab,
            ...getModuleMeta('EASYWAY'),
            icon: Cpu,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'ALGOMAX' as MainNavTab,
            ...getModuleMeta('ALGOMAX'),
            icon: Zap,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'ITRADEBOT' as MainNavTab,
            ...getModuleMeta('ITRADEBOT'),
            icon: Cpu,
            statusText: undefined,
            statusTone: '',
          },
        ],
      },
      {
        title: 'Prop & Analytics',
        items: [
          {
            id: 'EMERGE' as MainNavTab,
            ...getModuleMeta('EMERGE'),
            icon: Award,
            statusText:
              challenge.status === 'PASSED'
                ? 'Passed'
                : `${challenge.profitTargetPct}%`,
            statusTone:
              challenge.status === 'PASSED' ? 'text-emerald-400' : 'text-amber-400',
          },
          {
            id: 'MAP' as MainNavTab,
            ...getModuleMeta('MAP'),
            icon: Globe,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'SCRIPTS' as MainNavTab,
            ...getModuleMeta('SCRIPTS'),
            icon: Code,
            statusText: undefined,
            statusTone: '',
          },
        ],
      },
      {
        title: 'Cloud & Infrastructure',
        items: [
          {
            id: 'WORKSPACE' as MainNavTab,
            ...getModuleMeta('WORKSPACE'),
            icon: Calendar,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'EACONNECT' as MainNavTab,
            ...getModuleMeta('EACONNECT'),
            icon: Server,
            statusText: `${bridgeLatencyMs.toFixed(0)}ms`,
            statusTone: 'text-slate-400',
          },
          {
            id: 'EAMATRIX' as MainNavTab,
            ...getModuleMeta('EAMATRIX'),
            icon: Smartphone,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'ALGOHOST' as MainNavTab,
            ...getModuleMeta('ALGOHOST'),
            icon: Cloud,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'EACENTRAL' as MainNavTab,
            ...getModuleMeta('EACENTRAL'),
            icon: Share2,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'EAMIGRATE' as MainNavTab,
            ...getModuleMeta('EAMIGRATE'),
            icon: Smartphone,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'TRADEPORT' as MainNavTab,
            ...getModuleMeta('TRADEPORT'),
            icon: Server,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'EAVAULT' as MainNavTab,
            ...getModuleMeta('EAVAULT'),
            icon: Key,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'EACONVERTER' as MainNavTab,
            ...getModuleMeta('EACONVERTER'),
            icon: Smartphone,
            statusText: undefined,
            statusTone: '',
          },
          {
            id: 'ALGOADMIN' as MainNavTab,
            ...getModuleMeta('ALGOADMIN'),
            icon: Server,
            statusText: undefined,
            statusTone: '',
          },
        ],
      },
    ],
    [
      positions.length,
      automatedSettings.masterAutoTrading,
      challenge.status,
      challenge.profitTargetPct,
      bridgeLatencyMs,
      getModuleMeta,
      accent.textClass,
    ]
  );

  const filteredGroups = useMemo(() => {
    const q = navFilter.trim().toLowerCase();
    if (!q) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.subtext.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, navFilter]);

  return (
    <aside
      className={`hidden lg:flex bg-[#090C12]/72 backdrop-blur-2xl border-r border-white/[0.1] flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Top Collapse + Filter Input */}
      <div className="p-3 border-b border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display px-1">
              Workspace Modules
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] text-slate-400 hover:text-white transition mx-auto lg:mx-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              placeholder="Filter modules..."
              className="w-full bg-[#0F141E] border border-white/[0.08] rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
            />
            {navFilter && (
              <button
                type="button"
                onClick={() => setNavFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-5">
        {filteredGroups.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No modules match &ldquo;{navFilter}&rdquo;
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group.title}
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition relative group ${
                        isActive
                          ? `bg-[#141B29] text-white border ${accent.borderClass}`
                          : 'text-slate-400 hover:text-slate-100 hover:bg-[#0F141E] border border-transparent'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md shrink-0 transition ${
                          isActive
                            ? `${accent.bgClass} ${accent.textClass}`
                            : `bg-[#0F141E] text-slate-400 group-hover:${accent.textClass}`
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate font-semibold whitespace-nowrap ${
                                isActive ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {item.label}
                            </span>
                            {item.statusText && (
                              <span
                                className={`text-[10px] font-mono font-semibold tabular-nums shrink-0 ${item.statusTone}`}
                              >
                                {item.statusText}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {item.subtext}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connected Broker & Ownership Card at Bottom */}
      <div className="p-2.5 border-t border-white/[0.08] bg-[#070A0F]/65 backdrop-blur-md space-y-2">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-[#0F141E] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {primaryBroker ? primaryBroker.brokerName : 'IC Markets'}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-semibold ${accent.textClass} shrink-0`}>
                {primaryBroker ? primaryBroker.accountType : 'LIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span>#{primaryBroker ? primaryBroker.login : '50294112'}</span>
              <span className="text-emerald-400 font-semibold">
                ${primaryBroker ? primaryBroker.balance.toLocaleString() : '50,000'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={onOpenBrokerModal}
                className="w-full py-1.5 px-2 bg-[#141B29] hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1.5 border border-white/[0.08]"
              >
                <Server className={`w-3 h-3 ${accent.textClass}`} />
                <span>Broker Accounts</span>
              </button>

              {onOpenBrandStudio && (
                <button
                  type="button"
                  onClick={onOpenBrandStudio}
                  className="w-full py-1.5 px-2 bg-[#090C12] hover:bg-[#141B29] text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition flex items-center justify-between gap-1.5 border border-white/[0.08]"
                  title={`Owned by ${brand.ownerName}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <KeyRound className={`w-3 h-3 ${accent.textClass} shrink-0`} />
                    <span className="truncate">Brand &amp; IP Studio</span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 shrink-0">100%</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onOpenBrokerModal}
              className={`w-full p-2.5 rounded-lg bg-[#0F141E] border border-white/[0.08] ${accent.textClass} flex items-center justify-center transition`}
              title="Manage MT5 Broker Accounts"
            >
              <Server className="w-4 h-4" />
            </button>
            {onOpenBrandStudio && (
              <button
                type="button"
                onClick={onOpenBrandStudio}
                className={`w-full p-2.5 rounded-lg bg-[#0F141E] border border-white/[0.08] ${accent.textClass} flex items-center justify-center transition`}
                title="Brand & Full Ownership Studio"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
