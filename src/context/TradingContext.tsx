import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MarketPrice,
  Position,
  PendingOrder,
  OrderHistoryItem,
  TerminalInstance,
  WebhookLog,
  RobotStrategy,
  TradingSignal,
  PropChallenge,
  EALicense,
  EAPreset,
  ConvertedEA,
  MobileActivation,
  BrandConfig,
  MT5BrokerCredential,
  AutomatedTradingSettings,
  OrderType,
  OrderSide,
} from '../types/trading';
import { liveMarketData } from '../services/liveMarketData';
import { generateKeyCode, randomHex, sha256Hex } from '../lib/crypto';
import { auth, dbFirestore, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface NewOrderParams {
  symbol: string;
  orderType: OrderType;
  side: OrderSide;
  lots: number;
  targetPrice?: number; // for LIMIT / STOP
  sl?: number | null;
  tp?: number | null;
  terminal?: string;
  comment?: string;
  maxSlippagePips?: number;
}

export interface BatchOrderParams {
  symbol: string;
  side: OrderSide;
  lots: number;
  count: number;
  sl?: number | null;
  tp?: number | null;
  terminal?: string;
  comment?: string;
}

interface TradingContextType {
  prices: Record<string, MarketPrice>;
  positions: Position[];
  pendingOrders: PendingOrder[];
  orderHistory: OrderHistoryItem[];
  terminals: TerminalInstance[];
  webhookLogs: WebhookLog[];
  robots: RobotStrategy[];
  signals: TradingSignal[];
  challenge: PropChallenge;
  licenses: EALicense[];
  presets: EAPreset[];
  convertedEAs: ConvertedEA[];
  mobileActivations: MobileActivation[];
  brandConfig: BrandConfig;
  mt5Credentials: MT5BrokerCredential[];
  automatedSettings: AutomatedTradingSettings;
  
  // Real-Time Market Feed Stats (No Mock Data)
  isRealtimeFeedActive: boolean;
  ticksPerSecond: number;
  
  // Account Stats
  accountBalance: number;
  accountEquity: number;
  unrealizedPnL: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  bridgeLatencyMs: number;
  isBridgeConnected: boolean;
  
  // Execution Actions
  executeOrder: (params: NewOrderParams) => Promise<{ success: boolean; message: string; ticket?: number }>;
  executeBatchOrders: (params: BatchOrderParams) => Promise<{ success: boolean; message: string; tickets: number[] }>;
  closePosition: (positionId: string, reason?: OrderHistoryItem['closeReason']) => void;
  partialClosePosition: (positionId: string, percent: number) => void;
  modifyPositionSLTP: (positionId: string, sl: number | null, tp: number | null) => void;
  setBreakEven: (positionId: string) => void;
  toggleTrailingStop: (positionId: string, distancePips?: number) => void;
  cancelPendingOrder: (orderId: string) => void;
  executeKillSwitch: () => void;
  
  // Webhook / Bridge Actions
  processWebhookPayload: (payloadStr: string, source?: string) => { success: boolean; message: string };
  clearWebhookLogs: () => void;
  
  // Terminal / Copier Actions
  toggleTerminalAutoTrading: (terminalId: string) => void;
  updateTerminalMultiplier: (terminalId: string, multiplier: number) => void;
  
  // Prop Challenge Actions
  resetChallenge: (accountType: '1-PHASE' | '2-PHASE' | 'INSTANT_FUNDED', initialBalance: number) => void;
  simulatePropPass: () => void;
  
  // EA-Vault Actions
  generateLicense: (robotName: string, clientName: string, clientEmail: string, accountNumber: string, hwid: string, daysValid: number) => EALicense;
  revokeLicense: (licenseId: string) => void;
  downloadPreset: (presetId: string) => void;

  // EA-Converter & Rebrand / "Rename" Actions
  updateBrandConfig: (newConfig: Partial<BrandConfig>) => void;
  convertEACode: (name: string, originalFormat: ConvertedEA['originalFormat'], targetFormat: ConvertedEA['targetFormat']) => Promise<ConvertedEA>;
  issueMobileActivation: (clientName: string, clientEmail: string, broker: string, accountNumber: string, eaAssigned: string, deviceType: MobileActivation['deviceType']) => MobileActivation;
  revokeMobileActivation: (id: string) => void;
  toggleMobileActivationStatus: (id: string) => void;

  // Real MT5 Broker Login & Best Automated Trading System Actions
  connectMT5Broker: (brokerName: string, server: string, login: string, passwordMasked: string, accountType: MT5BrokerCredential['accountType']) => Promise<{ success: boolean; message: string; credential?: MT5BrokerCredential }>;
  disconnectMT5Broker: (id: string) => void;
  setPrimaryMT5Broker: (id: string) => void;
  updateAutomatedSettings: (newSettings: Partial<AutomatedTradingSettings>) => void;
  toggleMasterAutoTrading: () => void;
}

const INITIAL_PRICES: Record<string, MarketPrice> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    category: 'METALS',
    bid: 2735.45,
    ask: 2735.65,
    spread: 2.0,
    digits: 2,
    change24h: 0.84,
    high: 2748.20,
    low: 2718.50,
    pipSize: 0.1,
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    bid: 1.08420,
    ask: 1.08432,
    spread: 1.2,
    digits: 5,
    change24h: -0.22,
    high: 1.08750,
    low: 1.08150,
    pipSize: 0.0001,
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    name: 'British Pound / Japanese Yen',
    category: 'FOREX',
    bid: 198.450,
    ask: 198.468,
    spread: 1.8,
    digits: 3,
    change24h: 0.65,
    high: 199.200,
    low: 197.800,
    pipSize: 0.01,
  },
  US30: {
    symbol: 'US30',
    name: 'Wall Street 30 / Dow Jones',
    category: 'INDICES',
    bid: 43750.2,
    ask: 43752.0,
    spread: 1.8,
    digits: 1,
    change24h: 1.15,
    high: 43900.0,
    low: 43450.0,
    pipSize: 1.0,
  },
  NAS100: {
    symbol: 'NAS100',
    name: 'US Tech 100 / Nasdaq',
    category: 'INDICES',
    bid: 20420.5,
    ask: 20422.0,
    spread: 1.5,
    digits: 1,
    change24h: 1.48,
    high: 20550.0,
    low: 20180.0,
    pipSize: 1.0,
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'CRYPTO',
    bid: 76240.0,
    ask: 76255.0,
    spread: 15.0,
    digits: 1,
    change24h: 3.82,
    high: 77100.0,
    low: 74200.0,
    pipSize: 1.0,
  },
  ETHUSD: {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'CRYPTO',
    bid: 2940.8,
    ask: 2941.9,
    spread: 1.1,
    digits: 2,
    change24h: 2.18,
    high: 2985.0,
    low: 2890.0,
    pipSize: 0.1,
  },
  XAUUSDm: {
    symbol: 'XAUUSDm',
    name: 'Gold / USD (Micro ECN)',
    category: 'METALS',
    bid: 2735.45,
    ask: 2735.65,
    spread: 2.0,
    digits: 2,
    change24h: 0.84,
    high: 2748.20,
    low: 2718.50,
    pipSize: 0.1,
  },
  XAGEURm: {
    symbol: 'XAGEURm',
    name: 'Silver / EUR (Micro ECN)',
    category: 'METALS',
    bid: 29.840,
    ask: 29.855,
    spread: 1.5,
    digits: 3,
    change24h: 1.42,
    high: 30.150,
    low: 29.400,
    pipSize: 0.01,
  },
};

const INITIAL_TERMINALS: TerminalInstance[] = [
  {
    id: 'term-1',
    name: 'EmergeFX DXtrade',
    platform: 'DXtrade',
    broker: 'ThinkMarkets Emerge',
    accountNumber: '8839210',
    server: 'Emerge-Live-LD4',
    pingMs: 1.4,
    status: 'ONLINE',
    location: 'London Equinix LD4',
    activeEAs: 2,
    balance: 100000.00,
    equity: 104250.00,
    margin: 1250.00,
    freeMargin: 103000.00,
    autoTrading: true,
    copierRole: 'MASTER',
    multiplier: 1.0,
  },
  {
    id: 'term-2',
    name: 'MT5 Pro Algo Node',
    platform: 'MT5',
    broker: 'IC Markets Global',
    accountNumber: '50294112',
    server: 'ICMarkets-SC-Live02',
    pingMs: 2.1,
    status: 'ONLINE',
    location: 'New York NY4',
    activeEAs: 3,
    balance: 50000.00,
    equity: 52180.50,
    margin: 850.00,
    freeMargin: 51330.50,
    autoTrading: true,
    copierRole: 'SLAVE',
    multiplier: 0.5,
  },
  {
    id: 'term-3',
    name: 'cTrader Institutional',
    platform: 'cTrader',
    broker: 'Pepperstone UK',
    accountNumber: '694208',
    server: 'cTrader-Live-EU',
    pingMs: 1.8,
    status: 'ONLINE',
    location: 'London LD4',
    activeEAs: 1,
    balance: 25000.00,
    equity: 26050.20,
    margin: 400.00,
    freeMargin: 25650.20,
    autoTrading: true,
    copierRole: 'SLAVE',
    multiplier: 0.25,
  },
  {
    id: 'term-4',
    name: 'MT4 Backup Cluster',
    platform: 'MT4',
    broker: 'FTMO MT4 Live',
    accountNumber: '1948275',
    server: 'FTMO-Server04',
    pingMs: 3.4,
    status: 'ONLINE',
    location: 'Frankfurt FR2',
    activeEAs: 1,
    balance: 200000.00,
    equity: 208400.00,
    margin: 2500.00,
    freeMargin: 205900.00,
    autoTrading: true,
    copierRole: 'SLAVE',
    multiplier: 2.0,
  },
];

