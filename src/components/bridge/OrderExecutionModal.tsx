import React, { useState, useEffect, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';
import { OrderType, OrderSide } from '../../types/trading';
import {
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Shield,
  Target,
  Layers,
  ChevronDown,
  CheckCircle2,
  Sliders,
  DollarSign,
  Percent,
} from 'lucide-react';

interface OrderExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
  initialSide?: OrderSide;
}

export const OrderExecutionModal: React.FC<OrderExecutionModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'XAUUSD',
  initialSide = 'BUY',
}) => {
  const { prices, terminals, executeOrder, accountEquity, bridgeLatencyMs } = useTrading();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [side, setSide] = useState<OrderSide>(initialSide);
  const [sizingMode, setSizingMode] = useState<'LOTS' | 'RISK_PCT' | 'CASH_RISK'>('LOTS');
  const [lots, setLots] = useState<number>(1.0);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [cashRisk, setCashRisk] = useState<number>(1000);
  
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPips, setSlPips] = useState<string>('30');
  const [tpPips, setTpPips] = useState<string>('60');
  const [usePipsForSLTP, setUsePipsForSLTP] = useState<boolean>(true);

  const [selectedTerminal, setSelectedTerminal] = useState<string>('');
  const [maxSlippage, setMaxSlippage] = useState<number>(2.0);
  const [comment, setComment] = useState<string>('Bridge_Manual_Order');
  
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string; ticket?: number } | null>(null);

  // Sync initial symbol & side when opened
  useEffect(() => {
    if (isOpen) {
      setSymbol(initialSymbol);
      setSide(initialSide);
      setExecutionResult(null);
      if (terminals.length > 0 && !selectedTerminal) {
        setSelectedTerminal(terminals[0].name);
      }
    }
  }, [isOpen, initialSymbol, initialSide, terminals]);

  const currentMkt = prices[symbol] || prices['XAUUSD'];
  const marketPrice = side === 'BUY' ? currentMkt.ask : currentMkt.bid;

  // Auto-calculate target price default when switching to LIMIT or STOP
  useEffect(() => {
    if (orderType === 'LIMIT') {
      const priceOffset = currentMkt.pipSize * 25;
      const target = side === 'BUY' ? currentMkt.bid - priceOffset : currentMkt.ask + priceOffset;
      setTargetPrice(target.toFixed(currentMkt.digits));
    } else if (orderType === 'STOP') {
      const priceOffset = currentMkt.pipSize * 25;
      const target = side === 'BUY' ? currentMkt.ask + priceOffset : currentMkt.bid - priceOffset;
      setTargetPrice(target.toFixed(currentMkt.digits));
    }
  }, [orderType, side, symbol, currentMkt]);

  // Recalculate SL and TP prices when using Pips
  useEffect(() => {
    if (usePipsForSLTP && currentMkt) {
      const refPrice = orderType === 'MARKET' ? marketPrice : parseFloat(targetPrice) || marketPrice;
      const pipsSL = parseFloat(slPips);
      const pipsTP = parseFloat(tpPips);

      if (!isNaN(pipsSL) && pipsSL > 0) {
        const offset = pipsSL * currentMkt.pipSize;
        const calculatedSL = side === 'BUY' ? refPrice - offset : refPrice + offset;
        setSlPrice(calculatedSL.toFixed(currentMkt.digits));
      } else {
        setSlPrice('');
      }

      if (!isNaN(pipsTP) && pipsTP > 0) {
        const offset = pipsTP * currentMkt.pipSize;
        const calculatedTP = side === 'BUY' ? refPrice + offset : refPrice - offset;
        setTpPrice(calculatedTP.toFixed(currentMkt.digits));
      } else {
        setTpPrice('');
      }
    }
  }, [usePipsForSLTP, slPips, tpPips, marketPrice, side, symbol, orderType, targetPrice, currentMkt]);

  // Auto-calculate lot size if Sizing Mode is RISK_PCT or CASH_RISK
  useEffect(() => {
    if (!currentMkt) return;
    const pipsDistance = parseFloat(slPips) || 20;

    let targetRiskUSD = 1000;
    if (sizingMode === 'RISK_PCT') {
      targetRiskUSD = accountEquity * (riskPct / 100);
    } else if (sizingMode === 'CASH_RISK') {
      targetRiskUSD = cashRisk;
    }

    if (sizingMode !== 'LOTS') {
      let lotResult = 1.0;
      if (symbol === 'XAUUSD') {
        // 1 pip = 0.1, 1 lot = $10 per pip
        lotResult = targetRiskUSD / (pipsDistance * 10);
      } else if (symbol === 'US30' || symbol === 'NAS100') {
        lotResult = targetRiskUSD / (pipsDistance * 10);
      } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
        lotResult = targetRiskUSD / (pipsDistance * 1);
      } else {
        // Standard Forex: 1 pip = $10 per lot
        lotResult = targetRiskUSD / (pipsDistance * 10);
      }
      setLots(Math.max(0.01, Number(lotResult.toFixed(2))));
    }
  }, [sizingMode, riskPct, cashRisk, slPips, symbol, accountEquity, currentMkt]);

  // Calculate potential Risk and Reward in USD
  const pipsSLNum = parseFloat(slPips) || 0;
  const pipsTPNum = parseFloat(tpPips) || 0;
  const potentialLossUSD = Number((pipsSLNum * 10 * lots).toFixed(2));
  const potentialGainUSD = Number((pipsTPNum * 10 * lots).toFixed(2));
  const rrRatio = pipsSLNum > 0 ? (pipsTPNum / pipsSLNum).toFixed(2) : '0';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setExecutionResult(null);

    // Audio click effect simulation
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(side === 'BUY' ? 880 : 660, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio context may be restricted before user gesture
    }

    // Dispatch immediately over live DMA bridge
    const result = await executeOrder({
      symbol,
      orderType,
      side,
      lots,
      targetPrice: orderType !== 'MARKET' ? parseFloat(targetPrice) : undefined,
      sl: slPrice ? parseFloat(slPrice) : null,
      tp: tpPrice ? parseFloat(tpPrice) : null,
      terminal: selectedTerminal,
      comment,
      maxSlippagePips: maxSlippage,
    });

    setIsExecuting(false);
    setExecutionResult(result);

    if (result.success) {
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 1100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b0e14] border-t md:border border-slate-700/80 rounded-t-3xl md:rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[92vh]">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 md:hidden" />
        {/* Header */}
        <div className="px-5 md:px-6 py-3.5 md:py-4 border-b border-slate-800 bg-[#10141d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Trading Bridge Order Execution</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tabular-nums">
                  {bridgeLatencyMs.toFixed(1)}ms LD4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct DMA execution to MetaTrader 4 / MT5 / cTrader / DXTrade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Order Type Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Execution Mode
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#141923] p-1.5 rounded-xl border border-slate-800">
              {(['MARKET', 'LIMIT', 'STOP'] as OrderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    orderType === type
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {type === 'MARKET' && <Zap className="w-3.5 h-3.5" />}
                  {type === 'LIMIT' && <Clock className="w-3.5 h-3.5" />}
                  {type === 'STOP' && <Shield className="w-3.5 h-3.5" />}
                  <span>{type} ORDER</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symbol & Live Quote Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Instrument
              </label>
              <div className="relative">
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full appearance-none bg-[#141923] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  {Object.keys(prices).map((sym) => (
                    <option key={sym} value={sym} className="bg-slate-900 text-slate-100">
                      {sym} - {prices[sym].name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Target Terminal */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Destination Terminal
              </label>
              <div className="relative">
                <select
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                  className="w-full appearance-none bg-[#141923] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  {terminals.map((term) => (
                    <option key={term.id} value={term.name} className="bg-slate-900 text-slate-100">
                      {term.name} ({term.platform} • {term.pingMs}ms)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Live Quote Stream Display */}
          <div className="bg-[#121620] border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between font-mono">
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>BID (SELL)</span>
              </div>
              <div className="text-lg font-bold text-rose-400">{currentMkt.bid}</div>
            </div>
            <div className="text-center px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <div className="text-slate-500 text-[9px] uppercase">Spread</div>
              <div className="text-cyan-400 font-bold">{currentMkt.spread} pips</div>
            </div>
            <div className="space-y-0.5 text-right">
              <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1.5">
                <span>ASK (BUY)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-lg font-bold text-emerald-400">{currentMkt.ask}</div>
            </div>
          </div>

          {/* Direction Selector (BUY vs SELL) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                side === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : 'bg-[#141923] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <div className="text-left font-mono">
                <div className="text-xs">BUY / LONG</div>
                <div className="text-[11px] font-normal opacity-80">{currentMkt.ask}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                side === 'SELL'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                  : 'bg-[#141923] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <div className="text-left font-mono">
                <div className="text-xs">SELL / SHORT</div>
                <div className="text-[11px] font-normal opacity-80">{currentMkt.bid}</div>
              </div>
            </button>
          </div>

          {/* Target Price for Limit / Stop */}
          {orderType !== 'MARKET' && (
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{orderType} Target Price Level</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Current: {marketPrice}</span>
              </div>
              <input
                type="number"
                step="any"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={`Target fill price (e.g. ${marketPrice})`}
                className="w-full bg-[#10141d] border border-cyan-700/60 rounded-lg px-3.5 py-2 text-sm text-cyan-200 font-mono focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          )}

          {/* Volume Sizing & Risk Management */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Position Sizing
              </label>
              <div className="flex items-center gap-1 bg-[#141923] p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setSizingMode('LOTS')}
                  className={`px-2 py-0.5 rounded transition ${sizingMode === 'LOTS' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  LOTS
                </button>
                <button
                  type="button"
                  onClick={() => setSizingMode('RISK_PCT')}
                  className={`px-2 py-0.5 rounded transition ${sizingMode === 'RISK_PCT' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  % RISK
                </button>
                <button
                  type="button"
                  onClick={() => setSizingMode('CASH_RISK')}
                  className={`px-2 py-0.5 rounded transition ${sizingMode === 'CASH_RISK' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  $ CASH
                </button>
              </div>
            </div>

            {sizingMode === 'LOTS' && (
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={lots}
                    onChange={(e) => setLots(parseFloat(e.target.value) || 0.01)}
                    className="flex-1 bg-[#141923] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {[0.1, 0.5, 1.0, 2.0, 5.0].map((quickLot) => (
                      <button
                        key={quickLot}
                        type="button"
                        onClick={() => setLots(quickLot)}
                        className={`px-2 py-2 rounded-lg border transition ${
                          lots === quickLot
                            ? 'bg-slate-700 border-cyan-500/60 text-cyan-300 font-bold'
                            : 'bg-[#141923] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {quickLot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sizingMode === 'RISK_PCT' && (
              <div className="p-3 bg-[#141923] border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Risk Percentage of Equity (${accountEquity.toLocaleString()})</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-300">{riskPct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setRiskPct(pct)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-medium border transition ${
                        riskPct === pct ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-850 text-slate-400 border-slate-800'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-1">
                  <span>Computed Volume:</span>
                  <span className="text-emerald-400 font-bold">{lots} Lots</span>
                </div>
              </div>
            )}

            {sizingMode === 'CASH_RISK' && (
              <div className="p-3 bg-[#141923] border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Max Allowed Dollar Risk</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-300">${cashRisk}</span>
                </div>
                <div className="flex items-center gap-2">
                  {[250, 500, 1000, 2500].map((cash) => (
                    <button
                      key={cash}
                      type="button"
                      onClick={() => setCashRisk(cash)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-medium border transition ${
                        cashRisk === cash ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' : 'bg-slate-850 text-slate-400 border-slate-800'
                      }`}
                    >
                      ${cash}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-1">
                  <span>Computed Volume:</span>
                  <span className="text-emerald-400 font-bold">{lots} Lots</span>
                </div>
              </div>
            )}
          </div>

          {/* SL & TP Settings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Risk Management (SL & TP)
              </label>
              <button
                type="button"
                onClick={() => setUsePipsForSLTP(!usePipsForSLTP)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>{usePipsForSLTP ? 'Switch to Exact Prices' : 'Switch to Pip Offsets'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Stop Loss */}
              <div className="p-3 bg-[#141923] border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Stop Loss</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {usePipsForSLTP ? `${slPips} pips` : ''}
                  </span>
                </div>
                {usePipsForSLTP ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1"
                      value={slPips}
                      onChange={(e) => setSlPips(e.target.value)}
                      placeholder="SL Pips"
                      className="w-full bg-[#10141d] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                    />
                    <span className="text-xs text-slate-500 font-mono">pips</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    placeholder="SL Price"
                    className="w-full bg-[#10141d] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                  />
                )}
                <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>Price: {slPrice || 'None'}</span>
                  <span className="text-rose-400">-${potentialLossUSD}</span>
                </div>
              </div>

              {/* Take Profit */}
              <div className="p-3 bg-[#141923] border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>Take Profit</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {usePipsForSLTP ? `${tpPips} pips` : ''}
                  </span>
                </div>
                {usePipsForSLTP ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1"
                      value={tpPips}
                      onChange={(e) => setTpPips(e.target.value)}
                      placeholder="TP Pips"
                      className="w-full bg-[#10141d] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-slate-500 font-mono">pips</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    placeholder="TP Price"
                    className="w-full bg-[#10141d] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                )}
                <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>Price: {tpPrice || 'None'}</span>
                  <span className="text-emerald-400">+${potentialGainUSD}</span>
                </div>
              </div>
            </div>

            {/* R:R Ratio Banner */}
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Risk-to-Reward Ratio:</span>
              <span className="font-bold text-cyan-300">1 : {rrRatio} R:R</span>
            </div>
          </div>

          {/* Advanced Bridge Params */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Max Slippage (Pips)</label>
              <input
                type="number"
                step="0.5"
                value={maxSlippage}
                onChange={(e) => setMaxSlippage(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#141923] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Execution Comment</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-[#141923] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Execution Feedback Message */}
          {executionResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-mono animate-in fade-in duration-150 ${
                executionResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{executionResult.message}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isExecuting}
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-sm uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60'
              } ${isExecuting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Routing Order via Bridge...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    Execute {orderType} {side} ({lots} Lots)
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
