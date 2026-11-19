import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  ShieldCheck,
  Key,
  Lock,
  Download,
  Plus,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Search,
  RotateCcw,
} from 'lucide-react';
import { randomHex } from '../../lib/crypto';

export const EAVaultView: React.FC = () => {
  const { licenses, presets, generateLicense, revokeLicense, downloadPreset } = useTrading();

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedRobot, setSelectedRobot] = useState<string>('Endgame Forex Robot');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [hwid, setHwid] = useState<string>('');
  const [daysValid, setDaysValid] = useState<number>(365);

  const [licenseSearch, setLicenseSearch] = useState<string>('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewPreset, setPreviewPreset] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const filteredLicenses = useMemo(() => {
    const q = licenseSearch.trim().toLowerCase();
    return licenses.filter((lic) => {
      const matchesStatus = licenseStatusFilter === 'ALL' || lic.status === licenseStatusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        lic.key.toLowerCase().includes(q) ||
        lic.robotName.toLowerCase().includes(q) ||
        lic.clientName.toLowerCase().includes(q) ||
        lic.clientEmail.toLowerCase().includes(q) ||
        lic.accountNumber.toLowerCase().includes(q) ||
        lic.hwid.toLowerCase().includes(q)
      );
    });
  }, [licenses, licenseSearch, licenseStatusFilter]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) return;

    generateLicense(
      selectedRobot,
      clientName || 'Valued Trader',
      clientEmail || 'trader@propfirm.io',
      accountNumber,
      hwid || `HWID-${randomHex(2).toUpperCase()}-42BA`,
      daysValid
    );

    setIsGenerating(false);
    setClientName('');
    setClientEmail('');
    setAccountNumber('');
    setHwid('');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    const t = window.setTimeout(() => setCopiedKey(null), 2000);
    timersRef.current.push(t);
  };

  const handleDownloadPreset = (id: string, title: string) => {
    downloadPreset(id);
    setDownloadToast(`Downloaded verified .SET preset: ${title}`);
    const t = window.setTimeout(() => setDownloadToast(null), 3500);
    timersRef.current.push(t);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0a1626] via-[#09101c] to-[#160d26] border border-cyan-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>EA-Vault.com • Encrypted Licensing & Verified Preset Vault</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Cryptographic MQL4/MQL5 License Protection & Strategy Repository
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Lock Expert Advisors to specific MT4/MT5 account numbers and Hardware IDs (HWID). Download audited .set preset configurations verified with 99.9% real tick data.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <Lock className="w-4 h-4" />
              <span>Anti-Decompile DLL & Web Authentication Protocol</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 tabular-nums">
              <CheckCircle2 className="w-4 h-4" />
              <span>{licenses.filter((l) => l.status === 'ACTIVE').length} Active Licensed Terminals</span>
            </div>
          </div>
        </div>
      </div>

      {/* License Key Generator & Active Licenses */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <span>Cryptographic License Manager</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate hardware-locked or broker account-locked license strings for your algorithmic robots.
            </p>
          </div>

          <button
            onClick={() => setIsGenerating(!isGenerating)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New License</span>
          </button>
        </div>

        {/* Generator Form */}
        {isGenerating && (
          <form
            onSubmit={handleGenerate}
            className="bg-[#111622] border border-cyan-500/40 rounded-2xl p-5 animate-in fade-in space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-100">Provision Cryptographic EA License</span>
              <button
                type="button"
                onClick={() => setIsGenerating(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Target Robot</label>
                <select
                  value={selectedRobot}
                  onChange={(e) => setSelectedRobot(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option>Endgame Forex Robot</option>
                  <option>Shadow River Matrix</option>
                  <option>Apex Liquidity Scalper</option>
                  <option>Titan Grid Matrix</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MT4/MT5 Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8839210"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hardware ID (HWID Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. HWID-9F81-42BA"
                  value={hwid}
                  onChange={(e) => setHwid(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Client / Trader Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="trader@domain.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Validity Period</label>
                <select
                  value={daysValid}
                  onChange={(e) => setDaysValid(Number(e.target.value))}
                  className="w-full bg-[#18202e] border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value={30}>30 Days (Evaluation)</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>365 Days (Annual)</option>
                  <option value={3650}>Lifetime</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition"
            >
              Sign & Issue License Key
            </button>
          </form>
        )}

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={licenseSearch}
              onChange={(e) => setLicenseSearch(e.target.value)}
              placeholder="Search key, robot, account, client, or HWID..."
              className="w-full pl-9 pr-3 py-2 bg-[#111622] border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#111622] border border-slate-800 rounded-xl p-1">
            {(['ALL', 'ACTIVE', 'REVOKED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setLicenseStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  licenseStatusFilter === status
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* License Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">License Key</th>
                <th className="py-3 px-3">Robot</th>
                <th className="py-3 px-3">Bound Account</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Expires</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center space-y-3">
                    <div className="text-slate-400 text-xs">
                      No cryptographic licenses match your current search or status filter.
                    </div>
                    <button
                      onClick={() => {
                        setLicenseSearch('');
                        setLicenseStatusFilter('ALL');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-cyan-300">{lic.key}</span>
                        <button
                          onClick={() => handleCopyKey(lic.key)}
                          className="text-slate-500 hover:text-slate-200 p-0.5"
                          title="Copy Key"
                        >
                          {copiedKey === lic.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500">{lic.hwid}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{lic.robotName}</td>
                    <td className="py-3 px-3 text-slate-300">{lic.accountNumber}</td>
                    <td className="py-3 px-3 text-slate-400">
                      <div>{lic.clientName}</div>
                      <div className="text-[10px] text-slate-500">{lic.clientEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{lic.expiresAt}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lic.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {lic.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {lic.status === 'ACTIVE' && (
                        <button
                          onClick={() => revokeLicense(lic.id)}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded border border-rose-500/30 text-[10px] font-bold transition"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Verified Presets (.SET) Vault */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-400" />
              <span>Official Verified .SET Configuration Vault</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready parameter presets for MT4 and MT5 terminal inputs. Verified for Emerge Prop Firm rules.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">100% Verified Parameters</span>
        </div>

        {downloadToast && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadToast}</span>
            </div>
            <button onClick={() => setDownloadToast(null)} className="text-emerald-400 hover:text-white font-bold">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs tabular-nums">
          {presets.map((pre) => (
            <div
              key={pre.id}
              className="p-5 bg-[#111622] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    {pre.accountType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 text-[10px]">{pre.timeframe} • {pre.symbol}</span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm mb-1">{pre.title}</h4>
                <div className="text-[11px] text-slate-400 mb-2">Robot: {pre.robotName}</div>

                <div className="bg-[#070a0f] p-3 rounded-lg border border-slate-800 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Mode:</span>
                    <span className="text-emerald-400 font-bold">{pre.riskPercentage}% / trade</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Date:</span>
                    <span className="text-slate-300">{pre.verifiedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Downloads:</span>
                    <span className="text-cyan-400 font-bold">{pre.downloadCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewPreset(previewPreset === pre.id ? null : pre.id)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewPreset === pre.id ? 'Hide Code' : 'Inspect'}</span>
                </button>
                <button
                  onClick={() => handleDownloadPreset(pre.id, pre.title)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .SET</span>
                </button>
              </div>

              {previewPreset === pre.id && (
                <div className="mt-2 p-3 bg-black/60 rounded-lg border border-slate-800 text-[10px] text-slate-300 whitespace-pre font-mono overflow-x-auto max-h-40">
                  {pre.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
