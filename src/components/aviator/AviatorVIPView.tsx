import React, { useState, useRef, useEffect } from 'react';
import { Crown, Check, Sparkles, Send, ShieldCheck, Copy, Key, RefreshCw } from 'lucide-react';
import { generateKeyCode } from '../../lib/crypto';

type VipTierId = 'FREE' | 'PRO' | 'ELITE';

interface VipTierConfig {
  id: VipTierId;
  name: string;
  price: string;
  period: string;
  isPopular?: boolean;
  color: string;
  buttonClass: string;
  features: string[];
}

export const AviatorVIPView: React.FC = () => {
  const [activeTier, setActiveTier] = useState<VipTierId>('PRO');
  const [activationNotice, setActivationNotice] = useState<string | null>(null);
  const [apiKeyToken, setApiKeyToken] = useState<string>('NGN-VIP-8839-PRO-X92K');
  const [copiedTarget, setCopiedTarget] = useState<'KEY' | 'WEBHOOK' | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
  const webhookUrl = `${origin}/api/mt5/bridge`;

  const tiers: VipTierConfig[] = [
    {
      id: 'FREE',
      name: 'FREE TIER',
      price: 'R0',
      period: 'forever',
      color: 'border border-slate-800 bg-[#0a0d16]',
      buttonClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700',
      features: [
        'Basic pattern recognition',
        'Manual signal radar',
        '6 SA Bookmaker support',
        'Round history (12 rounds)',
        'Standard Discord alerts',
      ],
    },
    {
      id: 'PRO',
      name: 'PRO VIP',
      price: 'R299',
      period: '/month',
      isPopular: true,
      color: 'signal-glass border border-amber-500/50 shadow-[0_0_35px_rgba(232,185,35,0.25)] ring-1 ring-amber-500/40',
      buttonClass: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-950/40',
      features: [
        'Everything in Free',
        'Telegram VIP Auto-Alerts (<100ms)',
        'GPT Statistical AI Engine',
        'Pink Wave Sniper Radar',
        'EA Trade Lab Bot Execution',
        'Kelly Criterion & Martingale modes',
        'Zero-Ruin Drawdown Guard',
      ],
    },
    {
      id: 'ELITE',
      name: 'ELITE LIFETIME',
      price: 'R1,499',
      period: 'one-time',
      color: 'border border-cyan-500/40 bg-gradient-to-b from-[#0b1626] to-[#070b12] shadow-xl',
      buttonClass: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold',
      features: [
        'Lifetime Unlimited VIP Access',
        'All Pro Features Included',
        'Direct DMA Broker Bridge Link',
        'Custom Webhook Dispatch API',
        'Private 1-on-1 Mentorship Channel',
        'Priority Algorithmic Feed Latency',
      ],
    },
  ];

  const handleSelectTier = (tier: VipTierConfig) => {
    setActiveTier(tier.id);
    setActivationNotice(`${tier.name} profile activated. ${tier.id === 'FREE' ? 'Webhook API drawer locked.' : 'VIP Webhook & Dispatch API unlocked below.'}`);
    const t = window.setTimeout(() => setActivationNotice(null), 4500);
    timersRef.current.push(t);
  };

  const handleRotateKey = () => {
    const prefix = activeTier === 'ELITE' ? 'NGN-ELITE' : 'NGN-VIP';
    setApiKeyToken(generateKeyCode(prefix, 2, 4));
    setWebhookStatus('Rotated institutional VIP bearer token using WebCrypto CSPRNG.');
    const t = window.setTimeout(() => setWebhookStatus(null), 3500);
    timersRef.current.push(t);
  };

  const handleCopyValue = (val: string, target: 'KEY' | 'WEBHOOK') => {
    navigator.clipboard.writeText(val);
    setCopiedTarget(target);
    const t = window.setTimeout(() => setCopiedTarget(null), 2000);
    timersRef.current.push(t);
  };

  const handlePingWebhook = async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/mt5/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'HEALTH_PROBE',
          tier: activeTier,
          token: apiKeyToken,
        }),
      });
      const rtt = Number((performance.now() - start).toFixed(1));
      if (res.ok) {
        const data = await res.json();
        setWebhookStatus(`Dispatch probe acknowledged (200 OK · Ticket #${data.ticket} · RTT ${rtt}ms).`);
      } else {
        setWebhookStatus(`Dispatch endpoint returned HTTP ${res.status} (${rtt}ms).`);
      }
    } catch (err: unknown) {
      setWebhookStatus(err instanceof Error ? err.message : 'Unable to reach dispatch endpoint.');
    }
    const t = window.setTimeout(() => setWebhookStatus(null), 4500);
    timersRef.current.push(t);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-orbitron font-bold">
          <Crown className="w-3.5 h-3.5" />
          <span>VIP CLUB ACCESS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-orbitron text-white uppercase tracking-wider">
          UNLEASH THE FULL STATISTICAL ADVANTAGE
        </h2>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Unlock sub-millisecond Telegram alerts, AI pattern recognition, and autonomous EA crash bot execution
        </p>
      </div>

      {/* Activation Banner */}
      {activationNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activationNotice}</span>
          </div>
          <button
            onClick={() => setActivationNotice(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`rounded-3xl p-6 flex flex-col justify-between relative transition-transform hover:-translate-y-1 ${t.color}`}
          >
            {t.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-orbitron font-black uppercase tracking-widest shadow-md">
                MOST POPULAR IN SA
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="font-orbitron font-black text-sm text-white tracking-widest">
                  {t.name}
                </span>
                {t.isPopular && <Sparkles className="w-4 h-4 text-amber-400" />}
              </div>

              <div className="flex items-baseline gap-1 tabular-nums">
                <span className="text-3xl sm:text-4xl font-black font-orbitron text-white">
                  {t.price}
                </span>
                <span className="text-xs text-slate-400">{t.period}</span>
              </div>

              <ul className="space-y-2.5 pt-2">
                {t.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSelectTier(t)}
              className={`w-full py-3 rounded-2xl font-orbitron text-xs transition mt-6 ${t.buttonClass}`}
            >
              {activeTier === t.id ? 'CURRENTLY ACTIVE' : `UPGRADE TO ${t.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Unlocked VIP Dispatch Webhook & API Key Drawer */}
      {(activeTier === 'PRO' || activeTier === 'ELITE') && (
        <div className="rounded-3xl bg-[#0a0f1d] border border-cyan-500/35 p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-orbitron font-bold text-white uppercase tracking-wider">
                  VIP Dispatch Webhook &amp; API Key Console
                </h3>
                <p className="text-[11px] text-slate-400">
                  Unlocked for {activeTier === 'ELITE' ? 'ELITE LIFETIME' : 'PRO VIP'} tier • Sub-100ms Telegram &amp; MT5 Bridge Relay
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold tabular-nums">
              SLA: 99.98% • &lt;42ms RELAY
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#060a14] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>VIP BEARER API KEY</span>
                <button
                  onClick={handleRotateKey}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rotate Key</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-amber-300 font-bold truncate tabular-nums">{apiKeyToken}</span>
                <button
                  onClick={() => handleCopyValue(apiKeyToken, 'KEY')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 shrink-0"
                >
                  {copiedTarget === 'KEY' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTarget === 'KEY' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#060a14] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>WEBHOOK DISPATCH ENDPOINT</span>
                <button
                  onClick={handlePingWebhook}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                >
                  <Send className="w-3 h-3" />
                  <span>Test Dispatch</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-cyan-300 font-bold truncate">{webhookUrl}</span>
                <button
                  onClick={() => handleCopyValue(webhookUrl, 'WEBHOOK')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 shrink-0"
                >
                  {copiedTarget === 'WEBHOOK' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTarget === 'WEBHOOK' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {webhookStatus && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{webhookStatus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

