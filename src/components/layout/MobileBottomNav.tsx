import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { MainNavTab } from './Sidebar';
import {
  Zap,
  Activity,
  Layers,
  Flame,
  Menu,
  Sparkles,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onOpenEcosystemDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenEcosystemDrawer,
}) => {
  const { positions, automatedSettings } = useTrading();

  const isEcosystemActive = [
    'EMERGE',
    'EASYWAY',
    'EACONNECT',
    'EAVAULT',
    'EACONVERTER',
    'SCRIPTS',
    'ALGOADMIN',
    'MAP',
    'EAMIGRATE',
    'TRADEPORT',
  ].includes(currentTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#05070c]/90 backdrop-blur-2xl border-t border-white/10 px-1.5 py-1.5 select-none font-mono shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <div className="grid grid-cols-6 items-center max-w-lg mx-auto">
        {/* Tab 1: AlgoMax-EA.com & Admin */}
        <button
          onClick={() => onTabChange('ALGOMAX')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition relative ${
            currentTab === 'ALGOMAX' || currentTab === 'ALGOADMIN'
              ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'text-cyan-400/80 hover:text-cyan-300'
          }`}
        >
          <Zap className="w-4 h-4 mb-0.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-tight font-orbitron">AlgoMax</span>
          <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-[8px] font-black rounded-full shadow-sm">
            EA
          </span>
        </button>

        {/* Tab 2: Nexus2.v1 / Kante FX (Video Clone) */}
        <button
          onClick={() => onTabChange('NEXUS')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition relative ${
            currentTab === 'NEXUS'
              ? 'text-purple-300 bg-purple-950/60 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
              : 'text-purple-400/80 hover:text-purple-300'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-purple-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-tight font-orbitron">Nexus</span>
        </button>

        {/* Tab 2: Nguni Aviator Pro v6 */}
        <button
          onClick={() => onTabChange('AVIATOR')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition relative ${
            currentTab === 'AVIATOR'
              ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-[0_0_15px_rgba(232,185,35,0.3)]'
              : 'text-amber-400/80 hover:text-amber-300'
          }`}
        >
          <Flame className="w-4 h-4 mb-0.5 text-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-tight font-orbitron">Aviator</span>
          <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[8px] font-black rounded-full shadow-sm">
            v6
          </span>
        </button>

        {/* Tab 3: Auto-Pilot MT5 */}
        <button
          onClick={() => onTabChange('AUTOTRADE')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition relative ${
            currentTab === 'AUTOTRADE'
              ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity
            className={`w-4 h-4 mb-0.5 ${
              automatedSettings.masterAutoTrading ? 'text-emerald-400' : 'text-slate-400'
            }`}
          />
          <span className="text-[10px] font-bold tracking-tight">Auto-Bot</span>
          {automatedSettings.masterAutoTrading && (
            <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* Tab 4: Omni-Bridge */}
        <button
          onClick={() => onTabChange('BRIDGE')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition relative ${
            currentTab === 'BRIDGE'
              ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Layers className="w-4 h-4 mb-0.5" />
            {positions.length > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded-full min-w-[14px] text-center shadow">
                {positions.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Bridge</span>
        </button>

        {/* Tab 5: Ecosystem Suite Drawer */}
        <button
          onClick={onOpenEcosystemDrawer}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition ${
            isEcosystemActive
              ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Suite</span>
        </button>
      </div>
    </nav>
  );
};
