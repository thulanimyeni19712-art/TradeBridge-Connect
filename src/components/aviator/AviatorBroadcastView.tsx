import React, { useState, useMemo, useEffect } from 'react';
import { useAviator } from '../../context/AviatorContext';
import { createUniqueId } from '../../lib/crypto';
import {
  Send,
  Radio,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Search,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

interface BroadcastHistoryItem {
  id: string;
  symbol: string;
  signalType: 'CRASH_MULTIPLIER' | 'PINK_HUNTER' | 'DMA_SWEEP' | 'ODDS_ARBITRAGE';
  channel: 'TELEGRAM' | 'DISCORD' | 'DUAL';
  targetMultiplier: number;
  confidence: number;
  timestamp: string;
  status: 'DELIVERED' | 'FAILED';
  bookmaker: string;
}

interface TrendingSymbolStat {
  symbol: string;
  name: string;
  count: number;
  avgConfidence: number;
  trend: 'BULLISH' | 'HIGH_VOL' | 'HOT';
  sparkline: number[];
}

const DISPATCH_STORAGE_KEY = 'nguni_broadcast_dispatch_log_v1';

export const AviatorBroadcastView: React.FC = () => {
  const {
    telegramBotToken,
    setTelegramBotToken,
    telegramChatId,
    setTelegramChatId,
    discordWebhookUrl,
    setDiscordWebhookUrl,
    isAutoBroadcast,
    setIsAutoBroadcast,
    broadcastSignal,
    activeSignal,
    signalsHistory,
    rounds,
  } = useAviator();

  const [testStatus, setTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'ULTRA'>('BALANCED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'TELEGRAM' | 'DISCORD'>('ALL');
  const [isDispatching, setIsDispatching] = useState(false);

  const filterPresets = [
    { id: 'CONSERVATIVE', label: 'Conservative', desc: '≥78% conf · ≥3.0×' },
    { id: 'BALANCED', label: 'Balanced', desc: '≥72% conf · ≥2.5×' },
    { id: 'AGGRESSIVE', label: 'Aggressive', desc: '≥65% conf · ≥2.0×' },
    { id: 'ULTRA', label: 'Ultra', desc: '≥58% conf · ≥1.8×' },
  ];

  const [historyList, setHistoryList] = useState<BroadcastHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(DISPATCH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fall back to empty log until live dispatch occurs
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(historyList.slice(0, 50)));
    } catch {
      // Ignore
    }
  }, [historyList]);

  // Compute real Trending Signal Radar metrics from live Aviator rounds & signal history
  const trendingStats: TrendingSymbolStat[] = useMemo(() => {
    const recent = signalsHistory.length > 0 ? signalsHistory : [activeSignal];
    const bookmakerMap = new Map<string, { count: number; confSum: number; mults: number[] }>();

    for (const sig of recent) {
      const entry = bookmakerMap.get(sig.bookmaker) || { count: 0, confSum: 0, mults: [] };
      entry.count += 1;
      entry.confSum += sig.confidence;
      entry.mults.push(sig.predictedMultiplier);
      bookmakerMap.set(sig.bookmaker, entry);
    }

    const roundSpark = rounds.slice(0, 10).map((r) => r.multiplier).reverse();
    const list: TrendingSymbolStat[] = Array.from(bookmakerMap.entries()).map(([bm, data]) => {
      const avgConf = Math.round(data.confSum / data.count);
      const maxMult = Math.max(...data.mults);
      return {
        symbol: bm,
        name: `Live Crash Signal Stream (${data.count} signals)`,
        count: data.count,
        avgConfidence: avgConf,
        trend: maxMult >= 10 ? 'HIGH_VOL' : avgConf >= 80 ? 'HOT' : 'BULLISH',
        sparkline: data.mults.length >= 2 ? data.mults.slice(0, 10).reverse() : roundSpark,
      };
    });

    return list.slice(0, 4);
  }, [signalsHistory, activeSignal, rounds]);

  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.signalType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bookmaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesChannel =
        channelFilter === 'ALL' || item.channel === channelFilter || item.channel === 'DUAL';

      return matchesSearch && matchesChannel;
    });
  }, [historyList, searchQuery, channelFilter]);

  const handleTestBroadcast = async () => {
    setIsDispatching(true);
    setTestStatus({ ok: true, msg: 'Dispatching signal via Telegram Bot API / Discord Webhook...' });

    const res = await broadcastSignal(activeSignal);
    setTestStatus({ ok: res.success, msg: res.message });

    const hasTg = Boolean(telegramBotToken.trim() && telegramChatId.trim());
    const hasDc = Boolean(discordWebhookUrl.trim());
    const channel: BroadcastHistoryItem['channel'] =
      hasTg && hasDc ? 'DUAL' : hasDc ? 'DISCORD' : 'TELEGRAM';

    const isPinkPattern = activeSignal.pattern.includes('PINK');
    const newItem: BroadcastHistoryItem = {
      id: createUniqueId('DISP'),
      symbol: isPinkPattern ? 'AVIATOR_PINK' : activeSignal.bookmaker,
      signalType: isPinkPattern ? 'PINK_HUNTER' : 'CRASH_MULTIPLIER',
      channel,
      targetMultiplier: activeSignal.predictedMultiplier,
      confidence: activeSignal.confidence,
      timestamp: new Date().toLocaleTimeString(),
      status: res.success ? 'DELIVERED' : 'FAILED',
      bookmaker: activeSignal.bookmaker,
    };
    setHistoryList((prev) => [newItem, ...prev]);
    setIsDispatching(false);

    setTimeout(() => setTestStatus(null), 5000);
  };

  const renderSparkline = (points: number[], strokeColor: string) => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const coords = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  const tgConfigured = Boolean(telegramBotToken.trim() && telegramChatId.trim());
  const dcConfigured = Boolean(discordWebhookUrl.trim());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0d14] border border-amber-500/20 rounded-2xl p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Send className="w-4 h-4" />
            </span>
            <h2 className="text-base font-orbitron font-extrabold text-white tracking-wider uppercase">
              TELEGRAM &amp; DISCORD BROADCAST HUB
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch real-time signal payloads directly to your Telegram Bot API channel or Discord Webhook endpoint
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAutoBroadcast(!isAutoBroadcast)}
            aria-pressed={isAutoBroadcast}
            className={`px-3 py-2 rounded-xl border font-orbitron font-bold text-xs transition flex items-center gap-1.5 ${
              isAutoBroadcast
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoBroadcast ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>AUTO-DISPATCH: {isAutoBroadcast ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            disabled={isDispatching}
            onClick={handleTestBroadcast}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 font-orbitron font-bold text-xs text-white shadow-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {isDispatching ? 'DISPATCHING...' : 'DISPATCH LIVE SIGNAL'}
          </button>
        </div>
      </div>

      {testStatus && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in slide-in-from-top-1 ${
            testStatus.ok
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
          }`}
        >
          {testStatus.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{testStatus.msg}</span>
        </div>
      )}

      {/* Main 2-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Top Config Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Telegram Configuration */}
            <div className="glass-ultra p-5 space-y-4 border border-cyan-500/30 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>TELEGRAM BOT API</span>
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-orbitron border ${
                    tgConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {tgConfigured ? 'CONFIGURED' : 'NOT SET'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Telegram Bot Token (@BotFather)</label>
                  <input
                    type="password"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="Enter live bot token (e.g. 123456:ABC...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Target Channel ID / Username</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="e.g. -100123456789 or @channel"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Discord Webhook Configuration */}
            <div className="glass-ultra p-5 space-y-4 border border-[#5865F2]/30 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between border-b border-[#5865F2]/20 pb-3">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                  <span>DISCORD WEBHOOK</span>
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-orbitron border ${
                    dcConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {dcConfigured ? 'CONFIGURED' : 'NOT SET'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={discordWebhookUrl}
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Sensitivity Filter</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filterPresets.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFilter(f.id as typeof selectedFilter)}
                        className={`p-1.5 rounded-lg border text-left transition ${
                          selectedFilter === f.id
                            ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] block truncate">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Searchable Broadcast History Table */}
          <div className="bg-[#080d16] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-orbitron uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Signal Dispatch Audit Log ({historyList.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real webhook delivery history recorded from Telegram Bot &amp; Discord relays
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['ALL', 'TELEGRAM', 'DISCORD'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                      channelFilter === ch
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dispatch log by bookmaker, ID, or signal type..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-orbitron">
                    <th className="py-2.5 px-3">Bookmaker / Asset</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-3 font-bold text-white font-orbitron">
                          {item.symbol}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.signalType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              item.channel === 'TELEGRAM'
                                ? 'bg-cyan-500/15 text-cyan-300'
                                : item.channel === 'DISCORD'
                                ? 'bg-purple-500/15 text-purple-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {item.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-400 tabular-nums">
                          {item.targetMultiplier.toFixed(2)}x
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold tabular-nums">
                          {item.confidence}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] tabular-nums">
                          {item.timestamp}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              item.status === 'DELIVERED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs space-y-2">
                        <div>
                          {historyList.length === 0
                            ? 'No live webhook dispatches recorded yet. Configure Telegram or Discord above and click DISPATCH LIVE SIGNAL.'
                            : `No dispatch records matching active filters${searchQuery ? ` ("${searchQuery}")` : ''}.`}
                        </div>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setChannelFilter('ALL');
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold transition"
                          >
                            Reset Search &amp; Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Trending Signal Radar derived from AviatorContext */}
        <div className="space-y-4">
          <div className="bg-[#090d16] border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-orbitron">
                  Trending Signals Radar
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-orbitron animate-pulse">
                LIVE
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Aggregated strictly from your active round engine &amp; real prediction stream across SA bookmakers.
            </p>

            <div className="space-y-3">
              {trendingStats.map((stat) => {
                const strokeColor =
                  stat.trend === 'HOT'
                    ? '#f59e0b'
                    : stat.trend === 'HIGH_VOL'
                    ? '#ec4899'
                    : '#10b981';

                return (
                  <div
                    key={stat.symbol}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs font-orbitron">
                            {stat.symbol}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              stat.trend === 'HOT'
                                ? 'bg-amber-500/20 text-amber-300'
                                : stat.trend === 'HIGH_VOL'
                                ? 'bg-pink-500/20 text-pink-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {stat.trend}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                          {stat.name}
                        </div>
                      </div>

                      <div className="text-right">
                        {renderSparkline(stat.sparkline, strokeColor)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] mt-2.5 pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 font-mono tabular-nums">
                        Signals: <b className="text-white">{stat.count}</b>
                      </span>
                      <span className="text-emerald-400 font-mono font-bold tabular-nums">
                        {stat.avgConfidence}% Avg Conf
                      </span>
                      <button
                        onClick={() => setSearchQuery(stat.symbol)}
                        className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-0.5 font-bold"
                      >
                        <span>Filter</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900 p-3.5 rounded-xl border border-cyan-800/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Dispatch Automation</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                When configured, signals exceeding your threshold are routed through /api/aviator/broadcast with zero manual clicks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
