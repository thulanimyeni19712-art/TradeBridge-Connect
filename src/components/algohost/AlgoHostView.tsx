import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Server,
  Smartphone,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Activity,
  Sliders,
  Zap,
  Globe,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';

interface CloudSlotPort {
  id: string;
  label: string;
  platform: 'MT4' | 'MT5';
  broker: string;
  server: string;
  accountLogin: string;
  eaFile: string;
  region: string;
  pingMs: number;
  status: string;
  planTerm: string;
  expiresOn: string;
  mobileSyncCode: string;
  balance: number;
  equity: number;
}

const PLUG_AND_PLAY_EAS = [
  {
    file: 'Algohost_Gold_Trend_v4.8.ex5',
    label: 'Algohost Gold Trend v4.8',
    pair: 'XAUUSD',
    profile: 'Low Drawdown · M15',
    targetDd: '4.0%',
  },
  {
    file: 'US30_NY_Open_Harvester.ex5',
    label: 'US30 NY Open Harvester',
    pair: 'US30',
    profile: 'Session Breakout · M5',
    targetDd: '5.5%',
  },
  {
    file: 'Nexus_Basket_Guard_Pro.ex4',
    label: 'Nexus Basket Guard Pro',
    pair: 'EURUSD / GBPUSD',
    profile: 'Mean Reversion · H1',
    targetDd: '3.2%',
  },
  {
    file: 'ZeroGrid_FX_Scalper.ex5',
    label: 'ZeroGrid FX Scalper',
    pair: 'USDJPY',
    profile: 'Single-Shot SL · M15',
    targetDd: '2.8%',
  },
];

