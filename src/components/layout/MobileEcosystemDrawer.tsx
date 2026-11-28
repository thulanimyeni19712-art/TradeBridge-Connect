import React from 'react';
import { MainNavTab } from './Sidebar';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import {
  X,
  Award,
  Cpu,
  Server,
  Key,
  KeyRound,
  Smartphone,
  AlertTriangle,
  Zap,
  Activity,
  Code,
  ChevronRight,
  Flame,
  Crosshair,
  Globe,
  Sparkles,
  Layers,
  Calendar,
  ScanLine,
  GitMerge,
} from 'lucide-react';

interface MobileEcosystemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenBrokerModal: () => void;
  onOpenKillSwitch: () => void;
  onOpenBrandStudio?: () => void;
}

export const MobileEcosystemDrawer: React.FC<MobileEcosystemDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenBrokerModal,
  onOpenKillSwitch,
  onOpenBrandStudio,
}) => {
  const { challenge, mt5Credentials, bridgeLatencyMs, automatedSettings } =
    useTrading();
  const { brand, accent, getModuleMeta } = useBrand();
  const primaryBroker = mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0];

  if (!isOpen) return null;

  const handlePickTab = (tab: MainNavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handlePickBroker = () => {
    onClose();
    onOpenBrokerModal();
  };

  const handlePickKillSwitch = () => {
    onClose();
    onOpenKillSwitch();
  };

  const groups: Array<{
    title: string;
    items: Array<{
      id: MainNavTab;
      label: string;
      subtext: string;
      icon: React.ComponentType<{ className?: string }>;
      meta?: string;
    }>;
  }> = [
    {
      title: 'Command & AI',
      items: [
        { id: 'BRIDGE', ...getModuleMeta('BRIDGE'), icon: Layers },
        { id: 'AI_SCANNER', ...getModuleMeta('AI_SCANNER'), icon: ScanLine },
        {
          id: 'AUTOTRADE',
          ...getModuleMeta('AUTOTRADE'),
          icon: Activity,
          meta: automatedSettings.masterAutoTrading ? 'Live' : 'Paused',
        },
      ],
    },
    {
      title: 'Execution & Bots',
      items: [
        { id: 'EA_LAUNCHER', ...getModuleMeta('EA_LAUNCHER'), icon: Smartphone, meta: '11 Builds' },
        { id: 'EAMERGE', ...getModuleMeta('EAMERGE'), icon: GitMerge, meta: 'Fusion' },
        { id: 'NEXUS', ...getModuleMeta('NEXUS'), icon: Sparkles },
        { id: 'LIQUIDITY_EDGE', ...getModuleMeta('LIQUIDITY_EDGE'), icon: Crosshair },
        { id: 'AVIATOR', ...getModuleMeta('AVIATOR'), icon: Flame },
        { id: 'EASYWAY', ...getModuleMeta('EASYWAY'), icon: Cpu },
        { id: 'ALGOMAX', ...getModuleMeta('ALGOMAX'), icon: Zap },
        { id: 'ITRADEBOT', ...getModuleMeta('ITRADEBOT'), icon: Sparkles },
      ],
    },
    {
      title: 'Prop & Analytics',
      items: [
        {
          id: 'EMERGE',
          ...getModuleMeta('EMERGE'),
          icon: Award,
          meta: challenge.status === 'PASSED' ? 'Passed' : `${challenge.profitTargetPct}%`,
        },
        { id: 'MAP', ...getModuleMeta('MAP'), icon: Globe },
        { id: 'SCRIPTS', ...getModuleMeta('SCRIPTS'), icon: Code },
      ],
    },
    {
      title: 'Cloud & Infrastructure',
      items: [
        { id: 'WORKSPACE', ...getModuleMeta('WORKSPACE'), icon: Calendar },
        {
          id: 'EACONNECT',
          ...getModuleMeta('EACONNECT'),
          icon: Server,
          meta: `${bridgeLatencyMs.toFixed(0)}ms`,
        },
        { id: 'EAMATRIX', ...getModuleMeta('EAMATRIX'), icon: Smartphone },
        { id: 'ALGOHOST', ...getModuleMeta('ALGOHOST'), icon: Server },
        { id: 'EACENTRAL', ...getModuleMeta('EACENTRAL'), icon: Smartphone },
        { id: 'EAMIGRATE', ...getModuleMeta('EAMIGRATE'), icon: Smartphone },
        { id: 'TRADEPORT', ...getModuleMeta('TRADEPORT'), icon: Server },
        { id: 'EAVAULT', ...getModuleMeta('EAVAULT'), icon: Key },
        { id: 'EACONVERTER', ...getModuleMeta('EACONVERTER'), icon: Smartphone },
        { id: 'ALGOADMIN', ...getModuleMeta('ALGOADMIN'), icon: Server },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg glass-ultra border-t border-white/[0.14] rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-4">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />

        <div className="flex items-center justify-between pt-1 pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-base font-bold text-white font-display tracking-tight">
              {brand.brandName} Suite
            </h3>
            <p className="text-xs text-slate-400">
              {brand.ownerEntity} · {brand.licenseOwnership}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#0F141E] border border-white/[0.08] text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {onOpenBrandStudio && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBrandStudio();
            }}
            className={`w-full p-3 rounded-xl ${accent.bgClass} border ${accent.borderClass} flex items-center justify-between text-left transition`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className={`w-4 h-4 ${accent.textClass}`} />
              <div>
                <div className="text-xs font-bold text-white">Brand &amp; Full Ownership Studio</div>
                <div className="text-[11px] text-slate-300">Customize name, owner entity, palette &amp; page titles</div>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${accent.textClass}`} />
          </button>
        )}

        {/* Active MT5 Broker Card */}
        <button
          type="button"
          onClick={handlePickBroker}
          className="w-full p-3.5 bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] rounded-xl flex items-center justify-between text-left transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                {primaryBroker ? primaryBroker.brokerName : 'IC Markets Global'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                MT5 #{primaryBroker ? primaryBroker.login : '50294112'} ·{' '}
                {primaryBroker ? primaryBroker.accountType : 'LIVE'}
              </div>
            </div>
          </div>
          <div className="text-right font-mono tabular-nums">
            <span className="text-[11px] text-cyan-400 font-semibold block">
              Switch
            </span>
            <span className="text-[10px] text-emerald-400">
              {bridgeLatencyMs.toFixed(1)}ms
            </span>
          </div>
        </button>

        {/* Grouped Navigation Items */}
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <div className="px-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePickTab(item.id)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                        isActive
                          ? 'bg-[#141B29] border-cyan-500/40 text-white'
                          : 'bg-[#0F141E] border-white/[0.06] text-slate-300 hover:bg-[#141B29]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isActive
                              ? 'bg-cyan-500/15 text-cyan-400'
                              : 'bg-[#090C12] text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.subtext}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.meta && (
                          <span className="text-[11px] font-mono font-semibold text-cyan-400 tabular-nums">
                            {item.meta}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Global Kill Switch */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePickKillSwitch}
            className="w-full py-3 bg-rose-600/15 hover:bg-rose-600 border border-rose-500/35 text-rose-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Kill Switch (Liquidate All)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
