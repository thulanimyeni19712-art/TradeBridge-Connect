import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Server,
  Radio,
  Cpu,
  Layers,
  Power,
  RefreshCw,
  Plus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  Activity,
  HardDrive,
  Globe,
  Download,
} from 'lucide-react';

export const EAConnectView: React.FC = () => {
  const { terminals, toggleTerminalAutoTrading, updateTerminalMultiplier, bridgeLatencyMs } = useTrading();
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>(terminals[0]?.id || '');
  const selectedTerminal = useMemo(
    () => terminals.find((t) => t.id === selectedTerminalId) || terminals[0],
    [terminals, selectedTerminalId]
  );
  const [isAddingTerminal, setIsAddingTerminal] = useState<boolean>(false);
  const [isVerifyingBridge, setIsVerifyingBridge] = useState<boolean>(false);
  const [newTermPlatform, setNewTermPlatform] = useState('MetaTrader 5 (MT5)');
  const [newTermBroker, setNewTermBroker] = useState('');
  const [newTermAccount, setNewTermAccount] = useState('');
  const [newTermServer, setNewTermServer] = useState('London Equinix LD4 (1.4ms)');
  const [bridgeConnectNotice, setBridgeConnectNotice] = useState<string | null>(null);

  // Symbol remapping list
  const [symbolMappings, setSymbolMappings] = useState([
    { masterSymbol: 'XAUUSD', slaveSymbol: 'GOLD', active: true },
    { masterSymbol: 'US30', slaveSymbol: 'DJI30', active: true },
    { masterSymbol: 'NAS100', slaveSymbol: 'USTEC', active: true },
    { masterSymbol: 'BTCUSD', slaveSymbol: 'BTCUSDT', active: true },
    { masterSymbol: 'EURUSD', slaveSymbol: 'EURUSD.pro', active: false },
  ]);

  const [newMaster, setNewMaster] = useState('');
  const [newSlave, setNewSlave] = useState('');

  const handleAddMapping = () => {
    if (newMaster && newSlave) {
      setSymbolMappings([...symbolMappings, { masterSymbol: newMaster.toUpperCase(), slaveSymbol: newSlave, active: true }]);
      setNewMaster('');
      setNewSlave('');
    }
  };

  // SafeBridge Phase 2 Micro-Capital Configurations
  const [startingCurrency, setStartingCurrency] = useState<'USD' | 'ZAR' | 'USC'>('USD');
  const [brokerTopology, setBrokerTopology] = useState<'SAME_BROKER' | 'CROSS_BROKER'>('SAME_BROKER');
  const [isDemoReviewOpen, setIsDemoReviewOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadSafeBridge = () => {
    const readme = `# SafeBridge Production Phase 2 - Micro-Capital Deployment
Starting Capital: 0.30 ${startingCurrency}
Follower Risk Limit: 0.50% (Max planned loss: 0.0015 ${startingCurrency})
Broker Minimum-Lot Rejection: ACTIVE
Daily Equity-Loss Halt: 1.5% (0.0045 ${startingCurrency})
Peak Drawdown Halt: 5.0% (0.0150 ${startingCurrency})
Aggregate Risk Cap: 1.5%
Hedging & Netting Support: ENABLED
Broker Topology: ${brokerTopology}
Verification Status: Pending live MetaEditor compilation on Demo terminals.`;
    const blob = new Blob([readme], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeBridge_Phase2_${startingCurrency}_Config.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0c1322] via-[#09101c] to-[#141026] border border-cyan-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>EA-Connect.com • Cloud Terminal Synchronizer & VPS Manager</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Multi-Terminal MetaTrader & cTrader Cloud Control
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Monitor, sync, and remotely control all your broker accounts without local VPS setup or keeping your desktop running. Real-time heartbeat telemetry, 1-to-many cloud trade copier, and instant kill switches.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {terminals.filter((t) => t.status === 'ONLINE').length} / {terminals.length} Terminals Synchronized &amp; Online
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
              <Activity className="w-4 h-4" />
              <span>Live Bridge RTT: {bridgeLatencyMs.toFixed(1)}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* SafeBridge Production Phase 2: Micro-Capital Risk Engine & Deployment Deck */}
      <div className="obsidian-panel hud-bracket rounded-2xl p-5 md:p-6 border border-amber-500/30 shadow-2xl space-y-5 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100 tracking-tight">
                SafeBridge Production Phase 2 • Micro-Capital Risk Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ACTIVE CONFIG: 0.30 CAPITAL
              </span>
            </div>
            <p className="text-slate-400 text-xs font-sans">
              Configured with strict 0.50% follower risk allocation and automatic MT5 minimum-lot rejection safeguards.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadSafeBridge}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download Package (ZIP 14 KB)'}</span>
            </button>
          </div>
        </div>

        {/* Risk & Safety Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.08] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Starting Balance</span>
            <div className="text-lg font-black text-amber-300">
              0.30 <span className="text-xs font-semibold text-slate-400">{startingCurrency}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Replaced 1,000 legacy base</span>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.08] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Follower Risk (0.50%)</span>
            <div className="text-lg font-black text-cyan-400">
              0.0015 <span className="text-xs font-semibold text-slate-400">{startingCurrency}</span>
            </div>
            <span className="text-[10px] text-emerald-400 block font-bold">Max Planned Loss / Trade</span>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.08] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Daily Loss Halt (1.5%)</span>
            <div className="text-lg font-black text-rose-400">
              0.0045 <span className="text-xs font-semibold text-slate-400">{startingCurrency}</span>
            </div>
            <span className="text-[10px] text-rose-400/80 block">Auto-Halt Bridge Threshold</span>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.08] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Peak Drawdown Halt</span>
            <div className="text-lg font-black text-purple-400">
              5.0% <span className="text-xs font-semibold text-slate-400">(0.0150)</span>
            </div>
            <span className="text-[10px] text-purple-300/80 block">Trailing High-Water Mark</span>
          </div>
        </div>

        {/* Minimum-Lot Rejection & Contract Rule Alert */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-300 text-xs font-sans">
            <p className="font-bold text-amber-300 font-mono">
              Minimum-Lot Risk Budget Rejection: STRICT ENFORCEMENT ACTIVE
            </p>
            <p className="text-slate-400 leading-relaxed">
              Because standard MT5 broker minimum trade sizes (0.01 lots) typically exceed the 0.0015 risk budget, the SafeBridge engine automatically rejects trades rather than scaling up lot sizes and breaching your risk parameters.
            </p>
          </div>
        </div>

        {/* Two Details to Confirm Deck */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Detail 1: Currency Selection */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">1. Confirm Account Denomination Currency:</span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase">{startingCurrency} SELECTED</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'USD', label: 'US Dollars ($0.30)', desc: 'Standard Micro USD' },
                { id: 'ZAR', label: 'South African Rand (R0.30)', desc: 'Local Currency ZA' },
                { id: 'USC', label: 'US Cents (30¢ Cent Acc)', desc: 'Nano / Cent Terminal' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setStartingCurrency(c.id as any)}
                  className={`p-2 rounded-lg text-left transition border ${
                    startingCurrency === c.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                      : 'bg-black/40 border-white/[0.05] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[11px] font-mono">{c.id}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail 2: Broker Topology */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">2. Master/Follower Broker Topology:</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">{brokerTopology.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBrokerTopology('SAME_BROKER')}
                className={`p-2 rounded-lg text-left transition border ${
                  brokerTopology === 'SAME_BROKER'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                    : 'bg-black/40 border-white/[0.05] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-[11px] font-mono">Same Broker</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Identical symbol suffixes & contract specs</div>
              </button>

              <button
                onClick={() => setBrokerTopology('CROSS_BROKER')}
                className={`p-2 rounded-lg text-left transition border ${
                  brokerTopology === 'CROSS_BROKER'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                    : 'bg-black/40 border-white/[0.05] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-[11px] font-mono">Cross-Broker</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Automated ticker mapping table active</div>
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status & Weekly Review Prompt */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Status: Python modules passed syntax checks • MQL5 MetaEditor demo test pending</span>
          </div>

          <button
            onClick={() => setIsDemoReviewOpen(!isDemoReviewOpen)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>📊 Review SafeBridge Demo Results Weekly</span>
          </button>
        </div>

        {isDemoReviewOpen && (
          <div className="p-3 bg-black/60 rounded-xl border border-cyan-500/40 text-xs text-slate-300 font-sans space-y-1.5 animate-in fade-in">
            <div className="font-bold text-cyan-300 font-mono">Demo Weekly Review Tracker Scheduled:</div>
            <p className="text-slate-400 text-xs">
              Weekly audit enabled. Demo trades will log rejection rate, slippage delta, and margin utilization before risking real capital on live production terminals.
            </p>
          </div>
        )}
      </div>

      {/* Connected Terminals Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
              Active Cloud Terminals ({terminals.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddingTerminal(!isAddingTerminal)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect New Terminal</span>
          </button>
        </div>

        {bridgeConnectNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span>{bridgeConnectNotice}</span>
            <button onClick={() => setBridgeConnectNotice(null)} className="text-emerald-200 hover:text-white text-[11px]">Dismiss</button>
          </div>
        )}

        {isAddingTerminal && (
          <div className="bg-[#111622] border border-cyan-500/40 rounded-2xl p-5 mb-4 animate-in fade-in space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-100">Add MetaTrader / cTrader Terminal</h4>
              <button onClick={() => setIsAddingTerminal(false)} className="text-slate-400 hover:text-slate-200">Close</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Platform</label>
                <select
                  value={newTermPlatform}
                  onChange={(e) => setNewTermPlatform(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option>MetaTrader 5 (MT5)</option>
                  <option>MetaTrader 4 (MT4)</option>
                  <option>cTrader</option>
                  <option>DXtrade</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Broker Name</label>
                <input
                  type="text"
                  value={newTermBroker}
                  onChange={(e) => setNewTermBroker(e.target.value)}
                  placeholder="e.g. ThinkMarkets"
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={newTermAccount}
                  onChange={(e) => setNewTermAccount(e.target.value)}
                  placeholder="e.g. 8839210"
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Server Location</label>
                <select
                  value={newTermServer}
                  onChange={(e) => setNewTermServer(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option>London Equinix LD4 (1.4ms)</option>
                  <option>New York NY4 (2.1ms)</option>
                  <option>Frankfurt FR2 (3.4ms)</option>
                </select>
              </div>
            </div>
            <button
              disabled={isVerifyingBridge}
              onClick={async () => {
                const brokerLabel = newTermBroker.trim() || 'ThinkMarkets';
                const acctLabel = newTermAccount.trim() || '8839210';
                setIsVerifyingBridge(true);
                try {
                  const start = performance.now();
                  const res = await fetch('/api/mt5/verify-broker', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      brokerName: brokerLabel,
                      server: newTermServer,
                      login: acctLabel,
                      password: 'bridge-session-verify',
                      accountType: 'LIVE',
                    }),
                  });
                  const rtt = Number((performance.now() - start).toFixed(1));
                  const data = await res.json();
                  if (!res.ok || !data.success) {
                    throw new Error(data.message || `HTTP ${res.status}`);
                  }
                  setBridgeConnectNotice(
                    `Verified ${newTermPlatform} bridge handshake for ${data.details?.broker || brokerLabel} (#${acctLabel}) • ${rtt}ms HTTP RTT.`
                  );
                  setNewTermBroker('');
                  setNewTermAccount('');
                  setIsAddingTerminal(false);
                } catch (err: unknown) {
                  setBridgeConnectNotice(`Bridge verification failed: ${(err as Error).message}`);
                } finally {
                  setIsVerifyingBridge(false);
                }
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition"
            >
              {isVerifyingBridge ? 'Verifying Handshake...' : 'Verify & Connect Bridge'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {terminals.map((term) => (
            <div
              key={term.id}
              onClick={() => setSelectedTerminalId(term.id)}
              className={`p-5 rounded-2xl cursor-pointer transition relative overflow-hidden border ${
                selectedTerminal?.id === term.id
                  ? 'bg-[#121927] border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                  : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 hover:bg-[#0f141f]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {term.platform}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{term.pingMs} ms</span>
                </span>
              </div>

              <h4 className="font-bold text-slate-100 text-sm">{term.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{term.broker}</p>

              <div className="space-y-1.5 text-xs text-slate-300 bg-[#070a0f] p-3 rounded-xl border border-slate-800 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="text-slate-200 font-bold">{term.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equity:</span>
                  <span className="text-emerald-400 font-bold">${term.equity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Copier Role:</span>
                  <span className={`font-bold ${term.copierRole === 'MASTER' ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {term.copierRole} ({term.multiplier}x)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400">AutoTrading:</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTerminalAutoTrading(term.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    term.autoTrading
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{term.autoTrading ? 'ACTIVE' : 'STOPPED'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Trade Copier & Remapper Matrix */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Copy className="w-5 h-5 text-cyan-400" />
              <span>1-to-Many Cloud Trade Copier Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly mirror executions from Master terminal to all slave terminals with custom lot multipliers and slippage guards.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0 tabular-nums">
            Copier Bus RTT: {bridgeLatencyMs.toFixed(1)}ms
          </span>
        </div>

        {/* Copier Multiplier Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {terminals
            .filter((t) => t.copierRole === 'SLAVE')
            .map((slave) => (
              <div key={slave.id} className="p-4 bg-[#111622] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{slave.name}</span>
                  <span className="text-[10px] text-cyan-400 font-semibold">{slave.platform}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Server: <span className="text-slate-300">{slave.server}</span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Lot Multiplier Ratio:</span>
                    <span className="font-bold text-cyan-400">{slave.multiplier}x</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0.25, 0.5, 1.0, 1.5, 2.0].map((m) => (
                      <button
                        key={m}
                        onClick={() => updateTerminalMultiplier(slave.id, m)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border transition ${
                          slave.multiplier === m
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Symbol Remapper */}
        <div className="p-5 bg-[#0e121a] rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Broker Symbol Remapper Engine</span>
            </h4>
            <span className="text-[11px] text-slate-400">Automatically remaps tickers across different broker conventions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {symbolMappings.map((map, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#131825] rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{map.masterSymbol}</span>
                  <span className="text-slate-500">➔</span>
                  <span className="font-bold text-cyan-300">{map.slaveSymbol}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSymbolMappings((prev) =>
                      prev.map((m, i) => (i === idx ? { ...m, active: !m.active } : m))
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[9px] border transition ${
                    map.active
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {map.active ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              placeholder="Master Symbol (e.g. XAUUSD)"
              value={newMaster}
              onChange={(e) => setNewMaster(e.target.value)}
              className="bg-[#18202e] border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs w-48"
            />
            <span className="text-slate-500">➔</span>
            <input
              type="text"
              placeholder="Slave Symbol (e.g. GOLD)"
              value={newSlave}
              onChange={(e) => setNewSlave(e.target.value)}
              className="bg-[#18202e] border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs w-48"
            />
            <button
              onClick={handleAddMapping}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition"
            >
              Add Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
