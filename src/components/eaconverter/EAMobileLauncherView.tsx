import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  useBrand,
  BrandAccentTheme,
  GlassStyleMode,
  GLASS_STYLE_META,
} from '../../context/BrandContext';
import { LiveTradingChart } from '../bridge/LiveTradingChart';
import { speechNotifier, useSpeechNotifications } from '../../services/speechNotificationService';
import { OrderSide } from '../../types/trading';
import {
  Menu,
  X,
  Home,
  CandlestickChart,
  Newspaper,
  Settings,
  KeyRound,
  ScanLine,
  Play,
  Square,
  Plus,
  Search,
  Check,
  ShieldCheck,
  FileText,
  Volume2,
  VolumeX,
  Server,
  Trash2,
  ChevronRight,
  SlidersHorizontal,
  Copy,
  Video,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
  Activity,
  RotateCw,
  Sparkles,
  Wifi,
  Info,
} from 'lucide-react';
import { GoldMagicSettingsPanel, GoldMagicBotConfig } from './GoldMagicSettingsPanel';
import { MobileInPhoneScanner } from './MobileInPhoneScanner';

interface EAMobileLauncherViewProps {
  displayCurrency: 'USD' | 'ZAR';
  onCurrencyChange: (currency: 'USD' | 'ZAR') => void;
  onOpenAIScanner: () => void;
  onOpenInBridge: (symbol: string) => void;
  onOpenConverterAdmin?: () => void;
}

type BuildPresetId =
  | 'masterx2'
  | 'skullxpert'
  | 'ultrapro'
  | 'dnxnova'
  | 'fxbulls'
  | 'nexora2'
  | 'skynetpro2'
  | 'goldmagic'
  | 'moneybotpv1'
  | 'thejoker'
  | 'nexus2v1'
  | 'custombrand';

type LauncherBottomTab = 'HOME' | 'AI_SCANNER' | 'METATRADER' | 'NEWS' | 'SETTINGS';
type MT5SubTab = 'POSITIONS' | 'QUOTES' | 'CHART' | 'HISTORY' | 'LINK';

interface BotBuildPreset {
  id: BuildPresetId;
  appName: string;
  tagline: string;
  handle: string;
  version: string;
  accentHex: string;
  accentSoft: string;
  ringColor: string;
  emblem:
    | 'SKULL'
    | 'BULL'
    | 'NOVA'
    | 'NEURAL'
    | 'MECHA'
    | 'SKYNET'
    | 'SORCERER'
    | 'MONEYBOT'
    | 'JOKER'
    | 'NEXUS2V1';
  actionLabels: [string, string, string];
  defaultSymbols: string[];
  defaultLots: number;
  defaultTrades: number;
  defaultSide: OrderSide;
  sampleKey: string;
  referenceVideo?: string;
  referenceTitle?: string;
}

interface InstalledBot {
  id: string;
  name: string;
  pairRule: string;
  presetId: BuildPresetId;
  active: boolean;
  licenseKey: string;
}

interface EconomicEventItem {
  id: string;
  currency: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM';
  secondsRemaining: number;
  forecast: string;
  previous: string;
}

const BUILD_PRESETS: BotBuildPreset[] = [
  {
    id: 'masterx2',
    appName: 'MASTER X 2.0',
    tagline: 'Neural Multi-Symbol Batch Engine',
    handle: '@fxcartel001',
    version: 'v2.0',
    accentHex: '#ef4444',
    accentSoft: 'rgba(239, 68, 68, 0.16)',
    ringColor: 'border-rose-500/40',
    emblem: 'SKULL',
    actionLabels: ['News', 'Trade', 'Scan'],
    defaultSymbols: ['XAUUSDm', 'CADJPY.m', 'US30', 'BTCUSD'],
    defaultLots: 0.01,
    defaultTrades: 5,
    defaultSide: 'BUY',
    sampleKey: '6DEER0DQ3VE44M',
    referenceVideo: '/assets/aistudio/9de8172dc01bb2c5a5242f656cfc3f25_8b1b51df.mp4',
    referenceTitle: 'Master X 2.0 Multi-Trade Setup Build',
  },
  {
    id: 'skullxpert',
    appName: 'SKULLXPERT PRO+',
    tagline: 'Neural · Adaptive · Unstoppable',
    handle: '@proff_401',
    version: 'v4.1',
    accentHex: '#e11d48',
    accentSoft: 'rgba(225, 29, 72, 0.16)',
    ringColor: 'border-rose-500/45',
    emblem: 'SKULL',
    actionLabels: ['Pairs', 'Go', 'Logs'],
    defaultSymbols: ['US30.mic', 'XAUUSD'],
    defaultLots: 0.1,
    defaultTrades: 3,
    defaultSide: 'BUY',
    sampleKey: 'SKULL-PRO-401-X9',
    referenceVideo: '/assets/aistudio/2b4250354ae7638f90235ac4efb91eff_9a86bde3.mp4',
    referenceTitle: 'SkullXpert Pro+ / Quantum Pro Build',
  },
  {
    id: 'ultrapro',
    appName: 'ULTRA PRO EA',
    tagline: 'Quotes · Direct MT5 · Key Vault',
    handle: '@afigo13',
    version: 'v3.2',
    accentHex: '#f43f5e',
    accentSoft: 'rgba(244, 63, 94, 0.15)',
    ringColor: 'border-rose-500/40',
    emblem: 'MECHA',
    actionLabels: ['Quotes', 'Trade', 'Remove'],
    defaultSymbols: ['XAUUSD', 'EURUSD', 'GBPUSD'],
    defaultLots: 0.05,
    defaultTrades: 3,
    defaultSide: 'BUY',
    sampleKey: 'ULTRA-FIGO-13-PRO',
    referenceVideo: '/assets/aistudio/66fb2de2d0658d9ce19d20091eb12f14_21c18315.mp4',
    referenceTitle: 'Ultra Pro EA (~Figo) Deck Build',
  },
  {
    id: 'dnxnova',
    appName: 'DNX-NOVA-V6',
    tagline: 'High-Impact Filter · Gold Precision',
    handle: '@sloshkeys1',
    version: 'v6.0',
    accentHex: '#dc2626',
    accentSoft: 'rgba(220, 38, 38, 0.18)',
    ringColor: 'border-red-500/45',
    emblem: 'NOVA',
    actionLabels: ['News', 'Trade', 'Scan'],
    defaultSymbols: ['XAUUSD', 'NAS100'],
    defaultLots: 0.01,
    defaultTrades: 4,
    defaultSide: 'BUY',
    sampleKey: 'DNX-NOVA-V6-SLOSH',
    referenceVideo: '/assets/aistudio/1873af5575fc37aca45ff4ea2c8d6b33_f187e3e0.mp4',
    referenceTitle: 'DNX-NOVA-V6 (~SLOSH-TRADES) Build',
  },
  {
    id: 'fxbulls',
    appName: 'FX BULLS PRO',
    tagline: 'Policy Verified · Risk Protected',
    handle: '@mrfxbulls',
    version: 'v2.4',
    accentHex: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.16)',
    ringColor: 'border-emerald-500/45',
    emblem: 'BULL',
    actionLabels: ['News', 'Trade', 'Scan'],
    defaultSymbols: ['XAUUSD', 'AUDUSD', 'US30'],
    defaultLots: 0.05,
    defaultTrades: 2,
    defaultSide: 'BUY',
    sampleKey: 'FXB-BULLS-2026-KEY',
    referenceVideo: '/assets/aistudio/b458fe4040cc5da73a93bbe23efdf336_a97e55a5.mp4',
    referenceTitle: 'FX Bulls Pro Key & Policy Gate Build',
  },
  {
    id: 'nexora2',
    appName: 'NEXORA FX 2.0',
    tagline: 'Multi-Order Cloud Dispatch',
    handle: 'Kante FX',
    version: 'v2.0',
    accentHex: '#06b6d4',
    accentSoft: 'rgba(6, 182, 212, 0.16)',
    ringColor: 'border-cyan-500/45',
    emblem: 'NEURAL',
    actionLabels: ['News', 'Trade', 'Scan'],
    defaultSymbols: ['XAUUSDm', 'XAGEURm', 'NAS100'],
    defaultLots: 0.02,
    defaultTrades: 3,
    defaultSide: 'BUY',
    sampleKey: 'NEXORA-20-KANTE',
    referenceVideo: '/assets/aistudio/61ed20b3ee755751504f4e96772cfe7d_f57e448b.mp4',
    referenceTitle: 'EA Converter / MT5 Linking Deck',
  },
  {
    id: 'skynetpro2',
    appName: 'SKYNET AI PRO 2.0',
    tagline: 'Connect · Terminal · Execute AI Pipeline',
    handle: '@thabang_fx01',
    version: 'v2.0',
    accentHex: '#ef4444',
    accentSoft: 'rgba(239, 68, 68, 0.18)',
    ringColor: 'border-red-500/45',
    emblem: 'SKYNET',
    actionLabels: ['Stop', 'Quotes', 'Remove'],
    defaultSymbols: ['XAUUSD', 'US30'],
    defaultLots: 0.05,
    defaultTrades: 5,
    defaultSide: 'BUY',
    sampleKey: 'SKYNET-THABANG-20',
    referenceVideo: '/assets/aistudio/ecc49e8beb2ee29cc6ccfe1112e743c5_e4c4c3d2.mp4',
    referenceTitle: 'SKYNET AI PRO 2.0 (@thabang_fx01) Gold Chart Scan Build',
  },
  {
    id: 'goldmagic',
    appName: 'GOLD MAGIC',
    tagline: 'Powered by EA Connect',
    handle: '@eaconnect5',
    version: 'v3.0',
    accentHex: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.18)',
    ringColor: 'border-emerald-500/45',
    emblem: 'SORCERER',
    actionLabels: ['Start', 'Settings', 'Remove'],
    defaultSymbols: ['EURUSD.m', 'XAUUSD'],
    defaultLots: 0.01,
    defaultTrades: 1,
    defaultSide: 'BUY',
    sampleKey: 'GOLD-MAGIC-EAC5',
    referenceVideo: '/assets/aistudio/e8fa78c1ac8bf39b91f15f3003a84414_cd6b5536.mp4',
    referenceTitle: 'GOLD MAGIC · EA Connect Live Terminal & Settings',
  },
  {
    id: 'moneybotpv1',
    appName: 'Money Bot PV1',
    tagline: 'Powered by iTradeBot.org',
    handle: '@itradebot',
    version: 'PV1',
    accentHex: '#22d3ee',
    accentSoft: 'rgba(34, 211, 238, 0.16)',
    ringColor: 'border-cyan-400/45',
    emblem: 'MONEYBOT',
    actionLabels: ['Symbols', 'Start', 'Signals'],
    defaultSymbols: ['XAUUSD', 'EURUSD', 'BTCUSD'],
    defaultLots: 0.05,
    defaultTrades: 2,
    defaultSide: 'BUY',
    sampleKey: 'ITB-MONEYBOT-PV1-99',
    referenceVideo: '/assets/aistudio/40bf548910cdbef5e8cdc7a4d382fe81_4576ae0b.mp4',
    referenceTitle: 'Money Bot PV1 · iTradeBot Floating Overlay',
  },
  {
    id: 'thejoker',
    appName: 'THE JOKER · TRADE PORT EA',
    tagline: 'Bcm_scalper · AccuMarkets-Live',
    handle: '@simamkele.malawi',
    version: 'v4.9',
    accentHex: '#ef4444',
    accentSoft: 'rgba(239, 68, 68, 0.18)',
    ringColor: 'border-rose-500/50',
    emblem: 'JOKER',
    actionLabels: ['Pairs', 'Re Auto Trade', 'Info'],
    defaultSymbols: ['EURUSD', 'XAUUSD'],
    defaultLots: 0.02,
    defaultTrades: 1,
    defaultSide: 'BUY',
    sampleKey: 'TP-JOKER-BCM-49S',
    referenceVideo: '/assets/aistudio/3aafe6cc455d7a4a82c11b00870104c1_9f4bf156.mp4',
    referenceTitle: 'The Joker (Bcm_scalper) · 49s Execution Ring',
  },
  {
    id: 'nexus2v1',
    appName: 'NEXUS2.V1 · TRADE PORT',
    tagline: 'Powered by Trade Port EA · Purple Glass',
    handle: '@bothlhale.kante',
    version: '2.v1',
    accentHex: '#a855f7',
    accentSoft: 'rgba(168, 85, 247, 0.18)',
    ringColor: 'border-purple-500/50',
    emblem: 'NEXUS2V1',
    actionLabels: ['News', 'Trade', 'Scan'],
    defaultSymbols: ['XAUUSDm', 'XAGEURm', 'NAS100'],
    defaultLots: 0.05,
    defaultTrades: 3,
    defaultSide: 'BUY',
    sampleKey: '265-8DF-24C-595',
    referenceVideo: '/assets/aistudio/824c89f69d8a84df53a82064f90cae87_a3fb4a8c.mp4',
    referenceTitle: 'NEXUS2.V1 Purple Glass & Exness Flip Card',
  },
];

