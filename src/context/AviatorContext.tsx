import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  BookmakerId,
  BookmakerInfo,
  CrashRound,
  CrashSignal,
  EABotSettings,
  CrashBetSlot,
  CrashPatternType,
} from '../types/aviator';
import { randomHex, randomUint32, sha256Hex } from '../lib/crypto';

export const SA_BOOKMAKERS: BookmakerInfo[] = [
  {
    id: 'BETWAY',
    name: 'Betway South Africa',
    country: 'ZA',
    currency: 'ZAR',
    logoColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    minBet: 1,
    maxBet: 50000,
    rtpRate: '97.0%',
    status: 'ONLINE',
  },
  {
    id: 'HOLLYWOODBETS',
    name: 'Hollywoodbets SA',
    country: 'ZA',
    currency: 'ZAR',
    logoColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    minBet: 1,
    maxBet: 30000,
    rtpRate: '97.0%',
    status: 'ONLINE',
  },
  {
    id: 'LOTTOSTAR',
    name: 'LottoStar Live',
    country: 'ZA',
    currency: 'ZAR',
    logoColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    minBet: 2,
    maxBet: 25000,
    rtpRate: '97.2%',
    status: 'ONLINE',
  },
  {
    id: 'EASYBET',
    name: 'Easybet South Africa',
    country: 'ZA',
    currency: 'ZAR',
    logoColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    minBet: 1,
    maxBet: 20000,
    rtpRate: '96.8%',
    status: 'ONLINE',
  },
  {
    id: 'SPORTYBET',
    name: 'Sportybet Africa',
    country: 'AF',
    currency: 'USD',
    logoColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    minBet: 0.1,
    maxBet: 5000,
    rtpRate: '97.0%',
    status: 'ONLINE',
  },
  {
    id: 'YESPLAY',
    name: 'YesPlay SA',
    country: 'ZA',
    currency: 'ZAR',
    logoColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    minBet: 1,
    maxBet: 15000,
    rtpRate: '96.9%',
    status: 'ONLINE',
  },
];

export function computePredictionSignal(
  recentRounds: CrashRound[],
  bookmaker: BookmakerId,
  roundIndex: number,
  currentElo: number,
  overrideSeed?: number
): CrashSignal {
  const sample = recentRounds.slice(0, 8);
  const blueCount = sample.filter((r) => r.multiplier < 1.5).length;
  const pinkCount = sample.filter((r) => r.multiplier >= 10).length;
  const avgMult =
    sample.length > 0
      ? sample.reduce((sum, r) => sum + r.multiplier, 0) / sample.length
      : 2.4;

  const bookmakerFactor: Record<BookmakerId, number> = {
    BETWAY: 3,
    HOLLYWOODBETS: 2,
    LOTTOSTAR: 4,
    EASYBET: 0,
    SPORTYBET: -2,
    YESPLAY: -1,
  };

  const stochasticRoll =
    overrideSeed !== undefined ? overrideSeed : (randomUint32() % 10000) / 10000;
  const eloBoost = Math.max(-8, Math.min(10, Math.round((currentElo - 1230) / 5)));

  let predictedMultiplier = 2.45;
  let safeCashout = 1.8;
  let pattern: CrashPatternType = 'PURPLE_CLUSTER';
  let baseConfidence = 74;

  if (stochasticRoll > 0.82 || (blueCount >= 3 && pinkCount === 0 && stochasticRoll > 0.55)) {
    predictedMultiplier = +(10.2 + stochasticRoll * 18.5).toFixed(2);
    safeCashout = 3.2;
    pattern = 'PINK_WAVE';
    baseConfidence = 84 + Math.round(stochasticRoll * 8);
  } else if (stochasticRoll < 0.24) {
    predictedMultiplier = +(1.12 + stochasticRoll * 1.1).toFixed(2);
    safeCashout = 1.25;
    pattern = 'BLUE_TRAP';
    baseConfidence = 46 + Math.round(stochasticRoll * 45);
  } else if (avgMult > 4.2 && stochasticRoll < 0.55) {
    predictedMultiplier = +(1.65 + stochasticRoll * 1.4).toFixed(2);
    safeCashout = 1.45;
    pattern = 'MEAN_REVERSION';
    baseConfidence = 62 + Math.round(stochasticRoll * 22);
  } else {
    predictedMultiplier = +(2.05 + stochasticRoll * 3.8).toFixed(2);
    safeCashout = 1.85;
    pattern = stochasticRoll > 0.62 ? 'FIBONACCI_SURGE' : 'PURPLE_CLUSTER';
    baseConfidence = 74 + Math.round(stochasticRoll * 18);
  }

  const confidence = Math.max(
    38,
    Math.min(97, baseConfidence + eloBoost + (bookmakerFactor[bookmaker] ?? 0))
  );

  const strength: CrashSignal['strength'] =
    confidence >= 80 ? 'STRONG' : confidence >= 60 ? 'MODERATE' : 'WEAK';

  const stochValue = +(22 + stochasticRoll * 58).toFixed(1);

  return {
    id: `SIG-${roundIndex}-${bookmaker}`,
    bookmaker,
    predictedMultiplier,
    safeCashout,
    confidence,
    strength,
    pattern,
    phase:
      predictedMultiplier > 5
        ? 'PEAK'
        : predictedMultiplier < 1.5
        ? 'COOLDOWN'
        : 'ACCUMULATION',
    trend: predictedMultiplier >= 2.0 ? 'BULLISH' : predictedMultiplier < 1.45 ? 'BEARISH' : 'NEUTRAL',
    macdSignal: confidence >= 65 && predictedMultiplier >= 1.75 ? 'BUY' : 'WAIT',
    stochValue,
    timestamp: Date.now(),
  };
}

