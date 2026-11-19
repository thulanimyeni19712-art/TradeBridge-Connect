import React from 'react';
import { X, Award, ShieldCheck, Printer } from 'lucide-react';
import { sha256Hex } from '../../lib/crypto';

interface EmergeCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  traderName?: string;
  accountNumber?: string;
  fundedAmount?: number;
  datePassed?: string;
}

export const EmergeCertificateModal: React.FC<EmergeCertificateModalProps> = ({
  isOpen,
  onClose,
  traderName = 'Alex Mercer',
  accountNumber = 'EMG-8839210-PH1',
  fundedAmount = 100000,
  datePassed = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
}) => {
  if (!isOpen) return null;

  const verificationHash = sha256Hex(`${accountNumber}:${fundedAmount}:${traderName}`).slice(0, 14);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0e14] border-2 border-amber-500/60 rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Certificate Container */}
        <div className="p-4 sm:p-8 relative bg-gradient-to-b from-[#141824] via-[#0c1018] to-[#090b10] border-2 sm:border-4 border-double border-amber-500/40 m-2 sm:m-3 rounded-xl sm:rounded-2xl text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Emerge Seal */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0d121c] flex items-center justify-center text-amber-400">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              EMERGE PROFIT • PROPRIETARY CAPITAL ALLOCATION
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1 uppercase tracking-tight">
              Certificate of Achievement
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Official Verification of Evaluation Phase Completion
            </p>
          </div>

          <div className="py-2">
            <p className="text-xs text-slate-300 italic">This credential is proudly presented to:</p>
            <h3 className="text-2xl font-bold text-amber-300 mt-1 tracking-wide font-serif">
              {traderName}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              Having successfully passed the rigorous EmergeFX proprietary funding evaluation, demonstrating exceptional algorithmic risk management, capital preservation, and consistency.
            </p>
          </div>

          {/* Allocation Stats */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-black/50 rounded-xl border border-amber-500/30 font-mono text-xs max-w-lg mx-auto">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Funded Capital</span>
              <span className="text-emerald-400 font-bold text-sm">${fundedAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Account Number</span>
              <span className="text-slate-200 font-semibold">{accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Date Certified</span>
              <span className="text-amber-300 font-medium">{datePassed}</span>
            </div>
          </div>

          {/* Verification Stamp & Signatures */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 px-4">
            <div className="text-left font-mono text-[10px] text-slate-400">
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CRYPTOGRAPHICALLY VERIFIED</span>
              </div>
              <div className="text-slate-500">Hash: 0x{verificationHash}</div>
            </div>

            <div className="text-right">
              <div className="text-xs font-serif text-slate-300 italic">Jonathan Sterling</div>
              <div className="text-[10px] text-slate-500 font-mono">Head of Risk Allocation, Emerge</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#10141d] border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Congratulations! Your live funded account is now active on the Bridge.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold font-mono transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
