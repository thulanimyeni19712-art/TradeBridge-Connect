import { MarketPrice, OrderSide } from '../types/trading';
import { LiveCandle } from './liveMarketData';

export interface AutonomousSymbolAnalysis {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  emaFast: number;
  emaSlow: number;
  rsi14: number;
  atr: number;
  spreadPoints: number;
  spreadAllowed: boolean;
  entryPrice: number;
  sl: number;
  tp: number;
  riskReward: number;
  regime: 'BULL_EXPANSION' | 'BEAR_EXPANSION' | 'CONSOLIDATION';
  reason: string;
  updatedAt: string;
  candleCount: number;
}

export interface AutonomousDecisionLog {
  id: string;
  timestamp: string;
  bot: string;
  symbol: string;
  action: OrderSide | 'BREAK_EVEN' | 'PARTIAL_LOCK' | 'TRAIL_RATCHET' | 'SKIP';
  price: number;
  reason: string;
  protection: string;
  latencyMs: number;
}

function computeEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function computeRsi14(closes: number[]): number {
  if (closes.length < 15) return 50;
  let gains = 0;
  let losses = 0;
  const start = Math.max(1, closes.length - 14);
  for (let i = start; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss === 0) return avgGain === 0 ? 50 : 95;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function computeAtr14(candles: LiveCandle[]): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  const start = Math.max(1, candles.length - 14);
  for (let i = start; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);
  }
  if (trs.length === 0) return 0;
  return trs.reduce((sum, v) => sum + v, 0) / trs.length;
}