const EXTRA_REFERENCE_CLIPS = [
  {
    id: 'goldmagic-scanner',
    appName: 'GOLD MAGIC AI Scanner',
    handle: '@eaconnect5',
    referenceVideo: '/assets/aistudio/6d1fc9382e4b716a6a8c247424a4f99f_6af387ff.mp4',
  },
];

const INITIAL_NEWS_EVENTS: EconomicEventItem[] = [
  {
    id: 'evt-1',
    currency: 'AUD',
    title: 'AUD CPI m/m · High Volatility Expected',
    impact: 'HIGH',
    secondsRemaining: 14 * 3600 + 23 * 60 + 18,
    forecast: '0.4%',
    previous: '0.2%',
  },
  {
    id: 'evt-2',
    currency: 'AUD',
    title: 'AUD RBA Cash Rate Decision',
    impact: 'HIGH',
    secondsRemaining: 18 * 3600 + 45 * 60 + 10,
    forecast: '4.35%',
    previous: '4.35%',
  },
  {
    id: 'evt-3',
    currency: 'USD',
    title: 'USD Non-Farm Employment Change',
    impact: 'HIGH',
    secondsRemaining: 26 * 3600 + 12 * 60 + 40,
    forecast: '185K',
    previous: '214K',
  },
  {
    id: 'evt-4',
    currency: 'GBP',
    title: 'GBP BOE Monetary Policy Report',
    impact: 'MEDIUM',
    secondsRemaining: 31 * 3600 + 5 * 60,
    forecast: '4.75%',
    previous: '4.75%',
  },
];

const AVAILABLE_BROKER_SYMBOLS = [
  'XAUUSD',
  'XAUUSDm',
  'XAUUSD.m',
  'US30',
  'US30.mic',
  'NAS100',
  'CADJPY.m',
  'EURUSD',
  'GBPUSD',
  'GBPJPY',
  'USDJPY',
  'AUDUSD',
  'BTCUSD',
  'ETHUSD',
  'XAGEURm',
  'USDZAR',
];