interface AviatorContextType {
  activeBookmaker: BookmakerId;
  setActiveBookmaker: (b: BookmakerId) => void;
  bookmakerInfo: BookmakerInfo;

  // Live Engine State
  flightStatus: 'WAITING' | 'FLYING' | 'CRASHED';
  currentMultiplier: number;
  countdownSeconds: number;
  crashTarget: number;
  rounds: CrashRound[];
  currentElo: number;
  eloChange: number;

  // Prediction AI Engine
  activeSignal: CrashSignal;
  signalsHistory: CrashSignal[];
  generateSignalScan: (targetBookmaker?: BookmakerId) => CrashSignal;

  // Sound & FX
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;

  // Dual Betting Slots
  betSlot1: CrashBetSlot;
  setBetSlot1: React.Dispatch<React.SetStateAction<CrashBetSlot>>;
  betSlot2: CrashBetSlot;
  setBetSlot2: React.Dispatch<React.SetStateAction<CrashBetSlot>>;
  placeBet: (slotNum: 1 | 2) => void;
  cashoutBet: (slotNum: 1 | 2) => void;
  cancelBet: (slotNum: 1 | 2) => void;

  // Automated EA Lab Bot
  eaSettings: EABotSettings;
  setEaSettings: React.Dispatch<React.SetStateAction<EABotSettings>>;
  toggleEaBot: () => void;
  eaTotalProfit: number;
  eaWinCount: number;
  eaLossCount: number;

  // Telegram & Discord Broadcast Settings
  telegramBotToken: string;
  setTelegramBotToken: (val: string) => void;
  telegramChatId: string;
  setTelegramChatId: (val: string) => void;
  discordWebhookUrl: string;
  setDiscordWebhookUrl: (val: string) => void;
  isAutoBroadcast: boolean;
  setIsAutoBroadcast: (val: boolean) => void;
  broadcastSignal: (signal: CrashSignal) => Promise<{ success: boolean; message: string }>;

  // Provably Fair Verifier
  verifyHash: (serverSeed: string, clientSeed: string, nonce: number) => { multiplier: number; hash: string };

  // Manual Trigger for Next Round
  forceNextRound: () => void;
}

const AviatorContext = createContext<AviatorContextType | null>(null);

