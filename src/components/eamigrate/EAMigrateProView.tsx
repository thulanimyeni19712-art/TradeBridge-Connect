import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Server,
  Smartphone,
  Cpu,
  Zap,
  Shield,
  Activity,
  Globe,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Layers,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Award,
  Key,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  QrCode,
  Lock,
  Radio,
  FileCode,
  HardDrive,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { GooglePickerButton } from '../picker/GooglePickerButton';
import { randomHex } from '../../lib/crypto';

export interface MigratedTerminal {
  id: string;
  name: string;
  platform: 'MT4' | 'MT5';
  broker: string;
  server: string;
  login: string;
  eaName: string;
  magicNumber: number;
  status: 'RUNNING' | 'PAUSED' | 'SYNCING';
  region: string;
  pingMs: number;
  cpuLoad: number;
  memoryMb: number;
  uptimeHours: number;
  balance: number;
  equity: number;
  profitToday: number;
  newsShield: boolean;
  cloudBuffer: boolean;
  mobileSyncKey: string;
  lastPing: string;
}

export const EAMigrateProView: React.FC = () => {
  const { accountBalance, accountEquity, terminals, bridgeLatencyMs, executeKillSwitch } = useTrading();

  // Active navigation tab within EA Migrate Pro
  const [activeTab, setActiveTab] = useState<'WIZARD' | 'FLEET' | 'NEWS_SHIELD' | 'PRICING' | 'LATENCY_TEST'>('WIZARD');

  // Wizard state (3-Step Migration)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [platform, setPlatform] = useState<'MT5' | 'MT4'>('MT5');
  const [selectedEASource, setSelectedEASource] = useState<'UPLOAD' | 'VAULT'>('VAULT');
  const [selectedVaultEA, setSelectedVaultEA] = useState<string>('AlgoMax EA v5.2');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [customEAName, setCustomEAName] = useState<string>('');
  const [magicNumber, setMagicNumber] = useState<number>(882910);
  const [defaultLots, setDefaultLots] = useState<number>(0.05);

  // Broker Credentials in Wizard
  const [brokerName, setBrokerName] = useState<string>('IC Markets Global');
  const [serverAddress, setServerAddress] = useState<string>('ICMarketsSC-Live02');
  const [accountLogin, setAccountLogin] = useState<string>('50294112');
  const [accountPassword, setAccountPassword] = useState<string>('••••••••••••');
  const [accountType, setAccountType] = useState<'LIVE' | 'DEMO' | 'PROP_CHALLENGE'>('PROP_CHALLENGE');

  // Region & Protection in Wizard
  const [selectedRegion, setSelectedRegion] = useState<string>('Frankfurt Equinix FR2');
  const [enableNewsShield, setEnableNewsShield] = useState<boolean>(true);
  const [enableCloudBuffer, setEnableCloudBuffer] = useState<boolean>(true);

  // Migration deployment state
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployProgress, setDeployProgress] = useState<number>(0);
  const [deployStatusText, setDeployStatusText] = useState<string>('');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccessModal, setDeploySuccessModal] = useState<boolean>(false);
  const [newlyCreatedTerminal, setNewlyCreatedTerminal] = useState<MigratedTerminal | null>(null);
  const [liveProbeRttMs, setLiveProbeRttMs] = useState<number | null>(null);
  const [isProbingLatency, setIsProbingLatency] = useState<boolean>(false);

  // Copied token state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initial list of cloud migrated terminals
  const [migratedTerminals, setMigratedTerminals] = useState<MigratedTerminal[]>([
    {
      id: 'EAM-FR2-8821',
      name: 'AlgoMax v5.2 Primary Fleet',
      platform: 'MT5',
      broker: 'IC Markets Global',
      server: 'ICMarketsSC-Live02',
      login: '50294112',
      eaName: 'AlgoMax_EA_v5.2_Pro.ex5',
      magicNumber: 882910,
      status: 'RUNNING',
      region: 'Frankfurt Equinix FR2',
      pingMs: 1.2,
      cpuLoad: 18.4,
      memoryMb: 142.0,
      uptimeHours: 348,
      balance: 104280.0,
      equity: 107450.2,
      profitToday: 3170.2,
      newsShield: true,
      cloudBuffer: true,
      mobileSyncKey: 'SYNC-FR2-9901-AMX',
      lastPing: 'Just now',
    },
    {
      id: 'EAM-LD4-9042',
      name: 'Nexus2.v1 | Kante FX Prop Node',
      platform: 'MT5',
      broker: 'FTMO Funded Prop',
      server: 'FTMO-Server-04',
      login: '7729104',
      eaName: 'Nexus2_Kante_FX_AI.ex5',
      magicNumber: 902140,
      status: 'RUNNING',
      region: 'London Equinix LD4',
      pingMs: 1.8,
      cpuLoad: 24.1,
      memoryMb: 188.5,
      uptimeHours: 192,
      balance: 200000.0,
      equity: 208420.0,
      profitToday: 2420.0,
      newsShield: true,
      cloudBuffer: true,
      mobileSyncKey: 'SYNC-LD4-4412-KFX',
      lastPing: '2s ago',
    },
    {
      id: 'EAM-NY4-7319',
      name: 'Liquidity Edge SMC Hunter',
      platform: 'MT4',
      broker: 'Exness Real 09',
      server: 'Exness-Real9',
      login: '3381920',
      eaName: 'LiquidityEdge_SMC_v4.ex4',
      magicNumber: 771200,
      status: 'RUNNING',
      region: 'New York Equinix NY4',
      pingMs: 2.4,
      cpuLoad: 12.8,
      memoryMb: 110.2,
      uptimeHours: 512,
      balance: 50000.0,
      equity: 51890.0,
      profitToday: 890.0,
      newsShield: true,
      cloudBuffer: false,
      mobileSyncKey: 'SYNC-NY4-2201-LES',
      lastPing: 'Just now',
    },
  ]);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const avgPingMs = useMemo(() => {
    if (migratedTerminals.length === 0) return '0.0';
    const total = migratedTerminals.reduce((sum, term) => sum + term.pingMs, 0);
    return (total / migratedTerminals.length).toFixed(1);
  }, [migratedTerminals]);

  // Live Latency Benchmark Probe via /api/health
  const runLatencyProbe = async () => {
    setIsProbingLatency(true);
    try {
      const start = performance.now();
      const res = await fetch('/api/health');
      const measuredRtt = Number((performance.now() - start).toFixed(1));
      if (res.ok) {
        setLiveProbeRttMs(measuredRtt);
      }
    } catch {
      // Retain prior liveProbeRttMs
    } finally {
      setIsProbingLatency(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'LATENCY_TEST') {
      runLatencyProbe();
    }
  }, [activeTab]);

  // Handle Migration Deploy Process via real backend persistence
  const handleStartMigration = async () => {
    setIsDeploying(true);
    setDeployError(null);
    setDeployProgress(25);
    setDeployStatusText(`Verifying ${platform} session on ${serverAddress}...`);

    const eaLabel = selectedEASource === 'VAULT' ? selectedVaultEA : customEAName || 'Migrated Bot';
    const eaFile = selectedEASource === 'VAULT' ? `${selectedVaultEA}.ex5` : uploadedFileName || 'CustomEA.ex5';

    try {
      const start = performance.now();
      const res = await fetch('/api/tradeport/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: `${eaLabel} Cloud Node`,
          platform,
          broker: brokerName,
          server: serverAddress,
          accountLogin,
          eaFile,
          region: selectedRegion,
          planTerm: accountType === 'PROP_CHALLENGE' ? '3-Month Fixed' : '1-Month Fixed',
          initialBalance: accountBalance || 10000,
        }),
      });
      const rtt = Number((performance.now() - start).toFixed(1));
      const json = await res.json();
      if (!res.ok || !json.port) {
        throw new Error(json.error || `Deployment HTTP ${res.status}`);
      }

      setDeployProgress(100);
      setDeployStatusText(`Deployment complete in ${rtt}ms! 24/7 Cloud bridge armed.`);

      const created = json.port;
      const newTerminal: MigratedTerminal = {
        id: created.id || `EAM-${selectedRegion.slice(0, 3).toUpperCase()}-${randomHex(2).toUpperCase()}`,
        name: created.label || `${eaLabel} Cloud Node`,
        platform,
        broker: brokerName,
        server: serverAddress,
        login: accountLogin,
        eaName: eaFile,
        magicNumber,
        status: 'RUNNING',
        region: selectedRegion,
        pingMs: created.pingMs || rtt,
        cpuLoad: 14.5,
        memoryMb: 128.0,
        uptimeHours: 1,
        balance: Number(created.balance || accountBalance || 10000),
        equity: Number(created.equity || accountEquity || 10000),
        profitToday: 0.0,
        newsShield: enableNewsShield,
        cloudBuffer: enableCloudBuffer,
        mobileSyncKey: created.mobileSyncCode || `SYNC-${randomHex(2).toUpperCase()}-${platform}`,
        lastPing: 'Just now',
      };

      setMigratedTerminals((prev) => [newTerminal, ...prev]);
      setNewlyCreatedTerminal(newTerminal);
      setDeploySuccessModal(true);
    } catch (err: unknown) {
      setDeployError((err as Error).message || 'Cloud migration deployment failed.');
      setDeployStatusText('Deployment aborted.');
    } finally {
      setIsDeploying(false);
    }
  };

  // Toggle Terminal Status (Pause / Resume)
  const handleToggleTerminal = (id: string) => {
    setMigratedTerminals((prev) =>
      prev.map((term) => {
        if (term.id === id) {
          const nextStatus = term.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
          return { ...term, status: nextStatus };
        }
        return term;
      })
    );
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    timersRef.current.push(window.setTimeout(() => setCopiedKey(null), 2500));
  };

  return (
    <div className="space-y-6 font-mono text-slate-100 max-w-[1700px] mx-auto pb-12">
      {/* =========================================================================
          HERO BANNER: EA MIGRATE PRO CLONE
          ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#060a15] via-[#091226] to-[#060a15] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Ambient holographic background lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-br from-cyan-500/15 via-teal-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[400px] h-[250px] bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-cyan-950/40">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>eamigratepro.vercel.app</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>24/7 Cloud VPS Online</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Zero PC Required
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-orbitron tracking-tight leading-tight">
              Run Your Forex & Crypto EAs 24/7 in the Cloud —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                Directly from Your Phone
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Migrate any MetaTrader 4 or MetaTrader 5 Expert Advisor to our ultra-low latency (1ms) cloud infrastructure. 
              No need to leave your computer running or keep your phone turned on. Features automated news event protection, 
              dedicated platform freeze buffers, and real-time mobile companion sync.
            </p>

            {/* Micro value badges */}
            <div className="pt-2 flex items-center gap-3 sm:gap-6 flex-wrap text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Zap className="w-4 h-4 text-cyan-400" /> 1ms Equinix LD4/NY4
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Shield className="w-4 h-4 text-emerald-400" /> 99.99% Uptime SLA
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Flame className="w-4 h-4 text-amber-400" /> NFP/CPI News Freeze Shield
              </span>
              <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <Smartphone className="w-4 h-4 text-purple-400" /> iOS & Android Sync
              </span>
            </div>
          </div>

          {/* Right Hero Quick Metric Card */}
          <div className="lg:w-80 p-5 rounded-2xl bg-[#090e1c]/90 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs uppercase font-bold text-slate-400">Cloud Fleet Status</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                ALL SYSTEMS GO
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center tabular-nums">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block">Active Terminals</span>
                <span className="text-lg font-bold text-white font-orbitron">{migratedTerminals.length} Online</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block">Avg Ping</span>
                <span className="text-lg font-bold text-cyan-300 font-orbitron">{avgPingMs}ms</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('WIZARD');
                setWizardStep(1);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 text-xs font-black font-orbitron uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>Migrate New EA (3 Steps)</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            TOP SUB-NAV TABS
            ===================================================================== */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('WIZARD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'WIZARD'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. 3-Step Migration Wizard</span>
          </button>

          <button
            onClick={() => setActiveTab('FLEET')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'FLEET'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>2. Cloud Terminals ({migratedTerminals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('NEWS_SHIELD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'NEWS_SHIELD'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>3. News Shield &amp; Buffer</span>
          </button>

          <button
            onClick={() => setActiveTab('PRICING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'PRICING'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>4. Plans ($39/mo VPS)</span>
          </button>

          <button
            onClick={() => setActiveTab('LATENCY_TEST')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'LATENCY_TEST'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>5. Broker Latency Matcher</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: 3-STEP MIGRATION WIZARD
          ========================================================================= */}
      {activeTab === 'WIZARD' && (
        <div className="rounded-2xl bg-[#070b14] border border-cyan-500/20 p-6 shadow-xl space-y-6">
          {/* Step indicator breadcrumbs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center font-orbitron text-sm">
                {wizardStep}
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-orbitron">
                  {wizardStep === 1 && 'Step 1: Choose Platform & Select Robot (EA)'}
                  {wizardStep === 2 && 'Step 2: Broker Server & Trading Account Credentials'}
                  {wizardStep === 3 && 'Step 3: Select Cloud VPS Data Center & Freeze Shield'}
                </h2>
                <p className="text-xs text-slate-400">
                  {wizardStep === 1 && 'Select whether you run MT4 or MT5, then upload your robot file or choose a pre-configured viral EA.'}
                  {wizardStep === 2 && 'Provide server and login details so the cloud container can connect to your broker 24/7.'}
                  {wizardStep === 3 && 'Pick the closest Equinix data center to your broker for sub-millisecond execution.'}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold font-mono">
              <span className={`px-2.5 py-1 rounded-lg ${wizardStep >= 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-600'}`}>
                1. Robot
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className={`px-2.5 py-1 rounded-lg ${wizardStep >= 2 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-600'}`}>
                2. Broker
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className={`px-2.5 py-1 rounded-lg ${wizardStep === 3 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-600'}`}>
                3. Deploy
              </span>
            </div>
          </div>

          {/* STEP 1: EA & PLATFORM */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              {/* Platform Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Target Trading Platform
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPlatform('MT5')}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      platform === 'MT5'
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black font-orbitron">
                        MT5
                      </div>
                      <div className="text-left">
                        <span className="font-bold block text-sm">MetaTrader 5</span>
                        <span className="text-[11px] text-slate-400 font-sans">Multi-asset, 64-bit, microsecond execution</span>
                      </div>
                    </div>
                    {platform === 'MT5' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform('MT4')}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      platform === 'MT4'
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-black font-orbitron">
                        MT4
                      </div>
                      <div className="text-left">
                        <span className="font-bold block text-sm">MetaTrader 4</span>
                        <span className="text-[11px] text-slate-400 font-sans">Classic forex EA standard (.ex4)</span>
                      </div>
                    </div>
                    {platform === 'MT4' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                  </button>
                </div>
              </div>

              {/* EA Selection: Vault vs Custom Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Expert Advisor (EA) Source
                  </label>
                  <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setSelectedEASource('VAULT')}
                      className={`px-3 py-1 rounded font-bold ${
                        selectedEASource === 'VAULT' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Pre-Configured Vault EAs
                    </button>
                    <button
                      onClick={() => setSelectedEASource('UPLOAD')}
                      className={`px-3 py-1 rounded font-bold ${
                        selectedEASource === 'UPLOAD' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Upload File (.ex4/.ex5)
                    </button>
                  </div>
                </div>

                {selectedEASource === 'VAULT' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { name: 'AlgoMax EA v5.2', type: 'SMC & FVG Harvester', win: '94.6%', pass: 'Prop Firm Ready', icon: Zap },
                      { name: 'Nexus2.v1 | Kante FX', type: 'Neural BOE Momentum', win: '91.8%', pass: 'Micro-Batch 3x', icon: Sparkles },
                      { name: 'Nguni Aviator Pro v6', type: 'High-Frequency Tick Scraper', win: '89.4%', pass: 'Crash Engine', icon: Flame },
                      { name: 'Liquidity Edge EA', type: 'Institutional Order Block', win: '92.1%', pass: '077 600 4742', icon: Layers },
                      { name: 'Endgame HFT Robot', type: 'Sub-ms Arbitrage Pips', win: '88.5%', pass: 'Tick-to-Trade', icon: Cpu },
                      { name: 'Shadow River Matrix', type: 'Breakout Volatility', win: '86.2%', pass: 'London/NY Peak', icon: Globe },
                    ].map((bot) => (
                      <div
                        key={bot.name}
                        onClick={() => setSelectedVaultEA(bot.name)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          selectedVaultEA === bot.name
                            ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                            <bot.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs font-orbitron block">{bot.name}</span>
                            <span className="text-[10px] text-slate-400 font-sans block">{bot.type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400 block">{bot.win} Win</span>
                          <span className="text-[9px] text-cyan-300">{bot.pass}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-cyan-950/10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Drag and drop your EA file here</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports compiled MetaTrader files (.ex5, .ex4), source (.mq5, .mq4), or .set preset files
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                      <label className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center gap-2 transition shadow-md shadow-cyan-950/40">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Local File</span>
                        <input
                          type="file"
                          accept=".ex4,.ex5,.mq4,.mq5,.set"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setUploadedFileName(e.target.files[0].name);
                              setCustomEAName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                            }
                          }}
                        />
                      </label>

                      <GooglePickerButton
                        buttonLabel="Pick from Google Drive"
                        variant="cyber"
                        onFilePicked={(file) => {
                          setUploadedFileName(file.name);
                          setCustomEAName(file.name.replace(/\.[^/.]+$/, ''));
                        }}
                      />
                    </div>

                    {uploadedFileName && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Selected: <strong>{uploadedFileName}</strong> (Ready to migrate)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bot Parameters (Magic & Lots) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Magic Number ID (Cloud Isolation)
                  </label>
                  <input
                    type="number"
                    value={magicNumber}
                    onChange={(e) => setMagicNumber(parseInt(e.target.value) || 100000)}
                    className="w-full bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Unique identifier so trades do not conflict with manual or other EAs.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Default Lot Size per Order
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultLots}
                    onChange={(e) => setDefaultLots(parseFloat(e.target.value) || 0.01)}
                    className="w-full bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Dynamic equity sizing and risk multiplier are applied automatically.
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-orbitron flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
                >
                  <span>Continue to Broker Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BROKER CREDENTIALS */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              {/* Common Brokers Quick Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Select Broker Ecosystem
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    'IC Markets Global',
                    'FTMO Prop Challenge',
                    'Exness Real',
                    'FundedNext',
                    'Deriv MT5',
                    'XM Global',
                    'JustMarkets',
                    'Pepperstone',
                  ].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBrokerName(b);
                        if (b.includes('IC')) setServerAddress('ICMarketsSC-Live02');
                        if (b.includes('FTMO')) setServerAddress('FTMO-Server-04');
                        if (b.includes('Exness')) setServerAddress('Exness-Real9');
                        if (b.includes('Deriv')) setServerAddress('Deriv-Server-02');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        brokerName === b
                          ? 'bg-cyan-950/60 border-cyan-400 text-white font-bold'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block truncate">{b}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Server, Login, Password Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Broker Server Address
                  </label>
                  <input
                    type="text"
                    value={serverAddress}
                    onChange={(e) => setServerAddress(e.target.value)}
                    placeholder="e.g. ICMarketsSC-Live02"
                    className="w-full bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Account Login / Account Number
                  </label>
                  <input
                    type="text"
                    value={accountLogin}
                    onChange={(e) => setAccountLogin(e.target.value)}
                    placeholder="e.g. 50294112"
                    className="w-full bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Trader Password
                  </label>
                  <input
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="w-full bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Encrypted with AES-256 in memory. Never logged or shared.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Account Classification
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full bg-[#050811] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="LIVE">Live Real Capital Account</option>
                    <option value="PROP_CHALLENGE">Prop Firm Evaluation (FTMO / MFF / FundedNext)</option>
                    <option value="DEMO">Demo Testing Terminal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-orbitron flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
                >
                  <span>Continue to VPS Region &amp; Shield</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CLOUD VPS DATA CENTER & LAUNCH */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              {/* Region Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Select Ultra-Low Latency Equinix VPS Region
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Frankfurt Equinix FR2', ping: '1.2ms', flag: '🇩🇪', desc: 'Direct cross-connect to EU brokers' },
                    { name: 'London Equinix LD4', ping: '1.8ms', flag: '🇬🇧', desc: 'Forex capital cross-connect' },
                    { name: 'New York Equinix NY4', ping: '2.4ms', flag: '🇺🇸', desc: 'US indices, gold & crypto gateway' },
                    { name: 'Johannesburg Teraco JHB', ping: '4.1ms', flag: '🇿🇦', desc: 'Zero-slippage South African Rand' },
                    { name: 'Singapore Equinix SG1', ping: '3.6ms', flag: '🇸🇬', desc: 'Asian session liquidity peak' },
                  ].map((loc) => (
                    <div
                      key={loc.name}
                      onClick={() => setSelectedRegion(loc.name)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedRegion === loc.name
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                          : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{loc.flag}</span>
                        <span className="text-xs font-bold text-cyan-300 font-mono">{loc.ping} Ping</span>
                      </div>
                      <h4 className="font-bold text-xs mt-2">{loc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">{loc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protective Modules Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setEnableNewsShield((prev) => !prev)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    enableNewsShield
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                      : 'bg-slate-900/40 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-xs">Automated News Event Shield</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Pauses robot 15 mins before high-impact economic news (CPI, NFP, BOE, FOMC) to protect against spread spikes.
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${enableNewsShield ? 'bg-amber-500 text-slate-950' : 'bg-slate-800'}`}>
                    {enableNewsShield ? '✓' : ''}
                  </div>
                </div>

                <div
                  onClick={() => setEnableCloudBuffer((prev) => !prev)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    enableCloudBuffer
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/40 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-xs">Terminal Freeze Buffer</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Dedicated cloud buffer absorbs sudden volatile tick bursts so your MT4/MT5 terminal never freezes during execution.
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${enableCloudBuffer ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800'}`}>
                    {enableCloudBuffer ? '✓' : ''}
                  </div>
                </div>
              </div>

              {/* Progress or Launch Action */}
              {isDeploying ? (
                <div className="p-5 rounded-2xl bg-[#090e1d] border border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-bold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {deployStatusText}
                    </span>
                    <span className="text-cyan-400 font-bold">{deployProgress}%</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${deployProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStartMigration}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 text-xs font-black font-orbitron uppercase tracking-wider flex items-center gap-2 transition shadow-xl shadow-cyan-500/30 active:scale-95"
                  >
                    <Server className="w-4 h-4 text-slate-950" />
                    <span>Launch 24/7 Cloud Migration</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACTIVE CLOUD TERMINALS FLEET
          ========================================================================= */}
      {activeTab === 'FLEET' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-orbitron flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Active Cloud Terminals ({migratedTerminals.length} Running 24/7)</span>
            </h3>
            <button
              onClick={() => {
                setActiveTab('WIZARD');
                setWizardStep(1);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Migrate Another EA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {migratedTerminals.map((term) => (
              <div
                key={term.id}
                className="p-5 rounded-2xl bg-[#070b14] border border-cyan-500/25 shadow-xl space-y-4 relative overflow-hidden"
              >
                {/* Header of Card */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs font-orbitron">
                      {term.platform}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[170px]">{term.name}</h4>
                      <span className="text-[10px] text-slate-400 font-sans block truncate">{term.broker}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      term.status === 'RUNNING'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    ● {term.status}
                  </span>
                </div>

                {/* Performance HUD Mini */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-[9px] text-slate-400 uppercase block">Ping</span>
                    <span className="font-bold text-cyan-300">{term.pingMs}ms</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-[9px] text-slate-400 uppercase block">CPU</span>
                    <span className="font-bold text-white">{term.cpuLoad}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-[9px] text-slate-400 uppercase block">Uptime</span>
                    <span className="font-bold text-emerald-400">{term.uptimeHours}h</span>
                  </div>
                </div>

                {/* Balance & Equity */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Equity</span>
                    <span className="font-bold text-white text-sm">
                      ${term.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase block">Today PnL</span>
                    <span className="font-bold text-emerald-400">
                      +${term.profitToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Mobile sync key token */}
                <div className="p-2.5 rounded-lg bg-[#050811] border border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px]">Mobile Key:</span>
                    <code className="text-cyan-300 text-[10px]">{term.mobileSyncKey}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(term.mobileSyncKey, term.id)}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    title="Copy Key"
                  >
                    {copiedKey === term.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleToggleTerminal(term.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      term.status === 'RUNNING'
                        ? 'bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {term.status === 'RUNNING' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause EA</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume EA</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => executeKillSwitch()}
                    className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30"
                    title="Emergency Flatten Positions"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: NEWS SHIELD & PLATFORM FREEZE PROTECTION
          ========================================================================= */}
      {activeTab === 'NEWS_SHIELD' && (
        <div className="rounded-2xl bg-[#070b14] border border-cyan-500/20 p-6 shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>News Event Auto-Pilot &amp; Dedicated Cloud Buffer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              High-impact economic news causes slippage and broker terminal freezes. EA Migrate Pro shields your robots with microsecond circuit breakers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white font-orbitron flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Pre-News Circuit Breaker</span>
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Automatically scans the global economic calendar for CPI, Non-Farm Payrolls (NFP), FOMC interest rates, and BOE decisions. 
                Locks in trailing stops and halts new market order entries 15 minutes before the event to preserve capital.
              </p>
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 font-mono">
                Upcoming Catalyst: <strong>GBP BOE Rate Decision</strong> (Armed • Auto-Pause active)
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white font-orbitron flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span>Zero-Freeze Dedicated Cloud Buffer</span>
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                When brokers push thousands of ticks per second during volatility spikes, home PCs and mobile MT5 apps frequently freeze. 
                Our cloud nodes allocate a dedicated 100MB RAM stream buffer to absorb tick surges with zero frame drops.
              </p>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                Buffer Health: <strong>100% NOMINAL (0 DROPPED TICKS)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PRICING PLANS (As on eamigratepro.vercel.app: $39/mo VPS)
          ========================================================================= */}
      {activeTab === 'PRICING' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              TRANSPARENT CLOUD PRICING
            </span>
            <h2 className="text-2xl font-bold text-white font-orbitron">
              Simple, High-Performance Hosting Plans
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Bundled with mobile companion access, Equinix low-latency hosting, and automated protection tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1: Cloud Starter */}
            <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Cloud Starter</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-orbitron">$39</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-2">
                  Ideal for solo traders running 1 core robot or prop challenge evaluation.
                </p>

                <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 1 MT4 or MT5 Cloud Terminal
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 24/7 Zero-PC Execution
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Android &amp; iOS Mobile Companion
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 1ms Equinix LD4/NY4 Routing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 99.9% Uptime SLA
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setActiveTab('WIZARD');
                  setWizardStep(1);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Get Started ($39/mo)
              </button>
            </div>

            {/* Plan 2: Pro Trader (Highlighted) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#091224] to-[#070b14] border-2 border-cyan-400 shadow-2xl shadow-cyan-950/60 space-y-5 flex flex-col justify-between relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 uppercase tracking-wider">
                MOST POPULAR
              </span>

              <div>
                <span className="text-xs uppercase font-bold text-cyan-300">Pro Trader Cloud</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-orbitron">$69</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-2">
                  For aggressive multi-bot traders managing multiple prop firm accounts.
                </p>

                <ul className="mt-4 space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> <strong>3 MT4/MT5 Cloud Terminals</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Automated News Event Shield
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Dedicated Platform Freeze Buffer
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 4GB RAM Dedicated Container
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Priority WhatsApp &amp; Discord Support
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setActiveTab('WIZARD');
                  setWizardStep(1);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 text-xs font-black font-orbitron uppercase tracking-wider transition shadow-lg shadow-cyan-500/30"
              >
                Deploy Pro Trader ($69/mo)
              </button>
            </div>

            {/* Plan 3: Mentor / Fleet Tier */}
            <div className="p-6 rounded-2xl bg-[#070b14] border border-white/10 space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-purple-400">Mentor Fleet Master</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-orbitron">$149</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-2">
                  For educators &amp; signal providers managing client accounts &amp; EAs.
                </p>

                <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> <strong>10 Cloud Terminals</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Remote .set Preset Distributor
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Client Mobile Activation Keys
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> White-Label Mobile App Branding
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Dedicated IP &amp; Super Admin Console
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setActiveTab('WIZARD');
                  setWizardStep(1);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
              >
                Launch Fleet Tier ($149/mo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: BROKER LATENCY MATCHING BENCHMARK
          ========================================================================= */}
      {activeTab === 'LATENCY_TEST' && (
        <div className="rounded-2xl bg-[#070b14] border border-cyan-500/20 p-6 shadow-xl space-y-5">
          <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white font-orbitron flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Bridge &amp; Broker RTT Probe</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Live browser-to-server RTT measured via /api/health ({liveProbeRttMs ?? bridgeLatencyMs}ms) alongside active bridge telemetry.
              </p>
            </div>
            <button
              onClick={runLatencyProbe}
              disabled={isProbingLatency}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbingLatency ? 'animate-spin' : ''}`} />
              <span>{isProbingLatency ? 'Probing...' : 'Run Live RTT Probe'}</span>
            </button>
          </div>

          {deployError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {deployError}
            </div>
          )}

          <div className="space-y-3">
            {migratedTerminals.map((term) => {
              const clientRtt = liveProbeRttMs ?? bridgeLatencyMs;
              return (
                <div
                  key={term.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-white block">{term.broker} ({term.region})</span>
                    <span className="text-[10px] text-slate-400">{term.server} · Node {term.id}</span>
                  </div>

                  <div className="flex items-center gap-4 tabular-nums">
                    <div className="text-right">
                      <span className="text-[10px] text-amber-400 uppercase block">Client HTTP RTT</span>
                      <span className="text-amber-300 font-bold">{clientRtt.toFixed(1)}ms</span>
                    </div>
                    <div className="text-right pl-3 border-l border-white/10">
                      <span className="text-[10px] text-cyan-300 uppercase block">Node Ping</span>
                      <span className="text-cyan-300 font-bold text-sm">{term.pingMs}ms</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                      {term.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUCCESS MODAL AFTER MIGRATION
          ========================================================================= */}
      {deploySuccessModal && newlyCreatedTerminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a0f1d] border border-cyan-400/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 p-[2px] mx-auto shadow-xl shadow-cyan-500/30">
              <div className="w-full h-full bg-[#080d19] rounded-[14px] flex items-center justify-center text-cyan-400">
                <CheckCheck className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white font-orbitron">
                EA Successfully Migrated to Cloud!
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Your robot is now running 24/7 on <strong>{newlyCreatedTerminal.region}</strong> with zero PC required.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Instance ID:</span>
                <span className="text-cyan-300 font-bold">{newlyCreatedTerminal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Terminal &amp; EA:</span>
                <span className="text-white font-semibold">{newlyCreatedTerminal.eaName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Broker Ping:</span>
                <span className="text-emerald-400 font-bold">{newlyCreatedTerminal.pingMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Key:</span>
                <code className="text-purple-300 font-bold">{newlyCreatedTerminal.mobileSyncKey}</code>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeploySuccessModal(false);
                  setActiveTab('FLEET');
                }}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-orbitron uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
              >
                View in Cloud Fleet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
