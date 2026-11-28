import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import {
  APIProvider,
  Map as GoogleMapComponent,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  Globe,
  Radio,
  Server,
  Zap,
  Activity,
  Layers,
  Clock,
  Compass,
  Search,
  ExternalLink,
  Shield,
  Wifi,
  Crosshair,
  TrendingUp,
  MapPin,
  ChevronRight,
  Info,
} from 'lucide-react';

function computeLiveSessionStatus(hubId: string, nowUtc: Date): 'OPEN' | 'KILLZONE' | 'CLOSED' {
  const day = nowUtc.getUTCDay(); // 0=Sun, 6=Sat
  const mins = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes();

  // Standard weekend FX/equity closure (CME reopens Sunday 22:00 UTC)
  if (day === 6) return 'CLOSED';
  if (day === 0 && !(hubId === 'cme-chicago' && mins >= 22 * 60)) return 'CLOSED';

  switch (hubId) {
    case 'ld4-london':
      if ((mins >= 7 * 60 && mins < 9 * 60) || (mins >= 12 * 60 && mins < 16 * 60)) return 'KILLZONE';
      return mins >= 7 * 60 && mins < 16 * 60 ? 'OPEN' : 'CLOSED';
    case 'ny4-new-york':
      if (mins >= 12 * 60 && mins < 16 * 60) return 'KILLZONE';
      return mins >= 12 * 60 && mins < 21 * 60 ? 'OPEN' : 'CLOSED';
    case 'jse-johannesburg':
      if (mins >= 7 * 60 && mins < 8 * 60 + 30) return 'KILLZONE';
      return mins >= 7 * 60 && mins < 15 * 60 + 30 ? 'OPEN' : 'CLOSED';
    case 'fr2-frankfurt':
      return mins >= 7 * 60 && mins < 16 * 60 + 30 ? 'OPEN' : 'CLOSED';
    case 'ty3-tokyo':
      if (mins >= 0 && mins < 120) return 'KILLZONE';
      return mins >= 0 && mins < 6 * 60 ? 'OPEN' : 'CLOSED';
    case 'sg1-singapore':
      return mins >= 30 && mins < 9 * 60 ? 'OPEN' : 'CLOSED';
    case 'cme-chicago':
      if (mins >= 12 * 60 + 30 && mins < 15 * 60 + 30) return 'KILLZONE';
      return mins >= 22 * 60 || mins < 21 * 60 ? 'OPEN' : 'CLOSED';
    case 'six-zurich':
      return mins >= 7 * 60 + 30 && mins < 16 * 60 + 30 ? 'OPEN' : 'CLOSED';
    default:
      return 'OPEN';
  }
}

export interface FinancialHub {
  id: string;
  name: string;
  city: string;
  country: string;
  region: 'AMERICAS' | 'EUROPE_AFRICA' | 'ASIA_PACIFIC';
  lat: number;
  lng: number;
  exchange: string;
  dataCenter: string;
  latencyMs: number;
  sessionStatus: 'OPEN' | 'KILLZONE' | 'CLOSED';
  sessionHours: string;
  primaryPairs: string[];
  description: string;
  dailyVolumeUsd: string;
}

