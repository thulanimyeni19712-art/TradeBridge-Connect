import React from 'react';
import { X, Award, ShieldCheck, Printer } from 'lucide-react';
import { sha256Hex } from '../../lib/crypto';
import { useBrand } from '../../context/BrandContext';

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
  traderName,
  accountNumber = 'SOV-8839210-PH1',
  fundedAmount = 100000,
  datePassed = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
}) => {
  const { brand } = useBrand();
  if (!isOpen) return null;

  const recipientName = traderName || brand.ownerName;
  const verificationHash = sha256Hex(`${accountNumber}:${fundedAmount}:${recipientName}`).slice(0, 14);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F141E] border border-amber-500/50 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Certificate Container */}
        <div className="p-4 sm:p-8 relative bg-[#090C12] border-2 border-double border-amber-500/35 m-2 sm:m-3 rounded-xl text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sovereign Seal */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0F141E] flex items-center justify-center text-amber-400">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              {brand.brandName} · PROPRIETARY CAPITAL ALLOCATION
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1 uppercase tracking-tight font-display">
              Certificate of Achievement
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Official Verification of Funded Desk Completion
            </p>
          </div>

          <div className="py-2">
            <p className="text-xs text-slate-300 italic">This credential is proudly issued to:</p>
            <h3 className="text-2xl font-bold text-amber-300 mt-1 tracking-wide font-serif">
              {recipientName}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              Having successfully passed the {brand.ownerEntity} proprietary funding evaluation, demonstrating disciplined algorithmic risk management and capital preservation.
            </p>
          </div>

          {/* Allocation Stats */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#0F141E] rounded-xl border border-amber-500/30 font-mono tabular-nums text-xs max-w-lg mx-auto">
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
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] px-4">
            <div className="text-left font-mono text-[10px] text-slate-400">
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CRYPTOGRAPHICALLY VERIFIED</span>
              </div>
              <div className="text-slate-500 tabular-nums">Hash: 0x{verificationHash}</div>
            </div>

            <div className="text-right">
              <div className="text-xs font-serif text-slate-200 italic">{brand.ownerName}</div>
              <div className="text-[10px] text-slate-400 font-mono">Principal Owner, {brand.ownerEntity}</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#090C12] border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Your live funded account is active on the Sovereign Omni-Bridge.
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
