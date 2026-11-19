import React, { useState } from 'react';
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
  if (!position) return null;

  const [slValue, setSlValue] = useState<string>(position.sl !== null ? position.sl.toString() : '');
  const [tpValue, setTpValue] = useState<string>(position.tp !== null ? position.tp.toString() : '');

  const handleSave = () => {
    const sl = slValue.trim() === '' ? null : parseFloat(slValue);
    const tp = tpValue.trim() === '' ? null : parseFloat(tpValue);
    onSave(position.id, sl, tp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-[#0f131a] border-t md:border border-slate-700/60 rounded-t-3xl md:rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 md:hidden" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#141a24]">
          <div className="flex items-center gap-2.5">
            <div className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
              position.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {position.side}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>{position.symbol}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">#{position.ticket}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {position.lots} Lots @ {position.openPrice}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between font-mono">
            <span>Current Market Price:</span>
            <span className="font-bold text-slate-100">{position.currentPrice}</span>
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
                className="w-full bg-[#18202d] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-rose-500/80 transition"
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
                className="w-full bg-[#18202d] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
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

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Updated SL/TP values will sync instantly via bridge to {position.terminal}.</span>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#141a24] border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition"
          >
            Update Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