const FINANCIAL_HUBS: FinancialHub[] = [
  {
    id: 'ld4-london',
    name: 'London Financial Center & LD4',
    city: 'London / Slough',
    country: 'United Kingdom',
    region: 'EUROPE_AFRICA',
    lat: 51.5155,
    lng: -0.1419,
    exchange: 'LSE / Interbank FX',
    dataCenter: 'Equinix LD4 (Slough)',
    latencyMs: 1.2,
    sessionStatus: 'KILLZONE',
    sessionHours: '07:00 – 16:00 UTC',
    primaryPairs: ['GBPUSD', 'EURUSD', 'EURGBP'],
    description: 'The world epicenter of foreign exchange liquidity and interbank DMA matching engines.',
    dailyVolumeUsd: '$2.9 Trillion',
  },
  {
    id: 'ny4-new-york',
    name: 'New York Wall Street & NY4',
    city: 'New York / Secaucus',
    country: 'United States',
    region: 'AMERICAS',
    lat: 40.7128,
    lng: -74.006,
    exchange: 'NYSE / NASDAQ / CME',
    dataCenter: 'Equinix NY4 (Secaucus NJ)',
    latencyMs: 1.8,
    sessionStatus: 'OPEN',
    sessionHours: '12:00 – 21:00 UTC',
    primaryPairs: ['XAUUSD', 'US30', 'NAS100', 'SPX500'],
    description: 'Institutional index and bullion center hosting Gold COMEX and US equity index futures.',
    dailyVolumeUsd: '$3.8 Trillion',
  },
  {
    id: 'jse-johannesburg',
    name: 'Johannesburg Sandton & JN1',
    city: 'Sandton / Johannesburg',
    country: 'South Africa',
    region: 'EUROPE_AFRICA',
    lat: -26.1076,
    lng: 28.0567,
    exchange: 'Johannesburg Stock Exchange (JSE)',
    dataCenter: 'Teraco JB1 / JN1',
    latencyMs: 14.5,
    sessionStatus: 'OPEN',
    sessionHours: '07:00 – 15:30 UTC',
    primaryPairs: ['USDZAR', 'EURZAR', 'ALSI40', 'Aviator Engine'],
    description: 'Flagship desk core for Sovereign Liquidity Sweep algorithms, Crash Quant engines, and institutional DMA liquidity.',
    dailyVolumeUsd: '$210 Billion',
  },
  {
    id: 'fr2-frankfurt',
    name: 'Frankfurt Deutsche Börse & FR2',
    city: 'Frankfurt',
    country: 'Germany',
    region: 'EUROPE_AFRICA',
    lat: 50.1109,
    lng: 8.6821,
    exchange: 'Deutsche Börse (XETRA / Eurex)',
    dataCenter: 'Equinix FR2',
    latencyMs: 3.4,
    sessionStatus: 'OPEN',
    sessionHours: '07:00 – 16:30 UTC',
    primaryPairs: ['GER40', 'EURUSD', 'BUND'],
    description: 'Continental European banking core and DAX derivatives matching engine.',
    dailyVolumeUsd: '$850 Billion',
  },
  {
    id: 'ty3-tokyo',
    name: 'Tokyo Stock Exchange & TY3',
    city: 'Tokyo',
    country: 'Japan',
    region: 'ASIA_PACIFIC',
    lat: 35.6828,
    lng: 139.759,
    exchange: 'JPX (Tokyo Stock Exchange)',
    dataCenter: 'Equinix TY3',
    latencyMs: 9.8,
    sessionStatus: 'CLOSED',
    sessionHours: '00:00 – 06:00 UTC',
    primaryPairs: ['USDJPY', 'GBPJPY', 'NIKKEI225'],
    description: 'Asian consolidation anchor; defines high/low liquidity traps swept during European open.',
    dailyVolumeUsd: '$1.4 Trillion',
  },
  {
    id: 'sg1-singapore',
    name: 'Singapore SGX & SG1 Hub',
    city: 'Singapore',
    country: 'Singapore',
    region: 'ASIA_PACIFIC',
    lat: 1.3521,
    lng: 103.8198,
    exchange: 'Singapore Exchange (SGX)',
    dataCenter: 'Equinix SG1',
    latencyMs: 12.1,
    sessionStatus: 'CLOSED',
    sessionHours: '00:30 – 09:00 UTC',
    primaryPairs: ['USDCNH', 'USDSGD', 'XAUUSD Asian'],
    description: 'Leading Asia-Pacific multi-asset gateway with high-frequency commodity desks.',
    dailyVolumeUsd: '$680 Billion',
  },
  {
    id: 'cme-chicago',
    name: 'Chicago CME Aurora Liquidity Core',
    city: 'Aurora / Chicago',
    country: 'United States',
    region: 'AMERICAS',
    lat: 41.7606,
    lng: -88.3201,
    exchange: 'Chicago Mercantile Exchange (CME)',
    dataCenter: 'CME Aurora Technology Center',
    latencyMs: 2.1,
    sessionStatus: 'OPEN',
    sessionHours: '22:00 – 21:00 UTC (23h)',
    primaryPairs: ['ES (S&P 500)', 'NQ (Nasdaq)', 'GC (Gold)'],
    description: 'Global derivatives heartland; collocated microsecond fiber cross-connects.',
    dailyVolumeUsd: '$4.5 Trillion',
  },
  {
    id: 'six-zurich',
    name: 'Zurich SIX Swiss Exchange',
    city: 'Zurich',
    country: 'Switzerland',
    region: 'EUROPE_AFRICA',
    lat: 47.3769,
    lng: 8.5417,
    exchange: 'SIX Swiss Exchange',
    dataCenter: 'Equinix ZH4',
    latencyMs: 4.2,
    sessionStatus: 'OPEN',
    sessionHours: '07:30 – 16:30 UTC',
    primaryPairs: ['USDCHF', 'EURCHF', 'SMI20'],
    description: 'Swiss private banking and sovereign wealth capital clearing facility.',
    dailyVolumeUsd: '$340 Billion',
  },
];