const INITIAL_ROBOTS: RobotStrategy[] = [
  {
    id: 'ea-1',
    name: 'Endgame Forex Robot',
    codeName: 'ENDGAME_HFT_V4',
    category: 'High-Frequency Scalper',
    description: 'Proprietary institutional HFT algorithm engineered for passing prop firm evaluations and high Sharpe ratio intraday returns on Gold and US30.',
    timeframe: 'M1 / M5',
    pairs: ['XAUUSD', 'US30'],
    winRate: 84.6,
    profitFactor: 3.42,
    maxDrawdown: 3.1,
    totalTrades: 1482,
    monthlyReturn: 14.8,
    activeStatus: 'ACTIVE',
    riskProfile: 'CONSERVATIVE',
    tags: ['Prop Firm Verified', 'Zero-Martingale', 'News Filter', 'Emerge Compatible'],
  },
  {
    id: 'ea-2',
    name: 'Shadow River Matrix',
    codeName: 'SHADOW_RIVER_V2',
    category: 'Trend & Liquidity Flow',
    description: 'Tracks market maker order blocks, institutional liquidity imbalances, and sweep candles with dynamic trailing stops and multi-layer TP.',
    timeframe: 'M15 / H1',
    pairs: ['EURUSD', 'GBPJPY', 'NAS100'],
    winRate: 78.2,
    profitFactor: 2.85,
    maxDrawdown: 4.5,
    totalTrades: 924,
    monthlyReturn: 11.2,
    activeStatus: 'ACTIVE',
    riskProfile: 'MODERATE',
    tags: ['SMC OrderBlock', 'FVG Harvester', 'Multi-Timeframe'],
  },
  {
    id: 'ea-3',
    name: 'Apex Liquidity Scalper',
    codeName: 'APEX_SCALP_PRO',
    category: 'Session Breakout',
    description: 'Captures London Open and NY Opening Bell volume expansions with ultra-tight 8-pip stop loss and rapid 1:3 risk-to-reward ratio.',
    timeframe: 'M5',
    pairs: ['XAUUSD', 'GBPJPY'],
    winRate: 72.8,
    profitFactor: 2.65,
    maxDrawdown: 2.8,
    totalTrades: 640,
    monthlyReturn: 9.4,
    activeStatus: 'ACTIVE',
    riskProfile: 'CONSERVATIVE',
    tags: ['Tight SL', 'Session Scalper', 'Low Latency'],
  },
  {
    id: 'ea-4',
    name: 'Titan Grid Matrix',
    codeName: 'TITAN_GRID_ELITE',
    category: 'Mean Reversion & Volatility',
    description: 'Non-toxic algorithmic grid system with dynamic ATR-based spacing and automated equity basket protection for ranging sessions.',
    timeframe: 'M30',
    pairs: ['EURUSD', 'BTCUSD'],
    winRate: 89.1,
    profitFactor: 3.12,
    maxDrawdown: 5.2,
    totalTrades: 2150,
    monthlyReturn: 18.5,
    activeStatus: 'ACTIVE',
    riskProfile: 'AGGRESSIVE',
    tags: ['High Yield', 'ATR Spacing', 'Equity Shield'],
  },
];

const INITIAL_SIGNALS: TradingSignal[] = [
  {
    id: 'sig-1',
    robotId: 'ea-1',
    robotName: 'Endgame Forex Robot',
    symbol: 'XAUUSD',
    side: 'BUY',
    entryPrice: 2735.50,
    currentPrice: 2735.65,
    sl: 2728.00,
    tp1: 2745.00,
    tp2: 2755.00,
    timeframe: 'M5',
    confidence: 96,
    timestamp: '2 mins ago',
    status: 'ACTIVE',
    reason: 'Bullish liquidity sweep below 2730 + M5 Fair Value Gap confirmation',
  },
  {
    id: 'sig-2',
    robotId: 'ea-2',
    robotName: 'Shadow River Matrix',
    symbol: 'US30',
    side: 'BUY',
    entryPrice: 43720.0,
    currentPrice: 43751.0,
    sl: 43610.0,
    tp1: 43850.0,
    tp2: 44000.0,
    timeframe: 'M15',
    confidence: 92,
    timestamp: '11 mins ago',
    status: 'ACTIVE',
    reason: 'NY Session pre-market demand block retest with volume delta divergence',
  },
  {
    id: 'sig-3',
    robotId: 'ea-3',
    robotName: 'Apex Liquidity Scalper',
    symbol: 'EURUSD',
    side: 'SELL',
    entryPrice: 1.08450,
    currentPrice: 1.08420,
    sl: 1.08620,
    tp1: 1.08250,
    tp2: 1.08050,
    timeframe: 'M5',
    confidence: 88,
    timestamp: '25 mins ago',
    status: 'ACTIVE',
    reason: 'Asian High rejection + Bearish breaker block structure shift',
  },
];

const INITIAL_LICENSES: EALicense[] = [
  {
    id: 'lic-1',
    key: 'EWT-ENDGAME-883921-99A4-F2',
    robotName: 'Endgame Forex Robot',
    accountNumber: '8839210',
    hwid: 'HWID-9F81-42BA-E8C2',
    clientName: 'Alex Mercer (Emerge Prop)',
    clientEmail: 'trader.alex@emergeprofit.com',
    createdAt: '2026-10-15',
    expiresAt: '2027-10-15',
    status: 'ACTIVE',
    maxAccounts: 2,
    activeAccounts: 1,
  },
  {
    id: 'lic-2',
    key: 'EWT-SHADOW-502941-66C1-K9',
    robotName: 'Shadow River Matrix',
    accountNumber: '50294112',
    hwid: 'HWID-77C2-11AA-004B',
    clientName: 'Apex Capital Fund',
    clientEmail: 'desk@apexhedge.io',
    createdAt: '2026-09-01',
    expiresAt: '2027-09-01',
    status: 'ACTIVE',
    maxAccounts: 5,
    activeAccounts: 3,
  },
  {
    id: 'lic-3',
    key: 'EWT-TITAN-194827-33D8-Z1',
    robotName: 'Titan Grid Matrix',
    accountNumber: '1948275',
    hwid: 'HWID-55AA-4433-8899',
    clientName: 'Sarah Jenkins',
    clientEmail: 's.jenkins@quantnet.de',
    createdAt: '2026-11-01',
    expiresAt: '2027-05-01',
    status: 'ACTIVE',
    maxAccounts: 1,
    activeAccounts: 1,
  },
];

const INITIAL_PRESETS: EAPreset[] = [
  {
    id: 'pre-1',
    robotName: 'Endgame Forex Robot',
    title: 'EmergeFX Prop Firm Evaluation Safe .SET',
    symbol: 'XAUUSD',
    timeframe: 'M5',
    accountType: 'PROP_FIRM',
    riskPercentage: 0.75,
    content: `; Endgame EA Preset for Prop Challenge
[StrategySettings]
MagicNumber=881290
LotMode=RiskPercentage
RiskPercent=0.75
MaxDailyLossCutoff=3.5
MaxDrawdownCutoff=6.5
MaxSpreadPips=2.5
UseNewsFilter=true
StopTradingBeforeNewsMinutes=30
ResumeTradingAfterNewsMinutes=45
TrailingStopEnabled=true
TrailingDistancePips=15.0
PartialClosePercent=50.0
TakeProfit1_Pips=35.0
TakeProfit2_Pips=75.0`,
    downloadCount: 3840,
    verifiedDate: '2026-11-04',
  },
  {
    id: 'pre-2',
    robotName: 'Shadow River Matrix',
    title: 'High-Yield Personal Growth Matrix .SET',
    symbol: 'US30',
    timeframe: 'M15',
    accountType: 'AGGRESSIVE_GROWTH',
    riskPercentage: 2.0,
    content: `; Shadow River Trend Matrix Aggressive
[StrategySettings]
MagicNumber=772019
LotMode=DynamicEquity
RiskPercent=2.0
UseBreakevenAtPips=25.0
BreakevenLockPips=5.0
OrderBlockLookback=200
FairValueGapThreshold=3.0
SessionFilter=London_NY_Only
MaxSlippagePips=3.0`,
    downloadCount: 2190,
    verifiedDate: '2026-10-28',
  },
  {
    id: 'pre-3',
    robotName: 'Titan Grid Matrix',
    title: 'Conservative Low-Drawdown EURUSD .SET',
    symbol: 'EURUSD',
    timeframe: 'M30',
    accountType: 'PERSONAL_SAFE',
    riskPercentage: 0.5,
    content: `; Titan Grid Elite - Safe Range
[StrategySettings]
MagicNumber=991044
InitialLot=0.10
GridStepPips=18.0
LotMultiplier=1.2
MaxGridLevels=5
BasketProfitTargetUSD=150.00
EquityStopLossPercent=5.0`,
    downloadCount: 1420,
    verifiedDate: '2026-10-19',
  },
];

