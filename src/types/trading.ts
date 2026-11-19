export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'CLOSED';

export interface MarketPrice {
  symbol: string;
  name: string;
  category: 'FOREX' | 'METALS' | 'INDICES' | 'CRYPTO';
  bid: number;
  ask: number;
  spread: number;
  digits: number;
  change24h: number;
  high: number;
  low: number;
  pipSize: number;
}

export interface Position {
  id: string;
  ticket: number;
  symbol: string;
  side: OrderSide;
  lots: number;
  openPrice: number;
  currentPrice: number;
  sl: number | null;
  tp: number | null;
  profit: number;
  pips: number;
  commission: number;
  swap: number;
  openTime: string;
  terminal: string;
  magicNumber: number;
  comment: string;
  isTrailing: boolean;
  trailingDistancePips?: number;
}

export interface PendingOrder {
  id: string;
  ticket: number;
  symbol: string;
  type: 'LIMIT' | 'STOP';
  side: OrderSide;
  lots: number;
  targetPrice: number;
  currentPrice: number;
  sl: number | null;
  tp: number | null;
  placedTime: string;
  terminal: string;
  comment: string;
}

export interface OrderHistoryItem {
  id: string;
  ticket: number;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  lots: number;
  openPrice: number;
  closePrice: number;
  sl: number | null;
  tp: number | null;
  profit: number;
  pips: number;
  commission: number;
  swap: number;
  openTime: string;
  closeTime: string;
  latencyMs: number;
  slippagePips: number;
  terminal: string;
  closeReason: 'MANUAL' | 'TP_HIT' | 'SL_HIT' | 'KILL_SWITCH' | 'BRIDGE_SIGNAL' | 'TRAILING_STOP';
}

export interface TerminalInstance {
  id: string;
  name: string;
  platform: 'MT4' | 'MT5' | 'cTrader' | 'DXtrade';
  broker: string;
  accountNumber: string;
  server: string;
  pingMs: number;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
  location: string;
  activeEAs: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  autoTrading: boolean;
  copierRole: 'MASTER' | 'SLAVE' | 'STANDALONE';
  multiplier: number;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  source: string; // 'TradingView' | 'Python' | 'REST_API' | 'Telegram'
  symbol: string;
  action: OrderSide;
  orderType: OrderType;
  lots: number;
  sl: number | null;
  tp: number | null;
  status: 'SUCCESS' | 'FAILED' | 'ROUTED';
  executionTimeMs: number;
  payload: string;
  targetTerminal: string;
}

export interface RobotStrategy {
  id: string;
  name: string;
  codeName: string;
  category: string;
  description: string;
  timeframe: string;
  pairs: string[];
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
  monthlyReturn: number;
  activeStatus: 'ACTIVE' | 'OPTIMIZING' | 'PAUSED';
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  tags: string[];
}

export interface TradingSignal {
  id: string;
  robotId: string;
  robotName: string;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  sl: number;
  tp1: number;
  tp2: number;
  timeframe: string;
  confidence: number;
  timestamp: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'EXPIRED';
  reason: string;
}

export interface PropChallenge {
  id: string;
  accountType: '1-PHASE' | '2-PHASE' | 'INSTANT_FUNDED';
  initialBalance: number;
  currentBalance: number;
  currentEquity: number;
  dailyStartingEquity: number;
  maxDailyLossPct: number;
  maxDailyLossAmount: number;
  currentDailyLoss: number;
  maxTotalLossPct: number;
  maxTotalLossAmount: number;
  currentTotalLoss: number;
  profitTargetPct: number;
  profitTargetAmount: number;
  currentProfit: number;
  minTradingDays: number;
  daysTraded: number;
  status: 'PASSED' | 'IN_PROGRESS' | 'FAILED';
  platform: string;
  challengeNumber: string;
  startedAt: string;
}

export interface EALicense {
  id: string;
  key: string;
  robotName: string;
  accountNumber: string;
  hwid: string;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  maxAccounts: number;
  activeAccounts: number;
}

export interface EAPreset {
  id: string;
  robotName: string;
  title: string;
  symbol: string;
  timeframe: string;
  accountType: 'PROP_FIRM' | 'PERSONAL_SAFE' | 'AGGRESSIVE_GROWTH';
  riskPercentage: number;
  content: string;
  downloadCount: number;
  verifiedDate: string;
}

export interface ConvertedEA {
  id: string;
  name: string;
  originalFormat: 'MT4_EX4' | 'MT5_EX5' | 'PINESCRIPT' | 'PYTHON_BOT';
  targetFormat: 'MOBILE_CLOUD_ENGINE' | 'WEBHOOK_BRIDGE' | 'MT5_UNIVERSAL';
  fileSize: string;
  version: string;
  activeUsers: number;
  totalExecutions: number;
  status: 'READY' | 'CONVERTING' | 'UPDATING';
  checksum: string;
  updatedAt: string;
}

export interface MobileActivation {
  id: string;
  mentorId: string;
  clientName: string;
  clientEmail: string;
  activationKey: string;
  broker: string;
  accountNumber: string;
  deviceType: 'iOS iPhone' | 'Android Mobile' | 'Cloud Web';
  eaAssigned: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'PAUSED';
  profitToday: number;
  lastPing: string;
  activatedAt: string;
}

export interface BrandConfig {
  brandName: string;
  mentorId: string;
  tagline: string;
  mobileAppName: string;
  supportHandle: string;
  primaryColor: string;
  customDomain: string;
  logoIcon: string;
}

export interface MT5BrokerCredential {
  id: string;
  brokerName: string;
  server: string;
  login: string;
  passwordMasked: string;
  accountType: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  connectedAt: string;
  pingMs: number;
  leverage: string;
  currency: string;
  status: 'CONNECTED' | 'AUTHENTICATING' | 'DISCONNECTED' | 'INVALID_CREDENTIALS';
  balance: number;
  equity: number;
  isPrimary: boolean;
}

export interface AutomatedTradingSettings {
  masterAutoTrading: boolean;
  dynamicEquitySizing: boolean;
  riskPerTradePct: number;
  maxDailyLossCutoffPct: number;
  maxSimultaneousTrades: number;
  newsFilterActive: boolean;
  spreadFilterMaxPips: number;
  autoTrailingStopEnabled: boolean;
  autoBreakEvenPips: number;
  activeEAsCount: number;
}