export function analyzeLiveMarketStructure(
  symbol: string,
  market: MarketPrice,
  candles: LiveCandle[],
  maxSpreadPips: number
): AutonomousSymbolAnalysis {
  const digits = market.digits ?? 2;
  const pip = market.pipSize || 0.01;
  const spreadPips = Number(((market.ask - market.bid) / pip).toFixed(2));
  const spreadAllowed = spreadPips <= Math.max(maxSpreadPips, symbol.includes('BTC') ? 35 : maxSpreadPips);

  // Build real close series appending live market mid-price as most recent bar
  const liveMid = (market.bid + market.ask) / 2;
  const historicalCloses = candles.map((c) => c.close);
  const closes =
    historicalCloses.length >= 22
      ? [...historicalCloses.slice(0, -1), liveMid]
      : historicalCloses.length > 0
      ? [...historicalCloses, liveMid]
      : [liveMid];

  const emaFastArr = computeEmaSeries(closes, 9);
  const emaSlowArr = computeEmaSeries(closes, 21);
  const emaFast = emaFastArr[emaFastArr.length - 1] ?? liveMid;
  const emaSlow = emaSlowArr[emaSlowArr.length - 1] ?? liveMid;
  const prevFast = emaFastArr[emaFastArr.length - 2] ?? emaFast;
  const prevSlow = emaSlowArr[emaSlowArr.length - 2] ?? emaSlow;

  const rsi14 = computeRsi14(closes);
  const rawAtr = computeAtr14(candles);
  const minAtr = pip * 18;
  const atr = rawAtr > 0 ? Math.max(rawAtr, minAtr) : pip * 28;

  // Higher high / lower low breakout structure across recent 8 bars
  const recentBars = candles.slice(-9, -1);
  const recentHigh = recentBars.length > 0 ? Math.max(...recentBars.map((b) => b.high)) : market.high;
  const recentLow = recentBars.length > 0 ? Math.min(...recentBars.map((b) => b.low)) : market.low;

  const bullishCross = prevFast <= prevSlow && emaFast > emaSlow;
  const bearishCross = prevFast >= prevSlow && emaFast < emaSlow;
  const emaSpreadPct = emaSlow > 0 ? ((emaFast - emaSlow) / emaSlow) * 100 : 0;

  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 54;
  let regime: AutonomousSymbolAnalysis['regime'] = 'CONSOLIDATION';
  let reason = 'Awaiting clean institutional expansion or momentum cross.';

  const bullMomentum =
    emaFast > emaSlow &&
    rsi14 >= 51 &&
    rsi14 <= 73 &&
    (market.change24h >= -0.15 || bullishCross || liveMid >= recentHigh * 0.9992);

  const bearMomentum =
    emaFast < emaSlow &&
    rsi14 <= 49 &&
    rsi14 >= 27 &&
    (market.change24h <= 0.15 || bearishCross || liveMid <= recentLow * 1.0008);

  if (bullishCross || bullMomentum) {
    regime = 'BULL_EXPANSION';
    confidence = Math.min(
      97,
      Math.round(
        68 +
          (bullishCross ? 12 : 6) +
          Math.min(10, Math.abs(emaSpreadPct) * 80) +
          (rsi14 > 54 && rsi14 < 68 ? 6 : 2)
      )
    );
    action = spreadAllowed && confidence >= 72 ? 'BUY' : 'HOLD';
    reason = bullishCross
      ? `EMA 9/21 Golden Cross + RSI ${rsi14} bullish expansion`
      : `Bullish EMA structure (+${emaSpreadPct.toFixed(3)}%) · RSI ${rsi14} momentum`;
  } else if (bearishCross || bearMomentum) {
    regime = 'BEAR_EXPANSION';
    confidence = Math.min(
      97,
      Math.round(
        68 +
          (bearishCross ? 12 : 6) +
          Math.min(10, Math.abs(emaSpreadPct) * 80) +
          (rsi14 < 46 && rsi14 > 32 ? 6 : 2)
      )
    );
    action = spreadAllowed && confidence >= 72 ? 'SELL' : 'HOLD';
    reason = bearishCross
      ? `EMA 9/21 Bear Cross + RSI ${rsi14} downside sweep`
      : `Bearish EMA structure (${emaSpreadPct.toFixed(3)}%) · RSI ${rsi14} distribution`;
  } else if (rsi14 <= 29 && market.change24h > -2.5) {
    regime = 'BULL_EXPANSION';
    confidence = 76;
    action = spreadAllowed ? 'BUY' : 'HOLD';
    reason = `Oversold liquidity sweep reversal (RSI ${rsi14})`;
  } else if (rsi14 >= 71 && market.change24h < 2.5) {
    regime = 'BEAR_EXPANSION';
    confidence = 75;
    action = spreadAllowed ? 'SELL' : 'HOLD';
    reason = `Overbought exhaustion rejection (RSI ${rsi14})`;
  }

  if (!spreadAllowed && action !== 'HOLD') {
    reason = `Spread guard blocked (${spreadPips} pips > max ${maxSpreadPips})`;
    action = 'HOLD';
  }

  const chosenSide: OrderSide = action === 'SELL' ? 'SELL' : 'BUY';
  const entryPrice = Number((chosenSide === 'BUY' ? market.ask : market.bid).toFixed(digits));
  const slDist = Math.max(atr * 1.35, pip * 16);
  const tpDist = Math.max(atr * 3.25, pip * 40);
  const sl = Number(
    (chosenSide === 'BUY' ? entryPrice - slDist : entryPrice + slDist).toFixed(digits)
  );
  const tp = Number(
    (chosenSide === 'BUY' ? entryPrice + tpDist : entryPrice - tpDist).toFixed(digits)
  );

  return {
    symbol,
    action,
    confidence,
    emaFast: Number(emaFast.toFixed(digits)),
    emaSlow: Number(emaSlow.toFixed(digits)),
    rsi14,
    atr: Number(atr.toFixed(digits)),
    spreadPoints: Number(market.spread.toFixed(1)),
    spreadAllowed,
    entryPrice,
    sl,
    tp,
    riskReward: Number((tpDist / Math.max(slDist, pip)).toFixed(2)),
    regime,
    reason,
    updatedAt: new Date().toLocaleTimeString(),
    candleCount: candles.length,
  };
}