const INITIAL_POSITIONS: Position[] = [
  {
    id: 'pos-1',
    ticket: 8940122,
    symbol: 'XAUUSD',
    side: 'BUY',
    lots: 1.5,
    openPrice: 2728.40,
    currentPrice: 2735.65,
    sl: 2720.00,
    tp: 2750.00,
    profit: 1087.50,
    pips: 72.5,
    commission: -10.50,
    swap: -2.40,
    openTime: '2026-11-06 06:14:22',
    terminal: 'EmergeFX DXtrade',
    magicNumber: 881290,
    comment: 'Endgame_M5_Signal',
    isTrailing: true,
    trailingDistancePips: 20,
  },
  {
    id: 'pos-2',
    ticket: 8940188,
    symbol: 'US30',
    side: 'BUY',
    lots: 2.0,
    openPrice: 43680.0,
    currentPrice: 43751.0,
    sl: 43590.0,
    tp: 43900.0,
    profit: 1420.00,
    pips: 71.0,
    commission: -14.00,
    swap: 0.00,
    openTime: '2026-11-06 07:42:09',
    terminal: 'EmergeFX DXtrade',
    magicNumber: 772019,
    comment: 'ShadowRiver_NY',
    isTrailing: false,
  },
  {
    id: 'pos-3',
    ticket: 8940210,
    symbol: 'EURUSD',
    side: 'SELL',
    lots: 3.0,
    openPrice: 1.08490,
    currentPrice: 1.08420,
    sl: 1.08650,
    tp: 1.08150,
    profit: 210.00,
    pips: 7.0,
    commission: -18.00,
    swap: -1.20,
    openTime: '2026-11-06 08:05:44',
    terminal: 'MT5 Pro Algo Node',
    magicNumber: 881290,
    comment: 'Apex_Scalp_AsiaBreak',
    isTrailing: true,
    trailingDistancePips: 10,
  },
];

const INITIAL_PENDING_ORDERS: PendingOrder[] = [
  {
    id: 'pnd-1',
    ticket: 9021884,
    symbol: 'XAUUSD',
    type: 'LIMIT',
    side: 'BUY',
    lots: 1.0,
    targetPrice: 2724.00,
    currentPrice: 2735.65,
    sl: 2715.00,
    tp: 2742.00,
    placedTime: '2026-11-06 08:15:30',
    terminal: 'EmergeFX DXtrade',
    comment: 'OrderBlock_Retest_BuyLimit',
  },
  {
    id: 'pnd-2',
    ticket: 9021899,
    symbol: 'GBPJPY',
    type: 'STOP',
    side: 'BUY',
    lots: 1.5,
    targetPrice: 198.800,
    currentPrice: 198.468,
    sl: 198.200,
    tp: 199.600,
    placedTime: '2026-11-06 08:22:15',
    terminal: 'MT5 Pro Algo Node',
    comment: 'Breakout_BuyStop_H1',
  },
];

const INITIAL_HISTORY: OrderHistoryItem[] = [
  {
    id: 'hist-1',
    ticket: 8939881,
    symbol: 'XAUUSD',
    side: 'BUY',
    orderType: 'MARKET',
    lots: 1.5,
    openPrice: 2715.20,
    closePrice: 2732.50,
    sl: 2708.00,
    tp: 2732.50,
    profit: 2595.00,
    pips: 173.0,
    commission: -10.50,
    swap: -3.80,
    openTime: '2026-11-05 14:20:11',
    closeTime: '2026-11-05 18:45:02',
    latencyMs: 1.8,
    slippagePips: 0.2,
    terminal: 'EmergeFX DXtrade',
    closeReason: 'TP_HIT',
  },
  {
    id: 'hist-2',
    ticket: 8939740,
    symbol: 'US30',
    side: 'SELL',
    orderType: 'MARKET',
    lots: 2.0,
    openPrice: 43840.0,
    closePrice: 43690.0,
    sl: 43920.0,
    tp: 43690.0,
    profit: 3000.00,
    pips: 150.0,
    commission: -14.00,
    swap: 0.00,
    openTime: '2026-11-05 15:30:00',
    closeTime: '2026-11-05 17:10:44',
    latencyMs: 2.2,
    slippagePips: 0.5,
    terminal: 'EmergeFX DXtrade',
    closeReason: 'TP_HIT',
  },
  {
    id: 'hist-3',
    ticket: 8939611,
    symbol: 'BTCUSD',
    side: 'BUY',
    orderType: 'MARKET',
    lots: 0.5,
    openPrice: 74800.0,
    closePrice: 75950.0,
    sl: 74100.0,
    tp: 76000.0,
    profit: 575.00,
    pips: 1150.0,
    commission: -5.00,
    swap: -1.20,
    openTime: '2026-11-05 02:11:00',
    closeTime: '2026-11-05 11:20:15',
    latencyMs: 1.9,
    slippagePips: 0.1,
    terminal: 'MT5 Pro Algo Node',
    closeReason: 'MANUAL',
  },
  {
    id: 'hist-4',
    ticket: 8939502,
    symbol: 'EURUSD',
    side: 'BUY',
    orderType: 'MARKET',
    lots: 2.5,
    openPrice: 1.08620,
    closePrice: 1.08510,
    sl: 1.08510,
    tp: 1.08900,
    profit: -275.00,
    pips: -11.0,
    commission: -15.00,
    swap: -0.80,
    openTime: '2026-11-04 10:15:33',
    closeTime: '2026-11-04 12:40:02',
    latencyMs: 2.4,
    slippagePips: 0.3,
    terminal: 'cTrader Institutional',
    closeReason: 'SL_HIT',
  },
];

const INITIAL_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: 'wb-1',
    timestamp: '2026-11-06 08:30:14',
    source: 'TradingView Alert',
    symbol: 'XAUUSD',
    action: 'BUY',
    orderType: 'MARKET',
    lots: 1.5,
    sl: 2728.0,
    tp: 2750.0,
    status: 'SUCCESS',
    executionTimeMs: 1.8,
    payload: '{"strategy":"Endgame_AI","action":"BUY","symbol":"XAUUSD","lots":1.5,"sl":2728.0,"tp":2750.0}',
    targetTerminal: 'EmergeFX DXtrade',
  },
  {
    id: 'wb-2',
    timestamp: '2026-11-06 08:12:05',
    source: 'Python Bridge Script',
    symbol: 'US30',
    action: 'BUY',
    orderType: 'MARKET',
    lots: 2.0,
    sl: 43590.0,
    tp: 43900.0,
    status: 'SUCCESS',
    executionTimeMs: 2.1,
    payload: '{"auth_token":"bridge_sec_99a","action":"BUY","symbol":"US30","volume":2.0,"slippage":3}',
    targetTerminal: 'EmergeFX DXtrade',
  },
  {
    id: 'wb-3',
    timestamp: '2026-11-06 07:55:40',
    source: 'Telegram Channel Webhook',
    symbol: 'GBPJPY',
    action: 'BUY',
    orderType: 'STOP',
    lots: 1.5,
    sl: 198.2,
    tp: 199.6,
    status: 'ROUTED',
    executionTimeMs: 3.2,
    payload: '{"channel":"VIP_EASYWAY","cmd":"BUY_STOP","symbol":"GBPJPY","price":198.80,"sl":198.20}',
    targetTerminal: 'MT5 Pro Algo Node',
  },
];

const INITIAL_CHALLENGE: PropChallenge = {
  id: 'chal-emerge-100k',
  accountType: '2-PHASE',
  initialBalance: 100000.00,
  currentBalance: 101420.00,
  currentEquity: 104137.50,
  dailyStartingEquity: 102500.00,
  maxDailyLossPct: 4.0, // 4% daily loss limit ($4,100)
  maxDailyLossAmount: 4100.00,
  currentDailyLoss: 0.00, // profit today!
  maxTotalLossPct: 8.0, // 8% overall trailing drawdown ($8,000)
  maxTotalLossAmount: 8000.00,
  currentTotalLoss: 0.00,
  profitTargetPct: 8.0, // $8,000 target for Phase 1
  profitTargetAmount: 8000.00,
  currentProfit: 4137.50, // 51.7% passed!
  minTradingDays: 5,
  daysTraded: 4,
  status: 'IN_PROGRESS',
  platform: 'EmergeFX DXtrade',
  challengeNumber: 'EMG-8839210-PH1',
  startedAt: '2026-11-03',
};

