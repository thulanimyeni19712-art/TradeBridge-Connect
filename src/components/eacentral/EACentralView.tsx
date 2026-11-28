import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Smartphone,
  Upload,
  Share2,
  Users,
  Play,
  Pause,
  Copy,
  Check,
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Zap,
  Shield,
  Sliders,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { OrderSide } from '../../types/trading';
import { randomHex } from '../../lib/crypto';

interface HostedEAFile {
  id: string;
  name: string;
  format: '.ex4' | '.ex5';
  hostTerminal: string;
  inviteCode: string;
  subscribersCount: number;
  status: 'BROADCASTING' | 'PAUSED';
  lastTradeAt: string;
}

interface MobileSubscriber {
  id: string;
  clientName: string;
  broker: string;
  accountNumber: string;
  device: 'iOS App' | 'Android App';
  eaAssigned: string;
  lotMultiplier: number;
  maxRiskPct: number;
  equityUsd: number;
  todayPnlUsd: number;
  syncMs: number;
  status: 'MIRRORING' | 'PAUSED';
}

const INITIAL_HOSTED_EAS: HostedEAFile[] = [
  {
    id: 'ec-ea-1',
    name: 'CentralGold_SMC_Host.ex5',
    format: '.ex5',
    hostTerminal: 'Equinix LD4 Master #50294112',
    inviteCode: 'EAC-GOLD-9042',
    subscribersCount: 38,
    status: 'BROADCASTING',
    lastTradeAt: '2m ago',
  },
  {
    id: 'ec-ea-2',
    name: 'US30_NYSession_Breakout.ex4',
    format: '.ex4',
    hostTerminal: 'New York NY4 Master #8839210',
    inviteCode: 'EAC-US30-3188',
    subscribersCount: 24,
    status: 'BROADCASTING',
    lastTradeAt: '11m ago',
  },
  {
    id: 'ec-ea-3',
    name: 'London_Range_Reversal.ex5',
    format: '.ex5',
    hostTerminal: 'Frankfurt FR2 Master #1948275',
    inviteCode: 'EAC-FX24-7721',
    subscribersCount: 16,
    status: 'PAUSED',
    lastTradeAt: '1h ago',
  },
];

const INITIAL_SUBSCRIBERS: MobileSubscriber[] = [
  {
    id: 'sub-1',
    clientName: 'Marcus Reid',
    broker: 'IC Markets Global',
    accountNumber: '7740192',
    device: 'iOS App',
    eaAssigned: 'CentralGold_SMC_Host.ex5',
    lotMultiplier: 1.0,
    maxRiskPct: 2.0,
    equityUsd: 24850.4,
    todayPnlUsd: 642.15,
    syncMs: 14,
    status: 'MIRRORING',
  },
  {
    id: 'sub-2',
    clientName: 'Nadia Patel',
    broker: 'Exness MT5 Real',
    accountNumber: '5518290',
    device: 'Android App',
    eaAssigned: 'CentralGold_SMC_Host.ex5',
    lotMultiplier: 0.5,
    maxRiskPct: 1.5,
    equityUsd: 11240.0,
    todayPnlUsd: 318.8,
    syncMs: 18,
    status: 'MIRRORING',
  },
  {
    id: 'sub-3',
    clientName: 'Devon Brooks',
    broker: 'Pepperstone UK',
    accountNumber: '3391042',
    device: 'iOS App',
    eaAssigned: 'US30_NYSession_Breakout.ex4',
    lotMultiplier: 2.0,
    maxRiskPct: 3.0,
    equityUsd: 52400.0,
    todayPnlUsd: 1290.5,
    syncMs: 11,
    status: 'MIRRORING',
  },
  {
    id: 'sub-4',
    clientName: 'Elena Costa',
    broker: 'FTMO Prop MT5',
    accountNumber: '9042187',
    device: 'Android App',
    eaAssigned: 'London_Range_Reversal.ex5',
    lotMultiplier: 0.75,
    maxRiskPct: 1.0,
    equityUsd: 98940.0,
    todayPnlUsd: -115.0,
    syncMs: 16,
    status: 'PAUSED',
  },
];

