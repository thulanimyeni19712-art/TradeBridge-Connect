import React, { useState, useEffect } from 'react';
import { Position } from '../../types/trading';
import { X, Scissors, AlertTriangle } from 'lucide-react';

interface PartialCloseModalProps {
  position: Position | null;
  onClose: () => void;
  onConfirm: (positionId: string, percentage: number) => void;
}

export const PartialCloseModal: React.FC<PartialCloseModalProps> = ({
  position,
  onClose,
  onConfirm,
}) => {
  const [percentage, setPercentage] = useState<number>(50);

  useEffect(() => {
    if (position) {
      setPercentage(50);
    }
  }, [position?.id]);

  if (!position) return null;

  const lotsToClose = Number((position.lots * (percentage / 100)).toFixed(2));
  const remainingLots = Number(Math.max(0, position.lots - lotsToClose).toFixed(2));
  const estimatedProfit = Number((position.profit * (percentage / 100)).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-[#0F141E] border-t md:border border-white/[0.1] rounded-t-2xl md:rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 md:hidden" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#161D2B]">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100">Partial Close Position</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#090C12] border border-white/[0.08] p-3.5 rounded-lg flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 font-mono tabular-nums">Position #{position.ticket}</div>
              <div className="text-slate-100 font-semibold text-sm">
                {position.symbol} {position.side}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400">Total Volume</div>
              <div className="text-cyan-400 font-mono font-semibold tabular-nums">
                {position.lots} Lots
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-2">
              <span>Volume Percentage</span>
              <span className="font-mono font-semibold text-cyan-400 tabular-nums">{percentage}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[25, 33, 50, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPercentage(pct)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-medium transition tabular-nums ${
                    percentage === pct
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'bg-[#161D2B] text-slate-300 hover:bg-slate-800 border border-white/[0.08]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="p-3.5 bg-[#090C12] border border-white/[0.08] rounded-lg space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Volume to Close</span>
              <span className="text-rose-400 font-mono font-semibold tabular-nums">-{lotsToClose} Lots</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Position</span>
              <span className="text-emerald-400 font-mono font-semibold tabular-nums">{remainingLots} Lots</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/[0.08] text-slate-300">
              <span>Realized PnL Locked</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {estimatedProfit >= 0
                  ? `+$${estimatedProfit.toFixed(2)}`
                  : `-$${Math.abs(estimatedProfit).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#161D2B] border-t border-white/[0.08] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/[0.06] transition whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(position.id, percentage);
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Confirm Partial Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface KillSwitchModalProps {
  isOpen: boolean;
  positionCount: number;
  pendingCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  positionCount,
  pendingCount,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/85 backdrop-blur-md p-0 md:p-4">
      <div className="bg-[#120A0D] border-t md:border border-rose-500/40 rounded-t-2xl md:rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="w-10 h-1 bg-rose-700/60 rounded-full mx-auto my-2 md:hidden" />
        <div className="px-6 py-5 border-b border-rose-950/70 bg-rose-950/20 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-100">Emergency Kill Switch</h3>
            <p className="text-xs text-rose-200/80">
              Immediate liquidation across all connected broker terminals
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Executing the Kill Switch will immediately send market liquidation packets to all connected terminals:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-center">
              <div className="text-xs text-rose-300">Open Positions</div>
              <div className="text-2xl font-mono font-bold text-rose-200 mt-1 tabular-nums">
                {positionCount}
              </div>
              <div className="text-xs text-rose-400 mt-0.5">Force Market Close</div>
            </div>
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-center">
              <div className="text-xs text-rose-300">Pending Orders</div>
              <div className="text-2xl font-mono font-bold text-rose-200 mt-1 tabular-nums">
                {pendingCount}
              </div>
              <div className="text-xs text-rose-400 mt-0.5">Instant Cancel</div>
            </div>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              This action protects account equity during high-impact news spikes or sudden broker disconnections and cannot be reversed.
            </span>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#180B0F] border-t border-rose-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/[0.06] transition whitespace-nowrap"
          >
            Cancel &amp; Return
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-2 whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Liquidate All Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
