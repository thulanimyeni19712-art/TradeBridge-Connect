import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Trash2,
  ChevronDown,
  Radio,
} from 'lucide-react';
import {
  speechNotifier,
  useSpeechNotifications,
} from '../../services/speechNotificationService';

export const VoiceSettingsPopover: React.FC = () => {
  const speech = useSpeechNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition whitespace-nowrap ${
          speech.settings.enabled
            ? speech.isSpeaking
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              : 'bg-[#0F141E] hover:bg-[#141B29] border-white/[0.08] text-slate-200'
            : 'bg-[#0F141E] hover:bg-[#141B29] border-white/[0.08] text-slate-500'
        }`}
        title="Voice Dispatch Controls"
      >
        {speech.settings.enabled ? (
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span className="hidden sm:inline">
          {speech.settings.enabled
            ? speech.isSpeaking
              ? 'Speaking'
              : 'Voice Dispatch'
            : 'Voice Muted'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0F141E] border border-white/[0.1] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-[#090C12]">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                Voice Dispatch Controls
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                speechNotifier.updateSettings({ enabled: !speech.settings.enabled })
              }
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                speech.settings.enabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {speech.settings.enabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          <div className="p-4 space-y-4">
            {!speech.isSupported && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                Browser SpeechSynthesis API is not supported in this context.
              </div>
            )}

            {/* Category toggles */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Announcement Triggers
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    key: 'announceBotTrades' as const,
                    label: 'Bot Entries',
                    active: speech.settings.announceBotTrades,
                  },
                  {
                    key: 'announceCriticalMoves' as const,
                    label: 'Market Moves',
                    active: speech.settings.announceCriticalMoves,
                  },
                  {
                    key: 'announceOutcomes' as const,
                    label: 'Trade Results',
                    active: speech.settings.announceOutcomes,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      speechNotifier.updateSettings({ [item.key]: !item.active })
                    }
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition text-center ${
                      item.active
                        ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-200'
                        : 'bg-[#090C12] border-white/[0.06] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speech Rate & Voice */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Speech Cadence</span>
                  <span className="font-mono tabular-nums text-cyan-300 font-semibold">
                    {speech.settings.rate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.6}
                  step={0.05}
                  value={speech.settings.rate}
                  onChange={(e) =>
                    speechNotifier.updateSettings({ rate: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {speech.voices.length > 0 && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Synthesis Voice
                  </label>
                  <select
                    value={speech.settings.voiceURI}
                    onChange={(e) =>
                      speechNotifier.updateSettings({ voiceURI: e.target.value })
                    }
                    className="w-full bg-[#090C12] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">System Default (English)</option>
                    {speech.voices.slice(0, 20).map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => speechNotifier.testVoice()}
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Voice</span>
              </button>
              <button
                type="button"
                onClick={() => speechNotifier.stopAll()}
                className="py-2 px-3 rounded-lg bg-[#090C12] hover:bg-slate-800 border border-white/[0.08] text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
                title="Stop current announcement"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
              {speech.logs.length > 0 && (
                <button
                  type="button"
                  onClick={() => speechNotifier.clearLogs()}
                  className="p-2 rounded-lg bg-[#090C12] hover:bg-slate-800 border border-white/[0.08] text-slate-400 hover:text-rose-400 transition"
                  title="Clear dispatch log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Recent Dispatch Log */}
            {speech.logs.length > 0 && (
              <div className="border-t border-white/[0.08] pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  <span>Recent Dispatches</span>
                  <span className="font-mono tabular-nums">{speech.logs.length}</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {speech.logs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-[#090C12] border border-white/[0.06] text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2 text-slate-300 font-medium">
                        <span className="truncate">{log.title}</span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[10px] line-clamp-1 mt-0.5">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