function formatCountdown(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}H ${String(m).padStart(2, '0')}M ${String(sec).padStart(2, '0')}S`;
}

const BotCrestSvg: React.FC<{
  emblem: BotBuildPreset['emblem'];
  accentHex: string;
  isActive: boolean;
}> = ({ emblem, accentHex, isActive }) => {
  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto select-none">
      {/* Subtle Concentric Radial Field */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          background: `radial-gradient(circle, ${accentHex}${isActive ? '36' : '1f'} 0%, ${accentHex}0a 52%, transparent 74%)`,
        }}
      />
      <div
        className="absolute inset-3 rounded-full border transition-colors duration-300"
        style={{ borderColor: `${accentHex}${isActive ? '70' : '30'}` }}
      />
      <div
        className="absolute inset-6 rounded-full border border-dashed transition-transform duration-700"
        style={{
          borderColor: `${accentHex}${isActive ? '55' : '24'}`,
          transform: isActive ? 'rotate(18deg)' : 'rotate(0deg)',
        }}
      />

      {emblem === 'SKULL' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <path
            d="M60 14 L92 30 L96 62 L82 86 L74 104 L46 104 L38 86 L24 62 L28 30 Z"
            fill="#0d111a"
            stroke={accentHex}
            strokeWidth="2.5"
          />
          <path
            d="M36 42 L54 52 L48 64 L32 56 Z"
            fill={accentHex}
            fillOpacity={isActive ? '0.95' : '0.7'}
          />
          <path
            d="M84 42 L66 52 L72 64 L88 56 Z"
            fill={accentHex}
            fillOpacity={isActive ? '0.95' : '0.7'}
          />
          <path d="M56 72 L60 60 L64 72 Z" fill="#1e293b" stroke={accentHex} strokeWidth="1.5" />
          <path
            d="M48 86 L48 100 M56 86 L56 100 M64 86 L64 100 M72 86 L72 100"
            stroke={accentHex}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M60 14 L60 32" stroke={accentHex} strokeWidth="2" opacity="0.6" />
        </svg>
      )}

      {emblem === 'BULL' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <path
            d="M16 24 C20 42, 30 48, 42 46 L48 36 L72 36 L78 46 C90 48, 100 42, 104 24 C96 34, 86 34, 78 28 L42 28 C34 34, 24 34, 16 24 Z"
            fill={accentHex}
            fillOpacity="0.22"
            stroke={accentHex}
            strokeWidth="2.2"
          />
          <path
            d="M36 46 L84 46 L90 68 L74 98 L46 98 L30 68 Z"
            fill="#0b131c"
            stroke={accentHex}
            strokeWidth="2.5"
          />
          <path d="M40 58 L54 64 L48 70 Z" fill={accentHex} />
          <path d="M80 58 L66 64 L72 70 Z" fill={accentHex} />
          <circle cx="60" cy="88" r="7" fill="none" stroke={accentHex} strokeWidth="2.4" />
        </svg>
      )}

      {emblem === 'MECHA' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <polygon
            points="60,12 96,34 92,78 60,106 28,78 24,34"
            fill="#0d111a"
            stroke={accentHex}
            strokeWidth="2.4"
          />
          <polygon
            points="38,44 56,52 52,62 34,56"
            fill={accentHex}
            fillOpacity="0.9"
          />
          <polygon
            points="82,44 64,52 68,62 86,56"
            fill={accentHex}
            fillOpacity="0.9"
          />
          <path
            d="M42 78 L54 88 L66 88 L78 78"
            fill="none"
            stroke={accentHex}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path d="M60 12 L60 44 M24 34 L42 40 M96 34 L78 40" stroke={accentHex} strokeWidth="1.6" opacity="0.65" />
        </svg>
      )}

      {emblem === 'NOVA' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <path
            d="M36 22 L84 22 L96 46 L86 92 L60 106 L34 92 L24 46 Z"
            fill="#0c1018"
            stroke={accentHex}
            strokeWidth="2.5"
          />
          <path
            d="M32 50 L88 50 L82 64 L38 64 Z"
            fill={accentHex}
            fillOpacity="0.9"
          />
          <path
            d="M46 78 L74 78 L68 92 L52 92 Z"
            fill="#111827"
            stroke={accentHex}
            strokeWidth="1.8"
          />
          <circle cx="60" cy="34" r="4" fill={accentHex} />
        </svg>
      )}

      {emblem === 'NEURAL' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <polygon
            points="60,14 98,37 98,83 60,106 22,83 22,37"
            fill="#09131d"
            stroke={accentHex}
            strokeWidth="2.5"
          />
          <polygon
            points="60,28 84,42 84,78 60,92 36,78 36,42"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.6"
            opacity="0.7"
          />
          <circle cx="60" cy="60" r="10" fill={accentHex} fillOpacity="0.88" />
          <path
            d="M60 28 L60 50 M60 70 L60 92 M36 42 L51 54 M84 42 L69 54 M36 78 L51 66 M84 78 L69 66"
            stroke={accentHex}
            strokeWidth="1.8"
          />
        </svg>
      )}

      {emblem === 'SKYNET' && (
        <svg viewBox="0 0 140 120" className="w-28 h-24 relative z-10 drop-shadow">
          {/* Outer cyber eyelid & crosshair orbital brackets */}
          <path
            d="M12 60 Q70 16 128 60 Q70 104 12 60 Z"
            fill="#0b080a"
            stroke={accentHex}
            strokeWidth="2.4"
          />
          <circle
            cx="70"
            cy="60"
            r="24"
            fill="none"
            stroke={accentHex}
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <circle cx="70" cy="60" r="15" fill={accentHex} fillOpacity="0.28" stroke={accentHex} strokeWidth="2.2" />
          <circle cx="70" cy="60" r="6" fill="#fff1f2" />
          <path
            d="M70 18 L70 30 M70 90 L70 102 M20 60 L34 60 M106 60 L120 60"
            stroke={accentHex}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}

      {emblem === 'SORCERER' && (
        <svg viewBox="0 0 140 120" className="w-28 h-24 relative z-10 drop-shadow">
          {/* Neon emerald halo */}
          <circle cx="70" cy="40" r="24" fill="none" stroke={accentHex} strokeWidth="2.4" opacity="0.85" />
          {/* Left & Right Lightning Arcs */}
          <path
            d="M26 20 L40 44 L30 48 L44 74"
            fill="none"
            stroke={accentHex}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M114 20 L100 44 L110 48 L96 74"
            fill="none"
            stroke={accentHex}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hooded Cyber Sorcerer Silhouette */}
          <path
            d="M70 18 L92 42 L88 64 L106 98 L34 98 L52 64 L48 42 Z"
            fill="#07110b"
            stroke={accentHex}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M56 44 L70 60 L84 44 L70 36 Z"
            fill="#030705"
            stroke={accentHex}
            strokeWidth="1.4"
          />
          <circle cx="63" cy="48" r="2.2" fill={accentHex} />
          <circle cx="77" cy="48" r="2.2" fill={accentHex} />
          <path d="M56 72 L70 86 L84 72" fill="none" stroke={accentHex} strokeWidth="1.8" opacity="0.7" />
        </svg>
      )}

      {emblem === 'MONEYBOT' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <rect
            x="28"
            y="22"
            width="64"
            height="72"
            rx="18"
            fill="#0b1522"
            stroke="#e2e8f0"
            strokeWidth="2.2"
          />
          <rect
            x="38"
            y="40"
            width="44"
            height="20"
            rx="8"
            fill="#030712"
            stroke={accentHex}
            strokeWidth="2"
          />
          <circle cx="49" cy="50" r="4" fill={accentHex} />
          <circle cx="71" cy="50" r="4" fill={accentHex} />
          <path d="M60 10 L60 22 M20 52 L28 52 M92 52 L100 52" stroke={accentHex} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M44 76 L76 76" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}

      {emblem === 'JOKER' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <circle cx="60" cy="60" r="40" fill="#12060a" stroke={accentHex} strokeWidth="2.4" />
          <circle cx="60" cy="60" r="26" fill="none" stroke={accentHex} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M36 44 L52 54 L42 60 Z" fill={accentHex} />
          <path d="M84 44 L68 54 L78 60 Z" fill={accentHex} />
          <path d="M38 74 Q60 92 82 74" fill="none" stroke={accentHex} strokeWidth="3" strokeLinecap="round" />
          <path d="M60 20 L60 32 M60 88 L60 100 M20 60 L32 60 M88 60 L100 60" stroke={accentHex} strokeWidth="1.8" />
        </svg>
      )}

      {emblem === 'NEXUS2V1' && (
        <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow">
          <polygon
            points="60,12 96,30 100,68 60,106 20,68 24,30"
            fill="#130b24"
            stroke={accentHex}
            strokeWidth="2.6"
          />
          <polygon points="36,44 56,52 52,64 32,56" fill={accentHex} fillOpacity="0.92" />
          <polygon points="84,44 64,52 68,64 88,56" fill={accentHex} fillOpacity="0.92" />
          <path d="M44 76 L60 88 L76 76" fill="none" stroke="#e9d5ff" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M60 12 L60 40" stroke="#c084fc" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
};

export const EAMobileLauncherView: React.FC<EAMobileLauncherViewProps> = ({
  displayCurrency,
  onCurrencyChange,
  onOpenAIScanner,
  onOpenInBridge,
  onOpenConverterAdmin,
}) => {
  const {
    prices,
    positions,
    orderHistory,
    webhookLogs,
    mt5Credentials,
    brandConfig,
    mobileActivations,
    automatedSettings,
    accountBalance,
    accountEquity,
    freeMargin,
    marginLevel,
    unrealizedPnL,
    executeBatchOrders,
    executeOrder,
    closePosition,
    setBreakEven,
    modifyPositionSLTP,
    executeKillSwitch,
    connectMT5Broker,
    setPrimaryMT5Broker,
    disconnectMT5Broker,
    updateAutomatedSettings,
  } = useTrading();

  const speechSnapshot = useSpeechNotifications();

  // Active Build Preset (can also follow live brandConfig)
  const [activePresetId, setActivePresetId] = useState<BuildPresetId>('masterx2');
  const [bottomTab, setBottomTab] = useState<LauncherBottomTab>('HOME');
  const [mt5Tab, setMt5Tab] = useState<MT5SubTab>('POSITIONS');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Bot Engine Active State & Connected Fleet
  const [isRobotRunning, setIsRobotRunning] = useState<boolean>(false);
  const [installedBots, setInstalledBots] = useState<InstalledBot[]>([
    {
      id: 'bot-1',
      name: 'Master X 2.0',
      pairRule: 'XAUUSDm · US30 · 0.01 Lots',
      presetId: 'masterx2',
      active: true,
      licenseKey: '6DEER0DQ3VE44M',
    },
    {
      id: 'bot-2',
      name: 'Nexora FX 2.0',
      pairRule: 'CADJPY.m · BTCUSD · 0.01 Lots',
      presetId: 'nexora2',
      active: false,
      licenseKey: 'NEXORA-20-KANTE',
    },
  ]);

  // Quick Trade Setup Modal (@fxcartel001 Multi-Symbol Batch Flow)
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState<boolean>(false);
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['XAUUSDm']);
  const [setupSide, setSetupSide] = useState<OrderSide>('BUY');
  const [setupLots, setSetupLots] = useState<number>(0.01);
  const [setupTradesCount, setSetupTradesCount] = useState<number>(5);
  const [useAutoSlTp, setUseAutoSlTp] = useState<boolean>(true);
  const [isExecutingBatch, setIsExecutingBatch] = useState<boolean>(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  // License Key Activation + Terms Modal (@mrfxbulls Flow)
  const [isActivateModalOpen, setIsActivateModalOpen] = useState<boolean>(false);
  const [activateStep, setActivateStep] = useState<'KEY' | 'VERIFYING' | 'TERMS' | 'SUCCESS'>('KEY');
  const [licenseInput, setLicenseInput] = useState<string>('6DEER0DQ3VE44M');
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [termsTab, setTermsTab] = useState<'TERMS' | 'REFUND' | 'RISK'>('TERMS');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // MT5 Action Sheet for Tapped Position (@proff_401 / @fxcartel001)
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [editSl, setEditSl] = useState<string>('');
  const [editTp, setEditTp] = useState<string>('');

  // Link MT5 Account Form (@proff_401)
  const [mt5BrokerInput, setMt5BrokerInput] = useState<string>('XcoMarkets');
  const [mt5LoginInput, setMt5LoginInput] = useState<string>('');
  const [mt5PasswordInput, setMt5PasswordInput] = useState<string>('');
  const [mt5ServerInput, setMt5ServerInput] = useState<string>('XcoMarkets-Live');
  const [mt5AccountType, setMt5AccountType] = useState<'LIVE' | 'DEMO' | 'PROP_FIRM'>('LIVE');
  const [mt5LinkStatus, setMt5LinkStatus] = useState<string | null>(null);
  const [isLinkingMt5, setIsLinkingMt5] = useState<boolean>(false);

  // Live Economic News Countdowns
  const [newsEvents, setNewsEvents] = useState<EconomicEventItem[]>(INITIAL_NEWS_EVENTS);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string>('XAUUSD');

  // Desktop Reference Video Comparison Toggle
  const [showVideoReference, setShowVideoReference] = useState<boolean>(false);
  const [selectedRefVideoUrl, setSelectedRefVideoUrl] = useState<string>(
    BUILD_PRESETS[0].referenceVideo || ''
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const verifyTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const consoleTimersRef = useRef<number[]>([]);

  // Video 1 (SKYNET AI PRO 2.0) Connect -> Terminal -> Execute Pipeline & AI Trade Analysis Banner
  const [skynetStep, setSkynetStep] = useState<'IDLE' | 'CONNECT' | 'TERMINAL' | 'EXECUTE'>('EXECUTE');
  const [skynetBanner, setSkynetBanner] = useState<{
    symbol: string;
    side: OrderSide;
    entry: number;
    sl: number;
    tp: number;
  }>({
    symbol: 'GOLD',
    side: 'BUY',
    entry: 4159.365,
    sl: 4130.26,
    tp: 4217.98,
  });

  // Video 2 (GOLD MAGIC · EA Connect) Live Terminal Overlay & Toast & Bot Settings
  const [gmToastVisible, setGmToastVisible] = useState<boolean>(false);
  const [gmConsoleOpen, setGmConsoleOpen] = useState<boolean>(false);
  const [gmConsoleLogs, setGmConsoleLogs] = useState<string[]>([]);
  const [gmBotConfig, setGmBotConfig] = useState<GoldMagicBotConfig>({
    pairs: ['EURUSD.m'],
    preference: 'BUY_SELL',
    riskPerTradePct: '',
    dailyLossLimitPct: '',
    sessions: {
      sydney: true,
      tokyo: true,
      london: true,
      newYork: true,
    },
    analysisMode: 'Technical analysis',
    maxSpreadPoints: 35,
    trailingStopEnabled: true,
  });

  // Video 1 (Money Bot PV1 · @itradebot): Signal Listener & Floating Overlay HUD
  const [moneyBotListening, setMoneyBotListening] = useState<boolean>(true);
  const [moneyBotFloatingHud, setMoneyBotFloatingHud] = useState<boolean>(false);
  const [moneyBotToast, setMoneyBotToast] = useState<string | null>(null);

  // Video 2 (THE JOKER · Bcm_scalper · @simamkele.malawi): 49s Execution Ring & Step Console
  const [jokerTimerSec, setJokerTimerSec] = useState<number>(49);
  const [jokerSteps, setJokerSteps] = useState<string[]>([
    '>> Signal Received: BUY EURUSD',
    '>> Validating MT5 AccuMarkets-Live link...',
    '>> Spread 1.2 pips passed (max 2.5)',
    '>> Armed 49s Auto-Trade execution window',
  ]);
  const [jokerRunningRing, setJokerRunningRing] = useState<boolean>(false);

  // Video 3 (NEXUS2.V1 · Purple Glass · @bothlhale.kante): Exness Flip Card & Setup Modal
  const [exnessCardFlipped, setExnessCardFlipped] = useState<boolean>(false);
  const [nexusSetupModalOpen, setNexusSetupModalOpen] = useState<boolean>(false);

  const zarRate = prices['USDZAR']?.bid || 18.145;
  const currencyFactor = displayCurrency === 'ZAR' ? zarRate : 1;
  const formatMoney = (usdVal: number, signed = false) => {
    const val = usdVal * currencyFactor;
    const prefix = displayCurrency === 'ZAR' ? 'R' : '$';
    const absStr = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (signed) {
      return `${val >= 0 ? '+' : '-'}${prefix}${absStr}`;
    }
    return `${val < 0 ? '-' : ''}${prefix}${absStr}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNewsEvents((prev) =>
        prev.map((ev) => ({
          ...ev,
          secondsRemaining: ev.secondsRemaining > 0 ? ev.secondsRemaining - 1 : 0,
        }))
      );
      setJokerTimerSec((prev) => (prev > 0 ? prev - 1 : 49));
    }, 1000);
    return () => {
      clearInterval(timer);
      if (verifyTimerRef.current !== null) window.clearTimeout(verifyTimerRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      consoleTimersRef.current.forEach((id) => window.clearTimeout(id));
      consoleTimersRef.current = [];
    };
  }, []);

  const currentPreset: BotBuildPreset = useMemo(() => {
    if (activePresetId === 'custombrand') {
      return {
        id: 'custombrand',
        appName: brandConfig.mobileAppName || brandConfig.brandName || 'EA CONVERTER',
        tagline: brandConfig.tagline || 'White-Label Cloud Execution',
        handle: brandConfig.supportHandle || brandConfig.mentorId,
        version: 'v2.0',
        accentHex: brandConfig.primaryColor || '#06b6d4',
        accentSoft: 'rgba(6, 182, 212, 0.16)',
        ringColor: 'border-cyan-500/45',
        emblem: 'NEURAL',
        actionLabels: ['News', 'Trade', 'Scan'],
        defaultSymbols: ['XAUUSD', 'US30', 'BTCUSD'],
        defaultLots: 0.05,
        defaultTrades: 3,
        defaultSide: 'BUY',
        sampleKey: mobileActivations[0]?.activationKey || 'EAC-8839-LIAM-99X',
      };
    }
    return BUILD_PRESETS.find((p) => p.id === activePresetId) || BUILD_PRESETS[0];
  }, [activePresetId, brandConfig, mobileActivations]);

  const primaryMt5 = mt5Credentials.find((c) => c.isPrimary) || mt5Credentials[0];
  const nextHighImpact = newsEvents[0];

  const handleSelectPreset = (presetId: BuildPresetId) => {
    setActivePresetId(presetId);
    const found = BUILD_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedSymbols(found.defaultSymbols.slice(0, 1));
      setSetupLots(found.defaultLots);
      setSetupTradesCount(found.defaultTrades);
      setSetupSide(found.defaultSide);
      setLicenseInput(found.sampleKey);
      if (found.referenceVideo) {
        setSelectedRefVideoUrl(found.referenceVideo);
      }
    }
  };

  const allSymbolChoices = useMemo(() => {
    const merged = Array.from(new Set([...AVAILABLE_BROKER_SYMBOLS, ...customSymbols]));
    const q = symbolSearch.trim().toUpperCase();
    if (!q) return merged;
    return merged.filter((s) => s.toUpperCase().includes(q));
  }, [customSymbols, symbolSearch]);

  const canCreateCustomSymbol = useMemo(() => {
    const q = symbolSearch.trim().toUpperCase();
    if (q.length < 3) return false;
    return !AVAILABLE_BROKER_SYMBOLS.includes(q) && !customSymbols.includes(q);
  }, [symbolSearch, customSymbols]);

  const handleAddCustomSymbol = () => {
    const q = symbolSearch.trim().toUpperCase();
    if (!q) return;
    setCustomSymbols((prev) => (prev.includes(q) ? prev : [q, ...prev]));
    setSelectedSymbols((prev) => (prev.includes(q) ? prev : [...prev, q]));
    setSymbolSearch('');
  };

  const toggleSetupSymbol = (sym: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const launchGoldMagicConsole = async () => {
    consoleTimersRef.current.forEach((id) => window.clearTimeout(id));
    consoleTimersRef.current = [];

    const primarySym = gmBotConfig.pairs[0] || 'EURUSD.m';
    const cleanSym = primarySym.replace(/\.m$/i, '');
    const q = prices[cleanSym] || prices['EURUSD'] || prices['XAUUSD'];
    const digits = q?.digits ?? 5;
    const side: OrderSide = gmBotConfig.preference === 'SELL_ONLY' ? 'SELL' : 'BUY';
    const entry = Number((side === 'BUY' ? (q?.ask ?? 1.13574) : (q?.bid ?? 1.1356)).toFixed(digits));
    const slDist = (q?.pipSize ?? 0.0001) * 74;
    const tpDist = (q?.pipSize ?? 0.0001) * 126;
    const sl = Number((side === 'BUY' ? entry - slDist : entry + slDist).toFixed(digits));
    const tp = Number((side === 'BUY' ? entry + tpDist : entry - tpDist).toFixed(digits));

    setIsRobotRunning(true);
    setGmToastVisible(true);
    setGmConsoleOpen(true);
    setGmConsoleLogs(['>> Connected to trade server', '>> Gold Magic Trading']);

    const t1 = window.setTimeout(() => {
      setGmConsoleLogs((prev) => [...prev, `>> Analyzing ${primarySym}...`]);
    }, 550);
    const t2 = window.setTimeout(() => {
      setGmConsoleLogs((prev) => [
        ...prev,
        `>> ${primarySym} analysis completed: ${side}.`,
        `>> OPEN ${side}: ${primarySym} ${setupLots.toFixed(2)}`,
      ]);
    }, 1150);

    const execRes = await executeOrder({
      symbol: cleanSym,
      orderType: 'MARKET',
      side,
      lots: setupLots,
      sl,
      tp,
      comment: 'GoldMagic_EAConnect',
    });

    const t3 = window.setTimeout(() => {
      const ticketNum = execRes.ticket || 2697589758;
      setGmConsoleLogs((prev) => [
        ...prev,
        `>> ENTRY @ ${entry}`,
        `>> SL ${sl} TP ${tp}`,
        `>> ${side} trade opened on ${primarySym}. Ticket #${ticketNum}.`,
        '>> Market analysis completed. 1 trade opened.',
      ]);
    }, 1750);

    const tToast = window.setTimeout(() => {
      setGmToastVisible(false);
    }, 5200);

    consoleTimersRef.current.push(t1, t2, t3, tToast);
  };

  const runSkynetPipeline = async () => {
    consoleTimersRef.current.forEach((id) => window.clearTimeout(id));
    consoleTimersRef.current = [];
    setSkynetStep('CONNECT');

    const goldQuote = prices['XAUUSD'];
    const entry = goldQuote ? Number(goldQuote.ask.toFixed(2)) : 4159.365;
    const sl = goldQuote ? Number((entry - 29.1).toFixed(2)) : 4130.26;
    const tp = goldQuote ? Number((entry + 58.6).toFixed(2)) : 4217.98;
    setSkynetBanner({
      symbol: 'GOLD',
      side: setupSide,
      entry,
      sl,
      tp,
    });

    const t1 = window.setTimeout(() => setSkynetStep('TERMINAL'), 650);
    const t2 = window.setTimeout(async () => {
      setSkynetStep('EXECUTE');
      const res = await executeBatchOrders({
        symbol: 'XAUUSD',
        side: setupSide,
        lots: setupLots,
        count: setupTradesCount,
        sl,
        tp,
        comment: 'SKYNET_AI_PRO_2.0',
      });
      setIsRobotRunning(true);
      setBatchFeedback(`SKYNET AI PRO 2.0 executed ${res.tickets.length} GOLD position(s) on MT5.`);
    }, 1350);

    consoleTimersRef.current.push(t1, t2);
  };

  const handleOpenTradeDeckAction = () => {
    if (isRobotRunning) {
      setIsRobotRunning(false);
      setGmConsoleOpen(false);
      setSkynetStep('IDLE');
      speechNotifier.speak({
        category: 'BOT_ENTRY',
        severity: 'INFO',
        title: `${currentPreset.appName} Paused`,
        message: `${currentPreset.appName} mobile execution engine switched to IDLE.`,
        dedupeKey: `mobile-stop-${currentPreset.id}`,
        cooldownMs: 1500,
      });
      return;
    }

    if (activePresetId === 'goldmagic') {
      void launchGoldMagicConsole();
      return;
    }
    if (activePresetId === 'skynetpro2') {
      void runSkynetPipeline();
      return;
    }
    if (activePresetId === 'moneybotpv1') {
      const nextListen = !moneyBotListening;
      setMoneyBotListening(nextListen);
      setIsRobotRunning(nextListen);
      setMoneyBotFloatingHud(nextListen);
      setMoneyBotToast(
        nextListen
          ? 'Signal listener started · Money Bot PV1 Online'
          : 'Signal listener stopped'
      );
      return;
    }
    if (activePresetId === 'thejoker') {
      setJokerRunningRing(true);
      setIsRobotRunning(true);
      setJokerTimerSec(49);
      const q = prices['EURUSD'];
      setJokerSteps([
        `>> Signal Received: BUY EURUSD @ ${q ? q.ask.toFixed(q.digits) : '1.08432'}`,
        '>> Routing via Trade Port EA · AccuMarkets-Live...',
        '>> Opening 0.02L EURUSD with BE & Trail Guard...',
      ]);
      void executeOrder({
        symbol: 'EURUSD',
        orderType: 'MARKET',
        side: 'BUY',
        lots: 0.02,
        comment: 'The_Joker_Bcm_scalper',
      }).then((r) => {
        setJokerSteps((prev) => [
          ...prev,
          r.success ? `>> Executed Ticket #${r.ticket} (${r.message})` : `>> ${r.message}`,
        ]);
      });
      return;
    }

    setBatchFeedback(null);
    setIsQuickSetupOpen(true);
  };

  const handleConfirmBatchTrade = async () => {
    if (selectedSymbols.length === 0) return;
    setIsExecutingBatch(true);
    setBatchFeedback(null);

    try {
      let totalTickets = 0;
      for (const sym of selectedSymbols) {
        const cleanBase = sym
          .toUpperCase()
          .replace(/\.(M|MIC|PRO|ECN|RAW|STD|FX)$/i, '')
          .replace(/(MIC|PRO|ECN)$/i, '')
          .replace(/([A-Z]{6})M$/i, '$1');
        const refQuote = prices[sym] || prices[cleanBase] || prices['XAUUSD'];

        let sl: number | null = null;
        let tp: number | null = null;
        if (useAutoSlTp && refQuote) {
          const slDist = refQuote.pipSize * 45;
          const tpDist = refQuote.pipSize * 110;
          const entry = setupSide === 'BUY' ? refQuote.ask : refQuote.bid;
          sl = Number((setupSide === 'BUY' ? entry - slDist : entry + slDist).toFixed(refQuote.digits));
          tp = Number((setupSide === 'BUY' ? entry + tpDist : entry - tpDist).toFixed(refQuote.digits));
        }

        const res = await executeBatchOrders({
          symbol: sym,
          side: setupSide,
          lots: setupLots,
          count: setupTradesCount,
          sl,
          tp,
          comment: `${currentPreset.appName.replace(/\s+/g, '_')}_Auto`,
        });
        totalTickets += res.tickets.length;
      }

      setIsRobotRunning(true);
      setBatchFeedback(
        `Dispatched ${totalTickets} live MT5 orders across ${selectedSymbols.length} symbol(s).`
      );
      setIsQuickSetupOpen(false);
    } finally {
      setIsExecutingBatch(false);
    }
  };

  const handleStartActivation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = licenseInput.trim().toUpperCase();
    if (cleaned.length < 6) {
      setLicenseError('Enter a valid license key (minimum 6 characters).');
      return;
    }
    setLicenseError(null);
    setActivateStep('VERIFYING');
    if (verifyTimerRef.current !== null) window.clearTimeout(verifyTimerRef.current);
    verifyTimerRef.current = window.setTimeout(() => {
      verifyTimerRef.current = null;
      setActivateStep('TERMS');
    }, 650);
  };

  const handleAcceptTermsAndUnlock = () => {
    if (!termsAccepted) return;
    const cleaned = licenseInput.trim().toUpperCase();
    const newBot: InstalledBot = {
      id: `bot-${Date.now()}`,
      name: currentPreset.appName,
      pairRule: `${selectedSymbols.join(', ') || currentPreset.defaultSymbols[0]} · ${setupLots} Lots`,
      presetId: currentPreset.id,
      active: true,
      licenseKey: cleaned,
    };
    setInstalledBots((prev) => {
      const exists = prev.some((b) => b.licenseKey === cleaned);
      if (exists) return prev.map((b) => (b.licenseKey === cleaned ? { ...b, active: true } : b));
      return [newBot, ...prev];
    });
    setIsRobotRunning(true);
    setActivateStep('SUCCESS');
    speechNotifier.speak({
      category: 'SYSTEM',
      severity: 'HIGH',
      title: `${currentPreset.appName} License Verified`,
      message: `License activated and policies accepted. Mobile execution engine is armed.`,
      dedupeKey: `activate-${cleaned}`,
      cooldownMs: 2000,
    });
  };

  const handleLinkMt5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mt5LoginInput.trim() || !mt5ServerInput.trim()) return;
    setIsLinkingMt5(true);
    setMt5LinkStatus(null);
    try {
      const res = await connectMT5Broker(
        mt5BrokerInput.trim() || 'XcoMarkets',
        mt5ServerInput.trim(),
        mt5LoginInput.trim(),
        mt5PasswordInput || '••••••••',
        mt5AccountType
      );
      setMt5LinkStatus(res.message);
      setMt5LoginInput('');
      setMt5PasswordInput('');
      setMt5Tab('POSITIONS');
    } finally {
      setIsLinkingMt5(false);
    }
  };

  const selectedPos = positions.find((p) => p.id === selectedPosId) || null;
  const openPosModal = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;
    setSelectedPosId(posId);
    setEditSl(pos.sl !== null ? String(pos.sl) : '');
    setEditTp(pos.tp !== null ? String(pos.tp) : '');
  };

  const handleCloseProfitable = () => {
    positions.filter((p) => p.profit > 0).forEach((p) => closePosition(p.id, 'MANUAL'));
    setSelectedPosId(null);
  };

  const handleCopyValue = (val: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(val).catch(() => undefined);
    }
    setCopiedText(val);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      copyTimerRef.current = null;
      setCopiedText(null);
    }, 1800);
  };

  const validSampleKeys = useMemo(() => {
    const keysFromAdmin = mobileActivations.slice(0, 2).map((m) => m.activationKey);
    return Array.from(
      new Set([currentPreset.sampleKey, '6DEER0DQ3VE44M', 'FXB-BULLS-2026-KEY', ...keysFromAdmin])
    );
  }, [currentPreset.sampleKey, mobileActivations]);

  const activeBotCount = installedBots.filter((b) => b.active).length;

  const { brand, updateBrand } = useBrand();

  return (
    <div className="space-y-6 pb-8">
      {/* Top White-Label Studio Switcher & Toolbar */}
      <div className="glass-ultra border border-white/[0.12] rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-cyan-400">{brand.brandName} · Mobile Execution Studio</span>
            <span aria-hidden="true">·</span>
            <span>{brand.ownerEntity} · Live MT5 Bridge</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
            {currentPreset.appName} Mobile Execution Deck
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Switch between all 11 white-labeled mobile architectures (Money Bot PV1, The Joker Trade Port, NEXUS2.V1 Purple Glass, SKYNET AI PRO 2.0, GOLD MAGIC) or sync your custom brand live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVideoReference((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap ${
              showVideoReference
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-[#141B29] border-white/[0.08] text-slate-300 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{showVideoReference ? 'Hide Video Reference' : 'Compare Reference Clips'}</span>
          </button>

          {onOpenConverterAdmin && (
            <button
              type="button"
              onClick={onOpenConverterAdmin}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141B29] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Rebrand in Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 White-Label Build Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {BUILD_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-[#141B29] text-white border-white/25'
                  : 'bg-[#0F141E] text-slate-400 border-white/[0.08] hover:text-slate-100 hover:bg-[#141B29]/70'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: preset.accentHex }}
              />
              <div>
                <div className="text-xs font-bold font-display whitespace-nowrap">
                  {preset.appName}
                </div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">
                  {preset.handle} · {preset.version}
                </div>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handleSelectPreset('custombrand')}
          className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
            activePresetId === 'custombrand'
              ? 'bg-[#141B29] text-white border-cyan-500/45'
              : 'bg-[#0F141E] text-slate-400 border-white/[0.08] hover:text-slate-100 hover:bg-[#141B29]/70'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: brandConfig.primaryColor || '#06b6d4' }}
          />
          <div>
            <div className="text-xs font-bold font-display whitespace-nowrap">
              {brandConfig.mobileAppName || brandConfig.brandName}
            </div>
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              Synced Admin Brand
            </div>
          </div>
        </button>
      </div>

      {/* Main Responsive Stage: Left Interactive Mobile EA Launcher + Right Desktop Telemetry & MT5 Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols on desktop, full width on mobile): Interactive Mobile Launcher Device */}
        <div className="lg:col-span-5 flex justify-center">
          <div
            className="w-full max-w-[430px] backdrop-blur-2xl border border-white/[0.14] rounded-[28px] overflow-hidden shadow-2xl relative flex flex-col min-h-[760px]"
            style={{
              background:
                activePresetId === 'nexus2v1'
                  ? 'linear-gradient(160deg, rgba(88, 28, 135, 0.28) 0%, rgba(10, 8, 22, 0.92) 55%, rgba(6, 7, 14, 0.97) 100%)'
                  : activePresetId === 'thejoker'
                  ? 'linear-gradient(165deg, rgba(127, 29, 29, 0.25) 0%, rgba(10, 7, 12, 0.95) 55%, rgba(6, 7, 12, 0.98) 100%)'
                  : 'linear-gradient(165deg, rgba(15, 23, 42, 0.85) 0%, rgba(7, 10, 15, 0.96) 100%)',
            }}
          >
            {/* Subtle Candlestick Watermark Field in Background */}
            <svg
              aria-hidden="true"
              viewBox="0 0 400 220"
              className="absolute inset-x-0 top-12 w-full h-56 opacity-[0.07] pointer-events-none"
            >
              {[
                { x: 24, y: 120, h: 42, wickTop: 105, wickBot: 175 },
                { x: 52, y: 95, h: 55, wickTop: 80, wickBot: 165 },
                { x: 80, y: 108, h: 36, wickTop: 92, wickBot: 158 },
                { x: 108, y: 74, h: 48, wickTop: 55, wickBot: 138 },
                { x: 136, y: 84, h: 32, wickTop: 70, wickBot: 130 },
                { x: 164, y: 58, h: 54, wickTop: 42, wickBot: 126 },
                { x: 192, y: 70, h: 28, wickTop: 54, wickBot: 110 },
                { x: 220, y: 46, h: 50, wickTop: 30, wickBot: 112 },
                { x: 248, y: 60, h: 38, wickTop: 44, wickBot: 110 },
                { x: 276, y: 38, h: 44, wickTop: 20, wickBot: 96 },
                { x: 304, y: 52, h: 36, wickTop: 38, wickBot: 102 },
                { x: 332, y: 34, h: 52, wickTop: 18, wickBot: 98 },
                { x: 360, y: 42, h: 38, wickTop: 28, wickBot: 94 },
              ].map((c, idx) => (
                <g key={idx}>
                  <line
                    x1={c.x + 6}
                    y1={c.wickTop}
                    x2={c.x + 6}
                    y2={c.wickBot}
                    stroke={currentPreset.accentHex}
                    strokeWidth="2"
                  />
                  <rect
                    x={c.x}
                    y={c.y}
                    width="12"
                    height={c.h}
                    rx="2"
                    fill={currentPreset.accentHex}
                  />
                </g>
              ))}
            </svg>

            {/* Mobile App Top Bar */}
            <div className="relative z-20 flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-[#090C12]/90 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
                aria-label="Open launcher navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="text-center min-w-0 px-2">
                <div className="text-sm font-bold text-white font-display tracking-wide truncate">
                  {currentPreset.appName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {brand.brandName} · {brand.ownerName}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onCurrencyChange(displayCurrency === 'USD' ? 'ZAR' : 'USD')}
                className="min-w-[44px] min-h-[44px] px-2.5 flex items-center justify-center rounded-xl bg-[#0F141E] border border-white/[0.08] text-xs font-mono font-bold text-slate-200 hover:border-white/25 transition"
                title="Switch Currency Display"
              >
                {displayCurrency}
              </button>
            </div>

            {/* Slide-Out Mobile Drawer Inside Device */}
            {isDrawerOpen && (
              <div className="absolute inset-0 z-40 flex">
                <div
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                  onClick={() => setIsDrawerOpen(false)}
                />
                <div className="relative z-10 w-72 bg-[#0B0F17] border-r border-white/[0.10] p-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <div>
                        <div className="text-sm font-bold text-white font-display">
                          {currentPreset.appName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {currentPreset.handle} · {currentPreset.version}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {(
                        [
                          { id: 'HOME' as LauncherBottomTab, label: 'Home Deck', icon: Home },
                          {
                            id: 'AI_SCANNER' as LauncherBottomTab,
                            label: 'AI Scanner',
                            icon: ScanLine,
                          },
                          {
                            id: 'METATRADER' as LauncherBottomTab,
                            label: 'MetaTrader 5 Terminal',
                            icon: CandlestickChart,
                          },
                          {
                            id: 'NEWS' as LauncherBottomTab,
                            label: 'Economic News Filter',
                            icon: Newspaper,
                          },
                          {
                            id: 'SETTINGS' as LauncherBottomTab,
                            label: 'Settings & Keys',
                            icon: Settings,
                          },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        const active = bottomTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setBottomTab(item.id);
                              setIsDrawerOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition ${
                              active
                                ? 'bg-[#141B29] text-white border border-white/[0.12]'
                                : 'text-slate-300 hover:bg-[#0F141E]'
                            }`}
                          >
                            <Icon className="w-4 h-4" style={{ color: currentPreset.accentHex }} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActivateStep('KEY');
                          setIsActivateModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#0F141E] transition"
                      >
                        <KeyRound className="w-4 h-4" style={{ color: currentPreset.accentHex }} />
                        <span>Activate EA / Add Key</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          onOpenAIScanner();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 transition"
                      >
                        <ScanLine className="w-4 h-4" />
                        <span>AI Chart Scanner</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0F141E] border border-white/[0.08] space-y-1 text-xs">
                    <div className="font-semibold text-white">
                      {primaryMt5?.brokerName || 'IC Markets'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                      MT5 #{primaryMt5?.login || '50294112'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Video 2 Top Push Notification Toast (Trading Started from EAConnect) */}
            {gmToastVisible && (
              <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-[#141F1A]/95 border border-emerald-500/40 shadow-xl flex items-start gap-2.5 relative z-30">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-white">Trading Started</span>
                    <span className="text-[9px] text-slate-400">now</span>
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-300">from EAConnect</div>
                  <div className="text-[10px] text-slate-300">
                    Trading enabled. Analyzing your selected pairs now.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGmToastVisible(false)}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Video 1 Floating Overlay Widget: Money Bot PV1 · Online · Both */}
            {(activePresetId === 'moneybotpv1' || moneyBotFloatingHud) && (
              <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-400/40 shadow-2xl flex items-center justify-between gap-2 relative z-30">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="truncate">Money Bot PV1 · Online · Both</span>
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono truncate">
                    {moneyBotToast || 'Signal Alerts Active · iTradeBot.org'}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setMoneyBotListening(false);
                      setMoneyBotFloatingHud(false);
                      setIsRobotRunning(false);
                      setMoneyBotToast('Signal listener stopped');
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/35"
                  >
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={() => void executeOrder({ symbol: 'XAUUSD', orderType: 'MARKET', side: 'BUY', lots: 0.05, comment: 'MoneyBot_PV1_Signal' })}
                    className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                  >
                    Signal
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomTab('METATRADER')}
                    className="px-2 py-1 rounded-lg bg-white/[0.08] text-slate-200"
                  >
                    Details
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Inner Body Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 relative z-10">
              {bottomTab === 'HOME' && (
                <>
                  {/* VIDEO 1 (SKYNET AI PRO 2.0): Connect -> Terminal -> Execute Pipeline & AI TRADE ANALYSIS Banner */}
                  {activePresetId === 'skynetpro2' && (
                    <div className="rounded-2xl bg-[#090B0F] border border-white/[0.12] p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            skynetStep === 'EXECUTE'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : skynetStep === 'TERMINAL'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {skynetStep === 'EXECUTE'
                            ? `${skynetBanner.side}`
                            : skynetStep === 'TERMINAL'
                            ? 'READY'
                            : 'CONNECT'}
                        </span>
                        <button
                          type="button"
                          onClick={runSkynetPipeline}
                          className="text-[10px] font-semibold text-rose-400 hover:text-rose-300"
                        >
                          Re-scan GOLD
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xl font-extrabold text-white font-display tracking-tight">
                            {skynetBanner.symbol}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {skynetStep === 'EXECUTE'
                              ? 'AI trade · Executing 1 of 5'
                              : skynetStep === 'TERMINAL'
                              ? 'Chart scan · Loading symbol'
                              : 'Chart scan · Connecting...'}
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono text-slate-400">
                          AI TRADE ANALYSIS
                        </div>
                      </div>

                      {/* 3-Step Horizontal Stepper: Connect -> Terminal -> Execute */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-1">
                          {(['CONNECT', 'TERMINAL', 'EXECUTE'] as const).map((stepName, sIdx) => {
                            const currentRank =
                              skynetStep === 'EXECUTE' ? 2 : skynetStep === 'TERMINAL' ? 1 : 0;
                            const done = sIdx <= currentRank;
                            return (
                              <React.Fragment key={stepName}>
                                <span
                                  className={`w-3 h-3 rounded-full border-2 transition ${
                                    done
                                      ? 'bg-white border-emerald-400'
                                      : 'bg-[#090B0F] border-slate-600'
                                  }`}
                                />
                                {sIdx < 2 && (
                                  <span
                                    className={`flex-1 h-[2px] mx-1 ${
                                      sIdx < currentRank ? 'bg-emerald-400' : 'bg-white/[0.15]'
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span>Connect</span>
                          <span>Terminal</span>
                          <span>Execute</span>
                        </div>
                      </div>

                      {/* AI TRADE ANALYSIS Entry/SL/TP Card */}
                      <div className="p-2.5 rounded-xl bg-black/70 border border-white/[0.1] space-y-0.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          AI TRADE ANALYSIS
                        </div>
                        <div className="text-sm font-extrabold font-display text-emerald-400">
                          {skynetBanner.symbol} {skynetBanner.side}
                        </div>
                        <div className="text-[11px] font-mono text-slate-200 tabular-nums">
                          Entry {skynetBanner.entry} · SL {skynetBanner.sl} · TP {skynetBanner.tp}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* High-Impact Economic News Ticker Strip (shown on classic & non-skynet builds) */}
                  {activePresetId !== 'skynetpro2' && (
                    <button
                      type="button"
                      onClick={() => setBottomTab('NEWS')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F141E]/95 border border-white/[0.08] hover:border-white/20 flex items-center justify-between gap-2 text-left transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[11px] font-mono font-bold shrink-0"
                          style={{ color: currentPreset.accentHex }}
                        >
                          HIGH IMPACT
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                          · IN {formatCountdown(nextHighImpact.secondsRemaining).slice(0, 7)}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {nextHighImpact.currency} CPI m/m
                      </span>
                    </button>
                  )}

                  {/* Center Glowing Emblem & Status Hero */}
                  <div className="py-1 flex flex-col items-center text-center">
                    <button
                      type="button"
                      onClick={handleOpenTradeDeckAction}
                      className="group focus:outline-none"
                      title={isRobotRunning ? 'Pause EA Engine' : 'Launch EA Engine'}
                    >
                      <BotCrestSvg
                        emblem={currentPreset.emblem}
                        accentHex={currentPreset.accentHex}
                        isActive={isRobotRunning}
                      />
                    </button>

                    <div className="mt-1 space-y-0.5">
                      <div className="text-sm font-extrabold tracking-widest text-white font-display uppercase">
                        {currentPreset.appName}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">
                        {currentPreset.tagline}
                      </div>
                      <div
                        className="text-xs font-mono font-bold tracking-wider tabular-nums"
                        style={{
                          color: isRobotRunning ? '#34d399' : currentPreset.accentHex,
                        }}
                      >
                        {isRobotRunning
                          ? `ACTIVE · ${positions.length} OPEN POSITIONS`
                          : 'IDLE · READY TO DEPLOY'}
                      </div>
                    </div>
                  </div>

                  {batchFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300 flex items-center justify-between gap-2">
                      <span>{batchFeedback}</span>
                      <button
                        type="button"
                        onClick={() => setBottomTab('METATRADER')}
                        className="font-semibold underline shrink-0"
                      >
                        View MT5
                      </button>
                    </div>
                  )}

                  {/* 3 Primary Action Buttons (Adapts to Video 1 SKYNET, Video 2 GOLD MAGIC, and classic presets) */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {activePresetId === 'skynetpro2' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenTradeDeckAction}
                          className="min-h-[64px] rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.12] flex flex-col items-center justify-center gap-1.5 transition"
                        >
                          {isRobotRunning ? (
                            <Square className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-emerald-400 fill-current" />
                          )}
                          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                            {isRobotRunning ? 'STOP' : 'RUN AI'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBottomTab('METATRADER');
                            setMt5Tab('QUOTES');
                          }}
                          className="min-h-[64px] rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.12] flex flex-col items-center justify-center gap-1.5 transition"
                        >
                          <Activity className="w-4 h-4 text-slate-200" />
                          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                            QUOTES
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsRobotRunning(false);
                            setSkynetStep('IDLE');
                            setBatchFeedback('SKYNET AI PRO 2.0 bot disarmed from host.');
                          }}
                          className="min-h-[64px] rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.12] flex flex-col items-center justify-center gap-1.5 transition"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                            REMOVE
                          </span>
                        </button>
                      </>
                    ) : activePresetId === 'goldmagic' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenTradeDeckAction}
                          className="min-h-[64px] rounded-xl bg-[#09150E] hover:bg-[#0D2115] border border-emerald-500/35 flex flex-col items-center justify-center gap-1.5 transition"
                        >
                          {isRobotRunning ? (
                            <Square className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Play className="w-4 h-4 text-emerald-400 fill-current" />
                          )}
                          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                            {isRobotRunning ? 'STOP' : 'START'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBottomTab('SETTINGS')}
                          className="min-h-[64px] rounded-xl bg-[#09150E] hover:bg-[#0D2115] border border-emerald-500/35 flex flex-col items-center justify-center gap-1.5 transition"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
                          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                            SETTINGS
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsRobotRunning(false);
                            setGmConsoleOpen(false);
                            setBatchFeedback('Gold Magic detached from terminal.');
                          }}
                          className="min-h-[64px] rounded-xl bg-[#09150E] hover:bg-[#0D2115] border border-emerald-500/35 flex flex-col items-center justify-center gap-1.5 transition"
                        >
                          <Trash2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
                            REMOVE
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setBottomTab(
                              currentPreset.actionLabels[0] === 'Quotes' ||
                                currentPreset.actionLabels[0] === 'Pairs'
                                ? 'METATRADER'
                                : 'NEWS'
                            )
                          }
                          className="min-h-[60px] rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] flex flex-col items-center justify-center gap-1 transition"
                        >
                          <Newspaper className="w-4 h-4 text-slate-300" />
                          <span className="text-xs font-semibold text-slate-200">
                            {currentPreset.actionLabels[0]}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenTradeDeckAction}
                          className="min-h-[60px] rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-white transition active:scale-[0.98]"
                          style={{
                            backgroundColor: isRobotRunning
                              ? '#dc2626'
                              : currentPreset.accentHex,
                            borderColor: 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {isRobotRunning ? (
                            <>
                              <Square className="w-4 h-4 fill-current" />
                              <span className="text-xs font-semibold">Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-current" />
                              <span className="text-xs font-semibold">
                                {currentPreset.actionLabels[1]}
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (currentPreset.actionLabels[2] === 'Logs') {
                              setBottomTab('SETTINGS');
                            } else {
                              setBottomTab('AI_SCANNER');
                            }
                          }}
                          className="min-h-[60px] rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] flex flex-col items-center justify-center gap-1 transition"
                        >
                          <ScanLine className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-semibold text-slate-200">
                            {currentPreset.actionLabels[2] === 'Logs' ? 'Logs' : 'Scan'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Video 2 (GOLD MAGIC) EA Connect Badge, Wide AI Scanner CTA & ROBOT LIST */}
                  {activePresetId === 'goldmagic' && (
                    <div className="space-y-2.5">
                      <div className="flex justify-center">
                        <span className="px-4 py-1.5 rounded-full bg-[#09150E] border border-emerald-500/35 text-[11px] font-semibold text-slate-200">
                          Powered by EA Connect
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setBottomTab('AI_SCANNER')}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#091C11] via-[#0E2B19] to-[#091C11] border border-emerald-500/45 text-xs font-bold text-white tracking-wide hover:brightness-110 transition"
                      >
                        AI Scanner
                      </button>

                      <div className="p-3 rounded-2xl bg-[#09120D] border border-white/[0.08] space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          ROBOT LIST
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>Gold Magic ({gmBotConfig.pairs.join(', ')})</span>
                          <button
                            type="button"
                            onClick={() => setGmConsoleOpen(true)}
                            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>Console</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video 1 (SKYNET AI PRO 2.0) + ADD ROBOT (HOST ROBOT KEY) Card */}
                  {activePresetId === 'skynetpro2' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivateStep('KEY');
                        setLicenseError(null);
                        setTermsAccepted(false);
                        setIsActivateModalOpen(true);
                      }}
                      className="w-full p-4 rounded-2xl bg-[#090B0F] hover:bg-[#10131A] border border-white/[0.12] flex items-center justify-between text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full border border-white/25 flex items-center justify-center text-white">
                          <Plus className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="text-sm font-extrabold text-white tracking-wider uppercase">
                            ADD ROBOT
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            HOST ROBOT KEY
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  )}

                  {/* 3-Column Live Status Readout */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0F141E] border border-white/[0.08] text-center">
                      <div className="text-[11px] text-slate-400">Symbols</div>
                      <div className="text-base font-bold font-mono text-white tabular-nums">
                        {selectedSymbols.length}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0F141E] border border-white/[0.08] text-center">
                      <div className="text-[11px] text-slate-400">Status</div>
                      <div
                        className={`text-sm font-bold font-mono ${
                          isRobotRunning ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isRobotRunning ? 'ACTIVE' : 'IDLE'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0F141E] border border-white/[0.08] text-center">
                      <div className="text-[11px] text-slate-400">EAs</div>
                      <div className="text-base font-bold font-mono text-white tabular-nums">
                        {activeBotCount}
                      </div>
                    </div>
                  </div>

                  {/* Connected Bots List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-300">
                        Connected Bots ({installedBots.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setBottomTab('METATRADER')}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        Open MT5
                      </button>
                    </div>

                    {installedBots.map((bot) => (
                      <div
                        key={bot.id}
                        className="p-3 rounded-xl bg-[#0F141E] border border-white/[0.08] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {bot.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            {bot.pairRule}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setInstalledBots((prev) =>
                              prev.map((item) =>
                                item.id === bot.id ? { ...item, active: !item.active } : item
                              )
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition shrink-0 ${
                            bot.active
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-[#141B29] border-white/[0.08] text-slate-400'
                          }`}
                        >
                          {bot.active ? 'Active' : 'Idle'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* VIDEO 2 (THE JOKER · Bcm_scalper): 49s Execution Timer Ring, Checklist & AccuMarkets Card */}
                  {activePresetId === 'thejoker' && (
                    <div className="space-y-3">
                      <div className="rounded-2xl bg-black/50 backdrop-blur-md border-2 border-rose-500/55 shadow-[0_0_24px_rgba(244,63,94,0.2)] p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-extrabold text-white">The joker (Bcm_scalper)</div>
                            <div className="text-[10px] font-mono text-rose-300">TRADE PORT EA · AccuMarkets-Live</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                            {jokerRunningRing ? 'AUTO ACTIVE' : 'STATUS'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-white">Signal Received: BUY EURUSD</div>
                            <div className="text-[10px] font-mono text-slate-300 truncate">
                              {jokerSteps[jokerSteps.length - 1]}
                            </div>
                          </div>
                          {/* Circular 49s Execution Countdown Timer Ring */}
                          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                              <circle
                                cx="22"
                                cy="22"
                                r="18"
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="4"
                                strokeDasharray={113}
                                strokeDashoffset={113 - (113 * jokerTimerSec) / 49}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-[11px] font-mono font-black text-white tabular-nums">
                              {jokerTimerSec}s
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-[10px] text-emerald-300 space-y-1 max-h-24 overflow-y-auto">
                          {jokerSteps.map((st, idx) => (
                            <div key={idx}>{st}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED ACCOUNT
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <Wifi className="w-3.5 h-3.5" /> INTERNET READY
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SYMBOL EURUSD
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <Info className="w-3.5 h-3.5" /> BOT ACTIVE
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleOpenTradeDeckAction}
                            className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                          >
                            RE AUTO TRADE
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyValue(jokerSteps.join('\n'))}
                            className="py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-[11px] font-bold transition"
                          >
                            {copiedText === jokerSteps.join('\n') ? 'COPIED LOG' : 'COPY LOG TEXT'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIDEO 3 (NEXUS2.V1 Purple Glass): Exness Flip-Card, Dock & Live Theme/Glass Switcher */}
                  {activePresetId === 'nexus2v1' && (
                    <div className="space-y-3">
                      {/* Copper/Gold Flip-Card: Exness-MT5Real30 */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExnessCardFlipped((prev) => !prev)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExnessCardFlipped((prev) => !prev);
                          }
                        }}
                        className="w-full text-left rounded-2xl p-4 border border-amber-400/40 shadow-xl transition relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                        style={{
                          background: exnessCardFlipped
                            ? 'linear-gradient(135deg, rgba(168,85,247,0.38), rgba(15,23,42,0.92))'
                            : 'linear-gradient(135deg, rgba(217,119,6,0.34), rgba(120,53,15,0.45), rgba(15,12,24,0.9))',
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-200">
                          <span>MT5 ACCOUNT · {exnessCardFlipped ? 'ORDERS' : 'EXNESS NODE'}</span>
                          <span className="flex items-center gap-1 text-white/80">
                            <RotateCw className="w-3 h-3" /> TAP TO FLIP
                          </span>
                        </div>
                        {!exnessCardFlipped ? (
                          <div className="mt-2.5 space-y-1">
                            <div className="text-base font-extrabold text-white font-display">
                              Exness-MT5Real30
                            </div>
                            <div className="text-xs font-mono text-amber-200 tabular-nums">
                              Login #{primaryMt5?.login || '26589012'} · Powered by Trade Port EA
                            </div>
                            <div className="text-[11px] font-mono text-emerald-300 pt-1">
                              Balance: {formatMoney(accountBalance)} · Equity: {formatMoney(accountEquity)}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs font-mono">
                            <span className="text-purple-200">
                              Open Tickets: <b>{positions.length}</b> · Key <b>265-8DF-24C-595</b>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNexusSetupModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition"
                            >
                              SETUP REQUIRED
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Global Theme & Glass UI Switcher inside NEXUS2.V1 Phone */}
                      <div className="rounded-2xl bg-purple-950/35 backdrop-blur-xl border border-purple-400/30 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-purple-200 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-300" /> LIVE THEME &amp; GLASS STYLE
                          </span>
                          <span>SYNCED TO APP</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              { id: 'CYAN', label: 'Cyan' },
                              { id: 'PURPLE', label: 'Purple' },
                              { id: 'BLUE', label: 'Blue' },
                              { id: 'EMERALD', label: 'Green' },
                              { id: 'ORANGE', label: 'Orange' },
                              { id: 'CRIMSON', label: 'Red' },
                            ] as Array<{ id: BrandAccentTheme; label: string }>
                          ).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => updateBrand({ accentTheme: t.id })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                brand.accentTheme === t.id
                                  ? 'bg-purple-500 text-white border-purple-300'
                                  : 'bg-white/[0.06] text-slate-300 border-white/10'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(GLASS_STYLE_META) as GlassStyleMode[]).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => updateBrand({ glassStyle: g })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                brand.glassStyle === g
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                  : 'bg-white/[0.05] text-slate-300 border-white/10'
                              }`}
                            >
                              {GLASS_STYLE_META[g].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NEXUS2.V1 SETUP REQUIRED Modal Overlay */}
                  {nexusSetupModalOpen && (
                    <div className="p-3.5 rounded-2xl bg-purple-950/85 backdrop-blur-xl border border-purple-400/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>SETUP REQUIRED · NEXUS2.V1</span>
                        <button type="button" onClick={() => setNexusSetupModalOpen(false)}>
                          <X className="w-4 h-4 text-purple-300" />
                        </button>
                      </div>
                      <p className="text-[11px] text-purple-100">
                        License <b>265-8DF-24C-595</b> active on Exness-MT5Real30. Connect broker or adjust glass style anytime.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNexusSetupModalOpen(false);
                          setBottomTab('METATRADER');
                          setMt5Tab('LINK');
                        }}
                        className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-[11px]"
                      >
                        CONNECT ACCOUNT
                      </button>
                    </div>
                  )}

                  {/* Action Cards: Chart Scanner + Add Keys / Activate EA */}
                  {activePresetId !== 'skynetpro2' && (
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setBottomTab('AI_SCANNER')}
                        className="w-full p-3.5 rounded-xl bg-[#0F141E]/80 backdrop-blur-md hover:bg-[#141B29] border border-white/[0.1] flex items-center justify-between text-left transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0">
                            <ScanLine className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white">
                              In-Phone AI Chart Scanner
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Scan screenshots, SMC/ICT strategies &amp; Fundamentals
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActivateStep('KEY');
                          setLicenseError(null);
                          setTermsAccepted(false);
                          setIsActivateModalOpen(true);
                        }}
                        className="w-full p-3.5 rounded-xl bg-[#0F141E]/80 backdrop-blur-md hover:bg-[#141B29] border border-white/[0.1] flex items-center justify-between text-left transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="p-2 rounded-lg shrink-0"
                            style={{
                              backgroundColor: currentPreset.accentSoft,
                              color: currentPreset.accentHex,
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white">
                              Add a New EA / Activate Key
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Have a valid License Key? Unlock &amp; verify policy
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* MOBILE TAB: VIDEO 3 IN-PHONE AI SCANNER & FUNDAMENTAL ANALYSIS */}
              {bottomTab === 'AI_SCANNER' && (
                <MobileInPhoneScanner
                  accentHex={currentPreset.accentHex}
                  prices={prices}
                  accountEquity={accountEquity}
                  onExecuteOrder={({ symbol, side, lots, sl, tp, comment }) =>
                    executeOrder({
                      symbol,
                      orderType: 'MARKET',
                      side,
                      lots,
                      sl,
                      tp,
                      comment,
                    })
                  }
                  onOpenFullAIScanner={onOpenAIScanner}
                />
              )}

              {/* MOBILE TAB 2: METATRADER 5 LIVE TERMINAL */}
              {bottomTab === 'METATRADER' && (
                <div className="space-y-3">
                  {/* Account Summary Card */}
                  <div className="p-3.5 rounded-xl bg-[#0F141E] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {primaryMt5?.brokerName || 'IC Markets Global'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                          #{primaryMt5?.login || '50294112'} · {primaryMt5?.server || 'ICMarkets-Live'}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold font-mono tabular-nums ${
                          unrealizedPnL >= 0 ? 'text-cyan-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(unrealizedPnL, true)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono tabular-nums">
                      <div>
                        <span className="text-slate-500 block">Balance</span>
                        <span className="text-slate-200 font-semibold">
                          {formatMoney(accountBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Equity</span>
                        <span className="text-white font-semibold">
                          {formatMoney(accountEquity)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Free Margin</span>
                        <span className="text-slate-200 font-semibold">
                          {formatMoney(freeMargin)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MT5 Sub-Navigation Pills */}
                  <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[#0F141E] border border-white/[0.08] text-[11px] font-semibold">
                    {(
                      [
                        { id: 'POSITIONS' as MT5SubTab, label: `Trades (${positions.length})` },
                        { id: 'QUOTES' as MT5SubTab, label: 'Quotes' },
                        { id: 'CHART' as MT5SubTab, label: 'Chart' },
                        { id: 'HISTORY' as MT5SubTab, label: 'History' },
                        { id: 'LINK' as MT5SubTab, label: 'Link' },
                      ] as const
                    ).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setMt5Tab(sub.id)}
                        className={`py-2 px-1 rounded-lg transition truncate ${
                          mt5Tab === sub.id
                            ? 'bg-[#141B29] text-white border border-white/[0.12]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {/* Open Positions List */}
                  {mt5Tab === 'POSITIONS' && (
                    <div className="space-y-2">
                      {positions.length === 0 ? (
                        <div className="p-6 rounded-xl bg-[#0F141E] border border-white/[0.08] text-center space-y-2">
                          <div className="text-xs font-semibold text-slate-300">
                            No Open MT5 Positions
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsQuickSetupOpen(true)}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-white"
                            style={{ backgroundColor: currentPreset.accentHex }}
                          >
                            Launch Quick Trade Setup
                          </button>
                        </div>
                      ) : (
                        <>
                          {positions.map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => openPosModal(pos.id)}
                              className="w-full p-3 rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] text-left transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white font-mono">
                                    {pos.symbol}
                                  </span>
                                  <span
                                    className={`text-[11px] font-mono font-bold ${
                                      pos.side === 'BUY' ? 'text-cyan-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {pos.side.toLowerCase()} {pos.lots.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 tabular-nums mt-0.5">
                                  {pos.openPrice} &rarr; {pos.currentPrice}
                                </div>
                              </div>
                              <div className="text-right font-mono tabular-nums shrink-0">
                                <div
                                  className={`text-xs font-bold ${
                                    pos.profit >= 0 ? 'text-cyan-400' : 'text-rose-400'
                                  }`}
                                >
                                  {formatMoney(pos.profit, true)}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  SL {pos.sl ?? '--'} / TP {pos.tp ?? '--'}
                                </div>
                              </div>
                            </button>
                          ))}

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCloseProfitable}
                              className="py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-semibold text-emerald-300 transition"
                            >
                              Close Profitable
                            </button>
                            <button
                              type="button"
                              onClick={executeKillSwitch}
                              className="py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-semibold text-rose-300 transition"
                            >
                              Close All ({positions.length})
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Quotes Watchlist */}
                  {mt5Tab === 'QUOTES' && (
                    <div className="space-y-1.5">
                      {Object.values(prices).map((q) => (
                        <div
                          key={q.symbol}
                          className="p-3 rounded-xl bg-[#0F141E] border border-white/[0.08] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-white font-mono">
                              {q.symbol}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Spread {q.spread} · {q.category}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right font-mono text-xs tabular-nums">
                              <div className="text-rose-400">{q.bid.toFixed(q.digits)}</div>
                              <div className="text-cyan-400">{q.ask.toFixed(q.digits)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                void executeOrder({
                                  symbol: q.symbol,
                                  orderType: 'MARKET',
                                  side: 'BUY',
                                  lots: setupLots,
                                  comment: `${currentPreset.appName}_QuoteTap`,
                                });
                              }}
                              className="px-2.5 py-2 rounded-lg bg-[#141B29] hover:bg-cyan-500 hover:text-slate-950 border border-white/[0.08] text-[11px] font-bold text-slate-200 transition"
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Embedded Live Chart */}
                  {mt5Tab === 'CHART' && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0F141E]">
                      <LiveTradingChart
                        selectedSymbol={selectedChartSymbol}
                        onSymbolChange={setSelectedChartSymbol}
                        onQuickTrade={(sym, side) => {
                          void executeOrder({
                            symbol: sym,
                            orderType: 'MARKET',
                            side,
                            lots: setupLots,
                            comment: `${currentPreset.appName}_ChartTap`,
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Closed History */}
                  {mt5Tab === 'HISTORY' && (
                    <div className="space-y-2">
                      {orderHistory.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-[#0F141E] border border-white/[0.08] flex items-center justify-between gap-2 text-xs font-mono tabular-nums"
                        >
                          <div>
                            <div className="font-bold text-white">
                              {item.symbol} · {item.side.toLowerCase()} {item.lots.toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-500">{item.closeTime}</div>
                          </div>
                          <div
                            className={`font-bold ${
                              item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatMoney(item.profit, true)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Link MT5 Account Form (@proff_401 flow) */}
                  {mt5Tab === 'LINK' && (
                    <form
                      onSubmit={handleLinkMt5Submit}
                      className="p-3.5 rounded-xl bg-[#0F141E] border border-white/[0.08] space-y-3"
                    >
                      <div className="text-xs font-bold text-white">MT5 Login Details</div>
                      <input
                        type="text"
                        placeholder="Broker Name (e.g. XcoMarkets, ICMarkets)"
                        value={mt5BrokerInput}
                        onChange={(e) => setMt5BrokerInput(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                      <input
                        type="text"
                        placeholder="MT5 Account Login Number"
                        value={mt5LoginInput}
                        onChange={(e) => setMt5LoginInput(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                      <input
                        type="password"
                        placeholder="MT5 Trader Password"
                        value={mt5PasswordInput}
                        onChange={(e) => setMt5PasswordInput(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Server (e.g. XcoMarkets-Live)"
                          value={mt5ServerInput}
                          onChange={(e) => setMt5ServerInput(e.target.value)}
                          required
                          className="w-full px-3 py-2.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                        />
                        <select
                          value={mt5AccountType}
                          onChange={(e) =>
                            setMt5AccountType(e.target.value as 'LIVE' | 'DEMO' | 'PROP_FIRM')
                          }
                          className="w-full px-2.5 py-2.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs text-white focus:outline-none"
                        >
                          <option value="LIVE">LIVE</option>
                          <option value="PROP_FIRM">PROP_FIRM</option>
                          <option value="DEMO">DEMO</option>
                        </select>
                      </div>

                      {mt5LinkStatus && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[11px] text-emerald-300">
                          {mt5LinkStatus}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLinkingMt5}
                        className="w-full py-3 rounded-xl text-xs font-bold text-white transition"
                        style={{ backgroundColor: currentPreset.accentHex }}
                      >
                        {isLinkingMt5 ? 'Authenticating MT5 Server...' : 'Link MT5 Account'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* MOBILE TAB 3: HIGH-IMPACT NEWS & PROTECTION */}
              {bottomTab === 'NEWS' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#0F141E] border border-white/[0.08] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Auto News Filter Guard
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Pause EA entries 30m before red-folder releases
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateAutomatedSettings({
                          newsFilterActive: !automatedSettings.newsFilterActive,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        automatedSettings.newsFilterActive
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#141B29] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      {automatedSettings.newsFilterActive ? 'Armed' : 'Off'}
                    </button>
                  </div>

                  {newsEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-[#0F141E] border border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            ev.impact === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {ev.currency} · {ev.impact} IMPACT
                        </span>
                        <span className="text-[11px] font-mono text-slate-300 tabular-nums">
                          {formatCountdown(ev.secondsRemaining)}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white">{ev.title}</div>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 tabular-nums">
                        <span>Forecast: {ev.forecast}</span>
                        <span>Previous: {ev.previous}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MOBILE TAB 4: SETTINGS, GOLD MAGIC BOT SETTINGS ACCORDION, LOGS & LICENSE VAULT */}
              {bottomTab === 'SETTINGS' && (
                <div className="space-y-4">
                  {activePresetId === 'goldmagic' && (
                    <GoldMagicSettingsPanel
                      botName="Gold Magic"
                      accentHex={currentPreset.accentHex}
                      availablePairs={['EURUSD.m', 'XAUUSD', 'GBPUSD', 'US30', 'NAS100', 'USDJPY', 'BTCUSD']}
                      initialConfig={gmBotConfig}
                      onSave={(next) => {
                        setGmBotConfig(next);
                        setSelectedSymbols(next.pairs);
                        updateAutomatedSettings({
                          riskPerTradePct:
                            parseFloat(next.riskPerTradePct) || automatedSettings.riskPerTradePct,
                          maxDailyLossCutoffPct:
                            parseFloat(next.dailyLossLimitPct) || automatedSettings.maxDailyLossCutoffPct,
                          autoTrailingStopEnabled: next.trailingStopEnabled,
                          newsFilterActive: next.analysisMode !== 'Price Action',
                        });
                      }}
                      onBack={() => setBottomTab('HOME')}
                    />
                  )}

                  <div className="p-3.5 rounded-xl bg-[#0F141E] border border-white/[0.08] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {speechSnapshot.settings.enabled ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">
                          Voice Execution Alerts
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Announce bot fills and market surges aloud
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        speechNotifier.updateSettings({
                          enabled: !speechSnapshot.settings.enabled,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        speechSnapshot.settings.enabled
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#141B29] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      {speechSnapshot.settings.enabled ? 'On' : 'Muted'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0F141E] border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Recent Execution Logs</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {webhookLogs.length} events
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {webhookLogs.slice(0, 6).map((log) => (
                        <div
                          key={log.id}
                          className="p-2 rounded-lg bg-[#090C12] border border-white/[0.06] text-[11px] font-mono flex items-center justify-between gap-2 tabular-nums"
                        >
                          <span className="text-slate-200 truncate">
                            {log.action} {log.symbol} {log.lots}L
                          </span>
                          <span className="text-emerald-400 shrink-0">
                            {log.executionTimeMs}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActivateStep('TERMS');
                      setIsActivateModalOpen(true);
                    }}
                    className="w-full p-3.5 rounded-xl bg-[#0F141E] hover:bg-[#141B29] border border-white/[0.08] flex items-center justify-between text-xs font-semibold text-slate-200 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Terms, Refund Policy &amp; Risk Disclosure</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Fixed Bottom Navigation Bar (Includes AI Scanner tab from Videos 1 & 3) */}
            <div className="relative z-20 grid grid-cols-5 border-t border-white/[0.08] bg-[#090C12]/95 px-1 py-1.5">
              {(
                [
                  { id: 'HOME' as LauncherBottomTab, label: 'Home', icon: Home },
                  { id: 'AI_SCANNER' as LauncherBottomTab, label: 'AI Scan', icon: ScanLine },
                  {
                    id: 'METATRADER' as LauncherBottomTab,
                    label: 'MetaTrader',
                    icon: CandlestickChart,
                  },
                  { id: 'NEWS' as LauncherBottomTab, label: 'News', icon: Newspaper },
                  { id: 'SETTINGS' as LauncherBottomTab, label: 'Settings', icon: Settings },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = bottomTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBottomTab(tab.id)}
                    className="min-h-[46px] flex flex-col items-center justify-center gap-1 rounded-xl transition"
                    style={{
                      color: active ? currentPreset.accentHex : '#94a3b8',
                      backgroundColor: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* MODAL 1 INSIDE DEVICE: QUICK TRADE SETUP (@fxcartel001 Multi-Symbol Batch) */}
            {isQuickSetupOpen && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
                <div className="w-full bg-[#0F141E] border border-white/[0.12] rounded-2xl p-4 space-y-3.5 max-h-[92%] overflow-y-auto custom-scrollbar shadow-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white font-display">
                        Quick Trade Setup
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pick multiple broker symbols. Each executes with the lot & trade count below.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickSetupOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Symbol Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      placeholder="Search symbols or type suffix (e.g. XAUUSD.m)..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#090C12] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/25"
                    />
                  </div>

                  {canCreateCustomSymbol && (
                    <button
                      type="button"
                      onClick={handleAddCustomSymbol}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Broker Symbol &ldquo;{symbolSearch.trim().toUpperCase()}&rdquo;</span>
                    </button>
                  )}

                  {/* Selectable Symbol Grid */}
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                    {allSymbolChoices.map((sym) => {
                      const picked = selectedSymbols.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => toggleSetupSymbol(sym)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition ${
                            picked ? 'text-white' : 'bg-[#090C12] border-white/[0.08] text-slate-400 hover:text-white'
                          }`}
                          style={
                            picked
                              ? {
                                  backgroundColor: currentPreset.accentSoft,
                                  borderColor: currentPreset.accentHex,
                                }
                              : undefined
                          }
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Counter + Removable Chips (@fxcartel001) */}
                  <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>SELECTED ({selectedSymbols.length})</span>
                      {selectedSymbols.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSymbols([])}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {selectedSymbols.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSymbols.map((sym) => (
                          <button
                            key={`picked-${sym}`}
                            type="button"
                            onClick={() => toggleSetupSymbol(sym)}
                            className="px-2 py-1 rounded-lg bg-[#141B29] border border-white/[0.12] text-[11px] font-mono text-white flex items-center gap-1 hover:border-rose-400/50 transition"
                            title="Remove symbol"
                          >
                            <span>{sym}</span>
                            <X className="w-3 h-3 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Side + Auto SL/TP */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#090C12] border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => setSetupSide('BUY')}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          setupSide === 'BUY'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupSide('SELL')}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          setupSide === 'SELL'
                            ? 'bg-rose-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        SELL
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUseAutoSlTp((v) => !v)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        useAutoSlTp
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#090C12] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Auto SL / TP: {useAutoSlTp ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Lot & Trades Count */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Lot Size
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="50"
                        value={setupLots}
                        onChange={(e) => setSetupLots(Math.max(0.01, Number(e.target.value) || 0.01))}
                        className="w-full px-3 py-2 rounded-xl bg-[#090C12] border border-white/[0.08] text-xs font-mono font-bold text-white tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Trades per Symbol
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={setupTradesCount}
                        onChange={(e) =>
                          setSetupTradesCount(
                            Math.min(15, Math.max(1, parseInt(e.target.value, 10) || 1))
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#090C12] border border-white/[0.08] text-xs font-mono font-bold text-white tabular-nums"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isExecutingBatch || selectedSymbols.length === 0}
                    onClick={handleConfirmBatchTrade}
                    className="w-full py-3 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: currentPreset.accentHex }}
                  >
                    {isExecutingBatch
                      ? 'Dispatching Orders...'
                      : `Confirm & Trade (${selectedSymbols.length * setupTradesCount} Orders)`}
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 2 INSIDE DEVICE: ACTIVATE EA + TERMS GATE (@mrfxbulls Flow) */}
            {isActivateModalOpen && (
              <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full bg-[#0F141E] border border-white/[0.12] rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90%] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-display">
                      {activateStep === 'TERMS'
                        ? 'Terms & Policies'
                        : activateStep === 'SUCCESS'
                        ? 'Activation Complete'
                        : 'Activate EA License'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsActivateModalOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {activateStep === 'KEY' && (
                    <form onSubmit={handleStartActivation} className="space-y-3">
                      <div className="text-xs text-slate-400">
                        Enter your issued license key for {currentPreset.appName} or tap a sample key below.
                      </div>
                      <input
                        type="text"
                        value={licenseInput}
                        onChange={(e) => setLicenseInput(e.target.value)}
                        placeholder="Paste License Key (e.g. 6DEER0DQ3VE44M)"
                        className="w-full px-3.5 py-3 rounded-xl bg-[#090C12] border border-white/[0.12] text-xs font-mono font-bold text-white tracking-wider focus:outline-none focus:border-emerald-400"
                      />

                      <div className="flex flex-wrap gap-1.5">
                        {validSampleKeys.map((sample) => (
                          <button
                            key={sample}
                            type="button"
                            onClick={() => setLicenseInput(sample)}
                            className="px-2 py-1 rounded-lg bg-[#141B29] hover:bg-slate-800 border border-white/[0.08] text-[10px] font-mono text-slate-300"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>

                      {licenseError && (
                        <div className="text-xs text-rose-400">{licenseError}</div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-xs font-bold text-white transition"
                        style={{ backgroundColor: currentPreset.accentHex }}
                      >
                        Activate EA
                      </button>
                    </form>
                  )}

                  {activateStep === 'VERIFYING' && (
                    <div className="py-10 flex flex-col items-center gap-3 text-center">
                      <RefreshCw
                        className="w-8 h-8 animate-spin"
                        style={{ color: currentPreset.accentHex }}
                      />
                      <div className="text-xs font-mono font-bold text-slate-200">
                        Validating Key & Broker HWID...
                      </div>
                    </div>
                  )}

                  {activateStep === 'TERMS' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#090C12] border border-white/[0.08] text-[11px] font-semibold">
                        {(
                          [
                            { id: 'TERMS', label: 'Terms' },
                            { id: 'REFUND', label: 'Refunds' },
                            { id: 'RISK', label: 'Risk' },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTermsTab(t.id)}
                            className={`py-2 rounded-lg transition ${
                              termsTab === t.id
                                ? 'bg-[#141B29] text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-[#090C12] border border-white/[0.08] text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                        {termsTab === 'TERMS' && (
                          <p>
                            1. License Authorization: Each mobile activation key authorizes automated routing strictly on your verified MetaTrader 5 accounts via {currentPreset.appName}. Unauthorized key sharing or reverse engineering terminates access immediately.
                          </p>
                        )}
                        {termsTab === 'REFUND' && (
                          <p>
                            Digital algorithmic software licenses delivered and bound to a broker account login ID are non-refundable once telemetry routing begins, except where technical non-delivery occurs prior to key activation.
                          </p>
                        )}
                        {termsTab === 'RISK' && (
                          <p>
                            Foreign exchange, commodities (XAUUSD), and leveraged CFD index trading carries substantial risk of capital loss. Automated execution and high-impact news filters do not guarantee profits.
                          </p>
                        )}
                      </div>

                      <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 rounded border-white/20 bg-[#090C12]"
                        />
                        <span>
                          I accept the Terms & Conditions, Refund Policy, and Risk Disclosure.
                        </span>
                      </label>

                      <button
                        type="button"
                        disabled={!termsAccepted}
                        onClick={handleAcceptTermsAndUnlock}
                        className="w-full py-3 rounded-xl text-xs font-bold text-white transition disabled:opacity-40"
                        style={{ backgroundColor: currentPreset.accentHex }}
                      >
                        Accept & Activate
                      </button>
                    </div>
                  )}

                  {activateStep === 'SUCCESS' && (
                    <div className="py-4 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <div className="text-sm font-bold text-white">
                        {currentPreset.appName} Armed
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Key {licenseInput.toUpperCase()} active on MT5 #{primaryMt5?.login || '50294112'}.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsActivateModalOpen(false)}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                      >
                        Return to EA Deck
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL 3 INSIDE DEVICE: MT5 POSITION ACTION SHEET (@proff_401) */}
            {selectedPos && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3">
                <div className="w-full bg-[#0F141E] border border-white/[0.12] rounded-2xl p-4 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white font-mono">
                        #{selectedPos.ticket} · {selectedPos.symbol}
                      </div>
                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        {selectedPos.side} {selectedPos.lots.toFixed(2)} ·{' '}
                        {formatMoney(selectedPos.profit, true)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPosId(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">SL</label>
                      <input
                        type="text"
                        value={editSl}
                        onChange={(e) => setEditSl(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">TP</label>
                      <input
                        type="text"
                        value={editTp}
                        onChange={(e) => setEditTp(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        modifyPositionSLTP(
                          selectedPos.id,
                          editSl ? Number(editSl) : null,
                          editTp ? Number(editTp) : null
                        );
                        setSelectedPosId(null);
                      }}
                      className="py-2.5 rounded-xl bg-[#141B29] border border-white/[0.1] text-xs font-semibold text-white"
                    >
                      Save SL / TP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBreakEven(selectedPos.id);
                        setSelectedPosId(null);
                      }}
                      className="py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-xs font-semibold text-cyan-300"
                    >
                      Set Break-Even
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChartSymbol(selectedPos.symbol);
                        setSelectedPosId(null);
                        setMt5Tab('CHART');
                      }}
                      className="py-2.5 rounded-xl bg-[#141B29] border border-white/[0.08] text-xs font-semibold text-slate-200"
                    >
                      View Chart
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closePosition(selectedPos.id, 'MANUAL');
                        setSelectedPosId(null);
                      }}
                      className="py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white"
                    >
                      Close Position
                    </button>
                  </div>

                  {/* Video 1 MT5 Bulk Operations Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={handleCloseProfitable}
                      className="py-2 rounded-xl bg-[#090C12] border border-white/[0.08] text-[11px] font-semibold text-emerald-300"
                    >
                      Bulk: Close Profitable
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        executeKillSwitch();
                        setSelectedPosId(null);
                      }}
                      className="py-2 rounded-xl bg-[#090C12] border border-rose-500/30 text-[11px] font-semibold text-rose-300"
                    >
                      Bulk: Liquidate All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 4 INSIDE DEVICE: VIDEO 2 GOLD MAGIC EA CONNECT LIVE CONSOLE OVERLAY */}
            {gmConsoleOpen && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full rounded-2xl bg-[#051009] border border-emerald-500/45 p-4 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-base font-extrabold text-white font-display">
                        Gold Magic
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/45 text-[9px] font-mono font-bold text-emerald-300">
                          TRADING ACTIVE
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[9px] font-mono font-bold text-slate-200">
                          ROBOT ACTIVATED
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGmConsoleOpen(false)}
                      className="p-1.5 rounded-lg bg-white/[0.08] text-slate-300 hover:text-white"
                      aria-label="Close console overlay"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Balance / Equity / PnL Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#030906] border border-white/[0.08] text-center font-mono tabular-nums">
                    <div>
                      <span className="text-[9px] text-slate-400 block">BALANCE</span>
                      <span className="text-xs font-bold text-white">
                        {formatMoney(accountBalance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">EQUITY</span>
                      <span className="text-xs font-bold text-white">
                        {formatMoney(accountEquity)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">PNL</span>
                      <span
                        className={`text-xs font-bold ${
                          unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(unrealizedPnL, true)}
                      </span>
                    </div>
                  </div>

                  {/* Live Terminal Log Stream */}
                  <div className="p-3 rounded-xl bg-[#020503] border border-emerald-500/25 min-h-[150px] max-h-[210px] overflow-y-auto custom-scrollbar space-y-1 font-mono text-[11px]">
                    {gmConsoleLogs.map((line, i) => (
                      <div key={i} className="text-emerald-300 leading-relaxed">
                        {line}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">Powered by EAConnect</span>
                    <button
                      type="button"
                      onClick={() => {
                        setGmConsoleOpen(false);
                        setBottomTab('METATRADER');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold"
                    >
                      Inspect MT5 Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols on desktop): Institutional Live Exposure Deck, Linked Brokers & Reference Clips */}
        <div className="lg:col-span-7 space-y-5">
          {/* Optional Reference Clip Player (All 12 uploaded build recordings selectable) */}
          {showVideoReference && (
            <div className="glass-ultra border border-white/[0.12] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white font-display">
                    Reference Walkthroughs · Uploaded Builds (12 Clips)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Select any screen recording to compare side-by-side
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVideoReference(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...BUILD_PRESETS.filter((p) => p.referenceVideo).map((p) => ({
                    id: p.id,
                    appName: p.appName,
                    handle: p.handle,
                    referenceVideo: p.referenceVideo!,
                  })),
                  ...EXTRA_REFERENCE_CLIPS,
                ].map((clip) => {
                  const activeClip =
                    (selectedRefVideoUrl || currentPreset.referenceVideo) ===
                    clip.referenceVideo;
                  return (
                    <button
                      key={`clip-${clip.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedRefVideoUrl(clip.referenceVideo);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                        activeClip
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#090C12] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      {clip.appName} ({clip.handle})
                    </button>
                  );
                })}
              </div>
              <video
                key={selectedRefVideoUrl || currentPreset.referenceVideo}
                src={selectedRefVideoUrl || currentPreset.referenceVideo}
                controls
                playsInline
                className="w-full max-h-[380px] rounded-xl bg-black border border-white/[0.08]"
              />
            </div>
          )}

          {/* Account Exposure & Engine KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
              <div className="text-xs text-slate-400">Account Equity</div>
              <div className="text-lg font-bold font-mono text-white tabular-nums mt-1">
                {formatMoney(accountEquity)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
              <div className="text-xs text-slate-400">Floating PnL</div>
              <div
                className={`text-lg font-bold font-mono tabular-nums mt-1 ${
                  unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMoney(unrealizedPnL, true)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
              <div className="text-xs text-slate-400">Open Tickets</div>
              <div className="text-lg font-bold font-mono text-white tabular-nums mt-1">
                {positions.length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08]">
              <div className="text-xs text-slate-400">Margin Level</div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums mt-1">
                {marginLevel > 0 ? `${marginLevel.toFixed(0)}%` : 'Unencumbered'}
              </div>
            </div>
          </div>

          {/* Direct Widescreen Position Monitor & Quick Controls */}
          <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white font-display">
                  Live Synchronized MT5 Exposure Book
                </h2>
                <p className="text-xs text-slate-400">
                  Orders placed from the Mobile EA Deck appear here in real time across {primaryMt5?.server || 'ICMarkets-Live'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSetupOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
                  style={{ backgroundColor: currentPreset.accentHex }}
                >
                  + Batch Setup
                </button>
                <button
                  type="button"
                  onClick={executeKillSwitch}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 border border-rose-500/35 text-xs font-semibold text-rose-300 hover:text-white transition"
                >
                  Close All
                </button>
              </div>
            </div>

            {positions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="text-sm font-semibold text-slate-300">
                  Exposure Book Flat
                </div>
                <p className="text-xs text-slate-500">
                  Press Trade on the {currentPreset.appName} deck to launch multi-symbol MT5 orders.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090C12] text-slate-400 border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Ticket</th>
                      <th className="py-2.5 px-3 font-semibold">Symbol</th>
                      <th className="py-2.5 px-3 font-semibold">Side</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Lots</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Open / Mark</th>
                      <th className="py-2.5 px-3 font-semibold text-right">PnL ({displayCurrency})</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                    {positions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-[#141B29]/60">
                        <td className="py-2.5 px-4 text-slate-400">#{pos.ticket}</td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          <button
                            type="button"
                            onClick={() => onOpenInBridge(pos.symbol)}
                            className="hover:text-cyan-400 transition"
                          >
                            {pos.symbol}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              pos.side === 'BUY'
                                ? 'text-cyan-400 font-bold'
                                : 'text-rose-400 font-bold'
                            }
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-200">
                          {pos.lots.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {pos.openPrice} &rarr; {pos.currentPrice}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${
                            pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatMoney(pos.profit, true)}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setBreakEven(pos.id)}
                            className="text-[11px] text-cyan-400 hover:underline font-sans font-semibold"
                          >
                            BE
                          </button>
                          <button
                            type="button"
                            onClick={() => closePosition(pos.id, 'MANUAL')}
                            className="text-[11px] text-rose-400 hover:underline font-sans font-semibold"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Connected MT5 Broker Nodes & Sample Keys Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connected MT5 Brokers */}
            <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-display flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Connected MT5 Accounts ({mt5Credentials.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBottomTab('METATRADER');
                    setMt5Tab('LINK');
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  + Link New
                </button>
              </div>
              <div className="space-y-2">
                {mt5Credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      cred.isPrimary
                        ? 'bg-[#141B29] border-cyan-500/40'
                        : 'bg-[#090C12] border-white/[0.06]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {cred.brokerName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        #{cred.login} · {cred.server}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!cred.isPrimary ? (
                        <button
                          type="button"
                          onClick={() => setPrimaryMT5Broker(cred.id)}
                          className="px-2 py-1 rounded-lg bg-[#141B29] border border-white/[0.08] text-[10px] font-semibold text-slate-300 hover:text-white"
                        >
                          Use
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          Primary
                        </span>
                      )}
                      {mt5Credentials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => disconnectMT5Broker(cred.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active License Keys & Quick Test Card */}
            <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-display flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Valid Activation Keys</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivateStep('KEY');
                    setIsActivateModalOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Test Gate
                </button>
              </div>
              <div className="space-y-2">
                {validSampleKeys.slice(0, 4).map((keyStr) => (
                  <div
                    key={keyStr}
                    className="p-2.5 rounded-xl bg-[#090C12] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">
                      {keyStr}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyValue(keyStr)}
                        className="p-1.5 rounded-lg bg-[#141B29] text-slate-300 hover:text-white"
                        title="Copy license key"
                      >
                        {copiedText === keyStr ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLicenseInput(keyStr);
                          setActivateStep('KEY');
                          setIsActivateModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: currentPreset.accentHex }}
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