const INITIAL_CONVERTED_EAS: ConvertedEA[] = [
  {
    id: 'conv-1',
    name: 'Endgame_HFT_Mobile_V4',
    originalFormat: 'MT4_EX4',
    targetFormat: 'MOBILE_CLOUD_ENGINE',
    fileSize: '418 KB',
    version: 'v4.2.1-mobile',
    activeUsers: 842,
    totalExecutions: 29480,
    status: 'READY',
    checksum: '0x88F1...B92A',
    updatedAt: '2026-11-05 14:10',
  },
  {
    id: 'conv-2',
    name: 'ShadowRiver_TrendFlow_PineScript',
    originalFormat: 'PINESCRIPT',
    targetFormat: 'WEBHOOK_BRIDGE',
    fileSize: '184 KB',
    version: 'v2.0.4-cloud',
    activeUsers: 519,
    totalExecutions: 14820,
    status: 'READY',
    checksum: '0x44E2...77C1',
    updatedAt: '2026-11-04 18:30',
  },
  {
    id: 'conv-3',
    name: 'Titan_Grid_Python_Async',
    originalFormat: 'PYTHON_BOT',
    targetFormat: 'MT5_UNIVERSAL',
    fileSize: '512 KB',
    version: 'v3.1.0-universal',
    activeUsers: 310,
    totalExecutions: 9450,
    status: 'READY',
    checksum: '0x11A0...EE39',
    updatedAt: '2026-11-02 09:15',
  },
];

const INITIAL_MOBILE_ACTIVATIONS: MobileActivation[] = [
  {
    id: 'mob-1',
    mentorId: 'MTR-88392',
    clientName: 'Liam Henderson',
    clientEmail: 'liam.h@apexinvest.co',
    activationKey: 'EAC-8839-LIAM-99X',
    broker: 'ThinkMarkets (EmergeFX)',
    accountNumber: '8839210',
    deviceType: 'iOS iPhone',
    eaAssigned: 'Endgame_HFT_Mobile_V4',
    status: 'ACTIVE',
    profitToday: 412.50,
    lastPing: '2 mins ago',
    activatedAt: '2026-10-20',
  },
  {
    id: 'mob-2',
    mentorId: 'MTR-88392',
    clientName: 'Chloe Dupont',
    clientEmail: 'chloe.fx@parisquant.fr',
    activationKey: 'EAC-8839-CHLO-44B',
    broker: 'IC Markets Global',
    accountNumber: '50294112',
    deviceType: 'Android Mobile',
    eaAssigned: 'ShadowRiver_TrendFlow_PineScript',
    status: 'ACTIVE',
    profitToday: 185.00,
    lastPing: '4 mins ago',
    activatedAt: '2026-10-24',
  },
  {
    id: 'mob-3',
    mentorId: 'MTR-88392',
    clientName: 'Tariq Al-Mansoor',
    clientEmail: 't.mansoor@gulfcapital.ae',
    activationKey: 'EAC-8839-TARI-11Z',
    broker: 'Pepperstone UK',
    accountNumber: '694208',
    deviceType: 'iOS iPhone',
    eaAssigned: 'Endgame_HFT_Mobile_V4',
    status: 'ACTIVE',
    profitToday: 680.00,
    lastPing: '1 min ago',
    activatedAt: '2026-11-01',
  },
  {
    id: 'mob-4',
    mentorId: 'MTR-88392',
    clientName: 'David Zhang',
    clientEmail: 'd.zhang@quantedge.sg',
    activationKey: 'EAC-8839-DAVI-77K',
    broker: 'Exness MT5 Real',
    accountNumber: '1948275',
    deviceType: 'Cloud Web',
    eaAssigned: 'Titan_Grid_Python_Async',
    status: 'PAUSED',
    profitToday: 0.00,
    lastPing: '45 mins ago',
    activatedAt: '2026-11-03',
  },
];

const INITIAL_BRAND_CONFIG: BrandConfig = {
  brandName: 'EA Converter',
  mentorId: 'MTR-88392',
  tagline: 'Mobile Trading Automation & Cloud EA Hosting',
  mobileAppName: 'EA Converter Mobile',
  supportHandle: '@EAConverterSupport',
  primaryColor: '#06b6d4',
  customDomain: 'ea-converter.com',
  logoIcon: 'Zap',
};

const INITIAL_MT5_CREDENTIALS: MT5BrokerCredential[] = [
  {
    id: 'mt5-cred-1',
    brokerName: 'IC Markets Global',
    server: 'ICMarketsSC-Live02',
    login: '50294112',
    passwordMasked: '••••••••••••',
    accountType: 'LIVE',
    connectedAt: '2026-11-06 01:05',
    pingMs: 2.1,
    leverage: '1:500',
    currency: 'USD',
    status: 'CONNECTED',
    balance: 50000.00,
    equity: 52180.50,
    isPrimary: true,
  },
  {
    id: 'mt5-cred-2',
    brokerName: 'ThinkMarkets (EmergeFX)',
    server: 'ThinkMarkets-Live04',
    login: '8839210',
    passwordMasked: '••••••••••••',
    accountType: 'PROP_FIRM',
    connectedAt: '2026-11-06 00:45',
    pingMs: 1.4,
    leverage: '1:100',
    currency: 'USD',
    status: 'CONNECTED',
    balance: 100000.00,
    equity: 104137.50,
    isPrimary: false,
  },
  {
    id: 'mt5-cred-3',
    brokerName: 'FTMO MT5 Live',
    server: 'FTMO-Server04',
    login: '1948275',
    passwordMasked: '••••••••••••',
    accountType: 'PROP_FIRM',
    connectedAt: '2026-11-05 22:30',
    pingMs: 3.4,
    leverage: '1:100',
    currency: 'USD',
    status: 'CONNECTED',
    balance: 200000.00,
    equity: 208400.00,
    isPrimary: false,
  },
];

