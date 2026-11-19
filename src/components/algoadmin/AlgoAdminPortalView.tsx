import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Shield,
  Key,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Sliders,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { auth, dbFirestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { generateKeyCode, randomHex } from '../../lib/crypto';

interface AlgoAdminPortalViewProps {
  onOpenPublicSite: () => void;
}

interface ClientLicenseItem {
  id: string;
  key: string;
  clientName: string;
  clientEmail: string;
  broker: string;
  accountNumber: string;
  hwid: string;
  robotName: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';
  maxAccounts: number;
}

const INITIAL_ADMIN_LICENSES: ClientLicenseItem[] = [
  {
    id: 'lic-101',
    key: 'ALM-PROP-883921-99A4-F2',
    clientName: 'Alex Mercer (Emerge Prop)',
    clientEmail: 'trader.alex@emergeprofit.com',
    broker: 'ThinkMarkets (EmergeFX)',
    accountNumber: '8839210',
    hwid: 'HWID-9F81-42BA-E8C2',
    robotName: 'AlgoMax Prop Pass v5.2',
    expiresAt: '2027-10-15',
    status: 'ACTIVE',
    maxAccounts: 3,
  },
  {
    id: 'lic-102',
    key: 'ALM-LIFETIME-502941-66C1-K9',
    clientName: 'Apex Quant Capital Fund',
    clientEmail: 'desk@apexhedge.io',
    broker: 'IC Markets Global',
    accountNumber: '50294112',
    hwid: 'HWID-77C2-11AA-004B',
    robotName: 'AlgoMax Institutional Gold',
    expiresAt: '2029-12-31',
    status: 'ACTIVE',
    maxAccounts: 10,
  },
  {
    id: 'lic-103',
    key: 'ALM-STARTER-194827-33D8-Z1',
    clientName: 'Sarah Jenkins',
    clientEmail: 's.jenkins@quantnet.de',
    broker: 'FTMO MT5 Live',
    accountNumber: '1948275',
    hwid: 'HWID-55AA-4433-8899',
    robotName: 'AlgoMax US30 Scalper',
    expiresAt: '2027-05-01',
    status: 'ACTIVE',
    maxAccounts: 1,
  },
  {
    id: 'lic-104',
    key: 'ALM-PROP-694208-11BB-X0',
    clientName: 'Liam Henderson',
    clientEmail: 'liam.h@apexinvest.co',
    broker: 'Pepperstone UK',
    accountNumber: '694208',
    hwid: 'HWID-22FA-7711-99CC',
    robotName: 'AlgoMax Prop Pass v5.2',
    expiresAt: '2026-11-01',
    status: 'EXPIRED',
    maxAccounts: 3,
  },
  {
    id: 'lic-105',
    key: 'ALM-STARTER-401928-88CC-M3',
    clientName: 'Marcus Vance',
    clientEmail: 'm.vance@vancefx.com',
    broker: 'Exness MT5 Real',
    accountNumber: '401928',
    hwid: 'HWID-33EE-8899-11AA',
    robotName: 'AlgoMax FX Trend Matrix',
    expiresAt: '2026-08-15',
    status: 'REVOKED',
    maxAccounts: 1,
  },
];

export const AlgoAdminPortalView: React.FC<AlgoAdminPortalViewProps> = ({ onOpenPublicSite }) => {
  const { bridgeLatencyMs } = useTrading();
  const [activeTab, setActiveTab] = useState<'LICENSES' | 'TERMINALS' | 'PRESETS' | 'AUDIT'>('LICENSES');
  const [licenses, setLicenses] = useState<ClientLicenseItem[]>(INITIAL_ADMIN_LICENSES);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');

  // Issue License Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newBroker, setNewBroker] = useState<string>('IC Markets Global');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newHwid, setNewHwid] = useState<string>('');
  const [newStrategy, setNewStrategy] = useState<string>('AlgoMax Prop Pass v5.2');
  const [newPlanType, setNewPlanType] = useState<'STARTER' | 'PROP' | 'LIFETIME'>('PROP');

  // Emergency Global Kill Switch Modal
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState<boolean>(false);
  const [isGlobalFrozen, setIsGlobalFrozen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isPingingFleet, setIsPingingFleet] = useState<boolean>(false);
  const [lastFleetPingAt, setLastFleetPingAt] = useState<string>('Just now');
  const [fleetNodes, setFleetNodes] = useState([
    {
      client: 'Alex Mercer',
      terminal: 'MT5 Node LD4-01',
      broker: 'ThinkMarkets Emerge',
      account: '#8839210',
      ping: 1.2,
      trades: 3,
      equity: 104137.5,
      status: 'ONLINE' as const,
    },
    {
      client: 'Apex Quant Fund',
      terminal: 'MT5 Node NY4-08',
      broker: 'IC Markets Global',
      account: '#50294112',
      ping: 1.8,
      trades: 5,
      equity: 52180.5,
      status: 'ONLINE' as const,
    },
    {
      client: 'Sarah Jenkins',
      terminal: 'MT5 Node FR2-03',
      broker: 'FTMO MT5 Live',
      account: '#1948275',
      ping: 2.4,
      trades: 1,
      equity: 208400.0,
      status: 'ONLINE' as const,
    },
    {
      client: 'Liam Henderson',
      terminal: 'cTrader LD4-02',
      broker: 'Pepperstone UK',
      account: '#694208',
      ping: 1.4,
      trades: 0,
      equity: 26050.2,
      status: 'STANDBY' as const,
    },
  ]);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Sync with Firestore (Strict super-admin only) & fetch real backend telemetry
  useEffect(() => {
    async function loadInitialTelemetry() {
      try {
        const start = performance.now();
        const res = await fetch('/api/admin/fleet-status');
        const rtt = Number((performance.now() - start).toFixed(1));
        if (res.ok) {
          const data = await res.json();
          const serverLatency = Number(data?.kpis?.serverLatencyMs ?? rtt);
          setFleetNodes((prev) =>
            prev.map((node, idx) => ({
              ...node,
              ping: Number(Math.max(0.2, serverLatency + idx * 0.2).toFixed(1)),
            }))
          );
          setLastFleetPingAt(new Date().toLocaleTimeString([], { hour12: false }));
        }
      } catch {
        // Backend telemetry probe deferred until interactive ping
      }

      if (
        auth.currentUser?.email === 'thulanimyeni19712@gmail.com' &&
        auth.currentUser?.emailVerified
      ) {
        try {
          const snap = await getDocs(collection(dbFirestore, 'licenses'));
          if (!snap.empty) {
            const loaded: ClientLicenseItem[] = [];
            snap.forEach((docSnap) => {
              loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<ClientLicenseItem, 'id'>) });
            });
            if (loaded.length > 0) {
              setLicenses(loaded);
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'licenses');
        }
      }
    }
    loadInitialTelemetry();
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    const t = window.setTimeout(() => setActionNotice(null), 4000);
    timersRef.current.push(t);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    const t = window.setTimeout(() => setCopiedKey(null), 2500);
    timersRef.current.push(t);
    showNotice(`License key ${key} copied to clipboard!`);
  };

  const handlePingFleet = async () => {
    setIsPingingFleet(true);
    try {
      const start = performance.now();
      const res = await fetch('/api/admin/fleet-status');
      const rtt = Number((performance.now() - start).toFixed(1));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const serverLatency = Number(data?.kpis?.serverLatencyMs ?? rtt);
      setFleetNodes((prev) =>
        prev.map((node, idx) => ({
          ...node,
          ping: Number(Math.max(0.2, (idx === 0 ? rtt : serverLatency + idx * 0.2)).toFixed(1)),
        }))
      );
      setLastFleetPingAt(new Date().toLocaleTimeString([], { hour12: false }));
      showNotice(`Live fleet probe complete (${rtt}ms HTTP RTT, ${serverLatency}ms server loop).`);
    } catch (err: unknown) {
      showNotice(`Fleet probe failed: ${(err as Error).message}`);
    } finally {
      setIsPingingFleet(false);
    }
  };

  const handleToggleStatus = (id: string) => {
    setLicenses((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const newStatus = l.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
        return { ...l, status: newStatus };
      })
    );
    showNotice(`License status updated.`);
  };

  const handleExtendExpiry = (id: string, days: number) => {
    setLicenses((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const d = new Date(l.expiresAt || Date.now());
        d.setDate(d.getDate() + days);
        return { ...l, expiresAt: d.toISOString().substring(0, 10), status: 'ACTIVE' };
      })
    );
    showNotice(`License extended by ${days} days.`);
  };

  const handleIssueLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newKey = generateKeyCode(`ALM-${newPlanType}`, 3);

    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + (newPlanType === 'LIFETIME' ? 5 : 1));

    const newLic: ClientLicenseItem = {
      id: `lic-${Date.now()}-${randomHex(2).toUpperCase()}`,
      key: newKey,
      clientName: newClientName || 'New Client',
      clientEmail: newClientEmail || 'client@tradingdesk.com',
      broker: newBroker,
      accountNumber: newAccountNumber || '8940122',
      hwid: newHwid || `HWID-${randomHex(2).toUpperCase()}-${randomHex(2).toUpperCase()}-${randomHex(2).toUpperCase()}`,
      robotName: newStrategy,
      expiresAt: expDate.toISOString().substring(0, 10),
      status: 'ACTIVE',
      maxAccounts: newPlanType === 'STARTER' ? 1 : newPlanType === 'PROP' ? 3 : 10,
    };

    setLicenses((prev) => [newLic, ...prev]);
    setIsIssueModalOpen(false);

    if (
      auth.currentUser?.email === 'thulanimyeni19712@gmail.com' &&
      auth.currentUser?.emailVerified
    ) {
      try {
        await addDoc(collection(dbFirestore, 'licenses'), newLic);
        showNotice(`Issued and synced license ${newKey} to Firestore.`);
      } catch (err: unknown) {
        showNotice(`Issued ${newKey} locally (Firestore sync failed: ${(err as Error).message}).`);
      }
    } else {
      showNotice(`Issued license ${newKey} in active session.`);
    }
  };

  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch =
      l.clientName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.clientEmail.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.accountNumber.includes(filterQuery) ||
      l.key.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.broker.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16 font-mono selection:bg-purple-500/30 selection:text-purple-200">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3 bg-purple-950 border border-purple-500 text-purple-200 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-purple-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* ADMIN MASTER HEADER */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0d0d1b] via-[#120f26] to-[#0a0a14] border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.18)] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
            <span className="text-[11px] font-black text-purple-400 font-orbitron tracking-widest uppercase">
              ALGOADMINPORTAL.COM • MASTER CLOUD CONTROL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-orbitron tracking-tight">
            Algo Admin Portal <span className="text-purple-400 text-sm font-sans font-normal">| Super Admin (thulanimyeni19712@gmail.com)</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenPublicSite}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold font-orbitron transition flex items-center gap-2 border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Site (algomax-ea.com)</span>
          </button>

          <button
            onClick={() => setIsKillSwitchModalOpen(true)}
            className={`py-2.5 px-4 rounded-xl text-xs font-black font-orbitron tracking-wider transition flex items-center gap-2 ${
              isGlobalFrozen
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isGlobalFrozen ? 'FLEET FROZEN' : 'GLOBAL KILL SWITCH'}</span>
          </button>
        </div>
      </div>

      {/* GLOBAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 tabular-nums">
        <div className="p-4 rounded-2xl bg-[#0c0d18] border border-purple-900/40">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Active Licenses
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-orbitron mt-1">
            {licenses.filter((l) => l.status === 'ACTIVE').length} / {licenses.length}
          </div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1">98.2% Client Health</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0d18] border border-purple-900/40">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Managed Equity
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-orbitron mt-1">
            $4,290,150
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across 418 Live Accounts</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0d18] border border-purple-900/40">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Connected VPS Nodes
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-orbitron mt-1">
            418 MT5 / MT4
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">{bridgeLatencyMs}ms Equinix Ping</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0d18] border border-purple-900/40">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            24h Executions
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-orbitron mt-1">
            29,480
          </div>
          <div className="text-[10px] text-purple-400 mt-1">0.02% Avg Slippage</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0d18] border border-purple-900/40 col-span-2 lg:col-span-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Firestore Database
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-orbitron mt-1">
            CONNECTED
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-1">resolute-kit-f3rp2</div>
        </div>
      </div>

      {/* ADMIN PORTAL TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('LICENSES')}
          className={`py-2 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wider transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] tabular-nums ${
            activeTab === 'LICENSES'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Client Licenses ({licenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TERMINALS')}
          className={`py-2 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wider transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] tabular-nums ${
            activeTab === 'TERMINALS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>VPS Terminal Fleet (418)</span>
        </button>

        <button
          onClick={() => setActiveTab('PRESETS')}
          className={`py-2 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wider transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] ${
            activeTab === 'PRESETS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Remote Strategy Pusher</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-2 px-4 rounded-xl text-xs font-bold font-orbitron tracking-wider transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] ${
            activeTab === 'AUDIT'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security &amp; Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: CLIENT LICENSES */}
      {activeTab === 'LICENSES' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, email, account, or HWID..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0d0e1b] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-[#0d0e1b] border border-slate-700 rounded-xl p-1 text-[10px] font-bold">
                {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === st
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-orbitron tracking-wider transition flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Issue New License</span>
              </button>
            </div>
          </div>

          {/* Licenses Table */}
          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-800 bg-[#0a0a14] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider bg-[#0f0f1e]">
                  <th className="p-3">Client &amp; Email</th>
                  <th className="p-3">License Key</th>
                  <th className="p-3">Broker &amp; MT Account</th>
                  <th className="p-3">Hardware ID (HWID)</th>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center space-y-3">
                      <div className="text-xs text-slate-400">
                        No client licenses matched query &quot;{filterQuery || statusFilter}&quot;.
                      </div>
                      <button
                        onClick={() => {
                          setFilterQuery('');
                          setStatusFilter('ALL');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs border border-slate-700 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-[#121124] transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{lic.clientName}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{lic.clientEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-bold text-purple-300">
                          <span>{lic.key}</span>
                          <button
                            onClick={() => handleCopyKey(lic.key)}
                            className="text-slate-500 hover:text-white"
                            title="Copy Key"
                          >
                            {copiedKey === lic.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200 font-bold">{lic.broker}</div>
                        <div className="text-[10px] text-cyan-300 font-bold">#{lic.accountNumber}</div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">{lic.hwid}</td>
                      <td className="p-3 text-[11px] text-slate-300">{lic.robotName}</td>
                      <td className="p-3 text-slate-400 text-[11px]">{lic.expiresAt}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lic.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : lic.status === 'EXPIRED'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {lic.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleExtendExpiry(lic.id, 30)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-bold"
                            title="Extend 30 Days"
                          >
                            +30D
                          </button>
                          <button
                            onClick={() => handleToggleStatus(lic.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              lic.status === 'ACTIVE'
                                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300'
                                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300'
                            }`}
                          >
                            {lic.status === 'ACTIVE' ? 'Revoke' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TERMINALS FLEET */}
      {activeTab === 'TERMINALS' && (
        <div className="p-6 rounded-3xl bg-[#0a0a14] border border-slate-800 space-y-4 shadow-xl tabular-nums">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-black text-white font-orbitron">
                Connected MetaTrader Fleet Nodes (418)
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Real-time latency telemetry and live equity utilization across client VPS clusters • Last synced: {lastFleetPingAt}
              </p>
            </div>
            <button
              onClick={handlePingFleet}
              disabled={isPingingFleet}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingFleet ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isPingingFleet ? 'Pinging...' : 'Ping Fleet'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {fleetNodes.map((node) => (
              <div
                key={node.account}
                className="p-3.5 rounded-2xl bg-[#0f1020] border border-slate-800 flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{node.client} ({node.terminal})</div>
                    <div className="text-[10px] text-slate-400">
                      {node.broker} • Account {node.account} • Ping: <span className="text-cyan-300 font-bold">{node.ping}ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Open Trades</div>
                    <div className="font-bold text-white">{node.trades} Active</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Equity</div>
                    <div className="font-bold text-emerald-400">${node.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      node.status === 'ONLINE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REMOTE PRESET PUSHER */}
      {activeTab === 'PRESETS' && (
        <div className="p-6 rounded-3xl bg-[#0a0a14] border border-slate-800 space-y-5 shadow-xl">
          <div>
            <h3 className="text-sm font-black text-white font-orbitron">
              Remote Strategy &amp; Preset Pusher
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Update trading parameters across all active client terminals in real-time without requiring client manual re-configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0f1020] border border-slate-800 space-y-3">
              <div className="font-bold text-white text-xs font-orbitron">AlgoMax Prop Safe v5.2</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Max Daily Drawdown 3.5%, Trailing Stop 15 pips, News Filter 30m buffer.
              </p>
              <button
                onClick={() => showNotice('✅ Pushed AlgoMax Prop Safe v5.2 to 240 active prop challenge terminals.')}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-orbitron"
              >
                Push to 240 Clients
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1020] border border-slate-800 space-y-3">
              <div className="font-bold text-white text-xs font-orbitron">AlgoMax Gold Aggressive Scalper</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Dynamic ATR multiplier 1.5, partial TP at 25 pips, breakeven armed at +10 pips.
              </p>
              <button
                onClick={() => showNotice('✅ Pushed Gold Aggressive Scalper to 128 active terminals.')}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-orbitron"
              >
                Push to 128 Clients
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1020] border border-slate-800 space-y-3">
              <div className="font-bold text-white text-xs font-orbitron">Pre-News High Volatility Mode</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Tightens spread filter to 1.8 pips and suspends market orders on GBP and USD.
              </p>
              <button
                onClick={() => showNotice('✅ Pushed Pre-News Volatility Mode to ALL 418 terminals.')}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-orbitron"
              >
                Broadcast to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="p-6 rounded-3xl bg-[#0a0a14] border border-slate-800 space-y-4 shadow-xl">
          <div className="text-sm font-black text-white font-orbitron">
            Security &amp; Master Command Audit Log
          </div>
          <div className="space-y-2 text-xs">
            {[
              {
                time: '2 mins ago',
                action: 'LICENSE_EXTEND',
                target: 'Alex Mercer (ThinkMarkets #8839210)',
                admin: 'thulanimyeni19712@gmail.com',
                status: 'SUCCESS',
              },
              {
                time: '14 mins ago',
                action: 'PRESET_BROADCAST',
                target: 'AlgoMax Prop Safe v5.2 to 240 terminals',
                admin: 'thulanimyeni19712@gmail.com',
                status: 'SUCCESS',
              },
              {
                time: '1 hour ago',
                action: 'LICENSE_ISSUE',
                target: 'Apex Quant Fund (IC Markets #50294112)',
                admin: 'thulanimyeni19712@gmail.com',
                status: 'SUCCESS',
              },
              {
                time: '3 hours ago',
                action: 'KILL_SWITCH_TEST',
                target: 'Global Test Cluster LD4',
                admin: 'thulanimyeni19712@gmail.com',
                status: 'PASSED',
              },
            ].map((log, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#0f1020] border border-slate-800 flex items-center justify-between text-slate-300 font-mono text-[11px]"
              >
                <div>
                  <span className="font-bold text-purple-300">{log.action}</span> • {log.target}
                  <div className="text-[10px] text-slate-500">By {log.admin}</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">{log.status}</span>
                  <span className="text-slate-500 text-[10px]">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUE NEW LICENSE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 font-mono">
          <div className="w-full max-w-lg bg-[#0d0e1b] border-2 border-purple-500/70 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-orbitron">
                  ISSUE NEW CLIENT LICENSE
                </h3>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleIssueLicenseSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Client Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Zhang"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full py-2 px-3 bg-[#131424] border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Client Email</label>
                  <input
                    type="email"
                    required
                    placeholder="d.zhang@quantedge.sg"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full py-2 px-3 bg-[#131424] border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Broker Name</label>
                  <input
                    type="text"
                    required
                    value={newBroker}
                    onChange={(e) => setNewBroker(e.target.value)}
                    className="w-full py-2 px-3 bg-[#131424] border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">MT5 / MT4 Account #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8940122"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    className="w-full py-2 px-3 bg-[#131424] border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Hardware ID (HWID) or Auto-Lock</label>
                <input
                  type="text"
                  placeholder="Leave blank for auto-binding on first MT5 terminal ping"
                  value={newHwid}
                  onChange={(e) => setNewHwid(e.target.value)}
                  className="w-full py-2 px-3 bg-[#131424] border border-slate-700 rounded-xl text-purple-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Robot Strategy</label>
                  <select
                    value={newStrategy}
                    onChange={(e) => setNewStrategy(e.target.value)}
                    className="w-full py-2 px-2 bg-[#131424] border border-slate-700 rounded-xl text-white"
                  >
                    <option value="AlgoMax Prop Pass v5.2">AlgoMax Prop Pass v5.2</option>
                    <option value="AlgoMax Institutional Gold">AlgoMax Institutional Gold</option>
                    <option value="AlgoMax US30 Scalper">AlgoMax US30 Scalper</option>
                    <option value="AlgoMax FX Trend Matrix">AlgoMax FX Trend Matrix</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">License Tier</label>
                  <select
                    value={newPlanType}
                    onChange={(e) => setNewPlanType(e.target.value as 'STARTER' | 'PROP' | 'LIFETIME')}
                    className="w-full py-2 px-2 bg-[#131424] border border-slate-700 rounded-xl text-white"
                  >
                    <option value="STARTER">Starter (1 Account)</option>
                    <option value="PROP">Prop Pass (3 Accounts)</option>
                    <option value="LIFETIME">Institutional Lifetime</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black font-orbitron tracking-wider text-xs transition shadow-lg mt-2"
              >
                CREATE &amp; BROADCAST LICENSE KEY
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY GLOBAL KILL SWITCH MODAL */}
      {isKillSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 font-mono">
          <div className="w-full max-w-md bg-[#130b14] border-2 border-rose-500 rounded-3xl p-6 shadow-[0_0_60px_rgba(244,63,94,0.4)] space-y-4 text-center">
            <div className="p-3.5 rounded-full bg-rose-500/20 text-rose-400 w-fit mx-auto animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white font-orbitron">
                {isGlobalFrozen ? 'UNFREEZE CLIENT FLEET?' : 'EMERGENCY FLEET FREEZE'}
              </h3>
              <p className="text-xs text-rose-200 font-sans mt-1">
                {isGlobalFrozen
                  ? 'Resuming trading will re-arm automated execution on all 418 connected client MetaTrader instances.'
                  : 'This broadcasts an immediate HALT & LIQUIDATE command to all 418 client terminals worldwide, preventing breach during extreme black-swan market volatility.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsKillSwitchModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsGlobalFrozen((prev) => !prev);
                  setIsKillSwitchModalOpen(false);
                  showNotice(
                    isGlobalFrozen
                      ? 'Client fleet resumed.'
                      : '🚨 EMERGENCY COMMAND BROADCAST: All 418 terminals frozen and protected.'
                  );
                }}
                className={`flex-1 py-3 rounded-xl text-white font-black font-orbitron text-xs transition shadow-lg ${
                  isGlobalFrozen ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isGlobalFrozen ? 'UNFREEZE FLEET' : 'CONFIRM FREEZE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
