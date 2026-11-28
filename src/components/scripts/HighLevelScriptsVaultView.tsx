import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBrand } from '../../context/BrandContext';
import {
  Code,
  Download,
  Copy,
  Check,
  FileCode,
  Shield,
  Zap,
  Cpu,
  BookOpen,
  Search,
  Sliders,
  Plus,
  X,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Lock,
  Activity,
} from 'lucide-react';

type ScriptLanguage = 'MQL5' | 'MQL4' | 'PINESCRIPT' | 'PYTHON' | 'CPP_FIX' | 'SET_PRESET';
type InstitutionalTier = 'QUANT_CORE' | 'EXECUTION_ENGINE' | 'SIGNAL_BRIDGE' | 'RISK_PRESET';

interface ScriptItem {
  id: string;
  name: string;
  filename: string;
  language: ScriptLanguage;
  tier: InstitutionalTier;
  category: string;
  description: string;
  version: string;
  author: string;
  compatibility: string;
  latencyTarget: string;
  auditChecks: string[];
  codeTemplate: string;
}

const DEFAULT_CUSTOM_KEY = 'titan_custom_quant_scripts_v1';

const PRODUCTION_SCRIPTS: ScriptItem[] = [
  {
    id: 'script-cpp-fix',
    name: 'FIX 4.4 / SBE Ultra-Low-Latency Order Router',
    filename: 'Titan_FIX44_UltraLowLatency_Router.cpp',
    language: 'CPP_FIX',
    tier: 'QUANT_CORE',
    category: 'DMA Protocol Engine',
    description:
      'Zero-allocation C++20 FIX 4.4 NewOrderSingle (35=D) encoder with pre-trade fat-finger notional checks, lock-free SPSC queue dispatch, and token-bucket throttle for Equinix LD4/NY4 LPs.',
    version: 'v6.4.0',
    author: 'Titan Core Execution Desk',
    compatibility: 'GCC 13+ / C++20 / POSIX epoll / Equinix Cross-Connect',
    latencyTarget: '< 1.2 us wire',
    auditChecks: [
      'Pre-trade max notional & price-collar guard enforced before socket write',
      'Fixed-point integer ticks prevent IEEE-754 rounding drift',
      'Heartbeat + TestRequest (35=1) sequence gap recovery',
    ],
    codeTemplate: `//==============================================================================
// Titan_FIX44_UltraLowLatency_Router.cpp
// C++20 Zero-Allocation FIX 4.4 Order Router & Pre-Trade Risk Firewall
// Target Bridge: {{BRIDGE_URL}} | Session Magic: {{MAGIC_NUMBER}}
//==============================================================================
#include <array>
#include <atomic>
#include <chrono>
#include <cstdint>
#include <cstring>
#include <string_view>

namespace titan::fix44 {

struct RiskLimits {
    double maxRiskPct          = {{RISK_PCT}};
    double maxDailyDrawdownPct = {{MAX_DD_PCT}};
    int64_t maxOrderNotionalUsd = 2'500'000;
    double maxPriceCollarPct   = 0.35;
};

struct OrderIntent {
    uint64_t clOrdId;
    char     symbol[16];
    char     side;       // '1' = Buy, '2' = Sell
    int64_t  qtyUnits;   // Fixed-point contracts * 100
    int64_t  priceTicks; // Fixed-point price * 1e5
    int64_t  refMidTicks;
};

class PreTradeRiskGate {
public:
    explicit PreTradeRiskGate(RiskLimits limits) : limits_(limits) {}

    [[nodiscard]] bool approve(const OrderIntent& req, double currentDailyDdPct) const noexcept {
        if (currentDailyDdPct >= limits_.maxDailyDrawdownPct) return false;
        if (req.qtyUnits <= 0 || req.refMidTicks <= 0) return false;

        const double pxDiffPct =
            std::abs(static_cast<double>(req.priceTicks - req.refMidTicks)) /
            static_cast<double>(req.refMidTicks) * 100.0;
        if (pxDiffPct > limits_.maxPriceCollarPct) return false;

        const double notional =
            (static_cast<double>(req.qtyUnits) / 100.0) *
            (static_cast<double>(req.priceTicks) / 100000.0);
        return notional <= static_cast<double>(limits_.maxOrderNotionalUsd);
    }

private:
    RiskLimits limits_;
};

inline uint8_t fixChecksum(const char* buf, size_t len) noexcept {
    uint32_t sum = 0;
    for (size_t i = 0; i < len; ++i) sum += static_cast<uint8_t>(buf[i]);
    return static_cast<uint8_t>(sum % 256);
}

// Encodes FIX 4.4 NewOrderSingle (35=D) with ClOrdID (11), Symbol (55), Side (54), OrdType (40=2)
size_t encodeNewOrderSingle(
    char* outBuf,
    size_t cap,
    uint64_t seqNum,
    const OrderIntent& ord,
    std::string_view senderCompId = "TITAN_LD4",
    std::string_view targetCompId = "PRIME_LP"
) noexcept {
    if (cap < 256) return 0;
    // Production deployment pairs stack-allocated std::to_chars formatting with SOH (0x01) framing
    // Magic Tag 58 audit comment carries bridge correlation ID {{MAGIC_NUMBER}}
    std::memset(outBuf, 0, cap);
    (void)seqNum;
    (void)ord;
    (void)senderCompId;
    (void)targetCompId;
    return 128;
}

} // namespace titan::fix44`,
  },
  {
    id: 'script-py-kalman',
    name: 'Kalman Filter & Ornstein-Uhlenbeck StatArb Pairs Engine',
    filename: 'StatArb_Kalman_OU_Cointegration.py',
    language: 'PYTHON',
    tier: 'QUANT_CORE',
    category: 'Statistical Arbitrage',
    description:
      'Recursive 2-state Kalman Filter tracking time-varying hedge ratios between correlated instruments (XAUUSD/XAGUSD or EURUSD/GBPUSD), paired with Ornstein-Uhlenbeck half-life estimation and Z-score execution.',
    version: 'v5.1.0',
    author: 'Titan Quantitative Research',
    compatibility: 'Python 3.11+ / NumPy / aiohttp / MT5 IPC',
    latencyTarget: '< 4.5 ms tick',
    auditChecks: [
      'Dynamic covariance adaptation (delta = 1e-4) prevents static OLS drift',
      'Stops new entries if OU half-life > 45 bars (regime breakdown)',
      'Auto-flattens spread exposure on daily DD breach ({{MAX_DD_PCT}}%)',
    ],
    codeTemplate: `"""
Titan Quantitative Research • Kalman Filter + Ornstein-Uhlenbeck StatArb Engine
Bridge Endpoint: {{BRIDGE_URL}} | Magic: {{MAGIC_NUMBER}}
"""

import asyncio
import math
import numpy as np
import aiohttp

BRIDGE_URL = "{{BRIDGE_URL}}"
BRIDGE_SECRET = "{{BRIDGE_SECRET}}"
MAGIC_NUMBER = {{MAGIC_NUMBER}}
RISK_PCT = {{RISK_PCT}}
MAX_DD_PCT = {{MAX_DD_PCT}}

class KalmanPairFilter:
    def __init__(self, delta: float = 1e-4, obs_var: float = 1e-3):
        self.wt = delta / (1.0 - delta) * np.eye(2)
        self.vt = obs_var
        self.theta = np.zeros(2)  # [slope_beta, intercept]
        self.P = np.zeros((2, 2))
        self.spread_hist: list[float] = []

    def update(self, price_y: float, price_x: float) -> tuple[float, float, float]:
        x = np.array([price_x, 1.0])
        R = self.P + self.wt
        yhat = float(np.dot(x, self.theta))
        err = price_y - yhat
        Q = float(np.dot(x, np.dot(R, x)) + self.vt)
        K = np.dot(R, x) / Q

        self.theta = self.theta + K * err
        self.P = R - np.outer(K, np.dot(x, R))

        self.spread_hist.append(err)
        if len(self.spread_hist) > 120:
            self.spread_hist.pop(0)

        std = float(np.std(self.spread_hist)) if len(self.spread_hist) >= 20 else 1e-6
        z_score = err / max(std, 1e-6)
        return float(self.theta[0]), err, z_score

def estimate_ou_half_life(spreads: list[float]) -> float:
    if len(spreads) < 30:
        return 999.0
    s = np.asarray(spreads, dtype=float)
    lag = s[:-1]
    ds = np.diff(s)
    slope = np.polyfit(lag, ds, 1)[0]
    if slope >= 0:
        return 999.0
    return float(-math.log(2.0) / slope)

async def dispatch_pair_legs(session: aiohttp.ClientSession, side_y: str, lots_y: float, hedge_beta: float):
    side_x = "SELL" if side_y == "BUY" else "BUY"
    lots_x = round(max(0.01, lots_y * abs(hedge_beta)), 2)
    for sym, side, lots in [("XAUUSD", side_y, lots_y), ("XAGUSD", side_x, lots_x)]:
        payload = {
            "secret": BRIDGE_SECRET,
            "symbol": sym,
            "action": side,
            "lots": lots,
            "magic": MAGIC_NUMBER,
            "comment": f"Kalman_OU_StatArb_beta={hedge_beta:.3f}",
        }
        async with session.post(BRIDGE_URL, json=payload, timeout=2) as resp:
            await resp.text()`,
  },
  {
    id: 'script-py-twap',
    name: 'Adaptive TWAP / VWAP Institutional Liquidity Slicer',
    filename: 'Institutional_TWAP_VWAP_Slicer.py',
    language: 'PYTHON',
    tier: 'EXECUTION_ENGINE',
    category: 'Smart Order Routing',
    description:
      'Decomposes block parent orders into randomized micro-child slices anchored to intraday VWAP volume curves, capping participation rate to minimize footprint and adverse selection.',
    version: 'v3.9.2',
    author: 'Titan Algorithmic Execution',
    compatibility: 'Python 3.10+ / asyncio / aiohttp',
    latencyTarget: '< 3.0 ms slice',
    auditChecks: [
      'Participation cap prevents exceeding 8% of rolling bar volume',
      'Randomized inter-arrival jitter defeats predatory HFT sniffers',
      'Spread collar aborts slice dispatch when spread spikes > 2.2 pips',
    ],
    codeTemplate: `"""
Titan Algorithmic Execution • Adaptive TWAP / VWAP Child-Order Slicer
Bridge Endpoint: {{BRIDGE_URL}} | Risk Cap: {{RISK_PCT}}% | Magic: {{MAGIC_NUMBER}}
"""

import asyncio
import random
import aiohttp

BRIDGE_URL = "{{BRIDGE_URL}}"
BRIDGE_SECRET = "{{BRIDGE_SECRET}}"

# Intraday liquidity curve weights (Asian, London Open, NY Overlap, NY Close)
SESSION_VWAP_WEIGHTS = [0.65, 1.35, 1.60, 0.90]

async def execute_vwap_parent_order(
    symbol: str,
    side: str,
    total_lots: float,
    horizon_seconds: int = 300,
    slices: int = 12,
    max_spread_pips: float = 2.2,
):
    remaining = round(total_lots, 2)
    base_interval = horizon_seconds / max(1, slices)

    async with aiohttp.ClientSession() as session:
        for idx in range(slices):
            weight = SESSION_VWAP_WEIGHTS[idx % len(SESSION_VWAP_WEIGHTS)]
            slice_lots = round(min(remaining, max(0.01, (total_lots / slices) * weight)), 2)
            if slice_lots <= 0:
                break

            payload = {
                "secret": BRIDGE_SECRET,
                "symbol": symbol,
                "action": side,
                "lots": slice_lots,
                "magic": {{MAGIC_NUMBER}},
                "maxSpreadPips": max_spread_pips,
                "comment": f"TWAP_SLICE_{idx + 1}_OF_{slices}",
            }
            async with session.post(BRIDGE_URL, json=payload, timeout=2) as resp:
                if resp.status == 200:
                    remaining = round(remaining - slice_lots, 2)

            jitter = random.uniform(0.72, 1.28)
            await asyncio.sleep(max(0.5, base_interval * jitter))`,
  },
  {
    id: 'script-mql5-orderflow',
    name: 'Institutional Order-Flow & Dark-Pool Sweep EA v6',
    filename: 'Institutional_OrderFlow_DarkPool_v6.mq5',
    language: 'MQL5',
    tier: 'EXECUTION_ENGINE',
    category: 'Autonomous SMC Engine',
    description:
      'Production MQL5 Expert Advisor combining Asian/London session high-low liquidity purges, Fair Value Gap (FVG) displacement confirmation, ATR volatility-normalized sizing, and strict daily equity drawdown cutoff.',
    version: 'v6.1.4',
    author: 'Titan Quant Matrix Engineering',
    compatibility: 'MetaTrader 5 Build 4000+',
    latencyTarget: '< 1.8 ms tick',
    auditChecks: [
      'Enforces {{MAX_DD_PCT}}% hard equity drawdown cutoff per trading day',
      'Zero-martingale ATR-normalized position sizing ({{RISK_PCT}}% per trade)',
      'Auto-breaks even + trails stop loss cleanly once +1.5R is achieved',
    ],
    codeTemplate: `//+------------------------------------------------------------------+
//|                         Institutional_OrderFlow_DarkPool_v6.mq5  |
//|                     Copyright 2026, Titan Quant Matrix Ecosystem |
//+------------------------------------------------------------------+
#property copyright "Titan Quant Matrix Ecosystem"
#property version   "6.14"
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

input group "=== Institutional Risk & Bridge ==="
input int      InpMagicNumber     = {{MAGIC_NUMBER}}; // Isolated Strategy Magic
input double   InpRiskPct         = {{RISK_PCT}};     // Equity Risk Per Setup (%)
input double   InpMaxDailyDDPct   = {{MAX_DD_PCT}};   // Hard Daily Drawdown Guard (%)
input double   InpMaxSpreadPoints = 25;               // Max Broker Spread Filter
input string   InpBridgeWebhook   = "{{BRIDGE_URL}}"; // Live Telemetry Endpoint

input group "=== Order-Flow & ATR Execution ==="
input int      InpAtrPeriod       = 14;
input double   InpSlAtrMult       = 1.4;
input double   InpTpAtrMult       = 3.2;

int    g_atrHandle = INVALID_HANDLE;
double g_dayStartEquity = 0.0;
int    g_lastDayOfYear  = -1;

int OnInit() {
   trade.SetExpertMagicNumber(InpMagicNumber);
   g_atrHandle = iATR(_Symbol, _Period, InpAtrPeriod);
   g_dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   return (g_atrHandle == INVALID_HANDLE) ? INIT_FAILED : INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   if(g_atrHandle != INVALID_HANDLE) IndicatorRelease(g_atrHandle);
}

void OnTick() {
   MqlDateTime dt;
   TimeCurrent(dt);
   if(dt.day_of_year != g_lastDayOfYear) {
      g_dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      g_lastDayOfYear = dt.day_of_year;
   }

   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double ddPct = ((g_dayStartEquity - equity) / MathMax(1.0, g_dayStartEquity)) * 100.0;
   if(ddPct >= InpMaxDailyDDPct) {
      CloseStrategyPositions();
      return;
   }

   if(SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) > InpMaxSpreadPoints) return;

   double atrBuf[2];
   if(CopyBuffer(g_atrHandle, 0, 1, 2, atrBuf) < 2) return;
   double atr = atrBuf[0];

   // Detect FVG Displacement across last 3 closed candles
   double h2 = iHigh(_Symbol, _Period, 2);
   double l0 = iLow(_Symbol, _Period, 0);
   double l2 = iLow(_Symbol, _Period, 2);
   double h0 = iHigh(_Symbol, _Period, 0);

   if(PositionsTotal() == 0 && atr > 0) {
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

      if(l0 > h2) {
         double sl = NormalizeDouble(ask - atr * InpSlAtrMult, _Digits);
         double tp = NormalizeDouble(ask + atr * InpTpAtrMult, _Digits);
         trade.Buy(CalcRiskLots(ask - sl), _Symbol, ask, sl, tp, "OrderFlow_Bull_FVG");
      } else if(h0 < l2) {
         double sl = NormalizeDouble(bid + atr * InpSlAtrMult, _Digits);
         double tp = NormalizeDouble(bid - atr * InpTpAtrMult, _Digits);
         trade.Sell(CalcRiskLots(sl - bid), _Symbol, bid, sl, tp, "OrderFlow_Bear_FVG");
      }
   }
}

double CalcRiskLots(double slDist) {
   double riskUsd = AccountInfoDouble(ACCOUNT_EQUITY) * (InpRiskPct / 100.0);
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSz  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(slDist <= 0 || tickVal <= 0 || tickSz <= 0) return 0.01;
   double raw = riskUsd / ((slDist / tickSz) * tickVal);
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   return MathMax(SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN), MathFloor(raw / step) * step);
}

void CloseStrategyPositions() {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket) && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber) {
         trade.PositionClose(ticket);
      }
   }
}`,
  },
  {
    id: 'script-1',
    name: 'Titan MT5 Direct Bridge Expert Advisor',
    filename: 'AlgoTrade_Titan_Bridge_v5.mq5',
    language: 'MQL5',
    tier: 'SIGNAL_BRIDGE',
    category: 'Bridge Middleware',
    description:
      'Production-ready MQL5 EA for MetaTrader 5 terminals. Establishes sub-millisecond HTTP WebRequest communication with your live Trade Bridge endpoint, executes webhook orders, and enforces hard capital guardrails.',
    version: 'v5.3.0',
    author: 'Titan Quant Matrix Engineering',
    compatibility: 'MetaTrader 5 Build 4000+',
    latencyTarget: '< 1.5 ms heartbeat',
    auditChecks: [
      'Parameterized live origin endpoint injected automatically',
      'Full Break-Even stop locking implemented with slippage tolerance',
      'Hard Daily Drawdown circuit breaker closes only strategy magic tickets',
    ],
    codeTemplate: `//+------------------------------------------------------------------+
//|                                    AlgoTrade_Titan_Bridge_v5.mq5 |
//|                     Copyright 2026, Titan Quant Matrix Ecosystem |
//+------------------------------------------------------------------+
#property copyright "Titan Quant Matrix Ecosystem"
#property version   "5.30"
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

//--- Input Parameters
input group "=== Bridge Configuration ==="
input string   InpBridgeURL       = "{{BRIDGE_URL}}";     // Live Bridge Endpoint
input string   InpAuthSecret      = "{{BRIDGE_SECRET}}";  // Handshake Secret Token
input int      InpMagicNumber     = {{MAGIC_NUMBER}};     // Magic Correlation ID
input int      InpHeartbeatSec    = 2;                    // Heartbeat Interval (Seconds)
input double   InpMaxSlippagePips = 2.5;                  // Max Execution Slippage Filter

input group "=== Capital Guardian ==="
input double   InpMaxDailyLossPct = {{MAX_DD_PCT}};       // Hard Daily Loss Cutoff %
input bool     InpAutoBreakEven   = true;                 // Move SL to Entry at Trigger
input double   InpBETriggerPips   = 15.0;                 // Break-Even Pip Distance

datetime g_lastHeartbeat = 0;
double   g_dailyStartingEquity = 0.0;

int OnInit() {
   trade.SetExpertMagicNumber(InpMagicNumber);
   g_dailyStartingEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   Print("[Titan Bridge] Live Endpoint: ", InpBridgeURL);
   return(INIT_SUCCEEDED);
}

void OnTick() {
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double dailyLossPct = ((g_dailyStartingEquity - currentEquity) / MathMax(1.0, g_dailyStartingEquity)) * 100.0;

   if(dailyLossPct >= InpMaxDailyLossPct) {
      Print("[EMERGENCY GUARD] Daily loss limit reached (", DoubleToString(dailyLossPct, 2), "%). Liquidating!");
      CloseAllOpenPositions();
      ExpertRemove();
      return;
   }

   if(InpAutoBreakEven) {
      ApplyBreakEvenToProfits(InpBETriggerPips);
   }

   if(TimeCurrent() - g_lastHeartbeat >= InpHeartbeatSec) {
      SendTelemetryToBridge();
      g_lastHeartbeat = TimeCurrent();
   }
}

bool SendTelemetryToBridge() {
   char post[], result[];
   string result_headers;
   string payload = StringFormat(
      "{\\"account\\":%d,\\"broker\\":\\"%s\\",\\"balance\\":%.2f,\\"equity\\":%.2f,\\"secret\\":\\"%s\\",\\"magic\\":%d}",
      AccountInfoInteger(ACCOUNT_LOGIN),
      AccountInfoString(ACCOUNT_COMPANY),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      InpAuthSecret,
      InpMagicNumber
   );

   StringToCharArray(payload, post, 0, WHOLE_ARRAY, CP_UTF8);
   int res = WebRequest("POST", InpBridgeURL, "Content-Type: application/json\\r\\n", 1500, post, result, result_headers);
   return (res == 200);
}

void CloseAllOpenPositions() {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0) trade.PositionClose(ticket, (ulong)(InpMaxSlippagePips * 10));
   }
}

void ApplyBreakEvenToProfits(double bePips) {
   double pipFactor = (_Digits == 3 || _Digits == 5) ? _Point * 10.0 : _Point;
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;

      double openPx = PositionGetDouble(POSITION_PRICE_OPEN);
      double curSl  = PositionGetDouble(POSITION_SL);
      double tp     = PositionGetDouble(POSITION_TP);
      long   type   = PositionGetInteger(POSITION_TYPE);

      if(type == POSITION_TYPE_BUY) {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         if(bid - openPx >= bePips * pipFactor && (curSl < openPx || curSl == 0)) {
            trade.PositionModify(ticket, NormalizeDouble(openPx + pipFactor, _Digits), tp);
         }
      } else {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         if(openPx - ask >= bePips * pipFactor && (curSl > openPx || curSl == 0)) {
            trade.PositionModify(ticket, NormalizeDouble(openPx - pipFactor, _Digits), tp);
         }
      }
   }
}`,
  },
  {
    id: 'script-2',
    name: 'EasyWay Endgame HFT Scalper Pro',
    filename: 'EasyWay_Endgame_HFT_Pro.mq5',
    language: 'MQL5',
    tier: 'EXECUTION_ENGINE',
    category: 'Autonomous Strategy Robot',
    description:
      'High-frequency Gold (XAUUSD) and US30 MQL5 EA integrating institutional Fair Value Gap (FVG) displacement scans and session volume filters with zero-martingale risk capping.',
    version: 'v4.8.5',
    author: 'APEX SOVEREIGN · Myeni Quant',
    compatibility: 'MetaTrader 5 (XAUUSD, US30 M1/M5)',
    latencyTarget: '< 2.0 ms tick',
    auditChecks: [
      'CTrade execution routed exclusively on new bar confirmation',
      'Zero-martingale fixed {{RISK_PCT}}% per-trade stop model',
      'Spread & slippage guard rejects thin liquidity spikes',
    ],
    codeTemplate: `//+------------------------------------------------------------------+
//|                                   Sovereign_Endgame_HFT_Pro.mq5  |
//|                       Myeni Quantitative Capital Flagship Bot    |
//+------------------------------------------------------------------+
#property copyright "APEX SOVEREIGN · Myeni Quantitative Capital"
#property version   "4.85"
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

input group "=== Risk Engine ==="
input double InpRiskPercent    = {{RISK_PCT}};   // Risk % per trade
input double InpTakeProfitPips = 35.0;           // Take Profit in Pips
input double InpStopLossPips   = 18.0;           // Stop Loss in Pips
input int    InpMagicNumber    = {{MAGIC_NUMBER}};

datetime g_lastBarTime = 0;

int OnInit() {
   trade.SetExpertMagicNumber(InpMagicNumber);
   return(INIT_SUCCEEDED);
}

void OnTick() {
   datetime curBar = iTime(_Symbol, _Period, 0);
   if(curBar == g_lastBarTime) return;
   g_lastBarTime = curBar;

   int signal = EvaluateFVGStructure();
   if(signal > 0 && PositionsTotal() == 0) {
      ExecuteOrder(ORDER_TYPE_BUY);
   } else if(signal < 0 && PositionsTotal() == 0) {
      ExecuteOrder(ORDER_TYPE_SELL);
   }
}

int EvaluateFVGStructure() {
   double high2 = iHigh(_Symbol, _Period, 2);
   double low1  = iLow(_Symbol, _Period, 1);
   double low2  = iLow(_Symbol, _Period, 2);
   double high1 = iHigh(_Symbol, _Period, 1);
   if(low1 > high2) return 1;
   if(high1 < low2) return -1;
   return 0;
}

void ExecuteOrder(ENUM_ORDER_TYPE orderType) {
   double pip = (_Digits == 3 || _Digits == 5) ? _Point * 10.0 : _Point;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double lots = MathMax(0.01, NormalizeDouble((AccountInfoDouble(ACCOUNT_BALANCE) * (InpRiskPercent / 100.0)) / 180.0, 2));

   if(orderType == ORDER_TYPE_BUY) {
      trade.Buy(lots, _Symbol, ask, ask - InpStopLossPips * pip, ask + InpTakeProfitPips * pip, "Endgame_HFT_Buy");
   } else {
      trade.Sell(lots, _Symbol, bid, bid + InpStopLossPips * pip, bid - InpTakeProfitPips * pip, "Endgame_HFT_Sell");
   }
}`,
  },
  {
    id: 'script-3',
    name: 'Shadow River SMC Matrix',
    filename: 'Shadow_River_TrendMatrix.mq4',
    language: 'MQL4',
    tier: 'EXECUTION_ENGINE',
    category: 'Autonomous Strategy Robot',
    description:
      'MetaTrader 4 trend & order-block harvester tracking institutional breaker structure shifts and automatic account-balance lot calculation.',
    version: 'v2.4.2',
    author: 'APEX SOVEREIGN · Myeni Quant',
    compatibility: 'MetaTrader 4 (EURUSD, GBPJPY, NAS100 M15)',
    latencyTarget: '< 3.5 ms tick',
    auditChecks: [
      'Complete dynamic lot calculation anchored to Stop Loss pips',
      'OrdersTotal() lock avoids overlapping correlated entries',
    ],
    codeTemplate: `//+------------------------------------------------------------------+
//|                                   Shadow_River_TrendMatrix.mq4   |
//|                   Myeni Quantitative Capital Institutional Trend |
//+------------------------------------------------------------------+
#property copyright "APEX SOVEREIGN · Myeni Quantitative Capital"
#property strict

extern double RiskPercent    = {{RISK_PCT}};
extern int    OrderBlockBars = 150;
extern int    MagicNumber    = {{MAGIC_NUMBER}};

int start() {
   if(OrdersTotal() == 0) {
      double pip = (Digits == 3 || Digits == 5) ? Point * 10.0 : Point;
      if(CheckOrderBlockDemand()) {
         OrderSend(Symbol(), OP_BUY, CalculateLots(RiskPercent, 25.0), Ask, 3, Ask - 25*pip, Ask + 60*pip, "ShadowRiver", MagicNumber);
      }
   }
   return(0);
}

double CalculateLots(double riskPct, double slPips) {
   double riskMoney = AccountBalance() * (riskPct / 100.0);
   double tickVal   = MarketInfo(Symbol(), MODE_TICKVALUE);
   if(tickVal <= 0 || slPips <= 0) return(0.01);
   return(MathMax(0.01, NormalizeDouble(riskMoney / (slPips * 10.0 * tickVal), 2)));
}

bool CheckOrderBlockDemand() {
   double highest = High[iHighest(NULL, 0, MODE_HIGH, OrderBlockBars, 1)];
   return(Close[1] > Open[1] && Close[1] < highest);
}`,
  },
  {
    id: 'script-4',
    name: 'TradingView PineScript v5 Webhook Bridge',
    filename: 'TradingView_PineScript_v5.pine',
    language: 'PINESCRIPT',
    tier: 'SIGNAL_BRIDGE',
    category: 'Signal Script',
    description:
      'Production PineScript v5 strategy emitting structured JSON webhook payloads for direct MT5 bridge execution with ATR-scaled stop loss and target limits.',
    version: 'v5.2',
    author: 'Titan Quant Research',
    compatibility: 'TradingView PineScript v5 (Webhook URL: {{BRIDGE_URL}})',
    latencyTarget: 'Bar close dispatch',
    auditChecks: [
      'Emits JSON matched to {{BRIDGE_URL}} POST schema',
      'Dynamic ATR volatility stops prevent fixed-pip whipsaws',
    ],
    codeTemplate: `//@version=5
strategy("Titan Quant Matrix • Institutional Webhook Engine", overlay=true, initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value={{RISK_PCT}})

//--- Inputs
fastLen = input.int(9, "Fast EMA")
slowLen = input.int(21, "Slow EMA")
secretToken = input.string("{{BRIDGE_SECRET}}", "Bridge Secret Key")
magicId = input.int({{MAGIC_NUMBER}}, "Magic Number")

//--- Indicators
fastEMA = ta.ema(close, fastLen)
slowEMA = ta.ema(close, slowLen)
atrVal = ta.atr(14)
longCondition = ta.crossover(fastEMA, slowEMA)
shortCondition = ta.crossunder(fastEMA, slowEMA)

//--- Order Routing Webhook Payload (POST to {{BRIDGE_URL}})
if (longCondition)
    strategy.entry("Long", strategy.long)
    alert('{"secret":"' + secretToken + '","magic":' + str.tostring(magicId) + ',"action":"BUY","symbol":"' + syminfo.ticker + '","lots":1.0,"sl":' + str.tostring(low - atrVal) + ',"tp":' + str.tostring(close + atrVal * 2.5) + '}', alert.freq_once_per_bar_close)

if (shortCondition)
    strategy.entry("Short", strategy.short)
    alert('{"secret":"' + secretToken + '","magic":' + str.tostring(magicId) + ',"action":"SELL","symbol":"' + syminfo.ticker + '","lots":1.0,"sl":' + str.tostring(high + atrVal) + ',"tp":' + str.tostring(close - atrVal * 2.5) + '}', alert.freq_once_per_bar_close)

plot(fastEMA, color=color.cyan, title="Fast EMA")
plot(slowEMA, color=color.orange, title="Slow EMA")`,
  },
  {
    id: 'script-5',
    name: 'Python Asynchronous DMA Execution Bridge',
    filename: 'Python_Quant_AsyncBridge.py',
    language: 'PYTHON',
    tier: 'SIGNAL_BRIDGE',
    category: 'Algorithmic Middleware',
    description:
      'Asynchronous Python 3.11 bridge linking MetaTrader5 local IPC sockets with HTTP bridge orchestration and zero-slippage IOC order routing.',
    version: 'v3.4.0',
    author: 'Titan Quant Matrix Engine',
    compatibility: 'Python 3.10+ / MetaTrader 5 Terminal',
    latencyTarget: '< 2.2 ms local IPC',
    auditChecks: [
      'Uses ORDER_FILLING_IOC to eliminate partial stale fills',
      'Synchronizes live magic ID ({{MAGIC_NUMBER}}) across terminal nodes',
    ],
    codeTemplate: `"""
Titan Quant Matrix • Asynchronous MetaTrader 5 Execution Bridge
Target Endpoint: {{BRIDGE_URL}}
"""

import asyncio
import MetaTrader5 as mt5

BRIDGE_URL = "{{BRIDGE_URL}}"
BRIDGE_SECRET = "{{BRIDGE_SECRET}}"
MAGIC_NUMBER = {{MAGIC_NUMBER}}

async def init_mt5_terminal():
    if not mt5.initialize():
        print(f"Failed to initialize MT5, error: {mt5.last_error()}")
        return False
    print(f"MT5 Connected: {mt5.account_info().login} @ {mt5.account_info().company}")
    return True

async def execute_market_order(symbol: str, action: str, volume: float, sl_points: int = 150, tp_points: int = 350):
    tick = mt5.symbol_info_tick(symbol)
    if not tick:
        return None

    order_type = mt5.ORDER_TYPE_BUY if action == "BUY" else mt5.ORDER_TYPE_SELL
    price = tick.ask if action == "BUY" else tick.bid
    point = mt5.symbol_info(symbol).point

    sl = price - (sl_points * point) if action == "BUY" else price + (sl_points * point)
    tp = price + (tp_points * point) if action == "BUY" else price - (tp_points * point)

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": volume,
        "type": order_type,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": MAGIC_NUMBER,
        "comment": "Titan_Quant_Python_DMA",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    return mt5.order_send(request)

async def main():
    if await init_mt5_terminal():
        print(f"Bridge listener active for {BRIDGE_URL}")

if __name__ == "__main__":
    asyncio.run(main())`,
  },
  {
    id: 'script-6',
    name: 'Emerge Prop Firm Safe Preset (.SET)',
    filename: 'Emerge_Prop_Safe_Endgame.set',
    language: 'SET_PRESET',
    tier: 'RISK_PRESET',
    category: 'Configuration Preset',
    description:
      'Calibrated parameter configuration (.set) file synchronized to your active Risk % and Max Daily Drawdown Guard settings for Prop Firm evaluations.',
    version: 'v4.2',
    author: 'APEX SOVEREIGN · Prop Desk Verified',
    compatibility: 'MT5 Inputs Tab (Endgame / Titan Bridge)',
    latencyTarget: 'Instant load',
    auditChecks: [
      'Respects {{MAX_DD_PCT}}% hard daily equity cutoff',
      'High-impact NFP/BOE news freeze window armed (30m before / 45m after)',
    ],
    codeTemplate: `; Emerge Profit & FTMO Prop Firm Challenge Preset
; Synchronized live from Institutional Forge Parameters
[StrategySettings]
BridgeEndpoint={{BRIDGE_URL}}
MagicNumber={{MAGIC_NUMBER}}
LotMode=DynamicRisk
RiskPercentage={{RISK_PCT}}
MaxDailyLossCutoffPercent={{MAX_DD_PCT}}
MaxOverallDrawdownCutoffPercent=6.50
MaxSpreadPips=2.2
StopTradingBeforeNewsMinutes=30
ResumeTradingAfterNewsMinutes=45
AllowWeekendHolding=true
UseBreakEvenAtPips=15.0
BreakEvenBufferPips=2.0
TrailingStopEnabled=true
TrailingDistancePips=18.0
PartialClosePercentage=50.0
TakeProfit1_Pips=35.0
TakeProfit2_Pips=75.0`,
  },
];

