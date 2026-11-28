import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  Server,
  Key,
  Award,
  Layers,
  Radio,
  Sliders,
  Cpu,
  Plus,
  Smartphone,
  Activity,
} from 'lucide-react';

export type MainNavTab = 'BRIDGE' | 'AUTOTRADE' | 'EASYWAY' | 'EMERGE' | 'EACONNECT' | 'EAVAULT' | 'EACONVERTER';

interface NavbarProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onOpenOrderModal: () => void;
  onOpenKillSwitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenOrderModal,
  onOpenKillSwitch,
}) => {
  const { accountEquity, unrealizedPnL, bridgeLatencyMs, positions, automatedSettings } = useTrading();

  return (
    <header className="sticky top-0 z-40 bg-[#080b10]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Identifier */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-950/40 flex items-center justify-center">
              <div className="w-full h-full bg-[#090d14] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-wider text-white font-mono uppercase">
                  AlgoTrade<span className="text-cyan-400">Matrix</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  INSTITUTIONAL SUITE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden md:block">
                Bridge • Auto-Pilot • EasyWay2Trade • Emerge • EA-Connect • EA-Vault • EA-Converter
              </div>
            </div>
          </div>

          {/* Navigation Modules Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#10141e] p-1 rounded-2xl border border-slate-800 font-mono text-xs">
            <button
              onClick={() => onTabChange('BRIDGE')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'BRIDGE'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trading Bridge</span>
            </button>

            <button
              onClick={() => onTabChange('AUTOTRADE')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'AUTOTRADE'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Pilot MT5</span>
            </button>

            <button
              onClick={() => onTabChange('EASYWAY')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'EASYWAY'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>EasyWay2Trade</span>
            </button>

            <button
              onClick={() => onTabChange('EMERGE')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'EMERGE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Emerge Prop</span>
            </button>

            <button
              onClick={() => onTabChange('EACONNECT')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'EACONNECT'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>EA-Connect</span>
            </button>

            <button
              onClick={() => onTabChange('EAVAULT')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'EAVAULT'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>EA-Vault</span>
            </button>

            <button
              onClick={() => onTabChange('EACONVERTER')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                currentTab === 'EACONVERTER'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>EA-Converter Admin</span>
            </button>
          </nav>

          {/* Right Action & Live Telemetry Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Latency Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#10141e] border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">{bridgeLatencyMs}ms</span>
              <span className="text-slate-500">LD4</span>
            </div>

            {/* Live Equity & PnL */}
            <div className="hidden md:flex flex-col text-right font-mono text-xs">
              <span className="text-slate-400 text-[10px] uppercase">Live Equity</span>
              <span className="font-bold text-slate-100">
                ${accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="hidden md:flex flex-col text-right font-mono text-xs">
              <span className="text-slate-400 text-[10px] uppercase">Floating PnL</span>
              <span className={`font-bold ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {unrealizedPnL >= 0 ? `+$${unrealizedPnL.toFixed(2)}` : `-$${Math.abs(unrealizedPnL).toFixed(2)}`}
              </span>
            </div>

            {/* New Order Launcher Button */}
            <button
              onClick={onOpenOrderModal}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-mono text-xs rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Order Ticket</span>
              <span className="sm:hidden">Order</span>
            </button>

            {/* Global Emergency Kill Switch */}
            <button
              onClick={onOpenKillSwitch}
              title="Global Emergency Kill Switch"
              className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 rounded-xl transition flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/60"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 font-mono text-[11px] no-scrollbar">
          <button
            onClick={() => onTabChange('BRIDGE')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'BRIDGE' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Bridge & Execution
          </button>
          <button
            onClick={() => onTabChange('AUTOTRADE')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'AUTOTRADE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Auto-Pilot MT5
          </button>
          <button
            onClick={() => onTabChange('EASYWAY')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'EASYWAY' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            EasyWay2Trade
          </button>
          <button
            onClick={() => onTabChange('EMERGE')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'EMERGE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Emerge Prop
          </button>
          <button
            onClick={() => onTabChange('EACONNECT')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'EACONNECT' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            EA-Connect
          </button>
          <button
            onClick={() => onTabChange('EAVAULT')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'EAVAULT' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            EA-Vault
          </button>
          <button
            onClick={() => onTabChange('EACONVERTER')}
            className={`px-3 py-1 rounded-lg shrink-0 ${currentTab === 'EACONVERTER' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            EA-Converter Admin
          </button>
        </div>
      </div>
    </header>
  );
};
