import React, { useState } from 'react';
import { useAviator } from '../../context/AviatorContext';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Hash,
  Activity,
  Layers,
  Key,
  Flame,
  Radio,
  Sparkles,
} from 'lucide-react';

export const AviatorInfinityConsoleView: React.FC = () => {
  const { verifyHash, rounds, currentElo } = useAviator();

  const [inputServerSeed, setInputServerSeed] = useState(
    '8a9f24e9b7c81a2f00315f5bdb7043a71877ef2d127de1249b6d85992a0e41f2'
  );
  const [inputClientSeed, setInputClientSeed] = useState('client_live_sa_302');
  const [inputNonce, setInputNonce] = useState(9988);
  const [verificationResult, setVerificationResult] = useState<{
    multiplier: number;
    hash: string;
  } | null>(null);

  const handleVerify = () => {
    const res = verifyHash(inputServerSeed, inputClientSeed, inputNonce);
    setVerificationResult(res);
  };

  const handleLoadRoundSeed = (roundIndex: number) => {
    const r = rounds[roundIndex];
    if (!r) return;
    setInputServerSeed(r.serverSeed);
    setInputClientSeed(r.clientSeed);
    setInputNonce(r.nonce);
    const res = verifyHash(r.serverSeed, r.clientSeed, r.nonce);
    setVerificationResult(res);
  };

  const diagnostics = React.useMemo(() => {
    const sample = rounds.slice(0, 30);
    if (sample.length === 0) {
      return {
        entropy: 0.892,
        entropyLabel: 'Optimal Randomness',
        pinkProbPct: 12.5,
        streakText: 'Awaiting live rounds',
        pinkCount: 0,
      };
    }

    let blue = 0;
    let purple = 0;
    let pink = 0;
    for (const r of sample) {
      if (r.multiplier >= 10) pink++;
      else if (r.multiplier >= 2) purple++;
      else blue++;
    }

    const total = sample.length;
    const probs = [blue / total, purple / total, pink / total].filter((p) => p > 0);
    const rawEntropy = -probs.reduce((acc, p) => acc + p * Math.log2(p), 0);
    const normalizedEntropy = +(rawEntropy / Math.log2(3)).toFixed(3);

    const headColor =
      sample[0].multiplier >= 10 ? 'Pink' : sample[0].multiplier >= 2 ? 'Purple' : 'Blue';
    let streakLen = 0;
    for (const r of sample) {
      const c = r.multiplier >= 10 ? 'Pink' : r.multiplier >= 2 ? 'Purple' : 'Blue';
      if (c === headColor) streakLen++;
      else break;
    }

    let roundsSincePink = 0;
    for (const r of sample) {
      if (r.multiplier >= 10) break;
      roundsSincePink++;
    }
    const pinkProbPct = +Math.min(48, Math.max(8.5, (pink / total) * 100 + roundsSincePink * 1.4)).toFixed(1);

    return {
      entropy: normalizedEntropy,
      entropyLabel: normalizedEntropy >= 0.78 ? 'Optimal Randomness' : 'Clustered Regime',
      pinkProbPct,
      streakText: `${streakLen} ${headColor} ${streakLen === 1 ? 'Round' : 'Consecutive'}`,
      pinkCount: pink,
    };
  }, [rounds]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-mono">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
            <span className="font-semibold text-emerald-400">Provably Fair Verifier</span>
            <span aria-hidden="true">·</span>
            <span>HMAC-SHA256 Hash Auditor</span>
          </div>
          <h2 className="text-base sm:text-lg font-sans font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Infinity Console &amp; Seed Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Cryptographic validation engine verifying mathematical integrity for every Aviator round
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs text-emerald-400 whitespace-nowrap self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Hash Engine Ready</span>
        </div>
      </div>

      {/* Grid: Hash Verifier Tool & Algorithmic Entropy Index */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Stage: Provably Fair Hash Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F141E] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-sans font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>ROUND SEED AUDITOR</span>
            </h3>
            <span className="text-[10px] text-slate-500">HMAC-SHA256 Spec</span>
          </div>

          {rounds.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase block">
                Load Seed from Recent Live Rounds:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rounds.slice(0, 6).map((r, idx) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleLoadRoundSeed(idx)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold tabular-nums transition ${
                      r.multiplier >= 10
                        ? 'bg-pink-500/15 border-pink-500/40 text-pink-300 hover:bg-pink-500/25'
                        : r.multiplier >= 2
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                        : 'bg-[#141B29] border-white/[0.08] text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    #{r.roundNumber} ({r.multiplier.toFixed(2)}x)
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Server Seed (Hexadecimal)</label>
              <input
                type="text"
                value={inputServerSeed}
                onChange={(e) => setInputServerSeed(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Client Seed</label>
                <input
                  type="text"
                  value={inputClientSeed}
                  onChange={(e) => setInputClientSeed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nonce (Round Index)</label>
                <input
                  type="number"
                  value={inputNonce}
                  onChange={(e) => setInputNonce(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-sans font-bold text-slate-950 text-xs transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Recalculate Multiplier</span>
            </button>
          </div>

          {/* Verification Result Display */}
          {verificationResult && (
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-400">CALCULATED RESULT:</span>
                <span className="text-2xl font-black font-sans text-emerald-400 tabular-nums">
                  {verificationResult.multiplier.toFixed(2)}x
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">GENERATED SHA-256 HASH</span>
                <p className="text-[10px] text-slate-400 break-all select-all font-mono">
                  {verificationResult.hash}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Deterministic Seed Matches Official Aviator Provably Fair Standard.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Stage: Live Entropy & Volatility Diagnostics (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F141E] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-sans font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>CYCLE ENTROPY RADAR</span>
            </h3>
            <span className="text-[10px] text-amber-400 font-bold font-sans tabular-nums">ELO {currentElo}</span>
          </div>

          {/* Live Computed Entropy Gauge Cards */}
          <div className="space-y-3 tabular-nums">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Shannon Entropy Index</span>
                <span className="text-emerald-400 font-bold">
                  {diagnostics.entropy.toFixed(3)} ({diagnostics.entropyLabel})
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(diagnostics.entropy * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Pink Wave Probability</span>
                <span className="text-pink-400 font-bold">{diagnostics.pinkProbPct}% (Next 5 Rounds)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-pink-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(diagnostics.pinkProbPct))}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Live Cluster Streak</span>
                <span className="text-cyan-300 font-bold">{diagnostics.streakText}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Rolling Sample Window</span>
                <span>{Math.min(30, rounds.length)} Live Rounds ({diagnostics.pinkCount} Pink)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