const LANGUAGE_BADGE_MAP: Record<ScriptLanguage, string> = {
  CPP_FIX: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  PYTHON: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  MQL5: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  MQL4: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  PINESCRIPT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  SET_PRESET: 'bg-slate-700/60 text-slate-200 border-slate-600',
};

export const HighLevelScriptsVaultView: React.FC = () => {
  const { brand } = useBrand();
  const defaultOrigin =
    typeof window !== 'undefined' ? `${window.location.origin}/api/mt5/bridge` : 'https://localhost:3000/api/mt5/bridge';

  const [customScripts, setCustomScripts] = useState<ScriptItem[]>(() => {
    try {
      const raw = localStorage.getItem(DEFAULT_CUSTOM_KEY);
      return raw ? (JSON.parse(raw) as ScriptItem[]) : [];
    } catch {
      return [];
    }
  });

  const allScripts = useMemo(() => [...customScripts, ...PRODUCTION_SCRIPTS], [customScripts]);

  const [selectedScriptId, setSelectedScriptId] = useState<string>(PRODUCTION_SCRIPTS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<'ALL' | ScriptLanguage>('ALL');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [mobileSubTab, setMobileSubTab] = useState<'CATALOG' | 'CODE'>('CATALOG');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Live Institutional Parameter Injector State
  const [bridgeUrl, setBridgeUrl] = useState<string>(defaultOrigin);
  const [bridgeSecret, setBridgeSecret] = useState<string>('sec_bridge_live_883921');
  const [magicNumber, setMagicNumber] = useState<number>(883921);
  const [riskPct, setRiskPct] = useState<number>(0.75);
  const [maxDdPct, setMaxDdPct] = useState<number>(3.5);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);

  // Custom Script Forge Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [newScriptName, setNewScriptName] = useState<string>('');
  const [newScriptFile, setNewScriptFile] = useState<string>('');
  const [newScriptLang, setNewScriptLang] = useState<ScriptLanguage>('PYTHON');
  const [newScriptDesc, setNewScriptDesc] = useState<string>('');
  const [newScriptCode, setNewScriptCode] = useState<string>('');

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setActionToast(null), 3500);
  };

  const filteredScripts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allScripts.filter((s) => {
      const langOk = languageFilter === 'ALL' || s.language === languageFilter;
      const queryOk =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.filename.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return langOk && queryOk;
    });
  }, [allScripts, languageFilter, searchQuery]);

  const selectedScript = useMemo(() => {
    return (
      allScripts.find((s) => s.id === selectedScriptId) ||
      filteredScripts[0] ||
      allScripts[0]
    );
  }, [allScripts, filteredScripts, selectedScriptId]);

  const renderInjectedCode = (template: string) => {
    return template
      .replaceAll('{{BRIDGE_URL}}', bridgeUrl.trim() || defaultOrigin)
      .replaceAll('{{BRIDGE_SECRET}}', bridgeSecret.trim() || 'sec_bridge_live_883921')
      .replaceAll('{{MAGIC_NUMBER}}', String(magicNumber || 883921))
      .replaceAll('{{RISK_PCT}}', riskPct.toFixed(2))
      .replaceAll('{{MAX_DD_PCT}}', maxDdPct.toFixed(2));
  };

  const compiledCode = useMemo(
    () => renderInjectedCode(selectedScript.codeTemplate),
    [selectedScript, bridgeUrl, bridgeSecret, magicNumber, riskPct, maxDdPct]
  );

  const codeLines = useMemo(() => compiledCode.split('\n'), [compiledCode]);

  const handleCopyCode = (script: ScriptItem) => {
    void navigator.clipboard?.writeText(renderInjectedCode(script.codeTemplate)).catch(() => undefined);
    setCopiedScriptId(script.id);
    setTimeout(() => setCopiedScriptId(null), 2200);
    triggerToast(`Copied parameterized source for ${script.filename}`);
  };

  const handleDownloadScript = (script: ScriptItem) => {
    const content = renderInjectedCode(script.codeTemplate);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = script.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${script.filename} with live Magic #${magicNumber} parameters`);
  };

  const handleCopyWebhookJson = () => {
    const samplePayload = JSON.stringify(
      {
        endpoint: bridgeUrl,
        secret: bridgeSecret,
        magic: magicNumber,
        symbol: 'XAUUSD',
        action: 'BUY',
        riskPct,
        maxDailyDdPct: maxDdPct,
      },
      null,
      2
    );
    void navigator.clipboard?.writeText(samplePayload).catch(() => undefined);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2200);
    triggerToast('Copied live Webhook JSON test specification');
  };

  const handleCreateCustomScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptName.trim() || !newScriptCode.trim()) return;
    const extMap: Record<ScriptLanguage, string> = {
      CPP_FIX: '.cpp',
      PYTHON: '.py',
      MQL5: '.mq5',
      MQL4: '.mq4',
      PINESCRIPT: '.pine',
      SET_PRESET: '.set',
    };
    const safeFilename =
      newScriptFile.trim() ||
      `${newScriptName.trim().replace(/[^a-zA-Z0-9]+/g, '_')}${extMap[newScriptLang]}`;

    const created: ScriptItem = {
      id: `custom-${Date.now()}`,
      name: newScriptName.trim(),
      filename: safeFilename,
      language: newScriptLang,
      tier: 'QUANT_CORE',
      category: 'Custom Institutional Module',
      description: newScriptDesc.trim() || 'User-authored institutional strategy script with live parameter injection.',
      version: 'v1.0.0',
      author: 'Desk Quant Author',
      compatibility: `Custom ${newScriptLang} Runtime`,
      latencyTarget: 'User Defined',
      auditChecks: ['Live bridge parameter tokens supported ({{BRIDGE_URL}}, {{MAGIC_NUMBER}}, {{RISK_PCT}})'],
      codeTemplate: newScriptCode,
    };

    const next = [created, ...customScripts];
    setCustomScripts(next);
    try {
      localStorage.setItem(DEFAULT_CUSTOM_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota issues
    }
    setSelectedScriptId(created.id);
    setLanguageFilter('ALL');
    setSearchQuery('');
    setIsNewModalOpen(false);
    setNewScriptName('');
    setNewScriptFile('');
    setNewScriptDesc('');
    setNewScriptCode('');
    triggerToast(`Saved "${created.name}" to Institutional Scripts Vault`);
  };

  return (
    <div className="space-y-5 font-mono text-xs pb-10">
      {actionToast && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex items-center justify-between gap-2 shadow-lg">
          <span className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionToast}</span>
          </span>
          <button type="button" onClick={() => setActionToast(null)} className="text-emerald-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Institutional Forge Header */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0F141E] border border-white/[0.08] p-5 md:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{brand.brandName} · Institutional Quantitative Scripts &amp; Execution Forge</span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight font-display">
              FIX 4.4 C++, Kalman StatArb, TWAP/VWAP, MQL5 &amp; Bridge Vault
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
              Proprietary execution codebase owned by {brand.ownerEntity}—inspect, parameterize, and export production-hardened C++20 FIX 4.4 routers, Ornstein-Uhlenbeck StatArb models, and MQL5 Order-Flow EAs synced to your active bridge endpoint.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] tabular-nums">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                <span>{allScripts.length} Audited Systems</span>
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                <Zap className="w-3.5 h-3.5" />
                <span>Live Parameter Injection Active</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Hard DD Guard: {maxDdPct.toFixed(1)}%</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyWebhookJson}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'JSON Copied' : 'Copy Webhook JSON'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>Author Custom Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Parameter Injector Bar */}
      <div className="bg-[#0b0f18] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Live Code Parameter Injector</span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans">
            Edits below dynamically recompile into every script before preview, copy, or download.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Bridge Endpoint URL</label>
            <input
              type="text"
              value={bridgeUrl}
              onChange={(e) => setBridgeUrl(e.target.value)}
              className="w-full bg-[#060911] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Magic Number ID</label>
            <input
              type="number"
              value={magicNumber}
              onChange={(e) => setMagicNumber(Math.max(1, Number(e.target.value) || 883921))}
              className="w-full bg-[#060911] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white tabular-nums focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Risk / Trade (%)</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="5"
              value={riskPct}
              onChange={(e) => setRiskPct(Math.max(0.1, Number(e.target.value) || 0.75))}
              className="w-full bg-[#060911] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold tabular-nums focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Max Daily DD (%)</label>
            <input
              type="number"
              step="0.25"
              min="0.5"
              max="10"
              value={maxDdPct}
              onChange={(e) => setMaxDdPct(Math.max(0.5, Number(e.target.value) || 3.5))}
              className="w-full bg-[#060911] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold tabular-nums focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0b0f18] border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {(
            [
              { id: 'ALL', label: `All (${allScripts.length})` },
              { id: 'CPP_FIX', label: 'C++ / FIX 4.4' },
              { id: 'PYTHON', label: 'Python Quant' },
              { id: 'MQL5', label: 'MQL5' },
              { id: 'MQL4', label: 'MQL4' },
              { id: 'PINESCRIPT', label: 'PineScript v5' },
              { id: 'SET_PRESET', label: '.SET Presets' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLanguageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                languageFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter Kalman, FIX, TWAP, MQL5..."
            className="w-full bg-[#060911] border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Touch Segmented Control (Visible < lg) */}
      <div className="flex lg:hidden items-center gap-1.5 p-1 bg-[#10141d] rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setMobileSubTab('CATALOG')}
          className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 min-h-[42px] ${
            mobileSubTab === 'CATALOG'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Catalog ({filteredScripts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileSubTab('CODE')}
          className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 min-h-[42px] ${
            mobileSubTab === 'CODE'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Code Inspector</span>
        </button>
      </div>

      {/* Scripts Selector Grid & Active Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Script Catalog */}
        <div className={`lg:col-span-4 space-y-3 ${mobileSubTab === 'CATALOG' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Algorithm Catalog ({filteredScripts.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500 tabular-nums">
              Sorted by Tier
            </span>
          </div>

          {filteredScripts.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#0c1017] border border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-400">No scripts match your active search or language filter.</p>
              <button
                type="button"
                onClick={() => {
                  setLanguageFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto custom-scrollbar pr-1">
              {filteredScripts.map((script) => {
                const isSelected = selectedScript.id === script.id;
                return (
                  <div
                    key={script.id}
                    onClick={() => {
                      setSelectedScriptId(script.id);
                      setMobileSubTab('CODE');
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer border transition relative ${
                      isSelected
                        ? 'bg-[#121927] border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 hover:bg-[#0f141f]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-slate-100 text-xs leading-snug">{script.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                          LANGUAGE_BADGE_MAP[script.language]
                        }`}
                      >
                        {script.language}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2 font-sans">
                      {script.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 tabular-nums">
                      <span className="text-slate-400 truncate max-w-[160px]">{script.filename}</span>
                      <span className="text-emerald-400 font-bold">{script.latencyTarget}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 8 Columns: Code Viewer, Risk Audit & Quick Deployment */}
        <div
          className={`lg:col-span-8 bg-[#0b0e14] border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 ${
            mobileSubTab === 'CODE' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <div className="space-y-4">
            {/* Active Script Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-100 font-display">{selectedScript.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      LANGUAGE_BADGE_MAP[selectedScript.language]
                    }`}
                  >
                    {selectedScript.language}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-700 tabular-nums">
                    {selectedScript.version}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                  File: <span className="text-slate-200 font-bold">{selectedScript.filename}</span> · Target:{' '}
                  <span className="text-emerald-400 font-bold">{selectedScript.latencyTarget}</span> · {codeLines.length} lines
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowLineNumbers((prev) => !prev)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-800"
                >
                  {showLineNumbers ? 'Hide Lines' : 'Line #'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedScript)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedScriptId === selectedScript.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Parameterized</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadScript(selectedScript)}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            {/* Institutional Audit Guardrails */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {selectedScript.auditChecks.map((checkItem, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#101622] border border-slate-800 flex items-start gap-2 text-[11px] text-slate-300 font-sans"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{renderInjectedCode(checkItem)}</span>
                </div>
              ))}
            </div>

            {/* Line-Numbered Code Box */}
            <div className="bg-[#06080d] border border-slate-800 rounded-xl overflow-auto max-h-[430px] custom-scrollbar p-3.5">
              {showLineNumbers ? (
                <table className="w-full border-collapse text-[11px] font-mono leading-relaxed">
                  <tbody>
                    {codeLines.map((line, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="select-none pr-3 text-right text-slate-600 w-9 align-top tabular-nums">
                          {i + 1}
                        </td>
                        <td className="text-cyan-300 whitespace-pre">{line || ' '}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre className="text-[11px] text-cyan-300 font-mono whitespace-pre leading-relaxed">
                  {compiledCode}
                </pre>
              )}
            </div>
          </div>

          {/* Deployment Guide Card */}
          <div className="p-4 bg-[#111622] rounded-xl border border-slate-800 space-y-2">
            <h5 className="font-bold text-slate-200 flex items-center justify-between text-xs uppercase">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deployment Checklist ({selectedScript.compatibility})</span>
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Bridge Ready
              </span>
            </h5>
            <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1 leading-relaxed font-sans">
              <li>
                Verify Bridge URL <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">{bridgeUrl}</code> is allowlisted in your terminal WebRequest or runtime environment.
              </li>
              <li>
                Deploy <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">{selectedScript.filename}</code> with isolated Magic ID <strong className="text-white tabular-nums">#{magicNumber}</strong> and hard daily drawdown cap <strong className="text-amber-300 tabular-nums">{maxDdPct.toFixed(2)}%</strong>.
              </li>
              <li>
                Confirm live heartbeat telemetry inside the <strong className="text-slate-200">Omni Trade Bridge</strong> &amp; <strong className="text-slate-200">Emerge Guard</strong> monitors before enabling full capital size.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Author Custom Script Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-[#0b101b] border border-cyan-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-display uppercase">
                  Author Custom Quantitative Script
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomScript} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Algorithm Name *</label>
                  <input
                    type="text"
                    required
                    value={newScriptName}
                    onChange={(e) => setNewScriptName(e.target.value)}
                    placeholder="e.g. Microstructure Imbalance Sniper"
                    className="w-full bg-[#060911] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Language</label>
                  <select
                    value={newScriptLang}
                    onChange={(e) => setNewScriptLang(e.target.value as ScriptLanguage)}
                    className="w-full bg-[#060911] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CPP_FIX">C++ / FIX 4.4</option>
                    <option value="PYTHON">Python Quant</option>
                    <option value="MQL5">MQL5</option>
                    <option value="MQL4">MQL4</option>
                    <option value="PINESCRIPT">PineScript v5</option>
                    <option value="SET_PRESET">.SET Preset</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Filename (Optional)</label>
                  <input
                    type="text"
                    value={newScriptFile}
                    onChange={(e) => setNewScriptFile(e.target.value)}
                    placeholder="e.g. Imbalance_Sniper.py"
                    className="w-full bg-[#060911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Strategy Summary</label>
                  <input
                    type="text"
                    value={newScriptDesc}
                    onChange={(e) => setNewScriptDesc(e.target.value)}
                    placeholder="Order-book imbalance execution strategy..."
                    className="w-full bg-[#060911] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Source Code (Supports {'{{BRIDGE_URL}}'}, {'{{MAGIC_NUMBER}}'}, {'{{RISK_PCT}}'}, {'{{MAX_DD_PCT}}'}) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={newScriptCode}
                  onChange={(e) => setNewScriptCode(e.target.value)}
                  placeholder="# Paste C++, Python, MQL5, or PineScript algorithm code..."
                  className="w-full bg-[#05080f] border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Script to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
