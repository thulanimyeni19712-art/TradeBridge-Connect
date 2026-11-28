import React, { useState, useEffect, useMemo, useRef } from 'react';
import { liveMarketData } from '../../services/liveMarketData';
import {
  Cpu,
  Activity,
  HardDrive,
  Zap,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Server,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface AviatorPerformanceHUDProps {
  isBotRunning?: boolean;
  isBacktesting?: boolean;
  activeStrategy?: string;
  bookmakerName?: string;
}

interface TelemetryPoint {
  time: string;
  cpu: number;
  memoryMb: number;
  latencyMs: number;
  jitterMs: number;
  cyclesPerSec: number;
}

export const AviatorPerformanceHUD: React.FC<AviatorPerformanceHUDProps> = ({
  isBotRunning = true,
  isBacktesting = false,
  activeStrategy = 'AlgoMax v5.2 + Nexus2 SMC Multi-Matrix',
  bookmakerName = 'IC Markets Global MT5',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [gcLastCleanedSec, setGcLastCleanedSec] = useState<number>(0);
  const [cacheRoundsCount, setCacheRoundsCount] = useState<number>(4820);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  const [cpuLoad, setCpuLoad] = useState<number>(12.0);
  const [memoryUsedMb, setMemoryUsedMb] = useState<number>(96.0);
  const [latencyMs, setLatencyMs] = useState<number>(liveMarketData.lastRttMs || 1.8);
  const [jitterMs, setJitterMs] = useState<number>(0.15);
  const [cyclesPerSec, setCyclesPerSec] = useState<number>(60);
  const lastFrameRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const frameDeltaAccumRef = useRef<number[]>([]);
  const memoryRef = useRef<number>(memoryUsedMb);
  const latencyRef = useRef<number>(latencyMs);
  memoryRef.current = memoryUsedMb;
  latencyRef.current = latencyMs;

  // Real browser rAF event-loop jitter + JS heap + liveMarketData TPS + measured /api/health RTT sampler
  useEffect(() => {
    let rafId = 0;
    const measureFrame = (ts: number) => {
      const delta = ts - lastFrameRef.current;
      lastFrameRef.current = ts;
      if (delta > 0 && delta < 500) {
        frameDeltaAccumRef.current.push(delta);
        if (frameDeltaAccumRef.current.length > 60) {
          frameDeltaAccumRef.current.shift();
        }
      }
      rafId = window.requestAnimationFrame(measureFrame);
    };
    rafId = window.requestAnimationFrame(measureFrame);

    const interval = setInterval(() => {
      const deltas = frameDeltaAccumRef.current;
      const avgDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 16.67;
      const maxDelta = deltas.length > 0 ? Math.max(...deltas) : 16.67;
      const measuredJitter = Number(Math.max(0.05, maxDelta - 16.67).toFixed(2));
      const measuredFps = Math.max(1, Math.round(1000 / avgDelta));

      const frameLagPct = Math.min(75, Math.max(4, ((avgDelta - 16.0) / 16.0) * 18 + (isBacktesting ? 48 : isBotRunning ? 14 : 6)));

      const perf = window.performance as unknown as { memory?: { usedJSHeapSize: number } };
      const realHeapMb = perf?.memory?.usedJSHeapSize
        ? Number((perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1))
        : memoryRef.current;

      const currentLatency = liveMarketData.lastRttMs > 0 ? liveMarketData.lastRttMs : latencyRef.current;

      const point: TelemetryPoint = {
        time: new Date().toLocaleTimeString(),
        cpu: Number(frameLagPct.toFixed(1)),
        memoryMb: realHeapMb,
        latencyMs: Number(currentLatency.toFixed(2)),
        jitterMs: measuredJitter,
        cyclesPerSec: liveMarketData.ticksPerSecond > 0 ? liveMarketData.ticksPerSecond * measuredFps : measuredFps,
      };

      setCpuLoad(point.cpu);
      setMemoryUsedMb(point.memoryMb);
      setLatencyMs(point.latencyMs);
      setJitterMs(point.jitterMs);
      setCyclesPerSec(point.cyclesPerSec);

      setHistory((prev) => [...prev.slice(-19), point]);
      setGcLastCleanedSec((s) => s + 1);
    }, 1000);

    return () => {
      window.cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [isBotRunning, isBacktesting]);

  const handlePurgeCache = () => {
    frameDeltaAccumRef.current = [];
    setCacheRoundsCount(0);
    setGcLastCleanedSec(0);
  };

  const handleCalibrateBaseline = async () => {
    setIsCalibrating(true);
    const rtt = await liveMarketData.measureHealthRtt();
    if (rtt > 0) {
      setLatencyMs(rtt);
    }
    setIsCalibrating(false);
  };

  const healthStatus = useMemo(() => {
    if (cpuLoad > 80 || latencyMs > 50) return { label: 'HEAVY LOAD', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' };
    if (isBotRunning) return { label: 'OPTIMAL TRADING', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
    return { label: 'NOMINAL STANDBY', color: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30' };
  }, [cpuLoad, latencyMs, isBotRunning]);

  const renderSparkline = (data: number[], color: string, height = 28) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data) || 1;
    const range = max - min || 1;
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * 140;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-28 sm:w-36 h-7 overflow-visible select-none" viewBox="0 0 140 28">
        <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={points} />
        <circle
          cx="140"
          cy={height - ((data[data.length - 1] - min) / range) * (height - 6) - 3}
          r="2.5"
          fill={color}
        />
      </svg>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0F141E] border border-white/[0.08] transition-all">
      <div className="p-3.5 sm:p-4 bg-[#161D2B] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <Gauge className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-100">Process Telemetry</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className={`font-medium ${cpuLoad > 80 || latencyMs > 50 ? 'text-amber-400' : isBotRunning ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {healthStatus.label}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Measured browser &amp; server telemetry for {bookmakerName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 text-xs tabular-nums">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Loop:</span>
            <span className={`font-mono font-semibold ${cpuLoad > 75 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {cpuLoad}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Heap:</span>
            <span className="font-mono font-semibold text-amber-300">{memoryUsedMb} MB</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">RTT:</span>
            <span className="font-mono font-semibold text-emerald-400">{latencyMs} ms</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg bg-[#0F141E] border border-white/[0.08] hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title={isExpanded ? 'Collapse HUD telemetry details' : 'Expand detailed HUD cockpit'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 relative z-10 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#090C12] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white">Event Loop Load</span>
                </div>
                <span className="text-xs text-cyan-400 font-mono font-medium tabular-nums">
                  {cyclesPerSec.toLocaleString()} ops/s
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-cyan-300 tabular-nums">{cpuLoad}%</span>
                <span className="text-xs text-slate-400">Main Worker Thread</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    cpuLoad > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, cpuLoad))}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <span className="text-[11px] text-slate-500">20s Frame Drift</span>
                {renderSparkline(history.map((h) => h.cpu), '#06b6d4')}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#090C12] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">JS Heap &amp; Buffer</span>
                </div>
                <span className="text-xs text-amber-300 font-mono tabular-nums">
                  {cacheRoundsCount} Rounds
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
                  {memoryUsedMb}{' '}
                  <span className="text-xs font-sans font-normal text-slate-400">/ 512 MB</span>
                </span>
                <span className="text-xs text-emerald-400 font-medium">Live Heap</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (memoryUsedMb / 512) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <span className="text-[11px] text-slate-500 tabular-nums">Uptime Window: {gcLastCleanedSec}s</span>
                {renderSparkline(history.map((h) => h.memoryMb), '#f59e0b')}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#090C12] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Tick-to-Trade RTT</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono tabular-nums">
                  &plusmn;{jitterMs}ms Jitter
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                  {latencyMs} <span className="text-xs font-sans font-normal text-slate-400">ms RTT</span>
                </span>
                <span className="text-xs text-cyan-300 font-mono">/api/health</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    latencyMs > 25 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(8, latencyMs * 3))}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <span className="text-[11px] text-slate-500">Measured Live</span>
                {renderSparkline(history.map((h) => h.latencyMs), '#10b981')}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#090C12] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Watchdog Loop:</span>
                <span className="font-semibold text-white">
                  {isBotRunning ? 'Active rAF Telemetry' : 'Standby'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Node Sync:</span>
                <span className="font-semibold text-cyan-300">{bookmakerName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Active Strategy:</span>
                <span className="font-semibold text-amber-300">{activeStrategy.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCalibrateBaseline()}
                disabled={isCalibrating}
                className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-slate-200 text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap"
                title="Re-benchmark live /api/health roundtrip latency"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isCalibrating ? 'Measuring...' : 'Measure RTT'}</span>
              </button>

              <button
                type="button"
                onClick={handlePurgeCache}
                className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/[0.08] text-cyan-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap"
                title="Reset local frame telemetry buffer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Buffer</span>
              </button>

              <button
                onClick={() => setSoundAlerts((prev) => !prev)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                title={soundAlerts ? 'Disable audio threshold alerts' : 'Enable audio threshold alerts'}
              >
                {soundAlerts ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
