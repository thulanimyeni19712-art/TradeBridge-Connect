import React, { useState, useEffect } from 'react';
import { Position } from '../../types/trading';
import { X, Shield, Target, AlertCircle } from 'lucide-react';

interface EditPositionModalProps {
  position: Position | null;
  onClose: () => void;
  onSave: (positionId: string, sl: number | null, tp: number | null) => void;
}

export const EditPositionModal: React.FC<EditPositionModalProps> = ({
  position,
  onClose,
  onSave,
}) => {
  const [slValue, setSlValue] = useState<string>('');
  const [tpValue, setTpValue] = useState<string>('');

  useEffect(() => {
    if (position) {
      setSlValue(position.sl !== null ? position.sl.toString() : '');
      setTpValue(position.tp !== null ? position.tp.toString() : '');
    }
  }, [position]);

  if (!position) return null;

  const handleSave = () => {
    const parsedSl = slValue.trim() === '' ? null : parseFloat(slValue);
    const parsedTp = tpValue.trim() === '' ? null : parseFloat(tpValue);
    const sl = parsedSl !== null && Number.isFinite(parsedSl) ? parsedSl : null;
    const tp = parsedTp !== null && Number.isFinite(parsedTp) ? parsedTp : null;
    onSave(position.id, sl, tp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-[#0F141E] border-t md:border border-white/[0.1] rounded-t-2xl md:rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 md:hidden" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#161D2B]">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold font-mono ${
                position.side === 'BUY'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {position.side}
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>{position.symbol}</span>
                <span className="text-xs font-normal text-slate-400 font-mono tabular-nums">
                  #{position.ticket}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono tabular-nums">
                {position.lots} Lots @ {position.openPrice}
              </p>
            </div>
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
          <div className="p-3 bg-[#090C12] rounded-lg border border-white/[0.08] text-xs text-slate-300 flex items-center justify-between">
            <span>Current Market Price</span>
            <span className="font-mono font-semibold text-slate-100 tabular-nums">
              {position.currentPrice}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Stop Loss Price (SL)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={slValue}
                onChange={(e) => setSlValue(e.target.value)}
                placeholder="Leave blank for no SL"
                className="w-full bg-[#090C12] border border-white/[0.12] rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono tabular-nums placeholder:text-slate-500 focus:outline-none focus:border-rose-500/80 transition"
              />
              {slValue && (
                <button
                  type="button"
                  onClick={() => setSlValue('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Take Profit Price (TP)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={tpValue}
                onChange={(e) => setTpValue(e.target.value)}
                placeholder="Leave blank for no TP"
                className="w-full bg-[#090C12] border border-white/[0.12] rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono tabular-nums placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
              />
              {tpValue && (
                <button
                  type="button"
                  onClick={() => setTpValue('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Updated SL/TP values sync immediately via bridge to {position.terminal}.</span>
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
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition whitespace-nowrap"
          >
            Update Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
