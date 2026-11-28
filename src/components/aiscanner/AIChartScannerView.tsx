import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { OrderSide, OrderType } from '../../types/trading';
import { speechNotifier } from '../../services/speechNotificationService';
import { liveMarketData } from '../../services/liveMarketData';
import {
  ScanLine,
  Upload,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
  Volume2,
  Trash2,
  ClipboardPaste,
  Crosshair,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';

interface KeyLevelItem {
  label: string;
  price: number;
  type: string;
}

interface ChartScanAnalysis {
  symbol: string;
  timeframe: string;
  bias: 'BUY' | 'SELL' | 'WAIT';
  orderType: OrderType;
  confidence: number;
  pattern: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: string;
  recommendedLots: number;
  keyLevels: KeyLevelItem[];
  rationale: string;
  invalidationReason: string;
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

interface AIChartScannerViewProps {
  displayCurrency?: 'USD' | 'ZAR';
  onOpenInBridge?: (symbol: string) => void;
}

export const AIChartScannerView: React.FC<AIChartScannerViewProps> = ({
  displayCurrency = 'USD',
  onOpenInBridge,
}) => {
  const {
    prices,
    accountEquity,
    terminals,
    executeOrder,
    executeBatchOrders,
  } = useTrading();
  const { brand } = useBrand();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [imageName, setImageName] = useState<string>('');
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [traderNotes, setTraderNotes] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanMeta, setScanMeta] = useState<{ model: string; latencyMs: number } | null>(null);
  const [analysis, setAnalysis] = useState<ChartScanAnalysis | null>(null);

  // Interactive Trade Builder State (populated from Gemini output & user editable)
  const [draftSymbol, setDraftSymbol] = useState<string>('XAUUSD');
  const [draftSide, setDraftSide] = useState<OrderSide>('BUY');
  const [draftOrderType, setDraftOrderType] = useState<OrderType>('MARKET');
  const [draftLots, setDraftLots] = useState<number>(0.25);
  const [draftEntry, setDraftEntry] = useState<string>('');
  const [draftSl, setDraftSl] = useState<string>('');
  const [draftTp, setDraftTp] = useState<string>('');
  const [draftTerminal, setDraftTerminal] = useState<string>(terminals[0]?.name || 'EmergeFX DXtrade');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [execBanner, setExecBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  const availableSymbols = useMemo(() => Object.keys(prices), [prices]);

  // Match symbol to known live market ticker if Gemini outputs slight suffix/slash variation
  const resolveBridgeSymbol = (rawSym: string): string => {
    const clean = rawSym.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (prices[clean]) return clean;
    const partial = availableSymbols.find(
      (s) => clean.includes(s.replace(/[^A-Z0-9]/g, '')) || s.replace(/[^A-Z0-9]/g, '').includes(clean)
    );
    return partial || (availableSymbols.includes('XAUUSD') ? 'XAUUSD' : availableSymbols[0] || 'XAUUSD');
  };

  const loadImageFile = (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setScanError('Unsupported file format. Please upload a PNG, JPEG, WEBP, or GIF chart screenshot.');
      return;
    }
    if (file.size > 7.5 * 1024 * 1024) {
      setScanError('Screenshot is too large (max 7.5 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setScanError('Failed to read image bytes.');
        return;
      }
      setImagePreviewUrl(result);
      setImageMimeType(file.type || 'image/png');
      setImageName(file.name || 'chart-screenshot.png');
      setScanError(null);
      setExecBanner(null);
    };
    reader.onerror = () => {
      setScanError('Unable to decode selected image file.');
    };
    reader.readAsDataURL(file);
  };

  // Global clipboard paste support (Ctrl+V / Cmd+V screenshot directly from TradingView / MT5)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            loadImageFile(
              new File([blob], `pasted-chart-${Date.now()}.${blob.type.split('/')[1] || 'png'}`, {
                type: blob.type,
              })
            );
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadImageFile(file);
  };

  const handleAnalyzeScreenshot = async () => {
    if (!imagePreviewUrl) {
      setScanError('Upload or paste (Ctrl+V) a chart screenshot before scanning.');
      return;
    }
    setIsScanning(true);
    setScanError(null);
    setExecBanner(null);

    try {
      const res = await fetch('/api/ai/scan-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreviewUrl,
          mimeType: imageMimeType,
          accountBalance: accountEquity,
          riskPct,
          notes: traderNotes,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.analysis) {
        setScanError(data.error || `AI analysis failed (HTTP ${res.status}).`);
        setIsScanning(false);
        return;
      }

      const scanned: ChartScanAnalysis = data.analysis;
      setAnalysis(scanned);
      setScanMeta({ model: data.model || 'gemini-4-hydrogen', latencyMs: Number(data.latencyMs || 0) });

      // Populate interactive trade ticket builder
      const resolvedSym = resolveBridgeSymbol(scanned.symbol);
      const resolvedSide: OrderSide = scanned.bias === 'SELL' ? 'SELL' : 'BUY';
      const digits = prices[resolvedSym]?.digits ?? 2;

      setDraftSymbol(resolvedSym);
      setDraftSide(resolvedSide);
      setDraftOrderType(scanned.orderType || 'MARKET');
      setDraftLots(Math.max(0.01, Number((scanned.recommendedLots || 0.25).toFixed(2))));
      setDraftEntry(scanned.entryPrice ? scanned.entryPrice.toFixed(digits) : '');
      setDraftSl(scanned.stopLoss ? scanned.stopLoss.toFixed(digits) : '');
      setDraftTp(scanned.takeProfit1 ? scanned.takeProfit1.toFixed(digits) : '');

      speechNotifier.speak({
        category: 'SIGNAL_ALERT',
        severity: scanned.confidence >= 80 ? 'CRITICAL' : 'HIGH',
        title: `AI Chart Scan: ${scanned.bias} ${resolvedSym} (${scanned.confidence}%)`,
        message: `AI chart analysis complete on ${resolvedSym} ${scanned.timeframe}. Bias is ${scanned.bias} on ${scanned.pattern}, confidence ${scanned.confidence} percent. Target risk reward ${scanned.riskReward}.`,
        dedupeKey: `ai-scan-${resolvedSym}-${scanned.bias}`,
        cooldownMs: 3000,
      });
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Network error calling AI chart scanner.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBuildSingleTrade = async () => {
    setIsExecuting(true);
    setExecBanner(null);
    const parsedEntry = parseFloat(draftEntry);
    const parsedSl = parseFloat(draftSl);
    const parsedTp = parseFloat(draftTp);

    const res = await executeOrder({
      symbol: draftSymbol,
      side: draftSide,
      orderType: draftOrderType,
      lots: Math.max(0.01, draftLots),
      targetPrice: Number.isFinite(parsedEntry) && draftOrderType !== 'MARKET' ? parsedEntry : undefined,
      sl: Number.isFinite(parsedSl) ? parsedSl : null,
      tp: Number.isFinite(parsedTp) ? parsedTp : null,
      terminal: draftTerminal,
      comment: `AI_ChartScanner_${analysis?.pattern.slice(0, 18) || 'Vision'}`,
    });

    setExecBanner({ ok: res.success, msg: res.message });
    setIsExecuting(false);
  };

  const handleBuildSplitBatch = async () => {
    setIsExecuting(true);
    setExecBanner(null);
    const parsedSl = parseFloat(draftSl);
    const parsedTp = parseFloat(draftTp);
    const splitLots = Math.max(0.01, Number((draftLots / 3).toFixed(2)));

    const res = await executeBatchOrders({
      symbol: draftSymbol,
      side: draftSide,
      lots: splitLots,
      count: 3,
      sl: Number.isFinite(parsedSl) ? parsedSl : null,
      tp: Number.isFinite(parsedTp) ? parsedTp : null,
      terminal: draftTerminal,
      comment: `AI_Chart_Split_3x_${analysis?.timeframe || 'M15'}`,
    });

    setExecBanner({ ok: res.success, msg: res.message });
    setIsExecuting(false);
  };

  const fxMult = displayCurrency === 'ZAR' ? liveMarketData.usdZarRate : 1;
  const currencyPrefix = displayCurrency === 'ZAR' ? 'R ' : '$';
  const riskBudgetUsd = Number(((accountEquity * riskPct) / 100).toFixed(2));
  const riskBudgetDisplay = Number((riskBudgetUsd * fxMult).toFixed(2));

  const liveTradePreview = useMemo(() => {
    const market = prices[draftSymbol];
    const refEntry =
      parseFloat(draftEntry) ||
      (draftSide === 'BUY' ? market?.ask : market?.bid) ||
      0;
    const sl = parseFloat(draftSl);
    const tp = parseFloat(draftTp);
    const slDist =
      Number.isFinite(sl) && refEntry > 0 ? Math.abs(refEntry - sl) : 0;
    const tpDist =
      Number.isFinite(tp) && refEntry > 0 ? Math.abs(tp - refEntry) : 0;
    const rrRatio =
      slDist > 0 && tpDist > 0 ? (tpDist / slDist).toFixed(2) : null;
    const estNotional = Number((draftLots * 100000).toFixed(0));
    return {
      refEntry,
      rrRatio,
      estNotional,
      hasStops: slDist > 0 && tpDist > 0,
    };
  }, [prices, draftSymbol, draftEntry, draftSide, draftSl, draftTp, draftLots]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span className="text-cyan-400 font-semibold">{brand.brandName} Vision Desk</span>
              <span aria-hidden="true">·</span>
              <span>{brand.ownerEntity}</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-white font-display tracking-tight">
              AI Chart Screenshot Scanner &amp; Trade Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload or paste (Ctrl+V) any MT5 or TradingView screenshot to extract SMC levels, SL/TP coordinates, and dispatch directly to your bridge.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#090C12] border border-white/[0.08] rounded-xl px-3.5 py-2 font-mono text-xs tabular-nums shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Equity ({displayCurrency})</span>
            <span className="font-bold text-white">
              {currencyPrefix}
              {(accountEquity * fxMult).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Risk Budget ({riskPct}%)</span>
            <span className="font-bold text-cyan-300">
              {currencyPrefix}
              {riskBudgetDisplay.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Upload Dropzone, Preview & Context Controls */}
        <div className="lg:col-span-7 bg-[#0F141E] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h2 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Chart Screenshot Input</span>
            </h2>
            <div className="flex items-center gap-2">
              {imagePreviewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreviewUrl(null);
                    setImageName('');
                    setAnalysis(null);
                    setScanError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition"
              >
                Choose File
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadImageFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Dropzone / Image Preview */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => {
              if (!imagePreviewUrl) fileInputRef.current?.click();
            }}
            className={`rounded-xl border border-dashed transition overflow-hidden ${
              imagePreviewUrl
                ? 'border-cyan-500/40 bg-[#090C12]'
                : 'border-slate-700 hover:border-cyan-500/60 bg-[#090C12]/80 cursor-pointer p-8 sm:p-12 text-center'
            }`}
          >
            {imagePreviewUrl ? (
              <div className="space-y-2 p-2">
                <img
                  src={imagePreviewUrl}
                  alt={imageName || 'Trading chart screenshot'}
                  className="w-full max-h-[380px] object-contain rounded-lg bg-black"
                />
                <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 font-mono">
                  <span className="truncate">{imageName}</span>
                  <span>{imageMimeType}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                  <ClipboardPaste className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Drop chart screenshot here, click to browse, or press Ctrl+V to paste
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPEG, WEBP, GIF from TradingView, MetaTrader 5, cTrader, or DXtrade (max 7.5 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Risk & Session Context Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[11px] font-medium text-slate-400 block">
                Risk Per Trade (%)
              </label>
              <div className="flex items-center gap-1">
                {[0.5, 1.0, 2.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRiskPct(val)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition tabular-nums ${
                      riskPct === val
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-[#090C12] text-slate-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-8 space-y-1">
              <label className="text-[11px] font-medium text-slate-400 block">
                Trader Context / Session Notes (Optional)
              </label>
              <input
                type="text"
                value={traderNotes}
                onChange={(e) => setTraderNotes(e.target.value)}
                placeholder="e.g. NY Open liquidity sweep on M15, targeting daily high..."
                className="w-full bg-[#090C12] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Error Notice */}
          {scanError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Analyze Trigger */}
          <button
            type="button"
            disabled={isScanning || !imagePreviewUrl}
            onClick={handleAnalyzeScreenshot}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Market Structure &amp; Building Setup...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scan Chart Screenshot with AI</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN (5 cols): AI Analysis Output & Interactive Trade Builder */}
        <div className="lg:col-span-5 space-y-4">
          {analysis ? (
            <>
              {/* AI Vision Readout Card */}
              <div className="bg-[#0F141E] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white font-mono">
                        {analysis.symbol}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                        {analysis.timeframe}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{analysis.pattern}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        speechNotifier.speak({
                          category: 'SIGNAL_ALERT',
                          severity: 'HIGH',
                          title: `Replay AI Scan: ${analysis.bias} ${analysis.symbol}`,
                          message: `AI chart analysis for ${analysis.symbol}: ${analysis.bias} setup at ${analysis.entryPrice}, stop loss ${analysis.stopLoss}, take profit ${analysis.takeProfit1}. Confidence ${analysis.confidence} percent.`,
                          forceSpeak: true,
                          interrupt: true,
                        })
                      }
                      className="p-2 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/10 text-cyan-300 transition"
                      title="Announce setup via browser voice synthesis"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
                        analysis.bias === 'BUY'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : analysis.bias === 'SELL'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {analysis.bias === 'BUY' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : analysis.bias === 'SELL' ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{analysis.bias}</span>
                    </span>
                  </div>
                </div>

                {/* Price Targets & Confidence Strip */}
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
                  <div className="p-2.5 rounded-xl bg-[#090C12] border border-white/5">
                    <span className="text-[10px] text-slate-400 font-sans block">Entry ({analysis.orderType})</span>
                    <span className="text-sm font-bold text-white">{analysis.entryPrice}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#090C12] border border-white/5">
                    <span className="text-[10px] text-slate-400 font-sans block">Risk / Reward</span>
                    <span className="text-sm font-bold text-cyan-300">{analysis.riskReward}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#090C12] border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 font-sans block">Stop Loss</span>
                    <span className="text-sm font-bold text-rose-300">{analysis.stopLoss}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#090C12] border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 font-sans block">TP1 / TP2</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {analysis.takeProfit1} / {analysis.takeProfit2}
                    </span>
                  </div>
                </div>

                {/* Confidence Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Setup Confidence</span>
                    <span className="font-mono font-bold text-cyan-300 tabular-nums">
                      {analysis.confidence}% {scanMeta ? `· ${scanMeta.latencyMs}ms` : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#090C12] border border-white/5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Key Structural Levels */}
                {analysis.keyLevels.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Extracted Liquidity &amp; Structure Levels
                    </span>
                    <div className="divide-y divide-white/5 rounded-xl bg-[#090C12] border border-white/5 px-3">
                      {analysis.keyLevels.map((lv, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs font-mono tabular-nums">
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] text-cyan-400 font-bold mr-2">{lv.type}</span>
                            <span className="text-slate-300 font-sans">{lv.label}</span>
                          </div>
                          <span className="text-white font-bold shrink-0">{lv.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rationale & Invalidation */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#090C12] border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Execution Thesis
                    </span>
                    <p className="text-slate-200 leading-relaxed">{analysis.rationale}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-rose-300 uppercase block">
                        Setup Invalidation
                      </span>
                      <p className="text-slate-300">{analysis.invalidationReason}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#0F141E] border border-white/10 rounded-2xl p-6 text-center space-y-2">
              <Crosshair className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
              <h3 className="text-sm font-bold text-white">Awaiting Chart Screenshot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload or paste a chart image on the left and click Scan Chart Screenshot. Gemini Vision will extract the symbol, entry, stop loss, targets, and pre-fill the trade builder below.
              </p>
            </div>
          )}

          {/* Interactive Trade Builder & Bridge Dispatch Form */}
          <div className="bg-[#0F141E] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Trade Ticket Builder</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">DMA Bridge Execution</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bridge Symbol</label>
                <select
                  value={draftSymbol}
                  onChange={(e) => setDraftSymbol(e.target.value)}
                  className="w-full bg-[#090C12] border border-white/10 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  {availableSymbols.map((sym) => (
                    <option key={sym} value={sym}>
                      {sym} ({prices[sym]?.bid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Order Type</label>
                <select
                  value={draftOrderType}
                  onChange={(e) => setDraftOrderType(e.target.value as OrderType)}
                  className="w-full bg-[#090C12] border border-white/10 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                  <option value="STOP">STOP</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Direction</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraftSide('BUY')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      draftSide === 'BUY'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-[#090C12] text-slate-400 border-white/10'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftSide('SELL')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      draftSide === 'SELL'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-[#090C12] text-slate-400 border-white/10'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Volume (Lots)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={draftLots}
                  onChange={(e) => setDraftLots(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-full bg-[#090C12] border border-white/10 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-cyan-300 tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {draftOrderType === 'MARKET' ? 'Reference Entry' : 'Trigger Price'}
                </label>
                <input
                  type="text"
                  value={draftEntry}
                  onChange={(e) => setDraftEntry(e.target.value)}
                  placeholder={String(prices[draftSymbol]?.ask || '')}
                  className="w-full bg-[#090C12] border border-white/10 rounded-lg px-2.5 py-2 text-xs font-mono text-white tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Terminal</label>
                <select
                  value={draftTerminal}
                  onChange={(e) => setDraftTerminal(e.target.value)}
                  className="w-full bg-[#090C12] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {terminals.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-rose-400 block mb-1">Stop Loss</label>
                <input
                  type="text"
                  value={draftSl}
                  onChange={(e) => setDraftSl(e.target.value)}
                  placeholder="Optional SL price"
                  className="w-full bg-[#090C12] border border-rose-500/25 rounded-lg px-2.5 py-2 text-xs font-mono text-rose-300 tabular-nums focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-emerald-400 block mb-1">Take Profit</label>
                <input
                  type="text"
                  value={draftTp}
                  onChange={(e) => setDraftTp(e.target.value)}
                  placeholder="Optional TP price"
                  className="w-full bg-[#090C12] border border-emerald-500/25 rounded-lg px-2.5 py-2 text-xs font-mono text-emerald-300 tabular-nums focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Pre-Execution Risk & Reward Summary */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#090C12] border border-white/[0.06] text-xs font-mono tabular-nums">
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Ref Entry</span>
                <span className="font-semibold text-white">
                  {liveTradePreview.refEntry > 0
                    ? liveTradePreview.refEntry.toFixed(prices[draftSymbol]?.digits ?? 2)
                    : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Computed R:R</span>
                <span className="font-semibold text-cyan-300">
                  {liveTradePreview.rrRatio ? `1 : ${liveTradePreview.rrRatio}` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Risk Budget</span>
                <span className="font-semibold text-emerald-300">
                  {currencyPrefix}
                  {riskBudgetDisplay.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {execBanner && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  execBanner.ok
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500/35 text-rose-200'
                }`}
              >
                {execBanner.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{execBanner.msg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleBuildSingleTrade}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Build &amp; Execute Trade</span>
              </button>

              <button
                type="button"
                disabled={isExecuting}
                onClick={handleBuildSplitBatch}
                className="py-2.5 px-3 rounded-xl bg-[#141B29] hover:bg-slate-800 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Dispatch 3-Ticket Split</span>
              </button>
            </div>

            {onOpenInBridge && (
              <button
                type="button"
                onClick={() => onOpenInBridge(draftSymbol)}
                className="w-full py-2 px-3 rounded-xl bg-[#090C12] hover:bg-[#141B29] border border-white/[0.08] text-slate-300 hover:text-cyan-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <span>Open {draftSymbol} Chart in Titan Omni-Bridge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
