import React, { useEffect, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';
import { speechNotifier } from '../../services/speechNotificationService';

/**
 * Headless observer watching live spot market price moves, filled pending triggers,
 * and SL/TP/Kill-Switch outcomes from TradingContext so browser speech synthesis
 * announces critical market moves and trade closures across the entire terminal.
 */
export const MarketSpeechWatcher: React.FC = () => {
  const { prices, orderHistory, positions } = useTrading();

  const anchorPricesRef = useRef<Record<string, number>>({});
  const lastHistoryIdRef = useRef<string | null>(orderHistory[0]?.id ?? null);
  const lastPositionIdsRef = useRef<Set<string>>(new Set(positions.map((p) => p.id)));
  const initializedPricesRef = useRef<boolean>(false);

  // Monitor critical intraday price moves across watched instruments every 2 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      const entries = Object.values(prices);
      if (entries.length === 0) return;

      if (!initializedPricesRef.current) {
        const initialAnchors: Record<string, number> = {};
        for (const item of entries) {
          initialAnchors[item.symbol] = item.bid;
        }
        anchorPricesRef.current = initialAnchors;
        initializedPricesRef.current = true;
        return;
      }

      for (const market of entries) {
        const prevAnchor = anchorPricesRef.current[market.symbol];
        if (!prevAnchor || prevAnchor <= 0) {
          anchorPricesRef.current[market.symbol] = market.bid;
          continue;
        }

        const pctDelta = ((market.bid - prevAnchor) / prevAnchor) * 100;
        const absPctDelta = Math.abs(pctDelta);

        const impulseThreshold =
          market.category === 'CRYPTO'
            ? 0.45
            : market.category === 'INDICES' || market.category === 'METALS'
            ? 0.28
            : 0.18;

        if (absPctDelta >= impulseThreshold) {
          anchorPricesRef.current[market.symbol] = market.bid;
          const direction = pctDelta >= 0 ? 'surged' : 'dropped';
          const formattedPrice = market.bid.toFixed(market.digits);

          speechNotifier.speak({
            category: 'CRITICAL_MOVE',
            severity: absPctDelta >= impulseThreshold * 1.8 ? 'CRITICAL' : 'HIGH',
            title: `${market.symbol} ${pctDelta >= 0 ? '+' : ''}${pctDelta.toFixed(2)}% Impulse Move`,
            message: `Critical market move alert: ${market.symbol} ${direction} ${absPctDelta.toFixed(
              2
            )} percent, now trading at ${formattedPrice}.`,
            dedupeKey: `spot-impulse-${market.symbol}`,
            cooldownMs: 30000,
          });
        }
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [prices]);

  // Monitor newly filled Limit/Stop pending triggers (direct market/batch fills announce inside TradingContext)
  useEffect(() => {
    const prevIds = lastPositionIdsRef.current;
    const newlyOpened = positions.filter((p) => !prevIds.has(p.id));
    lastPositionIdsRef.current = new Set(positions.map((p) => p.id));

    for (const pos of newlyOpened) {
      if (pos.comment && pos.comment.startsWith('Filled_')) {
        speechNotifier.speak({
          category: 'BOT_ENTRY',
          severity: 'HIGH',
          title: `Pending Trigger Filled: ${pos.side} ${pos.symbol}`,
          message: `Pending order filled on ${pos.symbol}: ${pos.side} ${pos.lots.toFixed(
            2
          )} lots at ${pos.openPrice.toFixed(prices[pos.symbol]?.digits ?? 2)}.`,
          dedupeKey: `pending-fill-${pos.ticket}`,
          cooldownMs: 5000,
        });
      }
    }
  }, [positions, prices]);

  // Monitor Stop Loss / Take Profit / Trailing Stop / Kill Switch closures
  useEffect(() => {
    const newest = orderHistory[0];
    if (!newest || newest.id === lastHistoryIdRef.current) return;
    lastHistoryIdRef.current = newest.id;

    if (
      newest.closeReason === 'TP_HIT' ||
      newest.closeReason === 'SL_HIT' ||
      newest.closeReason === 'TRAILING_STOP' ||
      newest.closeReason === 'KILL_SWITCH'
    ) {
      const reasonText =
        newest.closeReason === 'TP_HIT'
          ? 'Take profit hit'
          : newest.closeReason === 'SL_HIT'
          ? 'Stop loss triggered'
          : newest.closeReason === 'TRAILING_STOP'
          ? 'Trailing stop hit'
          : 'Emergency kill switch executed';
      const pnlWord = newest.profit >= 0 ? 'profit' : 'loss';
      speechNotifier.speak({
        category: 'OUTCOME',
        severity: newest.closeReason === 'KILL_SWITCH' ? 'CRITICAL' : 'HIGH',
        title: `${reasonText}: ${newest.symbol}`,
        message: `${reasonText} on ${newest.symbol}. Realized ${pnlWord} ${Math.abs(newest.profit).toFixed(
          2
        )} dollars.`,
        dedupeKey: `order-close-${newest.id}`,
        cooldownMs: 4000,
      });
    }
  }, [orderHistory]);

  return null;
};
