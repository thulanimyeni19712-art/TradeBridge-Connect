import React from 'react';
import { MainNavTab } from './Sidebar';
import { useTrading } from '../../context/TradingContext';
import {
  X,
  Award,
  Cpu,
  Server,
  Key,
  Smartphone,
  AlertTriangle,
  Zap,
  Activity,
  Code,
  CheckCircle2,
  ChevronRight,
  Flame,
  Crosshair,
  Globe,
  Sparkles,
  Layers,
} from 'lucide-react';

interface MobileEcosystemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenBrokerModal: () => void;
  onOpenKillSwitch: () => void;
}

export const MobileEcosystemDrawer: React.FC<MobileEcosystemDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenBrokerModal,
  onOpenKillSwitch,
}) => {
  const { challenge, mt5Credentials } = useTrading();
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono">
      {/* Click outside to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Up Bottom Sheet */}
      <div className="relative z-10 w-full max-w-lg bg-[#0a0d14] border-t border-slate-700/80 rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-4">
        {/* Drag Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Titan Ecosystem Suite
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              All trading engines, prop tools &amp; cloud modules
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active MT5 Broker Card */}
        <div
          onClick={handlePickBroker}
          className="p-3.5 bg-[#101622] border border-cyan-800/40 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {primaryBroker ? primaryBroker.brokerName : 'IC Markets Global'}
              </div>
              <div className="text-[10px] text-slate-400">
                MT5 #{primaryBroker ? primaryBroker.login : '50294112'} • {primaryBroker ? primaryBroker.accountType : 'LIVE'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-cyan-300 font-bold block">SWITCH</span>
            <span className="text-[9px] text-emerald-400">1.4ms Ping</span>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-2">
          {/* Titan Omni-Bridge (All-in-One Master Trade Deck) */}
          <button
            onClick={() => handlePickTab('BRIDGE')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'BRIDGE'
                ? 'bg-gradient-to-r from-cyan-950/80 to-teal-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-[#10141d] border-cyan-500/40 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-slate-950 font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>Titan Omni-Bridge</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-400 text-slate-950">
                    ALL-IN-ONE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Combined Matrix • Every page in 1 master bridge
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-300 font-orbitron">
              UNIFIED
            </span>
          </button>

          {/* AlgoMax-EA.com (Clone of https://www.algomax-ea.com/) */}
          <button
            onClick={() => handlePickTab('ALGOMAX')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'ALGOMAX'
                ? 'bg-cyan-950/50 border-cyan-500/70 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-[#10141d] border-cyan-500/30 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Zap className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>AlgoMax-EA.com</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-500 text-slate-950">
                    PUBLIC
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Institutional MT4/MT5 AI Bot • Prop Pass Engine
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 font-orbitron">
              94.6% PASS
            </span>
          </button>

          {/* AlgoAdminPortal.com (Clone of https://algoadminportal.com/admin) */}
          <button
            onClick={() => handlePickTab('ALGOADMIN')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'ALGOADMIN'
                ? 'bg-purple-950/50 border-purple-500/70 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'bg-[#10141d] border-purple-500/30 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>AlgoAdminPortal.com</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-600 text-white">
                    ADMIN
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Master License Issuer &amp; VPS Fleet Monitor
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-400 font-orbitron">
              SUPER ADMIN
            </span>
          </button>

          {/* EAMigratePro.vercel.app (Clone of https://eamigratepro.vercel.app/) */}
          <button
            onClick={() => handlePickTab('EAMIGRATE')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'EAMIGRATE'
                ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-[#10141d] border-emerald-500/30 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Smartphone className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>EAMigratePro.vercel.app</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-500 text-slate-950">
                    24/7 VPS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  24/7 Mobile Cloud VPS for EAs • Zero PC Required
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 font-orbitron">
              $39/MO
            </span>
          </button>

          {/* TradePortEA.com (Clone of https://tradeportea.com/) */}
          <button
            onClick={() => handlePickTab('TRADEPORT')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'TRADEPORT'
                ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-[#10141d] border-emerald-500/30 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>TradePortEA.com</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-500 text-slate-950">
                    FIXED TERM
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Mobile MT4/MT5 Port Hosting • USDT/BTC Affiliates
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-300 font-orbitron">
              R600 / $36
            </span>
          </button>

          {/* Nexus2.v1 | KANTE FX (Video Clone) */}
          <button
            onClick={() => handlePickTab('NEXUS')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'NEXUS'
                ? 'bg-purple-950/50 border-purple-500/70 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'bg-[#10141d] border-purple-500/30 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>Nexus2.v1 | KANTE FX</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-600 text-white">
                    VIRAL EA
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Nexora AI 2.0 • 3-Trades Quick Setup • ZAR Live
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-400 font-orbitron">
              91.2% WR
            </span>
          </button>

          {/* Liquidity Edge EA (TikTok Viral @liquidityedgeea) */}
          <button
            onClick={() => handlePickTab('LIQUIDITY_EDGE')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'LIQUIDITY_EDGE'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-[#10141d] border-amber-500/30 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Crosshair className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>Liquidity Edge EA</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500 text-slate-950">
                    TIKTOK VIRAL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  077 600 4742 • SMC Sweeps, Asian Grab &amp; FVG
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 font-orbitron">
              PRO EA
            </span>
          </button>

          {/* Google Maps Global Liquidity Radar */}
          <button
            onClick={() => handlePickTab('MAP')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'MAP'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                : 'bg-[#10141d] border-cyan-500/20 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>Google Maps Financial Radar</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-500 text-slate-950">
                    GMP
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  LD4, NY4, CME &amp; Sandton JSE Broker Hubs
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 font-orbitron">
              8 HUBS
            </span>
          </button>

          {/* Nguni Aviator Pro v6 */}
          <button
            onClick={() => handlePickTab('AVIATOR')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'AVIATOR'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_20px_rgba(232,185,35,0.25)]'
                : 'bg-[#10141d] border-amber-500/20 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                  <span>Nguni Aviator Pro v6</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500 text-slate-950">
                    VIP
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  SA's #1 Statistical Crash Engine &amp; ELO Radar
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 font-orbitron">
              97.2% RTP
            </span>
          </button>

          {/* Emerge Prop */}
          <button
            onClick={() => handlePickTab('EMERGE')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'EMERGE'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : 'bg-[#10141d] border-slate-800 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Emerge Prop Firm Evaluation</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Challenge rules, 4% drawdown guard &amp; certificates
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400">
              {challenge.status === 'PASSED' ? 'PASSED' : `${challenge.profitTargetPct}% Goal`}
            </span>
          </button>

          {/* EasyWay2Trade */}
          <button
            onClick={() => handlePickTab('EASYWAY')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'EASYWAY'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                : 'bg-[#10141d] border-slate-800 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">EasyWay2Trade Bot Arsenal</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Endgame HFT, Shadow River, Apex &amp; Titan Grid
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-400">4 Bots</span>
          </button>

          {/* EA-Connect Copier */}
          <button
            onClick={() => handlePickTab('EACONNECT')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'EACONNECT'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                : 'bg-[#10141d] border-slate-800 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">EA-Connect Copier &amp; Cloud VPS</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Multi-terminal trade sync &amp; latency routing
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* EA-Vault */}
          <button
            onClick={() => handlePickTab('EAVAULT')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'EAVAULT'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                : 'bg-[#10141d] border-slate-800 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">EA-Vault Licenses &amp; Presets</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  HWID key generator &amp; verified .SET files
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* EA-Converter Admin */}
          <button
            onClick={() => handlePickTab('EACONVERTER')}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition ${
              currentTab === 'EACONVERTER'
                ? 'bg-purple-950/40 border-purple-500/60 text-purple-300'
                : 'bg-[#10141d] border-slate-800 text-slate-300 hover:bg-[#141a27]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">EA-Converter Admin Portal</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Mobile app activations &amp; white-label branding
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-400">White-Label</span>
          </button>
        </div>

        {/* Global Kill Switch Button */}
        <div className="pt-2">
          <button
            onClick={handlePickKillSwitch}
            className="w-full py-3 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>Emergency Kill Switch (Liquidate All)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