const INITIAL_ROUNDS_SEED: CrashRound[] = [
  { id: 'R-9989', roundNumber: 9989, multiplier: 1.95, timestamp: Date.now() - 40000, serverSeed: '2c5a08991', clientSeed: 'cli_309', nonce: 9989, hash: 'c90f2ac7d2b270425cc02a0a2df39bf2027e8a3a2d219bb2c6e1e8395b05b38f', eloRating: 1248, pattern: 'MEAN_REVERSION', durationSeconds: 3.8 },
  { id: 'R-9988', roundNumber: 9988, multiplier: 5.60, timestamp: Date.now() - 80000, serverSeed: '992a0e41f', clientSeed: 'cli_308', nonce: 9988, hash: 'fa6b27e8a9394f61f77d56658925f46ebfe6686161405e608f6c3ce044ffc9d6', eloRating: 1258, pattern: 'PURPLE_CLUSTER', durationSeconds: 8.9 },
  { id: 'R-9987', roundNumber: 9987, multiplier: 1.42, timestamp: Date.now() - 120000, serverSeed: '1249b6d85', clientSeed: 'cli_307', nonce: 9987, hash: 'b12a8039d91f8ef40c9497e594dfc1682333036814db355d9d7e5dca52d4323b', eloRating: 1245, pattern: 'BLUE_TRAP', durationSeconds: 2.5 },
  { id: 'R-9986', roundNumber: 9986, multiplier: 1.05, timestamp: Date.now() - 160000, serverSeed: 'ef2d127de', clientSeed: 'cli_306', nonce: 9986, hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', eloRating: 1251, pattern: 'BLUE_TRAP', durationSeconds: 0.8 },
  { id: 'R-9985', roundNumber: 9985, multiplier: 14.82, timestamp: Date.now() - 200000, serverSeed: '043a71877', clientSeed: 'cli_305', nonce: 9985, hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', eloRating: 1265, pattern: 'PINK_WAVE', durationSeconds: 15.2 },
  { id: 'R-9984', roundNumber: 9984, multiplier: 2.12, timestamp: Date.now() - 240000, serverSeed: '315f5bdb7', clientSeed: 'cli_304', nonce: 9984, hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', eloRating: 1239, pattern: 'PURPLE_CLUSTER', durationSeconds: 4.4 },
  { id: 'R-9983', roundNumber: 9983, multiplier: 3.45, timestamp: Date.now() - 280000, serverSeed: '7c81a2f00', clientSeed: 'cli_303', nonce: 9983, hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', eloRating: 1234, pattern: 'PURPLE_CLUSTER', durationSeconds: 6.8 },
  { id: 'R-9982', roundNumber: 9982, multiplier: 1.18, timestamp: Date.now() - 320000, serverSeed: '8a9f24e9b', clientSeed: 'cli_302', nonce: 9982, hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', eloRating: 1220, pattern: 'BLUE_TRAP', durationSeconds: 2.1 },
];

export const AviatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBookmaker, setActiveBookmaker] = useState<BookmakerId>('BETWAY');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Flight Engine State
  const [flightStatus, setFlightStatus] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [countdownSeconds, setCountdownSeconds] = useState(4);
  const [crashTarget, setCrashTarget] = useState(2.84);
  const [currentElo, setCurrentElo] = useState(1248);
  const [eloChange, setEloChange] = useState(+14);

  // Guaranteed Monotonic Round Sequencer & Crash Lock
  const roundCounterRef = useRef<number>(9990);
  const isCrashedProcessedRef = useRef<boolean>(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Seed history
  const [rounds, setRounds] = useState<CrashRound[]>(INITIAL_ROUNDS_SEED);

  // Active AI Signal & Engine-Calculated Broadcast History
  const [activeSignal, setActiveSignal] = useState<CrashSignal>(() =>
    computePredictionSignal(INITIAL_ROUNDS_SEED, 'BETWAY', 9990, 1248, 0.72)
  );
  const activeSignalRef = useRef<CrashSignal>(activeSignal);
  useEffect(() => {
    activeSignalRef.current = activeSignal;
  }, [activeSignal]);

  const [signalsHistory, setSignalsHistory] = useState<CrashSignal[]>(() => [
    { ...computePredictionSignal(INITIAL_ROUNDS_SEED, 'HOLLYWOODBETS', 9989, 1258, 0.89), timestamp: Date.now() - 42000 },
    { ...computePredictionSignal(INITIAL_ROUNDS_SEED, 'LOTTOSTAR', 9988, 1245, 0.44), timestamp: Date.now() - 88000 },
    { ...computePredictionSignal(INITIAL_ROUNDS_SEED, 'EASYBET', 9987, 1236, 0.14), timestamp: Date.now() - 134000 },
    { ...computePredictionSignal(INITIAL_ROUNDS_SEED, 'SPORTYBET', 9986, 1252, 0.68), timestamp: Date.now() - 182000 },
    { ...computePredictionSignal(INITIAL_ROUNDS_SEED, 'YESPLAY', 9985, 1230, 0.18), timestamp: Date.now() - 228000 },
  ]);

  // Betting Cockpit Slots
  const [betSlot1, setBetSlot1] = useState<CrashBetSlot>({
    id: 'SLOT-1',
    amount: 50,
    autoCashoutEnabled: true,
    autoCashoutMultiplier: 1.85,
    isPlaced: false,
    isCashedOut: false,
    cashoutPrice: null,
    pnl: 0,
  });

  const [betSlot2, setBetSlot2] = useState<CrashBetSlot>({
    id: 'SLOT-2',
    amount: 100,
    autoCashoutEnabled: true,
    autoCashoutMultiplier: 2.5,
    isPlaced: false,
    isCashedOut: false,
    cashoutPrice: null,
    pnl: 0,
  });

  // Automated EA Settings
  const [eaSettings, setEaSettings] = useState<EABotSettings>({
    strategy: 'KELLY_CRITERION',
    baseBet: 20,
    maxBet: 1000,
    autoCashout: 1.85,
    stopLossLimit: 500,
    takeProfitLimit: 2000,
    consecutiveLossCircuitBreaker: 3,
    martingaleMultiplier: 2.0,
    isRunning: false,
  });

  const [eaTotalProfit, setEaTotalProfit] = useState(480);
  const [eaWinCount, setEaWinCount] = useState(14);
  const [eaLossCount, setEaLossCount] = useState(3);

  // Broadcast Webhook settings (persisted in localStorage, zero hardcoded demo credentials)
  const [telegramBotToken, setTelegramBotToken] = useState<string>(() => {
    try { return localStorage.getItem('nguni_tg_bot_token') || ''; } catch { return ''; }
  });
  const [telegramChatId, setTelegramChatId] = useState<string>(() => {
    try { return localStorage.getItem('nguni_tg_chat_id') || ''; } catch { return ''; }
  });
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState<string>(() => {
    try { return localStorage.getItem('nguni_dc_webhook_url') || ''; } catch { return ''; }
  });
  const [isAutoBroadcast, setIsAutoBroadcast] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('nguni_tg_bot_token', telegramBotToken);
      localStorage.setItem('nguni_tg_chat_id', telegramChatId);
      localStorage.setItem('nguni_dc_webhook_url', discordWebhookUrl);
    } catch {
      // Ignore
    }
  }, [telegramBotToken, telegramChatId, discordWebhookUrl]);

  // Current Bookmaker Info
  const bookmakerInfo = SA_BOOKMAKERS.find((b) => b.id === activeBookmaker) || SA_BOOKMAKERS[0];

  // Provably Fair Cryptographic SHA-256 Verifier
  const verifyHash = useCallback((serverSeed: string, clientSeed: string, nonce: number) => {
    const combo = `${serverSeed}:${clientSeed}:${nonce}`;
    const digest = sha256Hex(combo);
    // Standard 52-bit hex prefix provably fair crash derivation (3% house edge)
    const h = parseInt(digest.slice(0, 13), 16);
    const e = Math.pow(2, 52);
    const r = h / e;
    const rawMultiplier = r < 0.03 ? 1.0 : Math.max(1.0, +(0.97 / (1 - r)).toFixed(2));
    const calculatedMultiplier = Math.min(rawMultiplier, 100.0);
    return {
      multiplier: calculatedMultiplier,
      hash: digest,
    };
  }, []);

  // Place bet action
  const placeBet = useCallback((slotNum: 1 | 2) => {
    if (slotNum === 1) {
      setBetSlot1((prev) => ({ ...prev, isPlaced: true, isCashedOut: false, cashoutPrice: null, pnl: 0 }));
    } else {
      setBetSlot2((prev) => ({ ...prev, isPlaced: true, isCashedOut: false, cashoutPrice: null, pnl: 0 }));
    }
  }, []);

  // Cashout bet action
  const cashoutBet = useCallback((slotNum: 1 | 2) => {
    if (flightStatus !== 'FLYING') return;
    if (slotNum === 1) {
      setBetSlot1((prev) => {
        if (!prev.isPlaced || prev.isCashedOut) return prev;
        const profit = +(prev.amount * currentMultiplier - prev.amount).toFixed(2);
        return { ...prev, isCashedOut: true, cashoutPrice: currentMultiplier, pnl: profit };
      });
    } else {
      setBetSlot2((prev) => {
        if (!prev.isPlaced || prev.isCashedOut) return prev;
        const profit = +(prev.amount * currentMultiplier - prev.amount).toFixed(2);
        return { ...prev, isCashedOut: true, cashoutPrice: currentMultiplier, pnl: profit };
      });
    }
  }, [flightStatus, currentMultiplier]);

  // Cancel bet action
  const cancelBet = useCallback((slotNum: 1 | 2) => {
    if (slotNum === 1) {
      setBetSlot1((prev) => ({ ...prev, isPlaced: false }));
    } else {
      setBetSlot2((prev) => ({ ...prev, isPlaced: false }));
    }
  }, []);

  // EA Bot toggle
  const toggleEaBot = useCallback(() => {
    setEaSettings((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const roundsRef = useRef<CrashRound[]>(rounds);
  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  // Clean up post-crash cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  // Broadcast signal to live Telegram Bot API & Discord Webhook via backend relay
  const broadcastSignal = useCallback(
    async (sig: CrashSignal) => {
      const formattedMessage = `[NGUNI AVIATOR SIGNAL] ${sig.bookmaker} | Target: ${sig.predictedMultiplier.toFixed(
        2
      )}x | Safe Cashout: ${sig.safeCashout.toFixed(2)}x | Confidence: ${sig.confidence}% | Pattern: ${sig.pattern}`;
      try {
        const res = await fetch('/api/aviator/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramBotToken,
            telegramChatId,
            discordWebhookUrl,
            message: formattedMessage,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const channels = [
            data.telegramDelivered ? 'Telegram' : null,
            data.discordDelivered ? 'Discord' : null,
          ]
            .filter(Boolean)
            .join(' & ');
          return {
            success: true,
            message: `Delivered ${sig.bookmaker} (${sig.predictedMultiplier.toFixed(2)}x) via ${channels} in ${data.rttMs}ms.`,
          };
        }
        return {
          success: false,
          message:
            data.error ||
            (Array.isArray(data.errors) && data.errors.length > 0
              ? data.errors.join(' | ')
              : 'Configure Telegram Bot Token or Discord Webhook URL to dispatch.'),
        };
      } catch (err: unknown) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Network failure dispatching signal.',
        };
      }
    },
    [telegramBotToken, telegramChatId, discordWebhookUrl]
  );

  // Run an on-demand Prediction Engine scan across rounds and prepend to signals feed
  const generateSignalScan = useCallback(
    (targetBookmaker?: BookmakerId): CrashSignal => {
      roundCounterRef.current += 1;
      const bm = targetBookmaker || activeBookmaker;
      const scannedSignal = computePredictionSignal(
        roundsRef.current,
        bm,
        roundCounterRef.current,
        currentElo
      );
      setActiveSignal(scannedSignal);
      setSignalsHistory((prev) => [scannedSignal, ...prev.slice(0, 29)]);
      return scannedSignal;
    },
    [activeBookmaker, currentElo]
  );

  // Main Aviator Game Loop with High-Performance Autonomous Bot Engine
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (flightStatus === 'WAITING') {
      // Autonomous Bot Decision Phase during WAITING
      if (eaSettings.isRunning) {
        setBetSlot1((prev) => {
          if (prev.isPlaced) return prev;
          let target = eaSettings.autoCashout;
          let stake = eaSettings.baseBet;

          if (eaSettings.strategy === 'CONSERVATIVE_COMPOUND') {
            target = 1.35;
            stake = eaSettings.baseBet * 1.2;
          } else if (eaSettings.strategy === 'KELLY_CRITERION') {
            target = activeSignalRef.current.safeCashout || 1.85;
            stake = Math.min(eaSettings.maxBet, Math.max(10, Math.floor(eaSettings.baseBet * 1.5)));
          } else if (eaSettings.strategy === 'PINK_HUNTER') {
            target = 2.0;
          }

          return {
            ...prev,
            amount: stake,
            autoCashoutEnabled: true,
            autoCashoutMultiplier: target,
            isPlaced: true,
            isCashedOut: false,
            cashoutPrice: null,
            pnl: 0,
          };
        });

        // Dual Slot Hedge for Kelly & Pink Hunter strategies
        if (eaSettings.strategy === 'KELLY_CRITERION' || eaSettings.strategy === 'PINK_HUNTER') {
          setBetSlot2((prev) => {
            if (prev.isPlaced) return prev;
            const target2 = eaSettings.strategy === 'PINK_HUNTER' ? 10.0 : 3.5;
            return {
              ...prev,
              amount: Math.max(10, Math.floor(eaSettings.baseBet * 0.75)),
              autoCashoutEnabled: true,
              autoCashoutMultiplier: target2,
              isPlaced: true,
              isCashedOut: false,
              cashoutPrice: null,
              pnl: 0,
            };
          });
        }
      }

      interval = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            // Launch flight!
            isCrashedProcessedRef.current = false;
            setFlightStatus('FLYING');
            setCurrentMultiplier(1.0);
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (flightStatus === 'FLYING') {
      // Exponential supersonic flight trajectory
      const startTime = Date.now();
      interval = setInterval(() => {
        setCurrentMultiplier((prev) => {
          const speedFactor = 0.035 + (prev > 10 ? 0.09 : prev > 5 ? 0.06 : prev > 2 ? 0.045 : 0.025);
          const nextVal = +(prev + speedFactor).toFixed(2);

          // Check Auto-Cashout for Slot 1
          setBetSlot1((b1) => {
            if (b1.isPlaced && !b1.isCashedOut && b1.autoCashoutEnabled && nextVal >= b1.autoCashoutMultiplier) {
              const profit = +(b1.amount * b1.autoCashoutMultiplier - b1.amount).toFixed(2);
              if (eaSettings.isRunning) {
                setEaWinCount((w) => w + 1);
                setEaTotalProfit((p) => +(p + profit).toFixed(2));
              }
              return { ...b1, isCashedOut: true, cashoutPrice: b1.autoCashoutMultiplier, pnl: profit };
            }
            return b1;
          });

          // Check Auto-Cashout for Slot 2
          setBetSlot2((b2) => {
            if (b2.isPlaced && !b2.isCashedOut && b2.autoCashoutEnabled && nextVal >= b2.autoCashoutMultiplier) {
              const profit = +(b2.amount * b2.autoCashoutMultiplier - b2.amount).toFixed(2);
              if (eaSettings.isRunning) {
                setEaWinCount((w) => w + 1);
                setEaTotalProfit((p) => +(p + profit).toFixed(2));
              }
              return { ...b2, isCashedOut: true, cashoutPrice: b2.autoCashoutMultiplier, pnl: profit };
            }
            return b2;
          });

          // Check if reached crash target
          if (nextVal >= crashTarget) {
            if (isCrashedProcessedRef.current) return crashTarget;
            isCrashedProcessedRef.current = true;
            setFlightStatus('CRASHED');

            // Record round with guaranteed monotonically increasing roundNumber
            roundCounterRef.current += 1;
            const newRoundNumber = roundCounterRef.current;
            const uniqueRoundId = `R-${newRoundNumber}-${Date.now()}`;
            const newElo = crashTarget > 5 ? currentElo + 18 : crashTarget > 2 ? currentElo + 6 : currentElo - 12;
            const newPattern: CrashPatternType =
              crashTarget >= 10 ? 'PINK_WAVE' : crashTarget < 1.5 ? 'BLUE_TRAP' : 'PURPLE_CLUSTER';

            const roundServerSeed = randomHex(8);
            const roundClientSeed = 'client_live_sa';
            const roundHash = sha256Hex(`${roundServerSeed}:${roundClientSeed}:${newRoundNumber}`);

            const newRound: CrashRound = {
              id: uniqueRoundId,
              roundNumber: newRoundNumber,
              multiplier: crashTarget,
              timestamp: Date.now(),
              serverSeed: roundServerSeed,
              clientSeed: roundClientSeed,
              nonce: newRoundNumber,
              hash: roundHash,
              eloRating: newElo,
              pattern: newPattern,
              durationSeconds: +((Date.now() - startTime) / 1000).toFixed(1),
            };

            const updatedRounds = [newRound, ...roundsRef.current.slice(0, 49)];
            setRounds(updatedRounds);
            setCurrentElo(newElo);
            setEloChange(newElo - currentElo);

            // Handle un-cashed bets as loss & record in EA stats
            setBetSlot1((b) => {
              if (b.isPlaced && !b.isCashedOut) {
                if (eaSettings.isRunning) {
                  setEaLossCount((l) => l + 1);
                  setEaTotalProfit((p) => +(p - b.amount).toFixed(2));
                }
                return { ...b, isPlaced: false, pnl: -b.amount };
              }
              return b;
            });

            setBetSlot2((b) => {
              if (b.isPlaced && !b.isCashedOut) {
                if (eaSettings.isRunning) {
                  setEaLossCount((l) => l + 1);
                  setEaTotalProfit((p) => +(p - b.amount).toFixed(2));
                }
                return { ...b, isPlaced: false, pnl: -b.amount };
              }
              return b;
            });

            // Generate Next Algorithmic Prediction from the Prediction Engine
            const nextSig = computePredictionSignal(
              updatedRounds,
              activeBookmaker,
              newRoundNumber,
              newElo
            );

            setCrashTarget(nextSig.predictedMultiplier);
            setActiveSignal(nextSig);
            setSignalsHistory((prev) => [nextSig, ...prev.slice(0, 29)]);

            // Cooldown before next round
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = setTimeout(() => {
              isCrashedProcessedRef.current = false;
              setFlightStatus('WAITING');
              setCountdownSeconds(3);
            }, 2500);

            return crashTarget;
          }

          return nextVal;
        });
      }, 70);
    }

    return () => clearInterval(interval);
  }, [flightStatus, crashTarget, currentElo, activeBookmaker, eaSettings.isRunning, eaSettings.strategy, eaSettings.baseBet, eaSettings.autoCashout, eaSettings.maxBet]);

  const forceNextRound = useCallback(() => {
    setFlightStatus('WAITING');
    setCountdownSeconds(1);
  }, []);

  return (
    <AviatorContext.Provider
      value={{
        activeBookmaker,
        setActiveBookmaker,
        bookmakerInfo,
        flightStatus,
        currentMultiplier,
        countdownSeconds,
        crashTarget,
        rounds,
        currentElo,
        eloChange,
        activeSignal,
        signalsHistory,
        generateSignalScan,
        soundEnabled,
        setSoundEnabled,
        betSlot1,
        setBetSlot1,
        betSlot2,
        setBetSlot2,
        placeBet,
        cashoutBet,
        cancelBet,
        eaSettings,
        setEaSettings,
        toggleEaBot,
        eaTotalProfit,
        eaWinCount,
        eaLossCount,
        telegramBotToken,
        setTelegramBotToken,
        telegramChatId,
        setTelegramChatId,
        discordWebhookUrl,
        setDiscordWebhookUrl,
        isAutoBroadcast,
        setIsAutoBroadcast,
        broadcastSignal,
        verifyHash,
        forceNextRound,
      }}
    >
      {children}
    </AviatorContext.Provider>
  );
};

export const useAviator = () => {
  const context = useContext(AviatorContext);
  if (!context) {
    throw new Error('useAviator must be used within an AviatorProvider');
  }
  return context;
};
