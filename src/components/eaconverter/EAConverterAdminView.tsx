import React, { useState, useRef, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { ConvertedEA, MobileActivation } from '../../types/trading';
import {
  Smartphone,
  Globe,
  QrCode,
  Users,
  Cpu,
  Layers,
  Code,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Power,
  RefreshCw,
  Plus,
  Play,
  Download,
  Settings,
  Edit3,
  ExternalLink,
  Shield,
  Activity,
  Zap,
  ArrowRight,
  TrendingUp,
  FileCode,
  Flame,
  Palette,
} from 'lucide-react';

export const EAConverterAdminView: React.FC = () => {
  const {
    convertedEAs,
    mobileActivations,
    brandConfig,
    updateBrandConfig,
    convertEACode,
    issueMobileActivation,
    revokeMobileActivation,
    toggleMobileActivationStatus,
  } = useTrading();

  // Sub-tabs in EA-Converter Admin
  const [adminTab, setAdminTab] = useState<'HOME' | 'RENAME_BRAND' | 'MOBILE_ACTIVATIONS' | 'CONVERTER_STUDIO'>('HOME');

  // Rename / Rebrand form state
  const [brandName, setBrandName] = useState<string>(brandConfig.brandName);
  const [mentorId, setMentorId] = useState<string>(brandConfig.mentorId);
  const [tagline, setTagline] = useState<string>(brandConfig.tagline);
  const [mobileAppName, setMobileAppName] = useState<string>(brandConfig.mobileAppName);
  const [supportHandle, setSupportHandle] = useState<string>(brandConfig.supportHandle);
  const [customDomain, setCustomDomain] = useState<string>(brandConfig.customDomain);
  const [primaryColor, setPrimaryColor] = useState<string>(brandConfig.primaryColor);
  const [brandSavedToast, setBrandSavedToast] = useState<boolean>(false);

  // New Mobile Activation Modal/Form
  const [isAddingMobile, setIsAddingMobile] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newBroker, setNewBroker] = useState<string>('ThinkMarkets Emerge');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newDeviceType, setNewDeviceType] = useState<MobileActivation['deviceType']>('iOS iPhone');
  const [selectedEA, setSelectedEA] = useState<string>(convertedEAs[0]?.name || 'Endgame_HFT_Mobile_V4');
  const [createdActivation, setCreatedActivation] = useState<MobileActivation | null>(null);

  // Converter Studio State
  const [eaInputName, setEaInputName] = useState<string>('Endgame_Scalper_Mobile');
  const [sourceFormat, setSourceFormat] = useState<ConvertedEA['originalFormat']>('MT4_EX4');
  const [targetFormat, setTargetFormat] = useState<ConvertedEA['targetFormat']>('MOBILE_CLOUD_ENGINE');
  const [codeSnippet, setCodeSnippet] = useState<string>(
`//+------------------------------------------------------------------+
//| EasyWay2Trade • Endgame HFT Algorithmic Engine                    |
//| Converted for Mobile Cloud Execution (No VPS Needed)              |
//+------------------------------------------------------------------+
#property copyright "EasyWay2Trade / AlgoTrade Matrix"
#property link      "https://ea-converter.com"
#property version   "4.21"

input double InpRiskPercent = 1.0;     // Risk Percentage per trade
input double InpMaxDailyLoss = 4.0;    // Emerge Prop 4% Daily Loss Guard
input bool   InpUseSMC_FVG   = true;   // ICT Fair Value Gap Filter
input int    InpMagicNumber  = 883921; // Cloud Mentor Sync Magic

void OnTick() {
    // Mobile cloud heartbeat signal transmission
    if(IsNewBar()) {
        ExecuteMatrixCloudSignal(_Symbol, InpRiskPercent);
    }
}`
  );
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);

  // Helper copy text & timer cleanup
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandConfig({
      brandName,
      mentorId,
      tagline,
      mobileAppName,
      supportHandle,
      customDomain,
      primaryColor,
    });
    setBrandSavedToast(true);
    const t = window.setTimeout(() => setBrandSavedToast(false), 3000);
    timersRef.current.push(t);
  };

  const handleCreateActivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newAccountNumber) return;

    const act = issueMobileActivation(
      newClientName,
      newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '')}@client.io`,
      newBroker,
      newAccountNumber,
      selectedEA,
      newDeviceType
    );

    setCreatedActivation(act);
    setNewClientName('');
    setNewClientEmail('');
    setNewAccountNumber('');
  };

  const handleRunConversion = async () => {
    setIsConverting(true);
    setConversionSuccess(null);

    try {
      const result = await convertEACode(eaInputName, sourceFormat, targetFormat);
      setConversionSuccess(`EA "${result.name}" compiled & converted to ${result.targetFormat} for mobile deployment.`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    const t = window.setTimeout(() => setCopiedKey(null), 2000);
    timersRef.current.push(t);
  };

  const totalClients = mobileActivations.length;
  const activeClients = mobileActivations.filter((m) => m.status === 'ACTIVE').length;
  const totalClientDailyProfit = mobileActivations.reduce((acc, m) => acc + m.profitToday, 0);

  return (
    <div className="space-y-6">
      {/* Portal URL Status Bar for /admin/home/ */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSL Encrypted</span>
          </span>
        </div>

        <div className="flex-1 max-w-xl mx-2 bg-[#121824] border border-slate-700/80 rounded-lg px-3 py-1 text-slate-200 text-[11px] truncate flex items-center justify-between">
          <span>https://{brandConfig.customDomain}/admin/home/</span>
          <span className="text-[10px] text-cyan-400 font-bold">LIVE MENTOR PORTAL</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Mentor ID:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
            {brandConfig.mentorId}
          </span>
        </div>
      </div>

      {/* Top Banner & Rename / Rebrand Indicator */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0d1627] via-[#09111e] to-[#17102b] border border-cyan-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>{brandConfig.brandName} • Admin Control Center</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {brandConfig.brandName} Mobile Admin Suite
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {brandConfig.tagline}. Run desktop MetaTrader EAs (.ex4/.ex5) on your clients' iPhones and Android devices with zero local VPS required. Issue mobile license keys and manage your trading community under your own brand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setAdminTab('RENAME_BRAND')}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition shadow-lg shadow-cyan-950/40 flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rename & Rebrand Platform</span>
            </button>
            <button
              onClick={() => setAdminTab('CONVERTER_STUDIO')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-1.5"
            >
              <Code className="w-4 h-4" />
              <span>Convert New EA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 font-mono text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setAdminTab('HOME')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[40px] ${
            adminTab === 'HOME'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Admin Home (/admin/home/)</span>
        </button>

        <button
          onClick={() => setAdminTab('RENAME_BRAND')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[40px] ${
            adminTab === 'RENAME_BRAND'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Rename &amp; White-label Brand</span>
        </button>

        <button
          onClick={() => setAdminTab('MOBILE_ACTIVATIONS')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[40px] tabular-nums ${
            adminTab === 'MOBILE_ACTIVATIONS'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Activations ({mobileActivations.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('CONVERTER_STUDIO')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[40px] tabular-nums ${
            adminTab === 'CONVERTER_STUDIO'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>EA Converter Engine ({convertedEAs.length})</span>
        </button>
      </div>

      {/* Tab 1: Admin Home Overview */}
      {adminTab === 'HOME' && (
        <div className="space-y-6">
          {/* Key Admin Telemetry Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs tabular-nums">
            <div className="p-4 bg-[#0e121a] border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Total Mobile Clients</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{totalClients} Users</div>
              <div className="text-[10px] text-emerald-400">
                {activeClients} Active & Executing
              </div>
            </div>

            <div className="p-4 bg-[#0e121a] border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Converted Mobile EAs</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{convertedEAs.length} Ready</div>
              <div className="text-[10px] text-cyan-400">
                Bytecode Cloud Executable
              </div>
            </div>

            <div className="p-4 bg-[#0e121a] border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Client Profits Today</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {totalClientDailyProfit >= 0 ? `+$${totalClientDailyProfit.toFixed(2)}` : `-$${Math.abs(totalClientDailyProfit).toFixed(2)}`}
              </div>
              <div className="text-[10px] text-slate-400">
                Across All Connected Accounts
              </div>
            </div>

            <div className="p-4 bg-[#0e121a] border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Push Gateway Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1">APNs / FCM</div>
              <div className="text-[10px] text-emerald-400">
                iOS & Android 100% Synced
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Client Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* Left 2 Cols: Recent Mobile Activations */}
            <div className="lg:col-span-2 bg-[#0b0e14] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Recent Mobile App Activations</span>
                </h4>
                <button
                  onClick={() => setAdminTab('MOBILE_ACTIVATIONS')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {mobileActivations.slice(0, 3).map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 bg-[#101520] border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{act.clientName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {act.deviceType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Broker: <span className="text-slate-200">{act.broker}</span> (#{act.accountNumber})
                      </div>
                      <div className="text-[10px] text-slate-500">EA: {act.eaAssigned}</div>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className={`text-xs font-bold ${act.profitToday >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {act.profitToday >= 0 ? `+$${act.profitToday.toFixed(2)}` : `-$${Math.abs(act.profitToday).toFixed(2)}`}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                          act.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Mentor Activation QR & Share */}
            <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>Client Mobile Onboarding</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Send this QR code or link to your clients to instantly connect their mobile trading app to your {brandConfig.brandName} cloud server.
                </p>

                {/* Activation QR Preview Box */}
                <div className="my-4 p-4 bg-white rounded-xl flex items-center justify-center max-w-[160px] mx-auto shadow-lg">
                  <div className="w-28 h-28 border-4 border-slate-900 grid grid-cols-4 grid-rows-4 p-1 gap-1">
                    <div className="bg-slate-900 col-span-2 row-span-2" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900 col-span-2 row-span-2" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900" />
                  </div>
                </div>

                <div className="bg-[#121622] p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 break-all">
                  eaconverter://activate?mentor={brandConfig.mentorId}
                </div>
              </div>

              <button
                onClick={() => handleCopy(`eaconverter://activate?mentor=${brandConfig.mentorId}`)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {copiedKey === `eaconverter://activate?mentor=${brandConfig.mentorId}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Activation Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Client Mobile Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: RENAME & WHITE-LABEL BRAND (User requested: "clone n rename") */}
      {adminTab === 'RENAME_BRAND' && (
        <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <span>White-Label & Re-name Customizer ("Rename" Studio)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rebrand the entire platform, mobile app title, mentor identifier, and support URLs. Changes take effect across all client screens in real time.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              White-label Engine Active
            </span>
          </div>

          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">
                  Platform / Brand Name ("Rename")
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Apex EA Converter"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">
                  Mentor ID Code
                </label>
                <input
                  type="text"
                  required
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  placeholder="e.g. MTR-88392"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3.5 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">
                  Mobile App Title (Shown on Client Phones)
                </label>
                <input
                  type="text"
                  required
                  value={mobileAppName}
                  onChange={(e) => setMobileAppName(e.target.value)}
                  placeholder="e.g. Matrix Mobile Trader"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">
                  Custom Domain Slug
                </label>
                <input
                  type="text"
                  required
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. ea-converter.com or mydomain.com"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">
                  Tagline / Description
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Mobile Trading Automation & Cloud EA Hosting"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">
                  Telegram / Support Handle
                </label>
                <input
                  type="text"
                  value={supportHandle}
                  onChange={(e) => setSupportHandle(e.target.value)}
                  placeholder="e.g. @MyMentorSupport"
                  className="w-full bg-[#121622] border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>

            {brandSavedToast && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Brand settings updated! Platform renamed to "{brandName}".</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-950/40 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Apply New Name Everywhere</span>
              </button>
            </div>
          </form>

          {/* Live Mobile App Client Preview with New Name */}
          <div className="pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Live Client Mobile App Interface Preview (White-Labeled)
            </h4>

            <div className="max-w-xs mx-auto bg-[#080c14] border-4 border-slate-700 rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-[9px]">
                    EA
                  </div>
                  <span className="font-bold text-slate-100">{mobileAppName}</span>
                </div>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>

              <div className="bg-[#101622] p-3 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-500 block">Mentor Active</span>
                <span className="text-xs font-bold text-cyan-300">{brandName}</span>
                <div className="text-[9px] text-slate-400">ID: {mentorId}</div>
              </div>

              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-300 text-center">
                ✓ Cloud Trading Connected • 0 VPS Needed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mobile Activations Manager */}
      {adminTab === 'MOBILE_ACTIVATIONS' && (
        <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <span>Mobile Client Activations Manager</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Issue activation keys for mobile devices, monitor client terminal health, and pause/resume trading remotely.
              </p>
            </div>

            <button
              onClick={() => setIsAddingMobile(!isAddingMobile)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Mobile Activation Key</span>
            </button>
          </div>

          {/* Form to issue activation */}
          {isAddingMobile && (
            <form onSubmit={handleCreateActivation} className="bg-[#111622] border border-cyan-500/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100">New Mobile App License Provisioning</span>
                <button type="button" onClick={() => setIsAddingMobile(false)} className="text-slate-400 hover:text-slate-200">
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Smith"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="jordan@apex.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Broker & Server</label>
                  <input
                    type="text"
                    value={newBroker}
                    onChange={(e) => setNewBroker(e.target.value)}
                    className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7749102"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Target Device</label>
                  <select
                    value={newDeviceType}
                    onChange={(e) => setNewDeviceType(e.target.value as MobileActivation['deviceType'])}
                    className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="iOS iPhone">iOS iPhone</option>
                    <option value="Android Mobile">Android Mobile</option>
                    <option value="Cloud Web">Cloud Web</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Assign Converted EA</label>
                  <select
                    value={selectedEA}
                    onChange={(e) => setSelectedEA(e.target.value)}
                    className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    {convertedEAs.map((ea) => (
                      <option key={ea.id} value={ea.name}>{ea.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition"
              >
                Generate Key & QR Code
              </button>
            </form>
          )}

          {createdActivation && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span>Activation Key Created for {createdActivation.clientName}!</span>
                <button onClick={() => setCreatedActivation(null)} className="text-xs text-slate-400 hover:text-slate-200">Dismiss</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-mono bg-black/60 px-3 py-1.5 rounded-lg border border-slate-700">
                  {createdActivation.activationKey}
                </span>
                <button
                  onClick={() => handleCopy(createdActivation.activationKey)}
                  className="px-3 py-1.5 bg-slate-800 text-xs rounded hover:bg-slate-700"
                >
                  {copiedKey === createdActivation.activationKey ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>
          )}

          {/* Activations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Activation Key</th>
                  <th className="py-3 px-3">Device</th>
                  <th className="py-3 px-3">Broker Account</th>
                  <th className="py-3 px-3">EA Assigned</th>
                  <th className="py-3 px-3">Today PnL</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mobileActivations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100">{m.clientName}</div>
                      <div className="text-[10px] text-slate-500">{m.clientEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-300 font-bold">{m.activationKey}</span>
                        <button onClick={() => handleCopy(m.activationKey)} className="text-slate-500 hover:text-slate-200">
                          {copiedKey === m.activationKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {m.deviceType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{m.broker}</div>
                      <div className="text-[10px] text-slate-500">#{m.accountNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{m.eaAssigned}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold tabular-nums ${m.profitToday >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.profitToday >= 0 ? `+$${m.profitToday.toFixed(2)}` : `-$${Math.abs(m.profitToday).toFixed(2)}`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : m.status === 'PAUSED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleMobileActivationStatus(m.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            m.status === 'ACTIVE'
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                          }`}
                        >
                          {m.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => revokeMobileActivation(m.id)}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded border border-rose-500/30 text-[10px] font-bold transition"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: EA Converter Engine */}
      {adminTab === 'CONVERTER_STUDIO' && (
        <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span>EA Bytecode Converter & Packaging Studio</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Convert MetaTrader 4 (.ex4/.mq4), MT5 (.ex5/.mq5), or PineScript algorithms into mobile-executable cloud bots.
              </p>
            </div>
            <span className="text-xs text-cyan-400 font-bold">Compiler: LLVM MQL-to-Wasm v4.2</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Config & Code */}
            <div className="bg-[#111622] border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>Algorithm Conversion Configuration</span>
              </h4>

              <div>
                <label className="text-slate-400 block mb-1">Target Robot Output Name</label>
                <input
                  type="text"
                  value={eaInputName}
                  onChange={(e) => setEaInputName(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Source Format</label>
                  <select
                    value={sourceFormat}
                    onChange={(e) => setSourceFormat(e.target.value as ConvertedEA['originalFormat'])}
                    className="w-full bg-[#161c2b] border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="MT4_EX4">MetaTrader 4 (.ex4 / .mq4)</option>
                    <option value="MT5_EX5">MetaTrader 5 (.ex5 / .mq5)</option>
                    <option value="PINESCRIPT">TradingView PineScript v5</option>
                    <option value="PYTHON_BOT">Python ccxt Strategy</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Target Architecture</label>
                  <select
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value as ConvertedEA['targetFormat'])}
                    className="w-full bg-[#161c2b] border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="MOBILE_CLOUD_ENGINE">Mobile Cloud Engine (Zero VPS)</option>
                    <option value="WEBHOOK_BRIDGE">Direct Webhook DMA Bridge</option>
                    <option value="MT5_UNIVERSAL">Universal Multi-Broker Package</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MQL4 / MQL5 / PineScript Source Code:</label>
                <textarea
                  rows={9}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-3 text-cyan-300 text-[11px] font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {conversionSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{conversionSuccess}</span>
                </div>
              )}

              <button
                onClick={handleRunConversion}
                disabled={isConverting}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider font-mono rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling & Packaging Bytecode...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Compile & Convert to Mobile Cloud EA</span>
                  </>
                )}
              </button>
            </div>

            {/* Converted EAs Library */}
            <div className="bg-[#111622] border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Ready-To-Deploy Converted EAs ({convertedEAs.length})</span>
              </h4>

              <div className="space-y-3">
                {convertedEAs.map((ea) => (
                  <div
                    key={ea.id}
                    className="p-4 bg-[#0d121c] border border-slate-800 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{ea.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {ea.version}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">{ea.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Source:</span>
                        <span className="text-slate-200">{ea.originalFormat}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Target:</span>
                        <span className="text-emerald-400 font-bold">{ea.targetFormat}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Active Mobile Users:</span>
                        <span className="text-cyan-300 font-bold">{ea.activeUsers}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">File Size:</span>
                        <span className="text-slate-300">{ea.fileSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span>Checksum: {ea.checksum}</span>
                      <span>Updated: {ea.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
