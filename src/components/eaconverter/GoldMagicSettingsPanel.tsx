import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

export interface GoldMagicBotConfig {
  pairs: string[];
  preference: 'BUY_SELL' | 'BUY_ONLY' | 'SELL_ONLY';
  riskPerTradePct: string;
  dailyLossLimitPct: string;
  sessions: {
    sydney: boolean;
    tokyo: boolean;
    london: boolean;
    newYork: boolean;
  };
  analysisMode: 'Technical analysis' | 'SMC + Fundamental' | 'Price Action';
  maxSpreadPoints: number;
  trailingStopEnabled: boolean;
}

interface GoldMagicSettingsPanelProps {
  botName: string;
  accentHex: string;
  availablePairs: string[];
  initialConfig: GoldMagicBotConfig;
  onSave: (next: GoldMagicBotConfig) => void;
  onBack: () => void;
}

type AccordionSection =
  | 'PAIRS'
  | 'PREFERENCES'
  | 'RISK'
  | 'SESSIONS'
  | 'ANALYSIS'
  | 'ADVANCED'
  | null;

export const GoldMagicSettingsPanel: React.FC<GoldMagicSettingsPanelProps> = ({
  botName,
  accentHex,
  availablePairs,
  initialConfig,
  onSave,
  onBack,
}) => {
  const [draft, setDraft] = useState<GoldMagicBotConfig>(initialConfig);
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const toggleSection = (section: AccordionSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const togglePair = (pair: string) => {
    setDraft((prev) => {
      const exists = prev.pairs.includes(pair);
      if (exists && prev.pairs.length === 1) return prev;
      return {
        ...prev,
        pairs: exists ? prev.pairs.filter((p) => p !== pair) : [...prev.pairs, pair],
      };
    });
  };

  const activeSessionCount = Object.values(draft.sessions).filter(Boolean).length;

  const handleSave = () => {
    onSave(draft);
    setSavedToast('Settings saved & synced to live engine.');
    window.setTimeout(() => setSavedToast(null), 2600);
  };

  const handleDiscard = () => {
    setDraft(initialConfig);
    setOpenSection(null);
    setSavedToast('Unsaved changes discarded.');
    window.setTimeout(() => setSavedToast(null), 2000);
  };

  const preferenceLabel =
    draft.preference === 'BUY_SELL'
      ? 'Buy & sell'
      : draft.preference === 'BUY_ONLY'
      ? 'Buy only'
      : 'Sell only';

  const sessionsSummary =
    activeSessionCount === 4
      ? 'All sessions · 7 days'
      : activeSessionCount === 0
      ? 'Paused (0 sessions)'
      : `${activeSessionCount} active session(s)`;

  return (
    <div className="space-y-3">
      {/* Video 2 Top Header: ← Bot settings + Bot Icon + Customize your trading */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.1] text-slate-200 transition shrink-0"
          aria-label="Back to bot deck"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-sm font-bold text-white font-display">Bot settings</div>
      </div>

      <div className="flex items-center gap-3 px-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 bg-[#08150E]"
          style={{ borderColor: `${accentHex}55` }}
        >
          <SlidersHorizontal className="w-4 h-4" style={{ color: accentHex }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{botName}</div>
          <div className="text-[11px] text-slate-400">Customize your trading.</div>
        </div>
      </div>

      {savedToast && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-2">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Video 2 Green-Glow Accordion Sections */}
      <div className="space-y-2.5">
        {/* 1. Trading pairs */}
        <div
          className="rounded-2xl border bg-gradient-to-r from-[#0B1710] via-[#09120D] to-[#0D2115] overflow-hidden"
          style={{ borderColor: `${accentHex}45` }}
        >
          <button
            type="button"
            onClick={() => toggleSection('PAIRS')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-bold text-white">Trading pairs</div>
              <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                {draft.pairs.length} {draft.pairs.length === 1 ? 'market selected' : 'markets selected'}
              </div>
            </div>
            <span className="w-7 h-7 rounded-full border border-white/15 bg-black/35 flex items-center justify-center text-slate-200">
              {openSection === 'PAIRS' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </span>
          </button>

          {openSection === 'PAIRS' && (
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] flex flex-wrap gap-1.5">
              {availablePairs.map((pair) => {
                const selected = draft.pairs.includes(pair);
                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => togglePair(pair)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition ${
                      selected
                        ? 'text-slate-950 font-bold'
                        : 'bg-[#070B09] border-white/[0.08] text-slate-300 hover:text-white'
                    }`}
                    style={
                      selected
                        ? { backgroundColor: accentHex, borderColor: accentHex }
                        : undefined
                    }
                  >
                    {pair}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Trade preferences */}
        <div
          className="rounded-2xl border bg-gradient-to-r from-[#0B1710] via-[#09120D] to-[#0D2115] overflow-hidden"
          style={{ borderColor: `${accentHex}45` }}
        >
          <button
            type="button"
            onClick={() => toggleSection('PREFERENCES')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-bold text-white">Trade preferences</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{preferenceLabel}</div>
            </div>
            <span className="w-7 h-7 rounded-full border border-white/15 bg-black/35 flex items-center justify-center text-slate-200">
              {openSection === 'PREFERENCES' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </span>
          </button>

          {openSection === 'PREFERENCES' && (
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'BUY_SELL', label: 'Buy & sell' },
                  { id: 'BUY_ONLY', label: 'Buy only' },
                  { id: 'SELL_ONLY', label: 'Sell only' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, preference: opt.id }))}
                  className={`py-2 px-2 rounded-lg text-[11px] font-semibold border transition ${
                    draft.preference === opt.id
                      ? 'text-slate-950 font-bold'
                      : 'bg-[#070B09] border-white/[0.08] text-slate-300'
                  }`}
                  style={
                    draft.preference === opt.id
                      ? { backgroundColor: accentHex, borderColor: accentHex }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Account risk */}
        <div
          className="rounded-2xl border bg-gradient-to-r from-[#0B1710] via-[#09120D] to-[#0D2115] overflow-hidden"
          style={{ borderColor: `${accentHex}45` }}
        >
          <button
            type="button"
            onClick={() => toggleSection('RISK')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-bold text-white">Account risk</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Your account limits</div>
            </div>
            <span className="w-7 h-7 rounded-full border border-white/15 bg-black/35 flex items-center justify-center text-slate-200">
              {openSection === 'RISK' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </span>
          </button>

          {openSection === 'RISK' && (
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3 text-xs">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Optional safety boundaries enforced for this bot&apos;s new entries. Blank means no limit. Risk sizing may reduce your selected lot size; broker data is required.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white block">
                  Risk per trade
                </label>
                <div className="flex items-center rounded-xl bg-[#070B09] border border-white/[0.12] px-3 py-2">
                  <input
                    type="text"
                    value={draft.riskPerTradePct}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, riskPerTradePct: e.target.value }))
                    }
                    placeholder="Not set"
                    className="flex-1 bg-transparent text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <span className="text-xs font-mono text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Percentage of account equity allocated to one trade&apos;s risk.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white block">
                  Daily loss limit
                </label>
                <div className="flex items-center rounded-xl bg-[#070B09] border border-white/[0.12] px-3 py-2">
                  <input
                    type="text"
                    value={draft.dailyLossLimitPct}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, dailyLossLimitPct: e.target.value }))
                    }
                    placeholder="Not set"
                    className="flex-1 bg-transparent text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <span className="text-xs font-mono text-slate-400">%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Trading sessions */}
        <div
          className="rounded-2xl border bg-gradient-to-r from-[#0B1710] via-[#09120D] to-[#0D2115] overflow-hidden"
          style={{ borderColor: `${accentHex}45` }}
        >
          <button
            type="button"
            onClick={() => toggleSection('SESSIONS')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-bold text-white">Trading sessions</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{sessionsSummary}</div>
            </div>
            <span className="w-7 h-7 rounded-full border border-white/15 bg-black/35 flex items-center justify-center text-slate-200">
              {openSection === 'SESSIONS' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </span>
          </button>

          {openSection === 'SESSIONS' && (
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-2">
              <div className="text-[11px] text-slate-400">Choose when your bot can trade:</div>
              {(
                [
                  { key: 'sydney', title: 'Sydney', hours: '21:00–06:00 UTC' },
                  { key: 'tokyo', title: 'Tokyo', hours: '00:00–09:00 UTC' },
                  { key: 'london', title: 'London', hours: '07:00–16:00 UTC' },
                  { key: 'newYork', title: 'New York', hours: '12:00–21:00 UTC' },
                ] as const
              ).map((sess) => {
                const enabled = draft.sessions[sess.key];
                return (
                  <button
                    key={sess.key}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        sessions: { ...prev.sessions, [sess.key]: !prev.sessions[sess.key] },
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B09] border border-white/[0.08] flex items-center justify-between text-left hover:border-white/20 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{sess.title}</div>
                      <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {sess.hours}
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        enabled ? 'text-slate-950' : 'border-white/20 bg-transparent text-transparent'
                      }`}
                      style={
                        enabled
                          ? { backgroundColor: accentHex, borderColor: accentHex }
                          : undefined
                      }
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Analysis */}
        <div
          className="rounded-2xl border bg-gradient-to-r from-[#0B1710] via-[#09120D] to-[#0D2115] overflow-hidden"
          style={{ borderColor: `${accentHex}45` }}
        >
          <button
            type="button"
            onClick={() => toggleSection('ANALYSIS')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-bold text-white">Analysis</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{draft.analysisMode}</div>
            </div>
            <span className="w-7 h-7 rounded-full border border-white/15 bg-black/35 flex items-center justify-center text-slate-200">
              {openSection === 'ANALYSIS' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </span>
          </button>

          {openSection === 'ANALYSIS' && (
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-1.5">
              {(
                [
                  'Technical analysis',
                  'SMC + Fundamental',
                  'Price Action',
                ] as const
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, analysisMode: mode }))}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold border transition flex items-center justify-between ${
                    draft.analysisMode === mode
                      ? 'bg-[#070B09] text-white'
                      : 'bg-transparent border-white/[0.06] text-slate-400'
                  }`}
                  style={
                    draft.analysisMode === mode ? { borderColor: accentHex } : undefined
                  }
                >
                  <span>{mode}</span>
                  {draft.analysisMode === mode && (
                    <Check className="w-3.5 h-3.5" style={{ color: accentHex }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6. Advanced pair settings */}
        <div
          className="rounded-2xl border bg-gradient-to-r from-[#0B1710] via-[#09120D] to-[#0D2115] overflow-hidden"
          style={{ borderColor: `${accentHex}35` }}
        >
          <button
            type="button"
            onClick={() => toggleSection('ADVANCED')}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="text-xs font-bold text-white">Advanced pair settings</span>
            <span className="w-6 h-6 rounded-full border border-white/15 bg-black/35 flex items-center justify-center text-slate-200">
              {openSection === 'ADVANCED' ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </span>
          </button>
          {openSection === 'ADVANCED' && (
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Max Spread Filter (pts)</span>
                <input
                  type="number"
                  min={5}
                  max={250}
                  value={draft.maxSpreadPoints}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      maxSpreadPoints: Math.max(5, parseInt(e.target.value, 10) || 25),
                    }))
                  }
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-[#070B09] border border-white/[0.1] font-mono text-right text-white tabular-nums"
                />
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Adaptive Trailing Stop</span>
                <input
                  type="checkbox"
                  checked={draft.trailingStopEnabled}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, trailingStopEnabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-500"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Save / Discard Footer */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 transition shadow-lg"
          style={{ backgroundColor: '#f8fafc' }}
        >
          Save settings
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          Discard unsaved changes
        </button>
        <div className="text-center text-[10px] text-slate-500">
          Applies to new trades. Existing positions stay open.
        </div>
      </div>
    </div>
  );
};
