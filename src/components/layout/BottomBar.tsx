import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { Shield, Volume2, VolumeX } from 'lucide-react';
import { useSpeechNotifications } from '../../services/speechNotificationService';

interface BottomBarProps {
  onOpenKillSwitch: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ onOpenKillSwitch }) => {
  const { positions, pendingOrders, bridgeLatencyMs } = useTrading();
  const speech = useSpeechNotifications();

  return (
    <footer className="hidden lg:block border-t border-white/[0.1] bg-[#090C12]/72 backdrop-blur-2xl py-2 px-6 text-xs text-slate-400 select-none relative z-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>DMA Bridge Online</span>
            <span className="text-slate-500 font-mono tabular-nums">
              · {bridgeLatencyMs.toFixed(1)} ms
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono tabular-nums">
            <span>
              Exposure: <strong className="text-slate-100">{positions.length}</strong>{' '}
              open · <strong className="text-cyan-400">{pendingOrders.length}</strong>{' '}
              pending
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Daily Cutoff: <strong className="text-slate-200 font-mono">3.5%</strong>
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-400">
            {speech.settings.enabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{speech.settings.enabled ? 'Voice Ready' : 'Voice Muted'}</span>
          </div>

          <button
            type="button"
            onClick={onOpenKillSwitch}
            className="text-rose-400 hover:text-white font-semibold transition flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-600 px-2.5 py-1 rounded-lg border border-rose-500/30"
          >
            <span>Panic Liquidate</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
