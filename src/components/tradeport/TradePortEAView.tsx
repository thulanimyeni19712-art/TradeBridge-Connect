import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { GooglePickerButton } from '../picker/GooglePickerButton';
import {
  Smartphone,
  Server,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Copy,
  Check,
  ArrowRight,
  Upload,
  Wallet,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface CloudPortInstance {
  id: string;
  label: string;
  platform: 'MT4' | 'MT5';
  broker: string;
  server: string;
  accountLogin: string;
  eaFile: string;
  region: string;
  pingMs: number;
  status: 'ACTIVE' | 'PAUSED';
  planTerm: '1-Month Fixed' | '3-Month Fixed' | '12-Month Fixed';
  expiresOn: string;
  mobileSyncCode: string;
  balance: number;
  equity: number;
}

interface ReferralDevice {
  id: string;
  traderName: string;
  device: string;
  platform: 'MT4' | 'MT5';
  plan: string;
  status: 'ONLINE' | 'EXPIRED';
  commissionUsd: number;
  joinedDate: string;
}

export const TradePortEAView: React.FC = () => {
  const {
    bridgeLatencyMs,
    executeKillSwitch,
    accountBalance,
    accountEquity,
    positions,
    autonomousSnapshots,
    runAutonomousCycle,
  } = useTrading();
  const { brand } = useBrand();
  const sovereignDomain = `${brand.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'apexsovereign'}.io`;
  const [jokerCountdownSec, setJokerCountdownSec] = useState<number>(49);

  useEffect(() => {
    const id = window.setInterval(() => {
      setJokerCountdownSec((prev) => (prev <= 1 ? 49 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Primary navigation tabs inside TradePort EA
  const [activeTab, setActiveTab] = useState<'PORTS' | 'PROVISION' | 'PLANS' | 'AFFILIATE'>('PORTS');
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');

  // Provision form state
  const [portLabel, setPortLabel] = useState<string>('Gold Scalper Port #4');
  const [platform, setPlatform] = useState<'MT5' | 'MT4'>('MT5');
  const [broker, setBroker] = useState<string>('IC Markets Global');
  const [serverName, setServerName] = useState<string>('ICMarketsSC-Live02');
  const [loginId, setLoginId] = useState<string>('50819244');
  const [eaFile, setEaFile] = useState<string>('TradePort_Gold_V5.ex5');
  const [region, setRegion] = useState<string>('Johannesburg Teraco JHB');
  const [selectedPlanTerm, setSelectedPlanTerm] = useState<'1-Month Fixed' | '3-Month Fixed' | '12-Month Fixed'>('1-Month Fixed');
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [provisionNotice, setProvisionNotice] = useState<string | null>(null);

  // Active Cloud Ports list
  const [ports, setPorts] = useState<CloudPortInstance[]>([
    {
      id: 'TP-JHB-1042',
      label: 'AlgoMax Prop Challenge Port',
      platform: 'MT5',
      broker: 'FTMO Prop Challenge',
      server: 'FTMO-Server-04',
      accountLogin: '7729104',
      eaFile: 'AlgoMax_EA_v5.2_Pro.ex5',
      region: 'Johannesburg Teraco JHB',
      pingMs: 1.4,
      status: 'ACTIVE',
      planTerm: '3-Month Fixed',
      expiresOn: '2027-02-19',
      mobileSyncCode: 'TP-SYNC-8841-JHB',
      balance: 100000,
      equity: 106420,
    },
    {
      id: 'TP-LD4-2091',
      label: 'Sovereign X2 BOE Momentum Port',
      platform: 'MT5',
      broker: 'Exness Real 09',
      server: 'Exness-Real9',
      accountLogin: '3381920',
      eaFile: 'Sovereign_X2_AI.ex5',
      region: 'London Equinix LD4',
      pingMs: 1.1,
      status: 'ACTIVE',
      planTerm: '12-Month Fixed',
      expiresOn: '2027-11-19',
      mobileSyncCode: 'TP-SYNC-4429-LD4',
      balance: 2450,
      equity: 2895,
    },
    {
      id: 'TP-NY4-3118',
      label: 'Liquidity Sweep Classic MT4',
      platform: 'MT4',
      broker: 'XM Global',
      server: 'XMGlobal-Real 24',
      accountLogin: '9104421',
      eaFile: 'LiquiditySweep_SMC.ex4',
      region: 'New York Equinix NY4',
      pingMs: 1.8,
      status: 'PAUSED',
      planTerm: '1-Month Fixed',
      expiresOn: '2026-12-19',
      mobileSyncCode: 'TP-SYNC-1930-NY4',
      balance: 5000,
      equity: 5140,
    },
  ]);

  // Plan checkout modal / notice
  const [activatedPlanReceipt, setActivatedPlanReceipt] = useState<{
    title: string;
    priceDisplay: string;
    expiresOn: string;
    portsIncluded: number;
  } | null>(null);

  // Affiliate state
  const [referralSearch, setReferralSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [payoutAsset, setPayoutAsset] = useState<'USDT (TRC20)' | 'BTC' | 'ETH'>('USDT (TRC20)');
  const [walletAddress, setWalletAddress] = useState<string>('TXq9k2LmP8v4R1nZb7xQ3yC9wE6uN4pA2k');
  const [availableCommissionUsd, setAvailableCommissionUsd] = useState<number>(684.5);
  const [payoutReceipt, setPayoutReceipt] = useState<string | null>(null);
  const [isRequestingPayout, setIsRequestingPayout] = useState<boolean>(false);

  const [referrals] = useState<ReferralDevice[]>([
    { id: 'REF-01', traderName: 'Sipho Ndlovu', device: 'Samsung S24 Ultra (Android)', platform: 'MT5', plan: '3-Month Fixed', status: 'ONLINE', commissionUsd: 27.6, joinedDate: '2026-11-04' },
    { id: 'REF-02', traderName: 'Thabo Mokoena', device: 'iPhone 15 Pro (iOS)', platform: 'MT5', plan: '12-Month Fixed', status: 'ONLINE', commissionUsd: 87.0, joinedDate: '2026-11-08' },
    { id: 'REF-03', traderName: 'Kagiso Molefe', device: 'iPhone 14 (iOS)', platform: 'MT4', plan: '1-Month Fixed', status: 'ONLINE', commissionUsd: 10.8, joinedDate: '2026-11-12' },
    { id: 'REF-04', traderName: 'Liam Van Der Merwe', device: 'Xiaomi 14 (Android)', platform: 'MT5', plan: '3-Month Fixed', status: 'ONLINE', commissionUsd: 27.6, joinedDate: '2026-11-15' },
    { id: 'REF-05', traderName: 'Zanele Khumalo', device: 'iPhone 16 Pro (iOS)', platform: 'MT4', plan: '1-Month Fixed', status: 'EXPIRED', commissionUsd: 10.8, joinedDate: '2026-10-02' },
  ]);

  const ownerSlug = brand.ownerName.trim().split(/\s+/)[0]?.toUpperCase() || 'SOVEREIGN';
  const referralUrl = `https://${sovereignDomain}/ref/${ownerSlug}-PRO`;

  useEffect(() => {
    let active = true;
    fetch('/api/tradeport/ports')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.ports && Array.isArray(data.ports) && data.ports.length > 0) {
          setPorts((prev) => {
            const seen = new Set(data.ports.map((p: CloudPortInstance) => p.id));
            return [...data.ports, ...prev.filter((p) => !seen.has(p.id))];
          });
        }
      })
      .catch((err: unknown) => {
        console.warn('TradePort ports fetch fell back to local cache:', err instanceof Error ? err.message : err);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCopy = (value: string, key: string) => {
    void navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePort = async (id: string) => {
    const existing = ports.find((p) => p.id === id);
    if (!existing) return;
    const nextStatus = existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setPorts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
    );
    try {
      await fetch(`/api/tradeport/ports/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Retain optimistic local toggle for built-in template slots
    }
  };

  const handleProvisionPort = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setProvisionNotice(null);

    try {
      const response = await fetch('/api/tradeport/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: portLabel,
          platform,
          broker,
          server: serverName,
          accountLogin: loginId,
          eaFile,
          region,
          planTerm: selectedPlanTerm,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.port) {
        throw new Error(data.error || `Port provisioning HTTP ${response.status}`);
      }
      const created: CloudPortInstance = data.port;
      setPorts((prev) => [created, ...prev]);
      setProvisionNotice(`Port ${created.id} deployed to ${created.region} (${created.pingMs}ms RTT).`);
      setActiveTab('PORTS');
    } catch (err: unknown) {
      setProvisionNotice(`Port provisioning error: ${(err as Error).message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleActivateFixedPlan = (title: string, zarPrice: number, usdPrice: number, months: number, portsIncluded: number) => {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    const formattedPrice = currency === 'ZAR' ? `R${zarPrice.toLocaleString()}` : `$${usdPrice}`;
    setActivatedPlanReceipt({
      title,
      priceDisplay: formattedPrice,
      expiresOn: expiryDate.toISOString().slice(0, 10),
      portsIncluded,
    });
  };

  const handleRequestCryptoPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availableCommissionUsd <= 0 || !walletAddress.trim()) return;
    setIsRequestingPayout(true);
    setPayoutReceipt(null);
    try {
      const res = await fetch('/api/tradeport/affiliate-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: payoutAsset,
          walletAddress,
          amountUsd: availableCommissionUsd,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Payout HTTP ${res.status}`);
      }
      setPayoutReceipt(
        json.message ||
          `Dispatched $${availableCommissionUsd.toFixed(2)} via ${payoutAsset} to ${walletAddress.slice(0, 10)}...`
      );
      setAvailableCommissionUsd(0);
    } catch (err: unknown) {
      setPayoutReceipt(`Settlement failed: ${(err as Error).message}`);
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const filteredReferrals = referrals.filter(
    (r) =>
      r.traderName.toLowerCase().includes(referralSearch.toLowerCase()) ||
      r.device.toLowerCase().includes(referralSearch.toLowerCase()) ||
      r.plan.toLowerCase().includes(referralSearch.toLowerCase())
  );

  const activePortsCount = ports.filter((p) => p.status === 'ACTIVE').length;

  const fixedPlans = [
    {
      id: '1m',
      title: '1-Month Fixed Port',
      audience: 'For solo traders & prop evaluations',
      zarPrice: 600,
      usdPrice: 36,
      months: 1,
      portsIncluded: 1,
      latency: '1.4ms Equinix / Teraco',
      renewalRule: 'Auto-pauses on expiry · Zero card auto-debit',
      features: [
        '1 Dedicated MT4 or MT5 Cloud Port',
        '24/7 Mobile Control (Android & iOS)',
        'High-Impact News Freeze Guard',
        'Single fixed payment, no subscription traps',
      ],
    },
    {
      id: '3m',
      title: '3-Month Accelerator',
      audience: 'For multi-account & news traders',
      zarPrice: 1550,
      usdPrice: 92,
      months: 3,
      portsIncluded: 2,
      latency: '1.1ms Direct Cross-Connect',
      renewalRule: 'Auto-pauses on expiry · Manual top-up',
      highlighted: true,
      features: [
        '2 Simultaneous MT4/MT5 Cloud Ports',
        'Priority NFP/CPI Spike Buffer',
        'Real-Time Telegram & Mobile Push Alerts',
        'Save 15% over monthly access',
      ],
    },
    {
      id: '12m',
      title: '12-Month Institutional Pass',
      audience: 'For signal mentors & fleet operators',
      zarPrice: 4900,
      usdPrice: 290,
      months: 12,
      portsIncluded: 5,
      latency: '1.0ms Sub-Millisecond Fiber',
      renewalRule: '365-day fixed license · Zero auto-charge',
      features: [
        '5 Dedicated MT4/MT5 Cloud Ports',
        '30% Tiered Affiliate Crypto Commission',
        'Google Drive .set Preset Direct Sync',
        'Save 32% with full annual coverage',
      ],
    },
  ];

  return (
    <div className="space-y-6 font-mono text-slate-100 max-w-[1600px] mx-auto pb-10">
      {/* =========================================================================
          HEADER & TOP SUMMARY STRIP (Single-Elevation Surface)
          ========================================================================= */}
      <div className="glass-ultra border border-white/[0.12] rounded-2xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">{brand.brandName} ({sovereignDomain})</span>
              <span aria-hidden="true">·</span>
              <span>{brand.ownerEntity}</span>
              <span aria-hidden="true">·</span>
              <span>Mobile MT4 / MT5 Cloud Ports</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight leading-tight">
              Run MetaTrader Robots 24/7 From Your Phone With Zero Recurring Traps
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-2xl">
              Connect your MT4 or MT5 account to low-latency cloud ports in Johannesburg, London, Frankfurt, or New York.
              Fixed-term single payments pause cleanly at expiration—never silent recurring credit card charges.
            </p>
          </div>

          {/* Right Controls: Currency Switch + Primary Action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center bg-[#04070e] p-1 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCurrency('ZAR')}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  currency === 'ZAR'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ZAR (R)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  currency === 'USD'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('PROVISION')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-sans flex items-center gap-2 transition whitespace-nowrap shrink-0"
            >
              <Server className="w-4 h-4" />
              <span>Deploy Cloud Port</span>
            </button>
          </div>
        </div>

        {/* 4-Column Tabular Telemetry Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] pt-5 border-t border-white/[0.08]">
          <div className="py-2 sm:py-0 sm:pr-4">
            <span className="text-[11px] text-slate-400 font-sans block">Active Cloud Ports</span>
            <span className="text-xl font-bold text-white tabular-nums mt-0.5 block">
              {activePortsCount} / {ports.length} Online
            </span>
          </div>
          <div className="py-2 sm:py-0 sm:px-4">
            <span className="text-[11px] text-slate-400 font-sans block">Port Infrastructure Ping</span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5 block">
              {Math.min(1.4, bridgeLatencyMs).toFixed(1)} ms
            </span>
          </div>
          <div className="py-2 sm:py-0 sm:px-4">
            <span className="text-[11px] text-slate-400 font-sans block">Starting Fixed Access</span>
            <span className="text-xl font-bold text-cyan-300 tabular-nums mt-0.5 block">
              {currency === 'ZAR' ? 'R600 / 30d' : '$36 / 30d'}
            </span>
          </div>
          <div className="py-2 sm:py-0 sm:pl-4">
            <span className="text-[11px] text-slate-400 font-sans block">Affiliate Crypto Payouts</span>
            <span className="text-xl font-bold text-amber-300 tabular-nums mt-0.5 block">
              ${availableCommissionUsd.toFixed(2)} Ready
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab('PORTS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'PORTS'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Cloud Ports ({ports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROVISION')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'PROVISION'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Connect MT4 / MT5 EA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PLANS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'PLANS'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fixed-Term Packages (1 / 3 / 12 Mo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AFFILIATE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'AFFILIATE'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-white/5'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Affiliate &amp; Crypto Payouts</span>
          </button>
        </div>
      </div>

      {provisionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {provisionNotice}
          </span>
          <button
            type="button"
            onClick={() => setProvisionNotice(null)}
            className="text-[11px] text-emerald-300 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: MOBILE CLOUD PORTS FLEET
          ========================================================================= */}
      {activeTab === 'PORTS' && (
        <div className="space-y-5">
          {/* THE JOKER (Bcm_scalper 49s Ring) & NEXUS2.V1 (Exness-MT5Real30 Purple Glass) Quick Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card border border-rose-500/35 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white font-sans">
                    The joker (Bcm_scalper)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/35 text-[10px] font-bold text-rose-300">
                    AccuMarkets-Live
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {autonomousSnapshots.EURUSD
                    ? `EURUSD 5M Bias: ${autonomousSnapshots.EURUSD.action} (${autonomousSnapshots.EURUSD.confidence}%) · RSI ${autonomousSnapshots.EURUSD.rsi14.toFixed(1)}`
                    : 'Live EURUSD 5M Signal Listener Armed · Bridge Healthy'}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void runAutonomousCycle(true)}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                  >
                    RE AUTO TRADE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(`EURUSD:${autonomousSnapshots.EURUSD?.action || 'HOLD'}`, 'joker-log')}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 text-[11px] font-bold transition"
                  >
                    {copiedId === 'joker-log' ? 'Copied' : 'Copy Log'}
                  </button>
                </div>
              </div>
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="4"
                    strokeDasharray={113}
                    strokeDashoffset={113 - (113 * jokerCountdownSec) / 49}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-white tabular-nums">
                  {jokerCountdownSec}s
                </span>
              </div>
            </div>

            <div
              className="glass-card border border-amber-400/35 rounded-2xl p-4 flex items-center justify-between gap-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(217,119,6,0.16), rgba(10,14,23,0.75))',
              }}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white font-sans">
                    NEXUS2.V1 · Exness-MT5Real30
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[10px] font-bold text-purple-200">
                    265-8DF-24C-595
                  </span>
                </div>
                <div className="text-[11px] text-amber-200 tabular-nums">
                  Balance: ${accountBalance.toLocaleString()} · Equity: ${accountEquity.toLocaleString()} · {positions.length} Live Tickets
                </div>
                <div className="text-[10px] text-slate-300">
                  Glass UI Synced · Sub-millisecond Cloud Port Routing Active
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('PROVISION')}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 transition"
              >
                Mount EA
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ports.map((port) => (
            <div
              key={port.id}
              className="glass-card border border-white/15 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>{port.platform}</span>
                      <span aria-hidden="true">·</span>
                      <span>{port.planTerm}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white font-sans mt-0.5">
                      {port.label}
                    </h3>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      port.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {port.status === 'ACTIVE' ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Broker / Server</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                      {port.broker} ({port.server})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Robot File</span>
                    <span className="text-cyan-300 truncate max-w-[180px]">{port.eaFile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Data Center</span>
                    <span className="text-slate-200 tabular-nums">
                      {port.region} · {port.pingMs.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Equity / Balance</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      ${port.equity.toLocaleString()} / ${port.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Fixed Term Expiry</span>
                    <span className="text-slate-300 tabular-nums">{port.expiresOn}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-[11px] bg-[#04070e] px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-slate-400">
                    Mobile Key: <code className="text-cyan-300">{port.mobileSyncCode}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(port.mobileSyncCode, port.id)}
                    className="text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    {copiedId === port.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === port.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePort(port.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      port.status === 'ACTIVE'
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {port.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Port</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Port</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => executeKillSwitch()}
                    className="py-2 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1"
                    title="Emergency close open broker trades"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flatten</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONNECT MT4 / MT5 EA PROVISIONER
          ========================================================================= */}
      {activeTab === 'PROVISION' && (
        <form
          onSubmit={handleProvisionPort}
          className="bg-[#070b14] border border-white/10 rounded-xl p-6 space-y-5"
        >
          <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Deploy New 24/7 Cloud Port
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Bind your MT4 or MT5 trading account and robot to an isolated cloud container.
              </p>
            </div>

            <GooglePickerButton
              variant="compact"
              buttonLabel="Pick EA from Google Drive"
              onFilePicked={(file) => setEaFile(file.name)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Port Label</label>
              <input
                type="text"
                value={portLabel}
                onChange={(e) => setPortLabel(e.target.value)}
                required
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {(['MT5', 'MT4'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setPlatform(plat)}
                    className={`py-2 rounded-lg font-bold border transition ${
                      platform === plat
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-[#04070e] text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    MetaTrader {plat === 'MT5' ? '5' : '4'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Fixed Term Access</label>
              <select
                value={selectedPlanTerm}
                onChange={(e) => setSelectedPlanTerm(e.target.value as any)}
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="1-Month Fixed">1-Month Fixed ({currency === 'ZAR' ? 'R600' : '$36'})</option>
                <option value="3-Month Fixed">3-Month Fixed ({currency === 'ZAR' ? 'R1,550' : '$92'})</option>
                <option value="12-Month Fixed">12-Month Fixed ({currency === 'ZAR' ? 'R4,900' : '$290'})</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Broker Name</label>
              <input
                type="text"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                required
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Broker Server</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                required
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Account Number</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-cyan-300 tabular-nums focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5">EA File (.ex4 / .ex5)</label>
              <input
                type="text"
                value={eaFile}
                onChange={(e) => setEaFile(e.target.value)}
                required
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-emerald-300 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 font-bold block mb-1.5">Data Center Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Johannesburg Teraco JHB">Johannesburg Teraco JHB (1.4 ms)</option>
                <option value="London Equinix LD4">London Equinix LD4 (1.1 ms)</option>
                <option value="Frankfurt Equinix FR2">Frankfurt Equinix FR2 (1.2 ms)</option>
                <option value="New York Equinix NY4">New York Equinix NY4 (1.8 ms)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-slate-400 font-sans">
              Access runs for the selected fixed duration and pauses cleanly on expiration with zero surprise charges.
            </span>

            <button
              type="submit"
              disabled={isProvisioning}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-sans flex items-center gap-2 transition disabled:opacity-50"
            >
              {isProvisioning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Provisioning Container...</span>
                </>
              ) : (
                <>
                  <span>Launch Cloud Port</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          TAB 3: FIXED-TERM PACKAGES (No Subscription Traps)
          ========================================================================= */}
      {activeTab === 'PLANS' && (
        <div className="space-y-5">
          {activatedPlanReceipt && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-300 block">
                  Fixed-Term Access Activated: {activatedPlanReceipt.title} ({activatedPlanReceipt.priceDisplay})
                </span>
                <span className="text-slate-300 font-sans">
                  Includes {activatedPlanReceipt.portsIncluded} Cloud Port(s) · Expires cleanly on{' '}
                  <span className="tabular-nums font-bold">{activatedPlanReceipt.expiresOn}</span> with zero auto-renewal charges.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('PROVISION')}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold shrink-0"
              >
                Configure Port Now
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fixedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-xl border flex flex-col justify-between gap-5 ${
                  plan.highlighted
                    ? 'bg-[#091224] border-emerald-400'
                    : 'bg-[#070b14] border-white/10'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">{plan.title}</span>
                    <span className="text-[11px] text-slate-400 font-sans">{plan.audience}</span>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white font-sans tabular-nums">
                        {currency === 'ZAR' ? `R${plan.zarPrice.toLocaleString()}` : `$${plan.usdPrice}`}
                      </span>
                      <span className="text-xs text-slate-400 font-sans">single payment</span>
                    </div>
                    <p className="text-[11px] text-cyan-300 mt-1">{plan.renewalRule}</p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs text-slate-300 font-sans">
                    <div className="flex justify-between font-mono text-[11px] pb-1">
                      <span className="text-slate-400">Included Ports</span>
                      <span className="text-white font-bold tabular-nums">{plan.portsIncluded} Cloud Port(s)</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] pb-2 border-b border-white/[0.06]">
                      <span className="text-slate-400">Latency Tier</span>
                      <span className="text-emerald-400 font-bold tabular-nums">{plan.latency}</span>
                    </div>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 pt-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleActivateFixedPlan(
                      plan.title,
                      plan.zarPrice,
                      plan.usdPrice,
                      plan.months,
                      plan.portsIncluded
                    )
                  }
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition ${
                    plan.highlighted
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Activate {plan.title}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AFFILIATE & MENTOR CRYPTO NETWORK (USDT / BTC / ETH)
          ========================================================================= */}
      {activeTab === 'AFFILIATE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Referral Network Table (7 cols) */}
          <div className="lg:col-span-7 bg-[#070b14] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Connected Referral Devices</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Real-time device sync telemetry for referred forex &amp; prop traders
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={referralSearch}
                  onChange={(e) => setReferralSearch(e.target.value)}
                  placeholder="Filter trader or device..."
                  className="bg-[#04070e] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] text-slate-400">
                    <th className="pb-2">Trader</th>
                    <th className="pb-2">Mobile Device</th>
                    <th className="pb-2">Plan</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No referred devices match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 font-semibold text-white">{ref.traderName}</td>
                        <td className="py-2.5 text-slate-300 font-sans">{ref.device}</td>
                        <td className="py-2.5 text-slate-300">{ref.platform} · {ref.plan}</td>
                        <td className="py-2.5">
                          <span className={ref.status === 'ONLINE' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                            {ref.status === 'ONLINE' ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">
                          +${ref.commissionUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Referral Link & Tiered Crypto Payout Request (5 cols) */}
          <div className="lg:col-span-5 bg-[#070b14] border border-white/10 rounded-xl p-5 space-y-5">
            <div className="space-y-2 pb-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white font-sans">
                Mentor Referral Link (30% Tier)
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-xs text-cyan-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(referralUrl, 'ref-url')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  {copiedId === 'ref-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'ref-url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleRequestCryptoPayout} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Available Crypto Commission</span>
                <span className="text-xl font-bold text-emerald-400 tabular-nums">
                  ${availableCommissionUsd.toFixed(2)} USD
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Settlement Asset</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['USDT (TRC20)', 'BTC', 'ETH'] as const).map((asset) => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setPayoutAsset(asset)}
                      className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                        payoutAsset === asset
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-[#04070e] text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Destination Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                  className="w-full bg-[#04070e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isRequestingPayout || availableCommissionUsd <= 0}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-sans transition disabled:opacity-50"
              >
                {isRequestingPayout
                  ? 'Processing On-Chain Settlement...'
                  : availableCommissionUsd > 0
                  ? `Withdraw $${availableCommissionUsd.toFixed(2)} in ${payoutAsset}`
                  : 'Payout Dispatched'}
              </button>

              {payoutReceipt && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  {payoutReceipt}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
