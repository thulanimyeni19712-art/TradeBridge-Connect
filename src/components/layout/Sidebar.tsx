import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Zap,
  Activity,
  Code,
  Cpu,
  Award,
  Server,
  Key,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sliders,
  ExternalLink,
  Lock,
  PlusCircle,
  Database,
  Radio,
  Crosshair,
  Globe,
  Sparkles,
  Layers,
} from 'lucide-react';

export type MainNavTab =
  | 'ALGOMAX'
  | 'ALGOADMIN'
  | 'NEXUS'
  | 'AVIATOR'
  | 'BRIDGE'
  | 'AUTOTRADE'
  | 'LIQUIDITY_EDGE'
  | 'MAP'
  | 'SCRIPTS'
  | 'EASYWAY'
  | 'EMERGE'
  | 'EACONNECT'
  | 'EAVAULT'
  | 'EACONVERTER'
  | 'EAMIGRATE'
  | 'TRADEPORT';

interface SidebarProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenBrokerModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onOpenBrokerModal,
}) => {
  const {
    automatedSettings,
    positions,
    pendingOrders,
    challenge,
    mt5Credentials,
    bridgeLatencyMs,
  } = useTrading();

  const primaryBroker = mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0];

  const navGroups = [
    {
      title: 'MASTER COMMAND CENTER',
      items: [
        {
          id: 'BRIDGE' as MainNavTab,
          label: 'Titan Omni-Bridge',
          subtext: 'Combined Matrix • Every Page in 1 Deck',
          icon: Layers,
          badge: 'ALL-IN-ONE',
          badgeColor: 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
        },
      ],
    },
    {
      title: 'ALGOMAX & ADMIN PORTAL',
      items: [
        {
          id: 'ALGOMAX' as MainNavTab,
          label: 'AlgoMax-EA.com',
          subtext: 'Institutional MT4/MT5 AI Bot',
          icon: Zap,
          badge: 'NEW v5.2',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
        },
        {
          id: 'ALGOADMIN' as MainNavTab,
          label: 'AlgoAdminPortal.com',
          subtext: 'Master Cloud Admin & Licenses',
          icon: Server,
          badge: 'ADMIN',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        },
        {
          id: 'EAMIGRATE' as MainNavTab,
          label: 'EAMigratePro.vercel.app',
          subtext: '24/7 Mobile Cloud VPS for EAs',
          icon: Smartphone,
          badge: 'NEW CLONE',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse',
        },
        {
          id: 'TRADEPORT' as MainNavTab,
          label: 'TradePortEA.com',
          subtext: 'Fixed-Term Mobile VPS & Crypto Affiliates',
          icon: Server,
          badge: 'R600 / $36',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        },
      ],
    },
    {
      title: 'VIRAL ROBOT & AI SYSTEMS',
      items: [
        {
          id: 'NEXUS' as MainNavTab,
          label: 'Nexus2.v1 | KANTE FX',
          subtext: 'Nexora AI 2.0 • Quick 3-Trade Setup',
          icon: Sparkles,
          badge: 'VIRAL EA',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse',
        },
        {
          id: 'LIQUIDITY_EDGE' as MainNavTab,
          label: 'Liquidity Edge EA',
          subtext: 'TikTok Viral • 077 600 4742',
          icon: Crosshair,
          badge: 'SMC BOT',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
        {
          id: 'AVIATOR' as MainNavTab,
          label: 'Nguni Aviator Pro v6',
          subtext: "SA's Statistical Crash Engine",
          icon: Zap,
          badge: 'NEW v6',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
      ],
    },
    {
      title: 'EXECUTION & AI CORE',
      items: [
        {
          id: 'AUTOTRADE' as MainNavTab,
          label: 'Auto-Pilot MT5 & AI Hub',
          subtext: 'Zero-ruin & profit multiplier',
          icon: Activity,
          badge: automatedSettings.masterAutoTrading ? 'LIVE' : 'PAUSED',
          badgeColor: automatedSettings.masterAutoTrading
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
            : 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        },
        {
          id: 'SCRIPTS' as MainNavTab,
          label: 'High-Level Scripts Vault',
          subtext: 'MQL5, MQL4, PineScript, Python',
          icon: Code,
          badge: '6 Systems',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
      ],
    },
    {
      title: 'PROP FIRM & STRATEGY',
      items: [
        {
          id: 'EMERGE' as MainNavTab,
          label: 'Emerge Prop Evaluation',
          subtext: 'Drawdown guard & certificates',
          icon: Award,
          badge: challenge.status === 'PASSED' ? 'PASSED' : `${challenge.profitTargetPct}% Target`,
          badgeColor: challenge.status === 'PASSED'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        {
          id: 'EASYWAY' as MainNavTab,
          label: 'EasyWay2Trade Bots',
          subtext: 'Endgame HFT, Shadow River, Apex',
          icon: Cpu,
          badge: '4 Bots',
          badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        },
      ],
    },
    {
      title: 'INFRASTRUCTURE & VAULT',
      items: [
        {
          id: 'MAP' as MainNavTab,
          label: 'Google Maps Financial Radar',
          subtext: 'Global Exchanges & Equinix LD4/NY4',
          icon: Globe,
          badge: 'MAPS',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        },
        {
          id: 'EACONNECT' as MainNavTab,
          label: 'EA-Connect Copier',
          subtext: 'Multi-terminal VPS sync',
          icon: Server,
          badge: `${bridgeLatencyMs}ms`,
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        },
        {
          id: 'EAVAULT' as MainNavTab,
          label: 'EA-Vault License & Presets',
          subtext: 'HWID encryption & .SET files',
          icon: Key,
          badge: undefined,
          badgeColor: undefined,
        },
        {
          id: 'EACONVERTER' as MainNavTab,
          label: 'EA-Converter Admin',
          subtext: 'Mobile activations & rebrand',
          icon: Smartphone,
          badge: 'White-Label',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
      ],
    },
  ];

  return (
    <aside
      className={`hidden lg:flex bg-[#080b11] border-r border-slate-800/80 flex-col justify-between transition-all duration-300 select-none z-30 shrink-0 font-mono ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header Section inside Sidebar */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Control Deck
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-[#0f141f] hover:bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                {group.title}
              </div>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-[#101a2b] text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1422]'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-[#121824] text-slate-400 group-hover:text-cyan-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 text-left truncate">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`truncate font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 tabular-nums ${
                                item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5 font-sans">
                          {item.subtext}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Connected Broker Quick-Card at Bottom */}
      <div className="p-3 border-t border-slate-800/80 bg-[#06090e]">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-[#0d121c] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-200">
                  {primaryBroker ? primaryBroker.brokerName : 'IC Markets'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400">
                {primaryBroker ? primaryBroker.accountType : 'LIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
              <span>Login: #{primaryBroker ? primaryBroker.login : '50294112'}</span>
              <span className="text-emerald-400 font-bold">
                ${primaryBroker ? primaryBroker.balance.toLocaleString() : '50,000'}
              </span>
            </div>

            <button
              onClick={onOpenBrokerModal}
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border border-slate-700"
            >
              <Server className="w-3 h-3" />
              <span>Switch / Add Broker</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenBrokerModal}
            className="w-full p-2.5 rounded-xl bg-[#0d121c] border border-slate-800 hover:border-cyan-500/40 text-cyan-400 flex items-center justify-center transition"
            title="Manage MT5 Broker Accounts"
          >
            <Server className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
