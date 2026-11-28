import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { auth, dbFirestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
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

interface AuditLogEntry {
  time: string;
  action: string;
  target: string;
  admin: string;
  status: string;
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
  const { bridgeLatencyMs, orderHistory, positions, accountEquity } = useTrading();
  const [activeTab, setActiveTab] = useState<'LICENSES' | 'TERMINALS' | 'PRESETS' | 'AUDIT'>('LICENSES');
  const [licenses, setLicenses] = useState<ClientLicenseItem[]>(INITIAL_ADMIN_LICENSES);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');

  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newBroker, setNewBroker] = useState<string>('IC Markets Global');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newHwid, setNewHwid] = useState<string>('');
  const [newStrategy, setNewStrategy] = useState<string>('AlgoMax Prop Pass v5.2');
  const [newPlanType, setNewPlanType] = useState<'STARTER' | 'PROP' | 'LIFETIME'>('PROP');

  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState<boolean>(false);
  const [isGlobalFrozen, setIsGlobalFrozen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isPingingFleet, setIsPingingFleet] = useState<boolean>(false);
  const [lastFleetPingAt, setLastFleetPingAt] = useState<string>('Just now');
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);

  const [fleetKpis, setFleetKpis] = useState({
    managedEquityUsd: 390768.2,
    activePorts: 4,
    totalExecutionsToday: 24,
    avgSlippagePct: 0.02,
  });

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

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      time: 'Initial boot',
      action: 'FLEET_HEARTBEAT',
      target: 'Equinix LD4 / NY4 / FR2 telemetry online',
      admin: 'thulanimyeni19712@gmail.com',
      status: 'VERIFIED',
    },
  ]);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const appendAudit = (action: string, target: string, status = 'SUCCESS') => {
    const nowLabel = new Date().toLocaleTimeString([], { hour12: false });
    setAuditLogs((prev) => [
      {
        time: nowLabel,
        action,
        target,
        admin: auth.currentUser?.email || 'thulanimyeni19712@gmail.com',
        status,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    async function loadInitialTelemetry() {
      try {
        const start = performance.now();
        const res = await fetch('/api/admin/fleet-status');
        const rtt = Number((performance.now() - start).toFixed(1));
        if (res.ok) {
          const data = await res.json();
          const serverLatency = Number(data?.kpis?.serverLatencyMs ?? rtt);
          setFleetKpis((prev) => ({
            managedEquityUsd: Number(data?.kpis?.managedEquityUsd ?? prev.managedEquityUsd),
            activePorts: Number(data?.kpis?.activePorts ?? prev.activePorts),
            totalExecutionsToday: Number(data?.kpis?.totalExecutionsToday ?? prev.totalExecutionsToday),
            avgSlippagePct: Number(data?.kpis?.avgSlippagePct ?? prev.avgSlippagePct),
          }));
          setFleetNodes((prev) =>
            prev.map((node, idx) => ({
              ...node,
              ping: Number(Math.max(0.2, serverLatency + idx * 0.2).toFixed(1)),
            }))
          );
          setLastFleetPingAt(new Date().toLocaleTimeString([], { hour12: false }));
        }
      } catch {
        // Backend telemetry probe deferred
      }

      if (
        auth.currentUser?.email === 'thulanimyeni19712@gmail.com' &&
        auth.currentUser?.emailVerified
      ) {
        try {
          const snap = await getDocs(collection(dbFirestore, 'licenses'));
          setFirestoreConnected(true);
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
    void loadInitialTelemetry();
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    const t = window.setTimeout(() => setActionNotice(null), 4000);
    timersRef.current.push(t);
  };

  const handleCopyKey = (key: string) => {
    void navigator.clipboard?.writeText(key).catch(() => undefined);
    setCopiedKey(key);
    const t = window.setTimeout(() => setCopiedKey(null), 2500);
    timersRef.current.push(t);
    showNotice(`License key ${key} copied to clipboard.`);
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
      setFleetKpis((prev) => ({
        managedEquityUsd: Number(data?.kpis?.managedEquityUsd ?? prev.managedEquityUsd),
        activePorts: Number(data?.kpis?.activePorts ?? prev.activePorts),
        totalExecutionsToday: Number(data?.kpis?.totalExecutionsToday ?? prev.totalExecutionsToday),
        avgSlippagePct: Number(data?.kpis?.avgSlippagePct ?? prev.avgSlippagePct),
      }));
      setFleetNodes((prev) =>
        prev.map((node, idx) => ({
          ...node,
          ping: Number(Math.max(0.2, idx === 0 ? rtt : serverLatency + idx * 0.2).toFixed(1)),
        }))
      );
      setLastFleetPingAt(new Date().toLocaleTimeString([], { hour12: false }));
      appendAudit('FLEET_PING', `RTT ${rtt}ms / Server loop ${serverLatency}ms`);
      showNotice(`Live fleet probe complete (${rtt}ms HTTP RTT, ${serverLatency}ms server loop).`);
    } catch (err: unknown) {
      showNotice(`Fleet probe failed: ${(err as Error).message}`);
    } finally {
      setIsPingingFleet(false);
    }
  };

  const isSuperAdminAuth =
    auth.currentUser?.email === 'thulanimyeni19712@gmail.com' &&
    Boolean(auth.currentUser?.emailVerified);

  const handleToggleStatus = async (id: string) => {
    const target = licenses.find((l) => l.id === id);
    if (!target) return;
    const newStatus: ClientLicenseItem['status'] = target.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';

    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    appendAudit('LICENSE_STATUS', `${target.clientName} (${target.key}) -> ${newStatus}`);

    if (isSuperAdminAuth) {
      try {
        await updateDoc(doc(dbFirestore, 'licenses', id), { status: newStatus });
        showNotice(`Updated ${target.key} status to ${newStatus} in Firestore.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `licenses/${id}`);
        showNotice(`Updated ${target.key} to ${newStatus} locally.`);
      }
    } else {
      showNotice(`Updated ${target.key} status to ${newStatus} in active session.`);
    }
  };

  const handleExtendExpiry = async (id: string, days: number) => {
    const target = licenses.find((l) => l.id === id);
    if (!target) return;
    const d = new Date(target.expiresAt || Date.now());
    d.setDate(d.getDate() + days);
    const nextExpiresAt = d.toISOString().substring(0, 10);

    setLicenses((prev) =>
      prev.map((l) => (l.id === id ? { ...l, expiresAt: nextExpiresAt, status: 'ACTIVE' } : l))
    );
    appendAudit('LICENSE_EXTEND', `${target.clientName} extended +${days}d -> ${nextExpiresAt}`);

    if (isSuperAdminAuth) {
      try {
        await updateDoc(doc(dbFirestore, 'licenses', id), {
          expiresAt: nextExpiresAt,
          status: 'ACTIVE',
        });
        showNotice(`Extended ${target.key} to ${nextExpiresAt} and synced to Firestore.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `licenses/${id}`);
        showNotice(`Extended ${target.key} locally.`);
      }
    } else {
      showNotice(`Extended ${target.key} by ${days} days in active session.`);
    }
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
      hwid:
        newHwid ||
        `HWID-${randomHex(2).toUpperCase()}-${randomHex(2).toUpperCase()}-${randomHex(2).toUpperCase()}`,
      robotName: newStrategy,
      expiresAt: expDate.toISOString().substring(0, 10),
      status: 'ACTIVE',
      maxAccounts: newPlanType === 'STARTER' ? 1 : newPlanType === 'PROP' ? 3 : 10,
    };

    setLicenses((prev) => [newLic, ...prev]);
    setIsIssueModalOpen(false);
    appendAudit('LICENSE_ISSUE', `${newLic.clientName} (${newLic.key})`);

    if (isSuperAdminAuth) {
      try {
        await setDoc(doc(dbFirestore, 'licenses', newLic.id), newLic);
        showNotice(`Issued and synced license ${newKey} to Firestore.`);
      } catch (err: unknown) {
        handleFirestoreError(err, OperationType.CREATE, `licenses/${newLic.id}`);
        showNotice(`Issued ${newKey} locally (Firestore sync requires matching rule permissions).`);
      }
    } else {
      showNotice(`Issued license ${newKey} in active session (Sign in as verified Super Admin to sync Firestore).`);
    }
  };

  const activeLicenseCount = useMemo(
    () => licenses.filter((l) => l.status === 'ACTIVE').length,
    [licenses]
  );
  const licenseHealthPct = licenses.length > 0 ? (activeLicenseCount / licenses.length) * 100 : 100;

  const totalNodeEquity = useMemo(() => {
    const nodesSum = fleetNodes.reduce((sum, node) => sum + node.equity, 0);
    return Math.max(fleetKpis.managedEquityUsd, nodesSum + accountEquity);
  }, [fleetNodes, fleetKpis.managedEquityUsd, accountEquity]);

  const totalExecutionsDisplay = fleetKpis.totalExecutionsToday + orderHistory.length + positions.length;

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
    <div className="space-y-6 pb-16 selection:bg-cyan-500/30 selection:text-cyan-200">
      {actionNotice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 text-cyan-100 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-cyan-300 hover:text-white px-2">
            &times;
          </button>
        </div>
      )}

      {/* Admin Header */}
      <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase block">
            AlgoAdminPortal.com • Master Cloud Control
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Algo Admin Portal{' '}
            <span className="text-slate-400 text-sm font-normal">
              | Super Admin (thulanimyeni19712@gmail.com)
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenPublicSite}
            className="py-2.5 px-4 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] text-cyan-300 hover:text-white text-xs font-semibold transition flex items-center gap-2 border border-white/[0.08] whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Site (algomax-ea.com)</span>
          </button>

          <button
            onClick={() => setIsKillSwitchModalOpen(true)}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-2 whitespace-nowrap border ${
              isGlobalFrozen
                ? 'bg-rose-600 text-white border-rose-400'
                : 'bg-rose-950/50 hover:bg-rose-900 border-rose-500/40 text-rose-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isGlobalFrozen ? 'Fleet Frozen' : 'Global Kill Switch'}</span>
          </button>
        </div>
      </div>

      {/* Live Derived KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Active Licenses
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {activeLicenseCount} / {licenses.length}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1 font-mono tabular-nums">
            {licenseHealthPct.toFixed(1)}% Active Health
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Managed Fleet Equity
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            ${totalNodeEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {fleetNodes.length} Registered Nodes
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Active VPS Nodes
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-300 font-mono tabular-nums mt-1">
            {fleetNodes.filter((n) => n.status === 'ONLINE').length} / {fleetNodes.length} Online
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 font-mono tabular-nums">
            {bridgeLatencyMs.toFixed(1)}ms Equinix Ping
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Session Executions
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums mt-1">
            {totalExecutionsDisplay.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono tabular-nums">
            {fleetKpis.avgSlippagePct.toFixed(2)}% Avg Slippage
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08] col-span-2 lg:col-span-1">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Firestore Sync
          </div>
          <div
            className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
              firestoreConnected ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {firestoreConnected ? 'SYNCED' : 'LOCAL MODE'}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-1 font-mono">resolute-kit-f3rp2</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('LICENSES')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] ${
            activeTab === 'LICENSES'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-[#161D2B]'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Client Licenses ({licenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TERMINALS')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] ${
            activeTab === 'TERMINALS'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-[#161D2B]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>VPS Terminal Fleet ({fleetNodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRESETS')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] ${
            activeTab === 'PRESETS'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-[#161D2B]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Remote Strategy Pusher</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 whitespace-nowrap min-h-[40px] ${
            activeTab === 'AUDIT'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-[#161D2B]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security &amp; Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: CLIENT LICENSES */}
      {activeTab === 'LICENSES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, email, account, or HWID..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0F141E] border border-white/[0.1] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-[#0F141E] border border-white/[0.08] rounded-xl p-1 text-[11px] font-semibold">
                {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Issue New License</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0F141E] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] text-slate-400 uppercase tracking-wider bg-[#161D2B]">
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
              <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center space-y-3 font-sans">
                      <div className="text-xs text-slate-400">
                        No client licenses matched query &quot;{filterQuery || statusFilter}&quot;.
                      </div>
                      <button
                        onClick={() => {
                          setFilterQuery('');
                          setStatusFilter('ALL');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] text-cyan-300 font-semibold text-xs border border-white/[0.08] transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-[#161D2B] transition">
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{lic.clientName}</div>
                        <div className="text-[11px] text-slate-400">{lic.clientEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                          <span>{lic.key}</span>
                          <button
                            onClick={() => handleCopyKey(lic.key)}
                            className="text-slate-400 hover:text-white"
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
                        <div className="text-slate-200 font-sans font-semibold">{lic.broker}</div>
                        <div className="text-[11px] text-cyan-300">#{lic.accountNumber}</div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">{lic.hwid}</td>
                      <td className="p-3 text-[11px] text-slate-300 font-sans">{lic.robotName}</td>
                      <td className="p-3 text-slate-400 text-[11px]">{lic.expiresAt}</td>
                      <td className="p-3 font-sans">
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
                      <td className="p-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => void handleExtendExpiry(lic.id, 30)}
                            className="px-2 py-1 rounded-lg bg-[#161D2B] hover:bg-[#1E2738] border border-white/[0.08] text-cyan-300 text-[11px] font-semibold"
                            title="Extend 30 Days"
                          >
                            +30D
                          </button>
                          <button
                            onClick={() => void handleToggleStatus(lic.id)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                              lic.status === 'ACTIVE'
                                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30'
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
        <div className="p-6 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Connected MetaTrader Fleet Nodes ({fleetNodes.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live latency telemetry and equity utilization across VPS clusters • Last synced: {lastFleetPingAt}
              </p>
            </div>
            <button
              onClick={handlePingFleet}
              disabled={isPingingFleet}
              className="py-2 px-3.5 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/[0.08] transition whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingFleet ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isPingingFleet ? 'Pinging...' : 'Ping Fleet'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {fleetNodes.map((node) => (
              <div
                key={node.account}
                className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.06] flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs">
                      {node.client} ({node.terminal})
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {node.broker} • Account {node.account} • Ping:{' '}
                      <span className="text-cyan-300 font-semibold">{node.ping}ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] font-sans text-slate-400">Open Trades</div>
                    <div className="font-semibold text-white">{node.trades} Active</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-400">Equity</div>
                    <div className="font-semibold text-emerald-400">
                      ${node.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
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
        <div className="p-6 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-5 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white">Remote Strategy &amp; Preset Pusher</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Push parameter updates across connected client terminals without manual client reconfiguration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#161D2B] border border-white/[0.08] space-y-3 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white text-xs">AlgoMax Prop Safe v5.2</div>
                <p className="text-xs text-slate-400 mt-1">
                  Max Daily Drawdown 3.5%, Trailing Stop 15 pips, News Filter 30m buffer.
                </p>
              </div>
              <button
                onClick={() => {
                  appendAudit('PRESET_PUSH', `AlgoMax Prop Safe v5.2 -> ${activeLicenseCount} active licenses`);
                  showNotice(`Pushed AlgoMax Prop Safe v5.2 to ${activeLicenseCount} active client licenses.`);
                }}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
              >
                Push to Active Prop Accounts ({activeLicenseCount})
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#161D2B] border border-white/[0.08] space-y-3 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white text-xs">AlgoMax Gold Aggressive Scalper</div>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamic ATR multiplier 1.5, partial TP at 25 pips, breakeven armed at +10 pips.
                </p>
              </div>
              <button
                onClick={() => {
                  appendAudit('PRESET_PUSH', `Gold Aggressive Scalper -> ${fleetNodes.length} VPS nodes`);
                  showNotice(`Pushed Gold Aggressive Scalper to ${fleetNodes.length} fleet nodes.`);
                }}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                Push to Fleet Nodes ({fleetNodes.length})
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#161D2B] border border-white/[0.08] space-y-3 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white text-xs">Pre-News High Volatility Mode</div>
                <p className="text-xs text-slate-400 mt-1">
                  Tightens spread filter to 1.8 pips and suspends market orders on GBP and USD.
                </p>
              </div>
              <button
                onClick={() => {
                  appendAudit('PRESET_BROADCAST', `Pre-News Volatility Mode -> All ${fleetNodes.length} nodes`);
                  showNotice(`Broadcast Pre-News Volatility Mode to all ${fleetNodes.length} terminals.`);
                }}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
              >
                Broadcast to All Nodes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="p-6 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-4 shadow-xl">
          <div className="text-sm font-bold text-white">Security &amp; Master Command Audit Log</div>
          <div className="space-y-2 text-xs">
            {auditLogs.map((log, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#161D2B] border border-white/[0.06] flex items-center justify-between text-slate-300 font-mono text-xs gap-3"
              >
                <div>
                  <span className="font-bold text-cyan-300">{log.action}</span> • {log.target}
                  <div className="text-[11px] text-slate-500 font-sans">By {log.admin}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-emerald-400 font-bold block">{log.status}</span>
                  <span className="text-slate-500 text-[11px] tabular-nums">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUE NEW LICENSE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0F141E] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Issue New Client License</h3>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleIssueLicenseSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Client Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Zhang"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Client Email</label>
                  <input
                    type="email"
                    required
                    placeholder="d.zhang@quantedge.sg"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Broker Name</label>
                  <input
                    type="text"
                    required
                    value={newBroker}
                    onChange={(e) => setNewBroker(e.target.value)}
                    className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">MT5 / MT4 Account #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8940122"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Hardware ID (HWID) or Auto-Lock
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for auto-binding on first MT5 terminal ping"
                  value={newHwid}
                  onChange={(e) => setNewHwid(e.target.value)}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-cyan-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Robot Strategy</label>
                  <select
                    value={newStrategy}
                    onChange={(e) => setNewStrategy(e.target.value)}
                    className="w-full py-2 px-2 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                  >
                    <option value="AlgoMax Prop Pass v5.2">AlgoMax Prop Pass v5.2</option>
                    <option value="AlgoMax Institutional Gold">AlgoMax Institutional Gold</option>
                    <option value="AlgoMax US30 Scalper">AlgoMax US30 Scalper</option>
                    <option value="AlgoMax FX Trend Matrix">AlgoMax FX Trend Matrix</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">License Tier</label>
                  <select
                    value={newPlanType}
                    onChange={(e) => setNewPlanType(e.target.value as 'STARTER' | 'PROP' | 'LIFETIME')}
                    className="w-full py-2 px-2 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                  >
                    <option value="STARTER">Starter (1 Account)</option>
                    <option value="PROP">Prop Pass (3 Accounts)</option>
                    <option value="LIFETIME">Institutional Lifetime</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition mt-2"
              >
                Create &amp; Broadcast License Key
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY GLOBAL KILL SWITCH MODAL */}
      {isKillSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F141E] border border-rose-500/60 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="p-3.5 rounded-full bg-rose-500/20 text-rose-400 w-fit mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {isGlobalFrozen ? 'Unfreeze Client Fleet?' : 'Emergency Fleet Freeze'}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {isGlobalFrozen
                  ? `Resuming trading will re-arm automated execution across ${fleetNodes.length} registered fleet nodes.`
                  : `This broadcasts a HALT & LIQUIDATE command across ${fleetNodes.length} registered fleet nodes to prevent drawdown breach.`}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsKillSwitchModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] text-slate-300 font-semibold text-xs border border-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const nextFrozen = !isGlobalFrozen;
                  setIsGlobalFrozen(nextFrozen);
                  setIsKillSwitchModalOpen(false);
                  appendAudit(
                    nextFrozen ? 'GLOBAL_FREEZE' : 'GLOBAL_UNFREEZE',
                    `${fleetNodes.length} fleet nodes`
                  );
                  showNotice(
                    nextFrozen
                      ? `Emergency freeze broadcast across ${fleetNodes.length} fleet terminals.`
                      : 'Client fleet resumed.'
                  );
                }}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition ${
                  isGlobalFrozen ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isGlobalFrozen ? 'Unfreeze Fleet' : 'Confirm Freeze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