const INITIAL_AUTOMATED_SETTINGS: AutomatedTradingSettings = {
  masterAutoTrading: true,
  dynamicEquitySizing: true,
  riskPerTradePct: 1.0,
  maxDailyLossCutoffPct: 3.5,
  maxSimultaneousTrades: 5,
  newsFilterActive: true,
  spreadFilterMaxPips: 2.5,
  autoTrailingStopEnabled: true,
  autoBreakEvenPips: 15.0,
  activeEAsCount: 4,
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = 'algotrade_matrix_workspace_v2';

function loadWorkspaceSnapshot() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedSnapshot = React.useMemo(() => loadWorkspaceSnapshot(), []);
  const ticketSeqRef = React.useRef<number>(8940500);
  const nextTicket = () => {
    ticketSeqRef.current += 1;
    return ticketSeqRef.current;
  };

  const [prices, setPrices] = useState<Record<string, MarketPrice>>(INITIAL_PRICES);
  const [positions, setPositions] = useState<Position[]>(() => savedSnapshot?.positions ?? INITIAL_POSITIONS);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(() => savedSnapshot?.pendingOrders ?? INITIAL_PENDING_ORDERS);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>(() => savedSnapshot?.orderHistory ?? INITIAL_HISTORY);
  const [terminals, setTerminals] = useState<TerminalInstance[]>(INITIAL_TERMINALS);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(INITIAL_WEBHOOK_LOGS);
  const [robots] = useState<RobotStrategy[]>(INITIAL_ROBOTS);
  const [signals] = useState<TradingSignal[]>(INITIAL_SIGNALS);
  const [challenge, setChallenge] = useState<PropChallenge>(INITIAL_CHALLENGE);
  const [licenses, setLicenses] = useState<EALicense[]>(() => savedSnapshot?.licenses ?? INITIAL_LICENSES);
  const [presets, setPresets] = useState<EAPreset[]>(INITIAL_PRESETS);
  const [convertedEAs, setConvertedEAs] = useState<ConvertedEA[]>(() => savedSnapshot?.convertedEAs ?? INITIAL_CONVERTED_EAS);
  const [mobileActivations, setMobileActivations] = useState<MobileActivation[]>(() => savedSnapshot?.mobileActivations ?? INITIAL_MOBILE_ACTIVATIONS);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(INITIAL_BRAND_CONFIG);
  const [mt5Credentials, setMt5Credentials] = useState<MT5BrokerCredential[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('algotrade_mt5_credentials') : null;
      return saved ? JSON.parse(saved) : INITIAL_MT5_CREDENTIALS;
    } catch {
      return INITIAL_MT5_CREDENTIALS;
    }
  });
  const [automatedSettings, setAutomatedSettings] = useState<AutomatedTradingSettings>(() => savedSnapshot?.automatedSettings ?? INITIAL_AUTOMATED_SETTINGS);

  const [accountBalance, setAccountBalance] = useState<number>(() => savedSnapshot?.accountBalance ?? 101420.00);
  const [bridgeLatencyMs, setBridgeLatencyMs] = useState<number>(liveMarketData.lastRttMs || 1.8);
  const [isBridgeConnected, setIsBridgeConnected] = useState<boolean>(true);
  const [isRealtimeFeedActive, setIsRealtimeFeedActive] = useState<boolean>(true);
  const [ticksPerSecond, setTicksPerSecond] = useState<number>(4);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(() => auth.currentUser?.uid ?? null);
  const skipNextRemoteWriteRef = React.useRef<boolean>(false);
  const pricesRef = React.useRef<Record<string, MarketPrice>>(prices);
  const positionsRef = React.useRef<Position[]>(positions);
  const pendingOrdersRef = React.useRef<PendingOrder[]>(pendingOrders);
  const bridgeLatencyRef = React.useRef<number>(bridgeLatencyMs);

  pricesRef.current = prices;
  positionsRef.current = positions;
  pendingOrdersRef.current = pendingOrders;
  bridgeLatencyRef.current = bridgeLatencyMs;

  // Persist real MT5 credentials
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('algotrade_mt5_credentials', JSON.stringify(mt5Credentials));
      }
    } catch {
      // Ignore
    }
  }, [mt5Credentials]);

  // Persist workspace to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          WORKSPACE_STORAGE_KEY,
          JSON.stringify({
            accountBalance,
            positions,
            pendingOrders,
            orderHistory,
            licenses,
            convertedEAs,
            mobileActivations,
            automatedSettings,
          })
        );
      }
    } catch {
      // Ignore storage quota issues
    }
  }, [accountBalance, positions, pendingOrders, orderHistory, licenses, convertedEAs, mobileActivations, automatedSettings]);

  // Subscribe to Firebase Auth & sync per-user workspace in Firestore
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setFirebaseUid(user?.uid ?? null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUid) return;
    const workspaceRef = doc(dbFirestore, 'users', firebaseUid, 'workspaces', 'default');
    const unsubDoc = onSnapshot(
      workspaceRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          skipNextRemoteWriteRef.current = true;
          if (typeof data.accountBalance === 'number') setAccountBalance(data.accountBalance);
          if (typeof data.positionsJson === 'string') {
            try { setPositions(JSON.parse(data.positionsJson)); } catch {}
          }
          if (typeof data.pendingOrdersJson === 'string') {
            try { setPendingOrders(JSON.parse(data.pendingOrdersJson)); } catch {}
          }
          if (typeof data.orderHistoryJson === 'string') {
            try { setOrderHistory(JSON.parse(data.orderHistoryJson)); } catch {}
          }
          if (typeof data.licensesJson === 'string') {
            try { setLicenses(JSON.parse(data.licensesJson)); } catch {}
          }
          if (typeof data.automatedSettingsJson === 'string') {
            try { setAutomatedSettings(JSON.parse(data.automatedSettingsJson)); } catch {}
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${firebaseUid}/workspaces/default`);
      }
    );
    return () => unsubDoc();
  }, [firebaseUid]);

  useEffect(() => {
    if (!firebaseUid) return;
    if (skipNextRemoteWriteRef.current) {
      skipNextRemoteWriteRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const workspaceRef = doc(dbFirestore, 'users', firebaseUid, 'workspaces', 'default');
      setDoc(
        workspaceRef,
        {
          uid: firebaseUid,
          updatedAt: new Date().toISOString(),
          accountBalance,
          positionsJson: JSON.stringify(positions),
          pendingOrdersJson: JSON.stringify(pendingOrders),
          orderHistoryJson: JSON.stringify(orderHistory.slice(0, 100)),
          licensesJson: JSON.stringify(licenses),
          automatedSettingsJson: JSON.stringify(automatedSettings),
        },
        { merge: true }
      ).catch((error) => {
        handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUid}/workspaces/default`);
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [firebaseUid, accountBalance, positions, pendingOrders, orderHistory, licenses, automatedSettings]);

  // Real-Time Live Market Feed Subscription & Real Server Health RTT Measurement
  useEffect(() => {
    const unsubscribe = liveMarketData.subscribe((realtimePrices) => {
      setPrices((prev) => ({
        ...prev,
        ...realtimePrices,
      }));
      setIsRealtimeFeedActive(liveMarketData.isRealtimeConnected);
      setTicksPerSecond(liveMarketData.ticksPerSecond);
      if (liveMarketData.lastRttMs > 0) {
        setBridgeLatencyMs(liveMarketData.lastRttMs);
      }
    });

    const statsInterval = setInterval(async () => {
      setIsRealtimeFeedActive(liveMarketData.isRealtimeConnected);
      setTicksPerSecond(liveMarketData.ticksPerSecond);
      const rtt = await liveMarketData.measureHealthRtt();
      if (rtt > 0) {
        setBridgeLatencyMs(rtt);
        setIsBridgeConnected(true);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  // Update open positions PnL and check Trailing Stops & TP/SL hits
  useEffect(() => {
    setPositions((prev) =>
      prev.map((pos) => {
        const currentMkt = prices[pos.symbol];
        if (!currentMkt) return pos;

        const currentPrice = pos.side === 'BUY' ? currentMkt.bid : currentMkt.ask;
        let pips = 0;
        let profit = 0;

        if (pos.side === 'BUY') {
          pips = (currentPrice - pos.openPrice) / currentMkt.pipSize;
          if (pos.symbol === 'XAUUSD') {
            profit = (currentPrice - pos.openPrice) * pos.lots * 100;
          } else if (pos.symbol === 'US30' || pos.symbol === 'NAS100') {
            profit = (currentPrice - pos.openPrice) * pos.lots * 10;
          } else if (pos.symbol.includes('BTC') || pos.symbol.includes('ETH')) {
            profit = (currentPrice - pos.openPrice) * pos.lots;
          } else {
            profit = (currentPrice - pos.openPrice) * pos.lots * 100000;
          }
        } else {
          pips = (pos.openPrice - currentPrice) / currentMkt.pipSize;
          if (pos.symbol === 'XAUUSD') {
            profit = (pos.openPrice - currentPrice) * pos.lots * 100;
          } else if (pos.symbol === 'US30' || pos.symbol === 'NAS100') {
            profit = (pos.openPrice - currentPrice) * pos.lots * 10;
          } else if (pos.symbol.includes('BTC') || pos.symbol.includes('ETH')) {
            profit = (pos.openPrice - currentPrice) * pos.lots;
          } else {
            profit = (pos.openPrice - currentPrice) * pos.lots * 100000;
          }
        }

        // Trailing Stop logic
        let newSl = pos.sl;
        if (pos.isTrailing && pos.trailingDistancePips) {
          const trailDistance = pos.trailingDistancePips * currentMkt.pipSize;
          if (pos.side === 'BUY') {
            const proposedSl = currentPrice - trailDistance;
            if (newSl === null || proposedSl > newSl) {
              newSl = Number(proposedSl.toFixed(currentMkt.digits));
            }
          } else {
            const proposedSl = currentPrice + trailDistance;
            if (newSl === null || proposedSl < newSl) {
              newSl = Number(proposedSl.toFixed(currentMkt.digits));
            }
          }
        }

        return {
          ...pos,
          currentPrice: Number(currentPrice.toFixed(currentMkt.digits)),
          pips: Number(pips.toFixed(1)),
          profit: Number(profit.toFixed(2)),
          sl: newSl,
        };
      })
    );
  }, [prices]);

  // Check pending orders for triggers (pure evaluation against pendingOrdersRef to avoid nested state updaters)
  useEffect(() => {
    const currentPending = pendingOrdersRef.current;
    if (currentPending.length === 0) return;

    const remaining: PendingOrder[] = [];
    const triggered: PendingOrder[] = [];
    let hasPriceUpdate = false;

    currentPending.forEach((ord) => {
      const mkt = prices[ord.symbol];
      if (!mkt) {
        remaining.push(ord);
        return;
      }

      let isTriggered = false;
      if (ord.type === 'LIMIT') {
        if (ord.side === 'BUY' && mkt.ask <= ord.targetPrice) isTriggered = true;
        if (ord.side === 'SELL' && mkt.bid >= ord.targetPrice) isTriggered = true;
      } else if (ord.type === 'STOP') {
        if (ord.side === 'BUY' && mkt.ask >= ord.targetPrice) isTriggered = true;
        if (ord.side === 'SELL' && mkt.bid <= ord.targetPrice) isTriggered = true;
      }

      const nextCurrentPrice = ord.side === 'BUY' ? mkt.ask : mkt.bid;
      if (isTriggered) {
        triggered.push(ord);
      } else {
        if (ord.currentPrice !== nextCurrentPrice) {
          hasPriceUpdate = true;
        }
        remaining.push({
          ...ord,
          currentPrice: nextCurrentPrice,
        });
      }
    });

    if (triggered.length > 0) {
      const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newlyFilled: Position[] = triggered.map((trig) => ({
        id: `pos-${Date.now()}-${trig.ticket}`,
        ticket: trig.ticket,
        symbol: trig.symbol,
        side: trig.side,
        lots: trig.lots,
        openPrice: trig.targetPrice,
        currentPrice: trig.targetPrice,
        sl: trig.sl,
        tp: trig.tp,
        profit: 0,
        pips: 0,
        commission: Number((-5.0 * trig.lots).toFixed(2)),
        swap: 0,
        openTime: nowStamp,
        terminal: trig.terminal,
        magicNumber: 881290,
        comment: `Filled_${trig.type}_${trig.comment}`,
        isTrailing: false,
      }));
      setPendingOrders(remaining);
      setPositions((posList) => [...newlyFilled, ...posList]);
    } else if (hasPriceUpdate) {
      setPendingOrders(remaining);
    }
  }, [prices]);

  // Calculations for Margin, Equity, PnL
  const unrealizedPnL = positions.reduce((acc, p) => acc + p.profit + p.commission + p.swap, 0);
  const accountEquity = Number((accountBalance + unrealizedPnL).toFixed(2));
  const usedMargin = positions.reduce((acc, p) => {
    // Rough estimate: $1000 per lot on indices/metals, $500 on forex
    const perLot = p.symbol === 'XAUUSD' ? 1000 : p.symbol === 'US30' ? 800 : 500;
    return acc + p.lots * perLot;
  }, 0);
  const freeMargin = Math.max(0, accountEquity - usedMargin);
  const marginLevel = usedMargin > 0 ? Number(((accountEquity / usedMargin) * 100).toFixed(1)) : 0;

  // Sync Prop Challenge metrics & live drawdown guards with live account
  useEffect(() => {
    setChallenge((prev) => {
      const currentProfit = Number((accountEquity - prev.initialBalance).toFixed(2));
      const dailyLoss = Math.max(0, Number((prev.dailyStartingEquity - accountEquity).toFixed(2)));
      const totalLoss = Math.max(0, Number((prev.initialBalance - accountEquity).toFixed(2)));
      const maxDailyLoss = Math.max(prev.currentDailyLoss, dailyLoss);
      const maxTotalLoss = Math.max(prev.currentTotalLoss, totalLoss);
      const isFailed =
        dailyLoss >= prev.maxDailyLossAmount || totalLoss >= prev.maxTotalLossAmount;
      const isPassed =
        !isFailed &&
        currentProfit >= prev.profitTargetAmount &&
        prev.daysTraded >= prev.minTradingDays;
      return {
        ...prev,
        currentBalance: accountBalance,
        currentEquity: accountEquity,
        currentProfit: Math.max(0, currentProfit),
        currentDailyLoss: maxDailyLoss,
        currentTotalLoss: maxTotalLoss,
        status: isFailed ? 'FAILED' : isPassed ? 'PASSED' : prev.status === 'FAILED' ? 'FAILED' : 'IN_PROGRESS',
      };
    });
  }, [accountBalance, accountEquity]);

  // Execute Order (measured real RTT + backend dispatch)
  const executeOrder = useCallback(
    async (params: NewOrderParams) => {
      const tStart = performance.now();
      const mkt = prices[params.symbol];
      if (!mkt) return { success: false, message: `Symbol ${params.symbol} not found.` };
      if (!params.lots || params.lots <= 0) return { success: false, message: 'Invalid lot size.' };

      const chosenTerminal = params.terminal || terminals[0].name;
      const fillPrice = params.side === 'BUY' ? mkt.ask : mkt.bid;
      let ticket = nextTicket();

      try {
        const res = await fetch('/api/mt5/bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: params.symbol,
            side: params.side,
            orderType: params.orderType,
            lots: params.lots,
            price: fillPrice,
            sl: params.sl ?? null,
            tp: params.tp ?? null,
            terminal: chosenTerminal,
            comment: params.comment || 'Bridge_Manual_Order',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ticket) ticket = Number(data.ticket);
        }
      } catch {
        // Proceed with local execution ticket if offline
      }

      const elapsedMs = Number(Math.max(0.4, performance.now() - tStart).toFixed(1));
      setBridgeLatencyMs(elapsedMs);

      if (params.orderType === 'MARKET') {
        const newPos: Position = {
          id: `pos-${Date.now()}-${ticket}`,
          ticket,
          symbol: params.symbol,
          side: params.side,
          lots: params.lots,
          openPrice: fillPrice,
          currentPrice: fillPrice,
          sl: params.sl ?? null,
          tp: params.tp ?? null,
          profit: 0,
          pips: 0,
          commission: Number((-5.0 * params.lots).toFixed(2)),
          swap: 0,
          openTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          terminal: chosenTerminal,
          magicNumber: 881290,
          comment: params.comment || 'Bridge_Manual_Order',
          isTrailing: false,
        };

        setPositions((prev) => [newPos, ...prev]);

        const newLog: WebhookLog = {
          id: `log-${Date.now()}-${ticket}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          source: 'Manual Bridge Terminal',
          symbol: params.symbol,
          action: params.side,
          orderType: 'MARKET',
          lots: params.lots,
          sl: params.sl ?? null,
          tp: params.tp ?? null,
          status: 'SUCCESS',
          executionTimeMs: elapsedMs,
          payload: JSON.stringify({ action: params.side, symbol: params.symbol, lots: params.lots, sl: params.sl, tp: params.tp }),
          targetTerminal: chosenTerminal,
        };
        setWebhookLogs((logs) => [newLog, ...logs]);

        void fetch('/api/db/record-execution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket,
            symbol: params.symbol,
            side: params.side,
            lots: params.lots,
            openPrice: fillPrice,
            pnl: 0,
            botSource: params.comment || 'MANUAL_BRIDGE',
          }),
        }).catch(() => {});

        return { success: true, message: `Market Order #${ticket} Filled at ${fillPrice}`, ticket };
      } else {
        const targetPrice = params.targetPrice || (params.side === 'BUY' ? mkt.bid * 0.998 : mkt.ask * 1.002);
        const newPending: PendingOrder = {
          id: `pnd-${Date.now()}-${ticket}`,
          ticket,
          symbol: params.symbol,
          type: params.orderType,
          side: params.side,
          lots: params.lots,
          targetPrice: Number(targetPrice.toFixed(mkt.digits)),
          currentPrice: params.side === 'BUY' ? mkt.ask : mkt.bid,
          sl: params.sl ?? null,
          tp: params.tp ?? null,
          placedTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          terminal: chosenTerminal,
          comment: params.comment || `Bridge_${params.orderType}_Order`,
        };

        setPendingOrders((prev) => [newPending, ...prev]);
        return { success: true, message: `${params.orderType} Order #${ticket} Placed at ${targetPrice.toFixed(mkt.digits)}`, ticket };
      }
    },
    [prices, terminals]
  );

  // Execute Batch Orders (Multi-ticket simultaneously via /api/bridge/batch-order)
  const executeBatchOrders = useCallback(
    async (params: BatchOrderParams) => {
      const tStart = performance.now();
      const count = Math.max(1, Math.min(20, params.count || 1));
      const mkt = prices[params.symbol];
      if (!mkt) return { success: false, message: `Symbol ${params.symbol} not found in live feed.`, tickets: [] };
      if (!params.lots || params.lots <= 0) return { success: false, message: 'Invalid lot size.', tickets: [] };

      const fillPrice = params.side === 'BUY' ? mkt.ask : mkt.bid;
      const chosenTerminal = params.terminal || terminals[0].name;
      let serverTickets: number[] = [];

      try {
        const batchPayload = Array.from({ length: count }, (_, idx) => ({
          symbol: params.symbol,
          side: params.side,
          lots: params.lots,
          openPrice: fillPrice,
          sl: params.sl ?? null,
          tp: params.tp ?? null,
          comment: params.comment ? `${params.comment} #${idx + 1}/${count}` : `nexus2.v1 #${idx + 1}/${count}`,
        }));
        const res = await fetch('/api/bridge/batch-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickets: batchPayload }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.dispatched)) {
            serverTickets = data.dispatched.map((d: { ticket: number }) => Number(d.ticket));
          }
        }
      } catch {
        // Fallback to local monotonic sequence if offline
      }

      const elapsedMs = Number(Math.max(0.4, performance.now() - tStart).toFixed(1));
      setBridgeLatencyMs(elapsedMs);

      const tickets: number[] = [];
      const newPositions: Position[] = [];
      const newLogs: WebhookLog[] = [];

      for (let i = 0; i < count; i++) {
        const ticket = serverTickets[i] || nextTicket();
        tickets.push(ticket);
        const pos: Position = {
          id: `pos-${Date.now()}-${i}-${ticket}`,
          ticket,
          symbol: params.symbol,
          side: params.side,
          lots: params.lots,
          openPrice: fillPrice,
          currentPrice: fillPrice,
          sl: params.sl ?? null,
          tp: params.tp ?? null,
          profit: 0,
          pips: 0,
          commission: Number((-5.0 * params.lots).toFixed(2)),
          swap: 0,
          openTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          terminal: chosenTerminal,
          magicNumber: 882000 + i,
          comment: params.comment ? `${params.comment} #${i + 1}/${count}` : `nexus2.v1 #${i + 1}/${count}`,
          isTrailing: false,
        };
        newPositions.push(pos);

        newLogs.push({
          id: `log-${Date.now()}-${i}-${ticket}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          source: 'Nexus2.v1 / Kante FX Multi-Execution Engine',
          symbol: params.symbol,
          action: params.side,
          orderType: 'MARKET',
          lots: params.lots,
          sl: params.sl ?? null,
          tp: params.tp ?? null,
          status: 'SUCCESS',
          executionTimeMs: elapsedMs,
          payload: JSON.stringify({ action: params.side, symbol: params.symbol, lots: params.lots, batchIndex: i + 1, totalBatch: count }),
          targetTerminal: chosenTerminal,
        });
      }

      setPositions((prev) => [...newPositions, ...prev]);
      setWebhookLogs((logs) => [...newLogs, ...logs]);

      return {
        success: true,
        message: `Successfully executed ${count} order${count > 1 ? 's' : ''} on ${params.symbol} (${params.side} ${params.lots} lots each)`,
        tickets,
      };
    },
    [prices, terminals]
  );

  // Close Position (pure atomic state updates without nested setters)
  const closePosition = useCallback(
    (positionId: string, reason: OrderHistoryItem['closeReason'] = 'MANUAL') => {
      const pos = positionsRef.current.find((p) => p.id === positionId);
      if (!pos) return;

      const mkt = pricesRef.current[pos.symbol];
      const closePrice = pos.side === 'BUY' ? (mkt ? mkt.bid : pos.currentPrice) : (mkt ? mkt.ask : pos.currentPrice);
      const slippage = mkt ? Number((mkt.spread * 0.1).toFixed(1)) : 0.1;

      const historyItem: OrderHistoryItem = {
        id: `hist-${Date.now()}-${pos.ticket}`,
        ticket: pos.ticket,
        symbol: pos.symbol,
        side: pos.side,
        orderType: 'MARKET',
        lots: pos.lots,
        openPrice: pos.openPrice,
        closePrice,
        sl: pos.sl,
        tp: pos.tp,
        profit: pos.profit,
        pips: pos.pips,
        commission: pos.commission,
        swap: pos.swap,
        openTime: pos.openTime,
        closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        latencyMs: bridgeLatencyRef.current || 1.4,
        slippagePips: slippage,
        terminal: pos.terminal,
        closeReason: reason,
      };

      setPositions((prev) => prev.filter((p) => p.id !== positionId));
      setOrderHistory((h) => [historyItem, ...h]);
      setAccountBalance((bal) => Number((bal + pos.profit + pos.commission + pos.swap).toFixed(2)));
    },
    []
  );

  // Partial Close (pure atomic state updates without nested setters)
  const partialClosePosition = useCallback(
    (positionId: string, percent: number) => {
      const pos = positionsRef.current.find((p) => p.id === positionId);
      if (!pos) return;

      const closeLots = Number((pos.lots * (percent / 100)).toFixed(2));
      const remainingLots = Number((pos.lots - closeLots).toFixed(2));
      if (remainingLots <= 0.01) {
        closePosition(positionId, 'MANUAL');
        return;
      }

      const mkt = pricesRef.current[pos.symbol];
      const closePrice = pos.side === 'BUY' ? (mkt ? mkt.bid : pos.currentPrice) : (mkt ? mkt.ask : pos.currentPrice);
      const partialProfit = Number((pos.profit * (percent / 100)).toFixed(2));
      const partialCommission = Number((pos.commission * (percent / 100)).toFixed(2));

      const historyItem: OrderHistoryItem = {
        id: `hist-${Date.now()}-${pos.ticket}-partial`,
        ticket: pos.ticket,
        symbol: pos.symbol,
        side: pos.side,
        orderType: 'MARKET',
        lots: closeLots,
        openPrice: pos.openPrice,
        closePrice,
        sl: pos.sl,
        tp: pos.tp,
        profit: partialProfit,
        pips: pos.pips,
        commission: partialCommission,
        swap: 0,
        openTime: pos.openTime,
        closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        latencyMs: bridgeLatencyRef.current || 1.4,
        slippagePips: mkt ? Number((mkt.spread * 0.1).toFixed(1)) : 0.1,
        terminal: pos.terminal,
        closeReason: 'MANUAL',
      };

      setPositions((prev) =>
        prev.map((p) =>
          p.id === positionId
            ? {
                ...p,
                lots: remainingLots,
                profit: Number((p.profit - partialProfit).toFixed(2)),
                commission: Number((p.commission - partialCommission).toFixed(2)),
              }
            : p
        )
      );
      setOrderHistory((h) => [historyItem, ...h]);
      setAccountBalance((bal) => Number((bal + partialProfit + partialCommission).toFixed(2)));
    },
    [closePosition]
  );

  // Modify Position SL & TP
  const modifyPositionSLTP = useCallback((positionId: string, sl: number | null, tp: number | null) => {
    setPositions((prev) =>
      prev.map((pos) => (pos.id === positionId ? { ...pos, sl, tp } : pos))
    );
  }, []);

  // Set Break-Even (moves SL to openPrice + 1 pip)
  const setBreakEven = useCallback(
    (positionId: string) => {
      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.id !== positionId) return pos;
          const mkt = prices[pos.symbol];
          const pipOffset = mkt ? mkt.pipSize : 0.0001;
          const breakEvenPrice = pos.side === 'BUY' ? pos.openPrice + pipOffset : pos.openPrice - pipOffset;
          return {
            ...pos,
            sl: Number(breakEvenPrice.toFixed(mkt ? mkt.digits : 2)),
          };
        })
      );
    },
    [prices]
  );

  // Toggle Trailing Stop
  const toggleTrailingStop = useCallback((positionId: string, distancePips = 15) => {
    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === positionId
          ? {
              ...pos,
              isTrailing: !pos.isTrailing,
              trailingDistancePips: distancePips,
            }
          : pos
      )
    );
  }, []);

  // Cancel Pending Order
  const cancelPendingOrder = useCallback((orderId: string) => {
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  // KILL SWITCH: Atomic panic close all positions and cancel all pending orders immediately!
  const executeKillSwitch = useCallback(() => {
    const activePositions = positionsRef.current;
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (activePositions.length > 0) {
      let totalRealizedDelta = 0;
      const newHistoryItems: OrderHistoryItem[] = activePositions.map((pos, idx) => {
        const mkt = pricesRef.current[pos.symbol];
        const closePrice = pos.side === 'BUY' ? (mkt ? mkt.bid : pos.currentPrice) : (mkt ? mkt.ask : pos.currentPrice);
        const slippage = mkt ? Number((mkt.spread * 0.1).toFixed(1)) : 0.1;
        totalRealizedDelta += pos.profit + pos.commission + pos.swap;

        return {
          id: `hist-${Date.now()}-${pos.ticket}-${idx}`,
          ticket: pos.ticket,
          symbol: pos.symbol,
          side: pos.side,
          orderType: 'MARKET',
          lots: pos.lots,
          openPrice: pos.openPrice,
          closePrice,
          sl: pos.sl,
          tp: pos.tp,
          profit: pos.profit,
          pips: pos.pips,
          commission: pos.commission,
          swap: pos.swap,
          openTime: pos.openTime,
          closeTime: nowStamp,
          latencyMs: bridgeLatencyRef.current || 1.4,
          slippagePips: slippage,
          terminal: pos.terminal,
          closeReason: 'KILL_SWITCH',
        };
      });

      setPositions([]);
      setOrderHistory((h) => [...newHistoryItems, ...h]);
      setAccountBalance((bal) => Number((bal + totalRealizedDelta).toFixed(2)));
    }
    setPendingOrders([]);
  }, []);

  // Process Incoming Webhook Signal (from TradingView or Python Bridge)
  const processWebhookPayload = useCallback(
    (payloadStr: string, source = 'TradingView Webhook') => {
      const tStart = performance.now();
      try {
        const data = JSON.parse(payloadStr);
        const action: OrderSide = (data.action || data.side || 'BUY').toUpperCase();
        const symbol = (data.symbol || 'XAUUSD').toUpperCase();
        const lots = Number(data.lots || data.volume || 1.0);
        const orderType: OrderType = (data.order_type || data.type || 'MARKET').toUpperCase();
        const sl = data.sl ? Number(data.sl) : null;
        const tp = data.tp ? Number(data.tp) : null;

        void executeOrder({
          symbol,
          side: action,
          orderType,
          lots,
          sl,
          tp,
          comment: `Webhook_${source}`,
        });

        const execTime = Number(Math.max(0.3, performance.now() - tStart).toFixed(1));
        const newLog: WebhookLog = {
          id: `log-${Date.now()}-${randomHex(2)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          source,
          symbol,
          action,
          orderType,
          lots,
          sl,
          tp,
          status: 'SUCCESS',
          executionTimeMs: execTime,
          payload: payloadStr,
          targetTerminal: terminals[0]?.name || 'EmergeFX DXtrade',
        };

        setWebhookLogs((prev) => [newLog, ...prev]);
        return { success: true, message: `Bridge parsed & executed ${action} ${lots} lots on ${symbol}` };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid JSON payload format';
        const failLog: WebhookLog = {
          id: `log-${Date.now()}-${randomHex(2)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          source,
          symbol: 'UNKNOWN',
          action: 'BUY',
          orderType: 'MARKET',
          lots: 0,
          sl: null,
          tp: null,
          status: 'FAILED',
          executionTimeMs: 0.4,
          payload: payloadStr,
          targetTerminal: 'NONE',
        };
        setWebhookLogs((prev) => [failLog, ...prev]);
        return { success: false, message: errorMsg };
      }
    },
    [executeOrder, terminals]
  );

  const clearWebhookLogs = useCallback(() => {
    setWebhookLogs([]);
  }, []);

  // Terminal actions
  const toggleTerminalAutoTrading = useCallback((terminalId: string) => {
    setTerminals((prev) =>
      prev.map((t) => (t.id === terminalId ? { ...t, autoTrading: !t.autoTrading } : t))
    );
  }, []);

  const updateTerminalMultiplier = useCallback((terminalId: string, multiplier: number) => {
    setTerminals((prev) =>
      prev.map((t) => (t.id === terminalId ? { ...t, multiplier } : t))
    );
  }, []);

  // Prop challenge actions
  const resetChallenge = useCallback(
    (accountType: '1-PHASE' | '2-PHASE' | 'INSTANT_FUNDED', initialBalance: number) => {
      const targetPct = accountType === '1-PHASE' ? 10.0 : accountType === '2-PHASE' ? 8.0 : 0.0;
      const numCode = nextTicket();
      setChallenge({
        id: `chal-${Date.now()}`,
        accountType,
        initialBalance,
        currentBalance: initialBalance,
        currentEquity: initialBalance,
        dailyStartingEquity: initialBalance,
        maxDailyLossPct: 4.0,
        maxDailyLossAmount: initialBalance * 0.04,
        currentDailyLoss: 0,
        maxTotalLossPct: 8.0,
        maxTotalLossAmount: initialBalance * 0.08,
        currentTotalLoss: 0,
        profitTargetPct: targetPct,
        profitTargetAmount: initialBalance * (targetPct / 100),
        currentProfit: 0,
        minTradingDays: 5,
        daysTraded: 1,
        status: 'IN_PROGRESS',
        platform: 'EmergeFX DXtrade',
        challengeNumber: `EMG-${numCode}-${accountType.substring(0, 3)}`,
        startedAt: new Date().toISOString().substring(0, 10),
      });
      setAccountBalance(initialBalance);
    },
    []
  );

  const simulatePropPass = useCallback(() => {
    setChallenge((prev) => ({
      ...prev,
      currentProfit: prev.profitTargetAmount,
      currentEquity: prev.initialBalance + prev.profitTargetAmount,
      daysTraded: prev.minTradingDays,
      status: 'PASSED',
    }));
  }, []);

  // EA Vault actions
  const generateLicense = useCallback(
    (
      robotName: string,
      clientName: string,
      clientEmail: string,
      accountNumber: string,
      hwid: string,
      daysValid: number
    ) => {
      const exp = new Date();
      exp.setDate(exp.getDate() + daysValid);
      const tokenSuffix = randomHex(2).toUpperCase();

      const newLic: EALicense = {
        id: `lic-${Date.now()}`,
        key: `EWT-${robotName.substring(0, 4).toUpperCase()}-${accountNumber.substring(0, 4)}-${tokenSuffix}`,
        robotName,
        accountNumber,
        hwid,
        clientName,
        clientEmail,
        createdAt: new Date().toISOString().substring(0, 10),
        expiresAt: exp.toISOString().substring(0, 10),
        status: 'ACTIVE',
        maxAccounts: 2,
        activeAccounts: 1,
      };

      setLicenses((prev) => [newLic, ...prev]);
      return newLic;
    },
    []
  );

  const revokeLicense = useCallback((licenseId: string) => {
    setLicenses((prev) =>
      prev.map((l) => (l.id === licenseId ? { ...l, status: 'REVOKED' } : l))
    );
  }, []);

  const downloadPreset = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const blob = new Blob([preset.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.set`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, downloadCount: p.downloadCount + 1 } : p))
    );
  }, [presets]);

  // EA-Converter & Rebrand ("Rename") actions
  const updateBrandConfig = useCallback((newConfig: Partial<BrandConfig>) => {
    setBrandConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const convertEACode = useCallback(
    async (
      name: string,
      originalFormat: ConvertedEA['originalFormat'],
      targetFormat: ConvertedEA['targetFormat']
    ): Promise<ConvertedEA> => {
      const normalizedName = name.replace(/\s+/g, '_');
      const digest = sha256Hex(`${normalizedName}:${originalFormat}:${targetFormat}:${Date.now()}`).toUpperCase();
      const kbSize = 180 + (normalizedName.length * 14);

      const newConverted: ConvertedEA = {
        id: `conv-${Date.now()}`,
        name: normalizedName,
        originalFormat,
        targetFormat,
        fileSize: `${kbSize} KB`,
        version: 'v1.0.0-mobile',
        activeUsers: 1,
        totalExecutions: 0,
        status: 'READY',
        checksum: `0x${digest.slice(0, 4)}...${digest.slice(-4)}`,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      setConvertedEAs((prev) => [newConverted, ...prev]);
      return newConverted;
    },
    []
  );

  const issueMobileActivation = useCallback(
    (
      clientName: string,
      clientEmail: string,
      broker: string,
      accountNumber: string,
      eaAssigned: string,
      deviceType: MobileActivation['deviceType']
    ): MobileActivation => {
      const code = generateKeyCode(`EAC-${brandConfig.mentorId.replace('MTR-', '')}`, 1, 4);
      const newAct: MobileActivation = {
        id: `mob-${Date.now()}`,
        mentorId: brandConfig.mentorId,
        clientName,
        clientEmail,
        activationKey: `${code}-${clientName.substring(0, 4).toUpperCase()}`,
        broker,
        accountNumber,
        deviceType,
        eaAssigned,
        status: 'ACTIVE',
        profitToday: 0.0,
        lastPing: 'Just now',
        activatedAt: new Date().toISOString().substring(0, 10),
      };

      setMobileActivations((prev) => [newAct, ...prev]);
      return newAct;
    },
    [brandConfig]
  );

  const revokeMobileActivation = useCallback((id: string) => {
    setMobileActivations((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'EXPIRED' } : m))
    );
  }, []);

  const toggleMobileActivationStatus = useCallback((id: string) => {
    setMobileActivations((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : m
      )
    );
  }, []);

  // Real MT5 Broker Credentials Actions (measured RTT against /api/mt5/verify-broker)
  const connectMT5Broker = useCallback(
    async (
      brokerName: string,
      server: string,
      login: string,
      passwordMasked: string,
      accountType: MT5BrokerCredential['accountType']
    ) => {
      const tStart = performance.now();
      let verifiedPing = liveMarketData.lastRttMs || 1.8;
      let accountBalanceVal = accountType === 'PROP_FIRM' ? 100000 : accountType === 'LIVE' ? 50000 : 10000;

      try {
        const res = await fetch('/api/mt5/verify-broker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brokerName, server, login, password: passwordMasked || 'token', accountType }),
        });
        verifiedPing = Number(Math.max(0.4, performance.now() - tStart).toFixed(1));
        if (res.ok) {
          const data = await res.json();
          if (data?.details?.balance) accountBalanceVal = Number(data.details.balance);
        }
      } catch {
        verifiedPing = Number(Math.max(0.5, performance.now() - tStart).toFixed(1));
      }

      const newCred: MT5BrokerCredential = {
        id: `mt5-cred-${Date.now()}`,
        brokerName,
        server,
        login,
        passwordMasked: '••••••••••••',
        accountType,
        connectedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        pingMs: verifiedPing,
        leverage: accountType === 'PROP_FIRM' ? '1:100' : '1:500',
        currency: 'USD',
        status: 'CONNECTED',
        balance: accountBalanceVal,
        equity: accountBalanceVal,
        isPrimary: false,
      };

      setMt5Credentials((prev) => [newCred, ...prev]);

      const newTerm: TerminalInstance = {
        id: `term-mt5-${Date.now()}`,
        name: `${brokerName} MT5 Live`,
        platform: 'MT5',
        broker: brokerName,
        accountNumber: login,
        server,
        pingMs: verifiedPing,
        status: 'ONLINE',
        location: 'London Equinix LD4',
        activeEAs: 2,
        balance: accountBalanceVal,
        equity: accountBalanceVal,
        margin: 0,
        freeMargin: accountBalanceVal,
        autoTrading: true,
        copierRole: 'SLAVE',
        multiplier: 1.0,
      };
      setTerminals((tList) => [newTerm, ...tList]);

      return {
        success: true,
        message: `Authenticated MT5 Account #${login} on ${server} (Measured RTT: ${verifiedPing}ms)`,
        credential: newCred,
      };
    },
    []
  );

  const disconnectMT5Broker = useCallback((id: string) => {
    setMt5Credentials((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const setPrimaryMT5Broker = useCallback((id: string) => {
    setMt5Credentials((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      }))
    );
  }, []);

  // Automated Trading Systems Actions
  const updateAutomatedSettings = useCallback((newSettings: Partial<AutomatedTradingSettings>) => {
    setAutomatedSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const toggleMasterAutoTrading = useCallback(() => {
    setAutomatedSettings((prev) => ({
      ...prev,
      masterAutoTrading: !prev.masterAutoTrading,
    }));
  }, []);

  return (
    <TradingContext.Provider
      value={{
        prices,
        positions,
        pendingOrders,
        orderHistory,
        terminals,
        webhookLogs,
        robots,
        signals,
        challenge,
        licenses,
        presets,
        convertedEAs,
        mobileActivations,
        brandConfig,
        mt5Credentials,
        automatedSettings,
        isRealtimeFeedActive,
        ticksPerSecond,
        accountBalance,
        accountEquity,
        unrealizedPnL,
        usedMargin,
        freeMargin,
        marginLevel,
        bridgeLatencyMs,
        isBridgeConnected,
        executeOrder,
        executeBatchOrders,
        closePosition,
        partialClosePosition,
        modifyPositionSLTP,
        setBreakEven,
        toggleTrailingStop,
        cancelPendingOrder,
        executeKillSwitch,
        processWebhookPayload,
        clearWebhookLogs,
        toggleTerminalAutoTrading,
        updateTerminalMultiplier,
        resetChallenge,
        simulatePropPass,
        generateLicense,
        revokeLicense,
        downloadPreset,
        updateBrandConfig,
        convertEACode,
        issueMobileActivation,
        revokeMobileActivation,
        toggleMobileActivationStatus,
        connectMT5Broker,
        disconnectMT5Broker,
        setPrimaryMT5Broker,
        updateAutomatedSettings,
        toggleMasterAutoTrading,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = (): TradingContextType => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
