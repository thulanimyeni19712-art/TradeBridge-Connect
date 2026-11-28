import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { MainNavTab } from './Sidebar';
import {
  Activity,
  Layers,
  Flame,
  Menu,
  Sparkles,
  ScanLine,
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
    'WORKSPACE',
    'EA_LAUNCHER',
    'ALGOMAX',
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
    'LIQUIDITY_EDGE',
    'EAMERGE',
  ].includes(currentTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#090C12]/75 backdrop-blur-2xl border-t border-white/[0.1] px-1.5 py-1.5 select-none">
      <div className="grid grid-cols-6 items-center max-w-lg mx-auto gap-0.5">
        <button
          type="button"
          onClick={() => onTabChange('BRIDGE')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition relative ${
            currentTab === 'BRIDGE'
              ? 'text-cyan-300 bg-[#141B29] border border-cyan-500/35'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <div className="relative">
            <Layers className="w-4 h-4 mb-0.5" />
            {positions.length > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 bg-cyan-400 text-slate-950 text-[9px] font-mono font-bold rounded-full min-w-[14px] text-center tabular-nums">
                {positions.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight">Bridge</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('AI_SCANNER')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition ${
            currentTab === 'AI_SCANNER'
              ? 'text-cyan-300 bg-[#141B29] border border-cyan-500/35'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <ScanLine className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">AI Scan</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('AUTOTRADE')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition relative ${
            currentTab === 'AUTOTRADE'
              ? 'text-emerald-300 bg-[#141B29] border border-emerald-500/35'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Activity
            className={`w-4 h-4 mb-0.5 ${
              automatedSettings.masterAutoTrading ? 'text-emerald-400' : ''
            }`}
          />
          <span className="text-[10px] font-semibold tracking-tight">Auto-Bot</span>
          {automatedSettings.masterAutoTrading && (
            <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('AVIATOR')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition ${
            currentTab === 'AVIATOR'
              ? 'text-amber-300 bg-[#141B29] border border-amber-500/35'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Flame className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Aviator</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('NEXUS')}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition ${
            currentTab === 'NEXUS'
              ? 'text-cyan-300 bg-[#141B29] border border-cyan-500/35'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Nexus</span>
        </button>

        <button
          type="button"
          onClick={onOpenEcosystemDrawer}
          className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition ${
            isEcosystemActive
              ? 'text-cyan-300 bg-[#141B29] border border-cyan-500/35'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Suite</span>
        </button>
      </div>
    </nav>
  );
};