export const GlobalLiquidityMapView: React.FC = () => {
  const { brand } = useBrand();
  const { bridgeLatencyMs } = useTrading();
  const [apiKey, setApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [selectedHubId, setSelectedHubId] = useState<string | null>(FINANCIAL_HUBS[0].id);
  const [activeRegion, setActiveRegion] = useState<'ALL' | 'AMERICAS' | 'EUROPE_AFRICA' | 'ASIA_PACIFIC'>('ALL');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 25.0, lng: 15.0 });
  const [mapZoom, setMapZoom] = useState<number>(2.4);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nowDate, setNowDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const utcNow = nowDate.toISOString().slice(11, 19);
  const utcMinuteBucket = Math.floor(nowDate.getTime() / 60000);

  // Fetch API key from server if not already present in client bundle
  useEffect(() => {
    if (!apiKey) {
      fetch('/api/maps/config')
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => {
          if (data?.apiKey) {
            setApiKey(data.apiKey);
          }
        })
        .catch((err: unknown) => {
          console.warn('Maps config unavailable, using tactical projection view:', err instanceof Error ? err.message : err);
        });
    }
  }, [apiKey]);

  const liveHubs = useMemo(() => {
    const refDate = new Date(utcMinuteBucket * 60000);
    return FINANCIAL_HUBS.map((hub) => ({
      ...hub,
      description:
        hub.id === 'jse-johannesburg'
          ? `Home base for ${brand.brandName} (${brand.ownerEntity}), Nguni Aviator algorithms, and African institutional DMA liquidity.`
          : hub.description,
      latencyMs: hub.id === 'ld4-london' && bridgeLatencyMs > 0 ? Number(bridgeLatencyMs.toFixed(1)) : hub.latencyMs,
      sessionStatus: computeLiveSessionStatus(hub.id, refDate),
    }));
  }, [utcMinuteBucket, bridgeLatencyMs, brand.brandName, brand.ownerEntity]);

  const selectedHub = useMemo(
    () => (selectedHubId ? liveHubs.find((h) => h.id === selectedHubId) ?? null : null),
    [liveHubs, selectedHubId]
  );

  const filteredHubs = liveHubs.filter((hub) => {
    const matchesRegion = activeRegion === 'ALL' || hub.region === activeRegion;
    const matchesQuery =
      searchQuery.trim() === '' ||
      hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.exchange.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.dataCenter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesQuery;
  });

  const handleSelectHub = (hub: FinancialHub) => {
    setSelectedHubId(hub.id);
    setMapCenter({ lat: hub.lat, lng: hub.lng });
    setMapZoom(5.5);
  };

  // Equirectangular projection helper for Vector Geo-Plot fallback
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 900;
    const y = ((90 - lat) / 180) * 460;
    return { x, y };
  };

  return (
    <div className="space-y-6 font-mono selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0F141E] border border-white/[0.08] p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold font-sans">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{brand.brandName} · Global Liquidity Topology</span>
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold tabular-nums">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{utcNow} UTC</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              Global Financial Exchanges &amp; DMA Radar
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Real-time geospatial mapping of Tier-1 interbank liquidity centers, MT5 broker data centers (LD4, NY4, CME Aurora, Sandton JN1), and cross-continental fiber routing latencies.
            </p>
          </div>

          {/* Quick Metrics Card */}
          <div className="bg-[#0c1424]/90 border border-cyan-500/30 rounded-2xl p-4 shrink-0 w-full lg:w-72 shadow-xl space-y-3">
            <div className="text-xs text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Active Exchanges</span>
              <span className="text-emerald-400 tabular-nums">{FINANCIAL_HUBS.length} Global Hubs</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">London LD4</div>
                <div className="text-emerald-400 font-bold tabular-nums">
                  {(bridgeLatencyMs || 1.2).toFixed(1)}ms DMA
                </div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Sandton JN1</div>
                <div className="text-amber-400 font-bold tabular-nums">14.5ms SA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Region Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d16] p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Exchanges' },
            { id: 'EUROPE_AFRICA', label: 'Europe & Africa (LD4 / JSE)' },
            { id: 'AMERICAS', label: 'Americas (NY4 / CME)' },
            { id: 'ASIA_PACIFIC', label: 'Asia-Pacific (TY3 / SGX)' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRegion(r.id as typeof activeRegion)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                activeRegion === r.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hub, broker, exchange..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Grid: Map Canvas & Interactive Nodes Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Google Map or Interactive Vector Geo-Plot Fallback */}
        <div className="lg:col-span-2 bg-[#0F141E] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#080d18]/90">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                {apiKey ? 'Google Maps Dynamic Vector Engine' : 'Equinix / Teraco Vector Geo-Plot'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              {apiKey ? `Live Geospatial Vector Map • ${filteredHubs.length} Hubs` : `${filteredHubs.length} Plotted Coordinates`}
            </span>
          </div>

          <div className="w-full h-[520px] md:h-[620px] relative bg-[#070b13]">
            {apiKey ? (
              <APIProvider apiKey={apiKey}>
                <GoogleMapComponent
                  id="global-liquidity-map"
                  mapId="DEMO_MAP_ID"
                  center={mapCenter}
                  zoom={mapZoom}
                  onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
                  onZoomChanged={(ev) => setMapZoom(ev.detail.zoom)}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                >
                  {filteredHubs.map((hub) => {
                    const isSelected = selectedHub?.id === hub.id;
                    const isKillzone = hub.sessionStatus === 'KILLZONE';
                    return (
                      <AdvancedMarker
                        key={hub.id}
                        position={{ lat: hub.lat, lng: hub.lng }}
                        onClick={() => handleSelectHub(hub)}
                        title={hub.name}
                      >
                        <Pin
                          background={isKillzone ? '#f59e0b' : hub.sessionStatus === 'OPEN' ? '#10b981' : '#64748b'}
                          borderColor={isSelected ? '#38bdf8' : '#020617'}
                          glyphColor="#020617"
                          scale={isSelected ? 1.35 : 1.1}
                        />
                      </AdvancedMarker>
                    );
                  })}

                  {selectedHub && (
                    <InfoWindow
                      position={{ lat: selectedHub.lat, lng: selectedHub.lng }}
                      onCloseClick={() => setSelectedHubId(null)}
                    >
                      <div className="p-2 text-slate-900 font-mono max-w-xs space-y-1">
                        <div className="text-xs font-extrabold uppercase text-slate-900">
                          {selectedHub.name}
                        </div>
                        <div className="text-[11px] text-slate-600 font-sans">
                          {selectedHub.description}
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 tabular-nums">
                          <span className="font-bold">Latency: {selectedHub.latencyMs}ms</span>
                          <span className="font-bold text-emerald-600">{selectedHub.dailyVolumeUsd} Vol</span>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMapComponent>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-[radial-gradient(#0e293b_1px,transparent_1px)] [background-size:24px_24px]">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Interactive Fiber Coordinate Grid · Click any hub node to inspect</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    Focus: {selectedHub ? `${selectedHub.lat.toFixed(2)}°, ${selectedHub.lng.toFixed(2)}°` : 'Global'}
                  </span>
                </div>

                <div className="relative flex-1 my-3 rounded-2xl bg-[#05080f]/90 border border-cyan-500/20 overflow-hidden">
                  <svg viewBox="0 0 900 460" className="w-full h-full">
                    {/* Lat / Lng Graticule */}
                    {[-60, -30, 0, 30, 60].map((lat) => {
                      const y = ((90 - lat) / 180) * 460;
                      return (
                        <line key={`lat-${lat}`} x1={0} y1={y} x2={900} y2={y} stroke="#132033" strokeDasharray="3 4" />
                      );
                    })}
                    {[-120, -60, 0, 60, 120].map((lng) => {
                      const x = ((lng + 180) / 360) * 900;
                      return (
                        <line key={`lng-${lng}`} x1={x} y1={0} x2={x} y2={460} stroke="#132033" strokeDasharray="3 4" />
                      );
                    })}
                    {/* Equator */}
                    <line x1={0} y1={230} x2={900} y2={230} stroke="#1e3a5f" strokeWidth={1} />

                    {/* Cross-Continental Fiber Links from Selected Hub */}
                    {selectedHub &&
                      filteredHubs
                        .filter((h) => h.id !== selectedHub.id)
                        .map((hub) => {
                          const p1 = projectCoords(selectedHub.lat, selectedHub.lng);
                          const p2 = projectCoords(hub.lat, hub.lng);
                          return (
                            <line
                              key={`link-${hub.id}`}
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              stroke="#06b6d4"
                              strokeOpacity={0.28}
                              strokeWidth={1.2}
                              strokeDasharray="4 4"
                            />
                          );
                        })}

                    {/* Interactive Exchange Markers */}
                    {filteredHubs.map((hub) => {
                      const { x, y } = projectCoords(hub.lat, hub.lng);
                      const isSelected = selectedHub?.id === hub.id;
                      const dotColor =
                        hub.sessionStatus === 'KILLZONE'
                          ? '#f59e0b'
                          : hub.sessionStatus === 'OPEN'
                          ? '#10b981'
                          : '#64748b';

                      return (
                        <g
                          key={hub.id}
                          className="cursor-pointer"
                          onClick={() => handleSelectHub(hub)}
                        >
                          {isSelected && (
                            <circle cx={x} cy={y} r={16} fill={dotColor} fillOpacity={0.18} stroke={dotColor} strokeWidth={1.5} />
                          )}
                          <circle cx={x} cy={y} r={isSelected ? 7 : 5} fill={dotColor} stroke="#020617" strokeWidth={2} />
                          <text
                            x={x + 10}
                            y={y + 3}
                            fill={isSelected ? '#ffffff' : '#94a3b8'}
                            fontSize={isSelected ? '11' : '9.5'}
                            fontWeight="bold"
                          >
                            {hub.city.split('/')[0].trim()} ({hub.latencyMs}ms)
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Killzone Peak
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Session Open
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Off-Hours
                    </span>
                  </div>
                  <span className="text-slate-500">Vector Geo-Plot active (configure Maps API key for Street/Satellite tiles)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Hub Detail & Node List */}
        <div className="space-y-4 flex flex-col">
          {/* Selected Financial Node Inspector Card */}
          {selectedHub && (
            <div className="bg-[#0F141E] border border-cyan-500/35 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                    Selected Node Telemetry
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedHub.sessionStatus === 'KILLZONE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : selectedHub.sessionStatus === 'OPEN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selectedHub.sessionStatus}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-sans">{selectedHub.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 tabular-nums">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {selectedHub.city}, {selectedHub.country} · {selectedHub.sessionHours}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">DMA Latency</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5 flex items-center gap-1 tabular-nums">
                    <Wifi className="w-3.5 h-3.5" />
                    {selectedHub.latencyMs} ms
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Daily Turnover</div>
                  <div className="text-amber-400 font-bold text-sm mt-0.5 tabular-nums">
                    {selectedHub.dailyVolumeUsd}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Collocation Facility:</div>
                <div className="text-white font-bold">{selectedHub.dataCenter}</div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Primary Traded Instruments:</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedHub.primaryPairs.map((pair) => (
                    <span
                      key={pair}
                      className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold text-[11px]"
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed pt-2 border-t border-slate-800/80">
                {selectedHub.description}
              </p>
            </div>
          )}

          {/* Scrollable Node Roster */}
          <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans tabular-nums">
                Global Nodes Directory ({filteredHubs.length})
              </span>
              <span className="text-[10px] text-slate-400">Click to focus node</span>
            </div>

            <div className="space-y-2 mt-3 overflow-y-auto max-h-[340px] custom-scrollbar pr-1">
              {filteredHubs.length === 0 ? (
                <div className="p-6 text-center space-y-2.5 text-xs text-slate-400">
                  <p>No global exchange hubs match your filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRegion('ALL');
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredHubs.map((hub) => {
                  const isSelected = selectedHub?.id === hub.id;
                  return (
                    <div
                      key={hub.id}
                      onClick={() => handleSelectHub(hub)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{hub.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                          {hub.dataCenter} • <span className="text-emerald-400 font-bold">{hub.latencyMs}ms</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