export const EACentralView: React.FC = () => {
  const { brand } = useBrand();
  const {
    prices,
    positions,
    bridgeLatencyMs,
    executeOrder,
    executeKillSwitch,
    connectMT5Broker,
    issueMobileActivation,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'DISTRIBUTOR' | 'SUBSCRIBERS' | 'MOBILE_APP'>('DISTRIBUTOR');
  const [hostedEAs, setHostedEAs] = useState<HostedEAFile[]>(INITIAL_HOSTED_EAS);
  const [subscribers, setSubscribers] = useState<MobileSubscriber[]>(INITIAL_SUBSCRIBERS);

  // Upload / Register .ex4 / .ex5 state
  const [newEAName, setNewEAName] = useState<string>('');
  const [newEAFormat, setNewEAFormat] = useState<'.ex4' | '.ex5'>('.ex5');
  const [hostTerminalLabel, setHostTerminalLabel] = useState<string>('Equinix LD4 Master #50294112');
  const [selectedEAId, setSelectedEAId] = useState<string>(INITIAL_HOSTED_EAS[0].id);

  // Live master signal mirror dispatcher
  const [mirrorSymbol, setMirrorSymbol] = useState<string>('XAUUSD');
  const [mirrorSide, setMirrorSide] = useState<OrderSide>('BUY');
  const [mirrorLots, setMirrorLots] = useState<number>(0.1);
  const [isMirroring, setIsMirroring] = useState<boolean>(false);

  // Subscriber filters & add client form
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MIRRORING' | 'PAUSED'>('ALL');
  const [isAddClientOpen, setIsAddClientOpen] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [clientBroker, setClientBroker] = useState<string>('IC Markets Global');
  const [clientAccount, setClientAccount] = useState<string>('');
  const [clientDevice, setClientDevice] = useState<'iOS App' | 'Android App'>('iOS App');
  const [clientMultiplier, setClientMultiplier] = useState<number>(1.0);
  const [clientMaxRisk, setClientMaxRisk] = useState<number>(2.0);

  // Mobile client invite link & broker onboarding state
  const [inviteJoinCode, setInviteJoinCode] = useState<string>('EAC-GOLD-9042');
  const [mobileBrokerName, setMobileBrokerName] = useState<string>('Exness MT5 Real');
  const [mobileBrokerServer, setMobileBrokerServer] = useState<string>('Exness-MT5Real14');
  const [mobileAccountLogin, setMobileAccountLogin] = useState<string>('');
  const [mobileAccountPass, setMobileAccountPass] = useState<string>('');
  const [isLinkingClient, setIsLinkingClient] = useState<boolean>(false);

  // Feedback & safety state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmHaltAll, setConfirmHaltAll] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'emerald' | 'cyan' | 'rose' } | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const showNotice = (text: string, tone: 'emerald' | 'cyan' | 'rose' = 'cyan') => {
    setNotice({ text, tone });
    const id = window.setTimeout(() => setNotice(null), 4200);
    timersRef.current.push(id);
  };

  const selectedEA = useMemo(
    () => hostedEAs.find((ea) => ea.id === selectedEAId) || hostedEAs[0],
    [hostedEAs, selectedEAId]
  );

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subscribers.filter((sub) => {
      const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        sub.clientName.toLowerCase().includes(q) ||
        sub.broker.toLowerCase().includes(q) ||
        sub.accountNumber.toLowerCase().includes(q) ||
        sub.eaAssigned.toLowerCase().includes(q)
      );
    });
  }, [subscribers, searchQuery, statusFilter]);

  const activeMirroringCount = useMemo(
    () => subscribers.filter((s) => s.status === 'MIRRORING').length,
    [subscribers]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isEx4 = file.name.toLowerCase().endsWith('.ex4');
    setNewEAName(file.name);
    setNewEAFormat(isEx4 ? '.ex4' : '.ex5');
  };

  const handleRegisterEA = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newEAName.trim();
    if (!cleanName) {
      showNotice('Provide a compiled .ex4 or .ex5 Expert Advisor filename.', 'rose');
      return;
    }
    const normalized =
      cleanName.endsWith('.ex4') || cleanName.endsWith('.ex5')
        ? cleanName
        : `${cleanName}${newEAFormat}`;
    const code = `EAC-${normalized.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-${randomHex(2).toUpperCase()}`;
    const created: HostedEAFile = {
      id: `ec-ea-${Date.now()}`,
      name: normalized,
      format: normalized.endsWith('.ex4') ? '.ex4' : '.ex5',
      hostTerminal: hostTerminalLabel,
      inviteCode: code,
      subscribersCount: 0,
      status: 'BROADCASTING',
      lastTradeAt: 'Armed now',
    };
    setHostedEAs((prev) => [created, ...prev]);
    setSelectedEAId(created.id);
    setNewEAName('');
    showNotice(`Registered ${created.name} for mobile mirroring (Invite: ${created.inviteCode}).`, 'emerald');
  };

  const handleToggleEA = (id: string) => {
    setHostedEAs((prev) =>
      prev.map((ea) =>
        ea.id === id
          ? { ...ea, status: ea.status === 'BROADCASTING' ? 'PAUSED' : 'BROADCASTING' }
          : ea
      )
    );
  };

  const handleCopyInvite = (ea: HostedEAFile) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ea-central.com';
    const inviteUrl = `${origin}/?invite=${ea.inviteCode}`;
    void navigator.clipboard?.writeText(inviteUrl).catch(() => undefined);
    setCopiedId(ea.id);
    timersRef.current.push(window.setTimeout(() => setCopiedId(null), 2200));
    showNotice(`Copied invite link for ${ea.name} (${ea.inviteCode}).`, 'cyan');
  };

  const handleMirrorMasterTrade = async () => {
    const market = prices[mirrorSymbol];
    if (!market) {
      showNotice(`Waiting for live quote on ${mirrorSymbol}.`, 'rose');
      return;
    }
    setIsMirroring(true);
    try {
      const price = mirrorSide === 'BUY' ? market.ask : market.bid;
      const pip = market.pipSize || 0.01;
      const digits = market.digits ?? 2;
      const sl = mirrorSide === 'BUY' ? price - pip * 40 : price + pip * 40;
      const tp = mirrorSide === 'BUY' ? price + pip * 90 : price - pip * 90;

      const res = await executeOrder({
        symbol: mirrorSymbol,
        orderType: 'MARKET',
        side: mirrorSide,
        lots: mirrorLots,
        sl: Number(sl.toFixed(digits)),
        tp: Number(tp.toFixed(digits)),
        terminal: selectedEA.hostTerminal,
        comment: `EACentral_${selectedEA.inviteCode}`,
      });

      if (res.success) {
        setHostedEAs((prev) =>
          prev.map((ea) => (ea.id === selectedEA.id ? { ...ea, lastTradeAt: 'Just now' } : ea))
        );
        showNotice(
          `Mirrored ${mirrorSide} ${mirrorLots} lots ${mirrorSymbol} from ${selectedEA.name} to ${activeMirroringCount} active mobile clients.`,
          'emerald'
        );
      } else {
        showNotice(res.message, 'rose');
      }
    } finally {
      setIsMirroring(false);
    }
  };

  const handleToggleSubscriber = (subId: string) => {
    setSubscribers((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: s.status === 'MIRRORING' ? 'PAUSED' : 'MIRRORING' }
          : s
      )
    );
  };

  const handleUpdateSubscriberMultiplier = (subId: string, nextVal: number) => {
    const clamped = Math.max(0.1, Math.min(5.0, Number(nextVal.toFixed(2))));
    setSubscribers((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, lotMultiplier: clamped } : s))
    );
  };

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientAccount.trim()) {
      showNotice('Client name and broker account number are required.', 'rose');
      return;
    }
    const newSub: MobileSubscriber = {
      id: `sub-${Date.now()}`,
      clientName: clientName.trim(),
      broker: clientBroker,
      accountNumber: clientAccount.trim(),
      device: clientDevice,
      eaAssigned: selectedEA.name,
      lotMultiplier: clientMultiplier,
      maxRiskPct: clientMaxRisk,
      equityUsd: 10000,
      todayPnlUsd: 0,
      syncMs: 14,
      status: 'MIRRORING',
    };
    setSubscribers((prev) => [newSub, ...prev]);
    issueMobileActivation(
      newSub.clientName,
      `${newSub.clientName.toLowerCase().replace(/\s+/g, '.')}@client.io`,
      newSub.broker,
      newSub.accountNumber,
      newSub.eaAssigned,
      clientDevice === 'iOS App' ? 'iOS iPhone' : 'Android Mobile'
    );
    setClientName('');
    setClientAccount('');
    setIsAddClientOpen(false);
    showNotice(`Onboarded ${newSub.clientName} (#${newSub.accountNumber}) to ${selectedEA.name}.`, 'emerald');
  };

  const handleClientMobileJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileAccountLogin.trim() || !mobileAccountPass.trim()) {
      showNotice('Enter your broker login ID and trading password to link your mobile account.', 'rose');
      return;
    }
    setIsLinkingClient(true);
    try {
      const res = await connectMT5Broker(
        mobileBrokerName,
        mobileBrokerServer,
        mobileAccountLogin.trim(),
        mobileAccountPass,
        'LIVE'
      );
      if (res.success) {
        const matchedEA =
          hostedEAs.find((ea) => ea.inviteCode.toUpperCase() === inviteJoinCode.trim().toUpperCase()) ||
          selectedEA;
        const joinedSub: MobileSubscriber = {
          id: `sub-${Date.now()}`,
          clientName: `Mobile Trader #${mobileAccountLogin.trim().slice(-4)}`,
          broker: mobileBrokerName,
          accountNumber: mobileAccountLogin.trim(),
          device: 'iOS App',
          eaAssigned: matchedEA.name,
          lotMultiplier: 1.0,
          maxRiskPct: 2.0,
          equityUsd: res.credential?.equity ?? 10000,
          todayPnlUsd: 0,
          syncMs: Math.round(res.credential?.pingMs ?? 12),
          status: 'MIRRORING',
        };
        setSubscribers((prev) => [joinedSub, ...prev]);
        setMobileAccountPass('');
        showNotice(
          `Mobile App linked to ${matchedEA.name} (${matchedEA.inviteCode}). Mirroring active with zero VPS required.`,
          'emerald'
        );
      } else {
        showNotice(res.message, 'rose');
      }
    } finally {
      setIsLinkingClient(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Banner */}
      <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Share2 className="w-4 h-4 shrink-0" />
              <span>
                {brand.brandName} · EA Central Bridge (ea-central.com) · {brand.ownerEntity}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              Desktop EA to Mobile Copy-Trading &amp; Distribution Bridge
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Keep your compiled .ex4 or .ex5 Expert Advisors running on one master desktop or VPS while subscribers mirror every execution straight to their mobile phones with zero client VPS setup.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-mono text-slate-400 tabular-nums">
              <span>{hostedEAs.length} Master EAs Distributed</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">{activeMirroringCount} Mobile Clients Mirroring</span>
              <span aria-hidden="true">·</span>
              <span>Channel Latency {bridgeLatencyMs.toFixed(1)}ms</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(
              [
                { id: 'DISTRIBUTOR', label: 'Master EA Bridge', icon: Upload },
                { id: 'SUBSCRIBERS', label: 'Client Risk Grid', icon: Users },
                { id: 'MOBILE_APP', label: 'Client Mobile App', icon: Smartphone },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-[#161D2B] text-slate-300 hover:text-white border-white/[0.08]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inline Status Notice */}
      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            notice.tone === 'emerald'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : notice.tone === 'rose'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: MASTER EA DISTRIBUTOR & REAL-TIME MIRROR DISPATCH */}
      {activeTab === 'DISTRIBUTOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Hosted .ex4/.ex5 Registry & Upload */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Hosted Master Expert Advisors (.ex4 / .ex5)</span>
                </h2>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {hostedEAs.filter((e) => e.status === 'BROADCASTING').length} Broadcasting
                </span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {hostedEAs.map((ea) => {
                  const isSelected = ea.id === selectedEA.id;
                  return (
                    <div
                      key={ea.id}
                      onClick={() => setSelectedEAId(ea.id)}
                      className={`py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white truncate">{ea.name}</span>
                          <span className="text-xs font-mono text-cyan-400">{ea.format}</span>
                          <span
                            className={`text-xs font-mono font-semibold ${
                              ea.status === 'BROADCASTING' ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            {ea.status}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 tabular-nums">
                          {ea.hostTerminal} · Invite {ea.inviteCode} · {ea.subscribersCount} mobile clients · Last signal {ea.lastTradeAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyInvite(ea);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-cyan-300 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {copiedId === ea.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Invite Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEA(ea.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1 whitespace-nowrap"
                        >
                          {ea.status === 'BROADCASTING' ? (
                            <>
                              <Pause className="w-3.5 h-3.5 text-amber-300" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Resume</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Register / Upload New .ex4 or .ex5 */}
            <form
              onSubmit={handleRegisterEA}
              className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload &amp; Publish Compiled EA (.ex4 / .ex5)</span>
                </h3>
                <label className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 cursor-pointer">
                  <input
                    type="file"
                    accept=".ex4,.ex5,.mq4,.mq5"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span>Browse Local File</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold block">EA Filename</label>
                  <input
                    type="text"
                    value={newEAName}
                    onChange={(e) => setNewEAName(e.target.value)}
                    placeholder="e.g. Sovereign_Gold_HFT.ex5"
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Terminal Format</label>
                  <select
                    value={newEAFormat}
                    onChange={(e) => setNewEAFormat(e.target.value as '.ex4' | '.ex5')}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  >
                    <option value=".ex5">MetaTrader 5 (.ex5)</option>
                    <option value=".ex4">MetaTrader 4 (.ex4)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs">
                <div className="flex-1 space-y-1">
                  <label className="text-slate-300 font-semibold block">Master Desktop / VPS Host</label>
                  <input
                    type="text"
                    value={hostTerminalLabel}
                    onChange={(e) => setHostTerminalLabel(e.target.value)}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Invite Link</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 5 Cols: Real-Time Mirror Dispatcher & Emergency Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Live Execution Mirror Test</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400 tabular-nums">
                  {activeMirroringCount} Subscribers Ready
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <div>
                  Active Feed: <span className="text-white font-semibold">{selectedEA.name}</span>
                </div>
                <div className="font-mono text-cyan-400">
                  Invite Token: {selectedEA.inviteCode} · Host: {selectedEA.hostTerminal}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Symbol</label>
                  <select
                    value={mirrorSymbol}
                    onChange={(e) => setMirrorSymbol(e.target.value)}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  >
                    {['XAUUSD', 'EURUSD', 'US30', 'GBPJPY', 'NAS100', 'BTCUSD'].map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Master Lot Size</label>
                  <input
                    type="number"
                    min={0.01}
                    max={10}
                    step={0.01}
                    value={mirrorLots}
                    onChange={(e) => setMirrorLots(Math.max(0.01, Number(e.target.value) || 0.01))}
                    className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['BUY', 'SELL'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setMirrorSide(side)}
                    className={`py-2 rounded-xl font-bold border transition ${
                      mirrorSide === side
                        ? side === 'BUY'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-rose-500 text-white border-rose-400'
                        : 'bg-[#161D2B] text-slate-400 border-white/[0.08]'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={isMirroring}
                onClick={handleMirrorMasterTrade}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {isMirroring
                    ? 'Broadcasting to Mobile Apps...'
                    : `Mirror ${mirrorSide} Signal to ${activeMirroringCount} Mobile Apps`}
                </span>
              </button>

              {/* Two-Step Global Halt Confirmation */}
              <div className="pt-3 border-t border-white/[0.08]">
                {!confirmHaltAll ? (
                  <button
                    type="button"
                    onClick={() => setConfirmHaltAll(true)}
                    className="w-full py-2.5 rounded-xl bg-[#161D2B] hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Emergency Close Mirrored Trades ({positions.length})</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        executeKillSwitch();
                        setConfirmHaltAll(false);
                        showNotice('Closed all mirrored positions across master and subscriber nodes.', 'rose');
                      }}
                      className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                    >
                      Confirm Close All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmHaltAll(false)}
                      className="py-2 rounded-xl bg-[#161D2B] text-slate-300 text-xs border border-white/[0.08]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Tier Summary */}
            <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Why Mentors Use EA Central Distribution</span>
              </div>
              <div className="divide-y divide-white/[0.06] text-xs">
                <div className="py-2 flex justify-between gap-3">
                  <span className="text-slate-400">Compiled IP Protection</span>
                  <span className="text-white font-semibold">Zero .ex4/.ex5 File Sharing</span>
                </div>
                <div className="py-2 flex justify-between gap-3">
                  <span className="text-slate-400">Subscriber Requirement</span>
                  <span className="text-emerald-400 font-semibold">Mobile App Only (No VPS)</span>
                </div>
                <div className="py-2 flex justify-between gap-3">
                  <span className="text-slate-400">Per-Client Safeguards</span>
                  <span className="text-cyan-300 font-semibold">Custom Lots &amp; Max Risk %</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIBER RISK OVERSIGHT GRID */}
      {activeTab === 'SUBSCRIBERS' && (
        <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Subscriber Mobile Mirroring &amp; Risk Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust per-subscriber lot scaling, enforce drawdown risk caps, or pause individual client feeds in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddClientOpen((prev) => !prev)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Mobile Client</span>
            </button>
          </div>

          {isAddClientOpen && (
            <form
              onSubmit={handleAddSubscriber}
              className="p-4 rounded-xl bg-[#161D2B] border border-cyan-500/30 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs items-end"
            >
              <div>
                <label className="text-slate-300 block mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-[#090C12] border border-white/[0.08] rounded-lg px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Broker</label>
                <select
                  value={clientBroker}
                  onChange={(e) => setClientBroker(e.target.value)}
                  className="w-full bg-[#090C12] border border-white/[0.08] rounded-lg px-2.5 py-2 text-white"
                >
                  <option>IC Markets Global</option>
                  <option>Exness MT5 Real</option>
                  <option>Pepperstone UK</option>
                  <option>FTMO Prop MT5</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Account #</label>
                <input
                  type="text"
                  required
                  value={clientAccount}
                  onChange={(e) => setClientAccount(e.target.value)}
                  placeholder="8841200"
                  className="w-full bg-[#090C12] border border-white/[0.08] rounded-lg px-2.5 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Mobile App</label>
                <select
                  value={clientDevice}
                  onChange={(e) => setClientDevice(e.target.value as 'iOS App' | 'Android App')}
                  className="w-full bg-[#090C12] border border-white/[0.08] rounded-lg px-2.5 py-2 text-white"
                >
                  <option value="iOS App">iOS App</option>
                  <option value="Android App">Android App</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Lot Scale / Risk %</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={clientMultiplier}
                    onChange={(e) => setClientMultiplier(Number(e.target.value) || 1)}
                    className="w-1/2 bg-[#090C12] border border-white/[0.08] rounded-lg px-2 py-2 text-cyan-300 font-mono"
                  />
                  <input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={clientMaxRisk}
                    onChange={(e) => setClientMaxRisk(Number(e.target.value) || 2)}
                    className="w-1/2 bg-[#090C12] border border-white/[0.08] rounded-lg px-2 py-2 text-amber-300 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold whitespace-nowrap"
              >
                Activate Mirror
              </button>
            </form>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscriber, broker, account #, or EA..."
                className="w-full pl-9 pr-3 py-2 bg-[#161D2B] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#161D2B] border border-white/[0.08] rounded-xl">
              {(['ALL', 'MIRRORING', 'PAUSED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition ${
                    statusFilter === status
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* High-Density Subscriber Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase">
                  <th className="py-3 pr-3">Subscriber</th>
                  <th className="py-3 px-3">Broker &amp; Account</th>
                  <th className="py-3 px-3">Assigned EA</th>
                  <th className="py-3 px-3">Lot Scale</th>
                  <th className="py-3 px-3 text-right">Equity</th>
                  <th className="py-3 px-3 text-right">Today PnL</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center space-y-3">
                      <div className="text-slate-400 font-sans">
                        No mobile subscribers match your search or status filter.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161D2B] border border-white/[0.08] text-cyan-300 font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#161D2B]/40 transition">
                      <td className="py-3 pr-3 font-sans">
                        <div className="font-semibold text-white">{sub.clientName}</div>
                        <div className="text-[11px] text-slate-400">
                          {sub.device} · {sub.syncMs}ms sync
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-sans">{sub.broker}</div>
                        <div className="text-[11px] text-slate-400">#{sub.accountNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-cyan-300">{sub.eaAssigned}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateSubscriberMultiplier(sub.id, sub.lotMultiplier - 0.25)}
                            className="px-1.5 py-0.5 rounded bg-[#161D2B] border border-white/[0.08] text-slate-300 hover:text-white"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-bold text-white">
                            {sub.lotMultiplier.toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSubscriberMultiplier(sub.id, sub.lotMultiplier + 0.25)}
                            className="px-1.5 py-0.5 rounded bg-[#161D2B] border border-white/[0.08] text-slate-300 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-white font-semibold">
                        ${sub.equityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-semibold ${
                          sub.todayPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {sub.todayPnlUsd >= 0 ? '+' : '-'}${Math.abs(sub.todayPnlUsd).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            sub.status === 'MIRRORING' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'
                          }
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleSubscriber(sub.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-white font-sans font-semibold"
                        >
                          {sub.status === 'MIRRORING' ? 'Pause' : 'Resume'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIBER MOBILE APP ONBOARDING & ZERO-VPS LINKER */}
      {activeTab === 'MOBILE_APP' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleClientMobileJoin}
            className="lg:col-span-7 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Subscriber Mobile Onboarding (Zero VPS Required)</span>
              </h2>
              <span className="text-xs font-mono text-emerald-400">iOS &amp; Android Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Mentor Invite Code</label>
                <input
                  type="text"
                  value={inviteJoinCode}
                  onChange={(e) => setInviteJoinCode(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-cyan-300 font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Broker Institution</label>
                <select
                  value={mobileBrokerName}
                  onChange={(e) => setMobileBrokerName(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white"
                >
                  <option>Exness MT5 Real</option>
                  <option>IC Markets Global</option>
                  <option>Pepperstone UK</option>
                  <option>Deriv Markets</option>
                  <option>FTMO Funded</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Trade Server</label>
                <input
                  type="text"
                  value={mobileBrokerServer}
                  onChange={(e) => setMobileBrokerServer(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">MT4 / MT5 Login ID</label>
                <input
                  type="text"
                  value={mobileAccountLogin}
                  onChange={(e) => setMobileAccountLogin(e.target.value)}
                  placeholder="e.g. 5518290"
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Account Trading Password</label>
              <input
                type="password"
                value={mobileAccountPass}
                onChange={(e) => setMobileAccountPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLinkingClient}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLinkingClient ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              <span>
                {isLinkingClient ? 'Connecting Broker to Mobile Bridge...' : 'Connect Broker & Mirror From Phone'}
              </span>
            </button>
          </form>

          <div className="lg:col-span-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-4">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>How Mobile Mirroring Works</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">3 Steps</span>
            </div>

            <div className="divide-y divide-white/[0.06] text-xs">
              <div className="py-3 space-y-1">
                <div className="font-semibold text-white">01. Mentor Hosts EA Once</div>
                <p className="text-slate-400 leading-relaxed">
                  The strategy developer keeps their .ex4 or .ex5 Expert Advisor active on one master MT4/MT5 terminal.
                </p>
              </div>
              <div className="py-3 space-y-1">
                <div className="font-semibold text-white">02. Share Invite Code to Mobile</div>
                <p className="text-slate-400 leading-relaxed">
                  Subscribers enter the invite code inside the mobile companion and authenticate their broker credentials.
                </p>
              </div>
              <div className="py-3 space-y-1">
                <div className="font-semibold text-white">03. Sub-Second Trade Mirroring</div>
                <p className="text-slate-400 leading-relaxed">
                  Entries, SL/TP modifications, and closes mirror straight to client accounts without renting any VPS.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
