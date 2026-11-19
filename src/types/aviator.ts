export type BookmakerId =
  | 'BETWAY'
  | 'HOLLYWOODBETS'
  | 'LOTTOSTAR'
  | 'EASYBET'
  | 'SPORTYBET'
  | 'YESPLAY';

export interface BookmakerInfo {
  id: BookmakerId;
  name: string;
  country: string;
  currency: string;
  logoColor: string;
  minBet: number;
  maxBet: number;
  rtpRate: string;
  status: 'ONLINE' | 'MAINTENANCE';
}

export type CrashPatternType =
  | 'PINK_WAVE'
  | 'BLUE_TRAP'
  | 'PURPLE_CLUSTER'
  | 'FIBONACCI_SURGE'
  | 'MEAN_REVERSION'
  | 'VOLATILITY_SQUEEZE';

export interface CrashRound {
  id: string;
  roundNumber: number;
  multiplier: number;
  timestamp: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  hash: string;
  eloRating: number;
  pattern: CrashPatternType;
  durationSeconds: number;
}

export interface CrashSignal {
  id: string;
  bookmaker: BookmakerId;
  predictedMultiplier: number;
  safeCashout: number;
  confidence: number; // e.g. 88%
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  pattern: CrashPatternType;
  phase: 'PEAK' | 'COOLDOWN' | 'WARMUP' | 'ACCUMULATION';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macdSignal: 'BUY' | 'WAIT';
  stochValue: number;
  timestamp: number;
  isVipOnly?: boolean;
}

export type EAStrategyType =
  | 'KELLY_CRITERION'
  | 'MARTINGALE'
  | 'ANTI_MARTINGALE'
  | 'DALEMBERT'
  | 'PINK_HUNTER'
  | 'CONSERVATIVE_COMPOUND';

export interface EABotSettings {
  strategy: EAStrategyType;
  baseBet: number;
  maxBet: number;
  autoCashout: number;
  stopLossLimit: number;
  takeProfitLimit: number;
  consecutiveLossCircuitBreaker: number;
  martingaleMultiplier: number;
  isRunning: boolean;
}

export interface CrashBetSlot {
  id: string;
  amount: number;
  autoCashoutEnabled: boolean;
  autoCashoutMultiplier: number;
  isPlaced: boolean;
  isCashedOut: boolean;
  cashoutPrice: number | null;
  pnl: number;
}