export const AlgoHostView: React.FC = () => {
  const { brand } = useBrand();
  const { automatedSettings, updateAutomatedSettings, executeKillSwitch, bridgeLatencyMs } =
    useTrading();

  const [slots, setSlots] = useState<CloudSlotPort[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [measuredPingMs, setMeasuredPingMs] = useState<number>(bridgeLatencyMs || 1.4);

  // Deploy slot form state
  const [slotLabel, setSlotLabel] = useState<string>('Algohost Mobile Slot #1');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5');
  const [region, setRegion] = useState<string>('Equinix LD4 London');
  const [broker, setBroker] = useState<string>('IC Markets Global');
  const [accountLogin, setAccountLogin] = useState<string>('8841209');
  const [selectedEa, setSelectedEa] = useState<string>(PLUG_AND_PLAY_EAS[0].file);
  const [planTerm, setPlanTerm] = useState<string>('1-Month Fixed');

  const [confirmKill, setConfirmKill] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedSyncId, setCopiedSyncId] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const showNotice = (msg: string) => {
    setErrorNotice(null);
    setNotice(msg);
    const id = window.setTimeout(() => setNotice(null), 4000);
    timersRef.current.push(id);
  };

  const showError = (msg: string) => {
    setNotice(null);
    setErrorNotice(msg);
    const id = window.setTimeout(() => setErrorNotice(null), 5000);
    timersRef.current.push(id);
  };

  const handleCopySyncCode = (code: string, slotId: string) => {
    void navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopiedSyncId(slotId);
    const id = window.setTimeout(() => setCopiedSyncId(null), 2000);
    timersRef.current.push(id);
  };

  const fetchCloudSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const start = performance.now();
      const [portsRes, healthRes] = await Promise.all([
        fetch('/api/tradeport/ports'),
        fetch('/api/health'),
      ]);
      const rtt = Number((performance.now() - start).toFixed(1));
      if (healthRes.ok) {
        setMeasuredPingMs(rtt);
      }
      if (portsRes.ok) {
        const data = (await portsRes.json()) as { success?: boolean; ports?: CloudSlotPort[] };
        if (Array.isArray(data.ports)) {
          setSlots(data.ports);
        }
      } else {
        showError(`Cloud registry returned HTTP ${portsRes.status}.`);
      }
    } catch {
      showError('Unable to reach cloud host registry right now.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    void fetchCloudSlots();
  }, []);

  const deployNewSlot = async () => {
    setIsDeploying(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/tradeport/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: slotLabel.trim() || 'Algohost Mobile Container',
          platform,
          broker,
          server: `${broker.replace(/\s+/g, '')}-Live01`,
          accountLogin: accountLogin.trim() || '8841209',
          eaFile: selectedEa,
          region,
          planTerm,
          initialBalance: 25000,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        port?: CloudSlotPort;
        error?: string;
      };
      if (!res.ok || !data.port) {
        showError(data.error || `Provisioning failed (HTTP ${res.status}).`);
        return;
      }
      setSlots((prev) => [data.port as CloudSlotPort, ...prev]);
      showNotice(
        `Provisioned ${data.port.platform} container ${data.port.id} with ${data.port.eaFile} in ${data.port.region}.`
      );
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Network failure provisioning cloud container.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeploySlot = async (e: React.FormEvent) => {
    e.preventDefault();
    await deployNewSlot();
  };

  const handleAttachStrategyToSlot = async (slotId: string, eaFile: string) => {
    const previous = slots.find((s) => s.id === slotId)?.eaFile;
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, eaFile } : s)));
    try {
      const res = await fetch(`/api/tradeport/ports/${encodeURIComponent(slotId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eaFile }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showNotice(`Hot-swapped container ${slotId} strategy to ${eaFile}.`);
    } catch {
      if (previous) {
        setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, eaFile: previous } : s)));
      }
      showError(`Failed to persist strategy swap for ${slotId}.`);
    }
  };

  const toggleSlotStatus = async (slotId: string) => {
    const target = slots.find((s) => s.id === slotId);
    if (!target) return;
    const prevStatus = target.status;
    const nextStatus = prevStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: nextStatus } : s)));
    try {
      const res = await fetch(`/api/tradeport/ports/${encodeURIComponent(slotId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showNotice(
        nextStatus === 'PAUSED'
          ? `Cloud container ${slotId} paused. Open trades remain protected by server SL.`
          : `Cloud container ${slotId} resumed 24/7 execution.`
      );
    } catch {
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: prevStatus } : s)));
      showError(`Failed to update container ${slotId} status.`);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/tradeport/ports/${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      showNotice(`Decommissioned cloud container ${slotId}.`);
    } catch {
      showError(`Unable to remove container ${slotId}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Cloud className="w-4 h-4 shrink-0" />
              <span>
                {brand.brandName} · AlgoHost Pro Cloud (algohostpro.com) · {brand.ownerEntity}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              AlgoHost Pro Cloud VPS &amp; Headless EA Containers
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Launch pre-configured MT4 and MT5 Expert Advisor containers directly from mobile or desktop without touching Windows RDP servers, terminal installation files, or manual port setup.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-mono text-slate-400">
              <span className="text-emerald-400 tabular-nums">
                Cloud RTT {measuredPingMs}ms
              </span>
              <span>·</span>
              <span className="tabular-nums">{slots.length} Active Cloud Slots</span>
              <span>·</span>
              <span>99.98% Container SLA</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void fetchCloudSlots()}
              className="px-3.5 py-2 rounded-xl bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots ? 'animate-spin' : ''}`} />
              <span>Probe Fleet RTT</span>
            </button>
            {!confirmKill ? (
              <button
                onClick={() => setConfirmKill(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Flatten All</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    executeKillSwitch();
                    setConfirmKill(false);
                    showNotice('All active cloud positions flattened.');
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold whitespace-nowrap"
                >
                  Confirm Flatten
                </button>
                <button
                  onClick={() => setConfirmKill(false)}
                  className="px-2.5 py-2 rounded-xl bg-[#161D2B] text-slate-300 text-xs border border-white/[0.08]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="px-4 py-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main 12-Col Grid: Launcher + Live Cloud Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1-Click Mobile Cloud Slot Launcher (5 cols) */}
        <form
          onSubmit={handleDeploySlot}
          className="lg:col-span-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1-Click Cloud Container Launcher
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">NO RDP REQUIRED</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Container Label</label>
              <input
                type="text"
                value={slotLabel}
                onChange={(e) => setSlotLabel(e.target.value)}
                className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Platform</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['MT5', 'MT4'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`py-2 rounded-lg font-mono font-bold border transition ${
                        platform === p
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-[#161D2B] text-slate-400 border-white/[0.08]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Broker Login ID</label>
                <input
                  type="text"
                  value={accountLogin}
                  onChange={(e) => setAccountLogin(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Equinix Data Center</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                >
                  <option>Equinix LD4 London</option>
                  <option>Equinix NY4 New York</option>
                  <option>Equinix FR2 Frankfurt</option>
                  <option>Teraco JHB Johannesburg</option>
                  <option>Equinix TY3 Tokyo</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Broker</label>
                <select
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
                >
                  <option>IC Markets Global</option>
                  <option>Exness MT5 Real</option>
                  <option>Pepperstone UK</option>
                  <option>FTMO Funded</option>
                  <option>ThinkMarkets</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Plug-and-Play Strategy Package</label>
              <select
                value={selectedEa}
                onChange={(e) => setSelectedEa(e.target.value)}
                className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
              >
                {PLUG_AND_PLAY_EAS.map((ea) => (
                  <option key={ea.file} value={ea.file}>
                    {ea.label} ({ea.pair})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Slot Plan Term</label>
              <select
                value={planTerm}
                onChange={(e) => setPlanTerm(e.target.value)}
                className="w-full bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
              >
                <option>1-Month Fixed ($29/mo)</option>
                <option>3-Month Pro ($54/mo)</option>
                <option>12-Month Matrix ($99/mo)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isDeploying}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{isDeploying ? 'Provisioning Cloud Slot...' : 'Deploy Cloud EA Container'}</span>
          </button>
        </form>

        {/* Active Cloud Slots List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Hosted Cloud Container Fleet
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {slots.length} Deployed
              </span>
            </div>

            {isLoadingSlots && slots.length === 0 ? (
              <div className="py-10 text-center text-xs font-mono text-slate-400">
                Loading Algohost containers...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-3 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                <div className="text-sm font-semibold text-white">
                  No cloud EA containers deployed yet
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Launch a mobile-ready MT4 or MT5 container slot on the left—or click below to provision your first default container immediately.
                </p>
                <button
                  type="button"
                  disabled={isDeploying}
                  onClick={() => void deployNewSlot()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isDeploying ? 'Provisioning...' : 'Deploy First Cloud Container'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => {
                  const isPaused = slot.status === 'PAUSED';
                  return (
                    <div
                      key={slot.id}
                      className="p-4 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                            <span>{slot.id}</span>
                            <span>·</span>
                            <span>{slot.platform}</span>
                            <span>·</span>
                            <span>{slot.region}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-0.5">{slot.label}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                            <span>
                              {slot.broker} #{slot.accountLogin} · Sync {slot.mobileSyncCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySyncCode(slot.mobileSyncCode, slot.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white transition"
                              title="Copy Mobile Sync Key"
                            >
                              {copiedSyncId === slot.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedSyncId === slot.id ? 'Copied' : 'Copy Key'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-mono font-semibold ${
                              isPaused ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {isPaused ? 'PAUSED' : 'ONLINE'}
                          </span>
                          <button
                            type="button"
                            onClick={() => void toggleSlotStatus(slot.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#090C12] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1"
                          >
                            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteSlot(slot.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition"
                            title="Decommission container"
                            aria-label={`Delete container ${slot.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono tabular-nums pt-2 border-t border-white/[0.06]">
                        <div>
                          <span className="text-slate-500 text-[10px] block">ATTACHED EA</span>
                          <select
                            value={slot.eaFile}
                            onChange={(e) => void handleAttachStrategyToSlot(slot.id, e.target.value)}
                            className="mt-0.5 w-full bg-[#090C12] border border-white/[0.08] rounded-md px-2 py-1 text-[11px] text-cyan-300"
                          >
                            {PLUG_AND_PLAY_EAS.map((ea) => (
                              <option key={ea.file} value={ea.file}>
                                {ea.file}
                              </option>
                            ))}
                            {!PLUG_AND_PLAY_EAS.some((e) => e.file === slot.eaFile) && (
                              <option value={slot.eaFile}>{slot.eaFile}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">CONTAINER PING / CPU</span>
                          <span className="text-white font-semibold">
                            {slot.pingMs}ms · 14% CPU
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">EQUITY / EXPIRY</span>
                          <span className="text-emerald-400 font-semibold">
                            ${slot.equity.toLocaleString()} · {slot.expiresOn}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Transparency & Windows VPS Cost Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Drawdown &amp; Slippage Guardrails
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every Algohost container enforces hard broker-level risk limits synced to your master risk matrix. Drawdown breaches automatically halt new entries across all hosted terminals.
          </p>

          <div className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Max Daily Equity Drawdown Cap
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {automatedSettings.maxDailyLossCutoffPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={0.5}
                value={automatedSettings.maxDailyLossCutoffPct}
                onChange={(e) =>
                  updateAutomatedSettings({ maxDailyLossCutoffPct: Number(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Max Execution Spread / Slippage Guard
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {automatedSettings.spreadFilterMaxPips.toFixed(1)} pips
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={automatedSettings.spreadFilterMaxPips}
                onChange={(e) =>
                  updateAutomatedSettings({ spreadFilterMaxPips: Number(e.target.value) })
                }
                className="w-full accent-emerald-400"
              />
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#161D2B] border border-white/[0.06] cursor-pointer">
              <span className="text-slate-200 font-sans font-semibold">
                Auto-Pause Containers 15m Before Red-Folder News
              </span>
              <input
                type="checkbox"
                checked={automatedSettings.newsFilterActive}
                onChange={(e) =>
                  updateAutomatedSettings({ newsFilterActive: e.target.checked })
                }
                className="accent-cyan-400 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Comparison Table: Algohost Cloud vs Legacy Windows RDP */}
        <div className="lg:col-span-6 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Algohost Cloud Containers vs Legacy Windows VPS
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase">
                  <th className="py-2.5 pr-3">Capability</th>
                  <th className="py-2.5 px-3 text-cyan-300">Algohost Cloud</th>
                  <th className="py-2.5 pl-3 text-slate-500">Legacy Windows RDP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <tr>
                  <td className="py-2.5 pr-3 text-slate-200 font-sans">Setup Time</td>
                  <td className="py-2.5 px-3 text-emerald-400">Under 30s (Mobile)</td>
                  <td className="py-2.5 pl-3 text-slate-400">35–90 min manual install</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-slate-200 font-sans">Desktop / PC Needed</td>
                  <td className="py-2.5 px-3 text-emerald-400">Zero PC (Phone Ready)</td>
                  <td className="py-2.5 pl-3 text-slate-400">Remote Desktop Client</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-slate-200 font-sans">Equinix Tick Latency</td>
                  <td className="py-2.5 px-3 text-cyan-300 tabular-nums">&lt; 1.8ms Colocated</td>
                  <td className="py-2.5 pl-3 text-slate-400 tabular-nums">12–45ms Shared VM</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-slate-200 font-sans">Drawdown Circuit Breaker</td>
                  <td className="py-2.5 px-3 text-emerald-400">Built-In Server Guard</td>
                  <td className="py-2.5 pl-3 text-slate-400">Manual EA Config Only</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 text-slate-200 font-sans">Monthly Entry Cost</td>
                  <td className="py-2.5 px-3 text-white font-bold tabular-nums">$29 / slot</td>
                  <td className="py-2.5 pl-3 text-slate-400 tabular-nums">$45–$85 + Licenses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
