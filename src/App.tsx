import React, { useState, useEffect } from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { TopHeader } from './components/layout/TopHeader';
import { Sidebar, MainNavTab } from './components/layout/Sidebar';
import { BottomBar } from './components/layout/BottomBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileEcosystemDrawer } from './components/layout/MobileEcosystemDrawer';
import { CommandPaletteModal } from './components/layout/CommandPaletteModal';
import { VoiceSettingsPopover } from './components/layout/VoiceSettingsPopover';
import { OrderExecutionModal } from './components/bridge/OrderExecutionModal';
import { KillSwitchModal } from './components/bridge/PartialCloseModal';
import { AutomatedTradingHubView } from './components/automated/AutomatedTradingHubView';
import { HighLevelScriptsVaultView } from './components/scripts/HighLevelScriptsVaultView';
import { EasyWay2TradeView } from './components/easyway2trade/EasyWay2TradeView';
import { EmergePropView } from './components/emerge/EmergePropView';
import { EAConnectView } from './components/eaconnect/EAConnectView';
import { EAVaultView } from './components/eavault/EAVaultView';
import { EAConverterAdminView } from './components/eaconverter/EAConverterAdminView';
import { EAMobileLauncherView } from './components/eaconverter/EAMobileLauncherView';
import { MT5BrokerConnectionModal } from './components/mt5/MT5BrokerConnectionModal';
import { NguniAviatorApp } from './components/aviator/NguniAviatorApp';
import { LiquidityEdgeEAView } from './components/liquidityedge/LiquidityEdgeEAView';
import { GlobalLiquidityMapView } from './components/maps/GlobalLiquidityMapView';
import { Nexus2KanteView } from './components/nexus/Nexus2KanteView';
import { AlgoMaxPublicView } from './components/algomax/AlgoMaxPublicView';
import { AlgoAdminPortalView } from './components/algoadmin/AlgoAdminPortalView';
import { UnifiedOmniTradeBridgeView } from './components/bridge/UnifiedOmniTradeBridgeView';
import { EAMigrateProView } from './components/eamigrate/EAMigrateProView';
import { TradePortEAView } from './components/tradeport/TradePortEAView';
import { EAMatrixView } from './components/eamatrix/EAMatrixView';
import { AlgoHostView } from './components/algohost/AlgoHostView';
import { EACentralView } from './components/eacentral/EACentralView';
import { ITradeBotView } from './components/itradebot/ITradeBotView';
import { EAMergeView } from './components/eamerge/EAMergeView';
import { GoogleWorkspaceHubView } from './components/workspace/GoogleWorkspaceHubView';
import { AIChartScannerView } from './components/aiscanner/AIChartScannerView';
import { MarketSpeechWatcher } from './components/aviator/MarketSpeechWatcher';
import { OrderSide } from './types/trading';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BrandProvider, useBrand, GLASS_STYLE_META } from './context/BrandContext';
import { BrandOwnershipModal } from './components/layout/BrandOwnershipModal';
import { ScanLine, Clock, ChevronRight, Smartphone, Layers, Flame, KeyRound, ShieldCheck, GitMerge, Sparkles } from 'lucide-react';

function getUtcMarketSession(utcHour: number): { label: string; active: boolean } {
  if (utcHour >= 13 && utcHour < 16) {
    return { label: 'LDN / NY Overlap', active: true };
  }
  if (utcHour >= 8 && utcHour < 13) {
    return { label: 'London Session', active: true };
  }
  if (utcHour >= 16 && utcHour < 21) {
    return { label: 'New York Session', active: true };
  }
  if (utcHour >= 0 && utcHour < 8) {
    return { label: 'Asian / Tokyo', active: true };
  }
  return { label: 'Sydney Rollover', active: false };
}

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<MainNavTab>('BRIDGE');
  const [activeSymbol, setActiveSymbol] = useState<string>('XAUUSD');
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'ZAR'>(() => {
    if (typeof window === 'undefined') return 'USD';
    return localStorage.getItem('titan_display_currency') === 'ZAR' ? 'ZAR' : 'USD';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState<boolean>(false);
  const [isEcosystemDrawerOpen, setIsEcosystemDrawerOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState<boolean>(false);
  const [modalSymbol, setModalSymbol] = useState<string>('XAUUSD');
  const [modalSide, setModalSide] = useState<OrderSide>('BUY');
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState<boolean>(false);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [utcNow, setUtcNow] = useState<Date>(() => new Date());
  const { brand, accent, getModuleMeta, ownershipHash } = useBrand();

  useEffect(() => {
    const timer = setInterval(() => setUtcNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCurrencyChange = (currency: 'USD' | 'ZAR') => {
    setDisplayCurrency(currency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('titan_display_currency', currency);
    }
  };

  // Global Google Maps Platform Quota Exceeded Listener
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut for Command Deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    positions,
    pendingOrders,
    freeMargin,
    automatedSettings,
    executeKillSwitch,
    executeOrder,
  } = useTrading();

  const handleOpenOrderModal = (symbol = activeSymbol, side: OrderSide = 'BUY') => {
    setModalSymbol(symbol);
    setModalSide(side);
    setIsOrderModalOpen(true);
  };

  const handleOpenInBridge = (symbol: string) => {
    setActiveSymbol(symbol);
    setCurrentTab('BRIDGE');
  };

  const handleExecuteSignalDirect = async (
    symbol: string,
    side: OrderSide,
    sl: number,
    tp: number,
    lots = 1.0
  ) => {
    await executeOrder({
      symbol,
      orderType: 'MARKET',
      side,
      lots,
      sl,
      tp,
      comment: 'EasyWay2Trade_Direct_Execution',
    });
  };

  const activeMeta = getModuleMeta(currentTab);
  const activeGlassMeta = GLASS_STYLE_META[brand.glassStyle || 'LIQUID'];
  const sessionInfo = getUtcMarketSession(utcNow.getUTCHours());
  const utcClock = `${String(utcNow.getUTCHours()).padStart(2, '0')}:${String(
    utcNow.getUTCMinutes()
  ).padStart(2, '0')} UTC`;

  return (
    <div className="min-h-screen sovereign-glass-canvas sovereign-glass-stage text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200 relative overflow-x-hidden">
      <MarketSpeechWatcher />

      {/* Google Maps Platform Quota Exceeded Sticky Notice */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Institutional Top Header */}
      <TopHeader
        onOpenOrderModal={() => handleOpenOrderModal(activeSymbol, 'BUY')}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenEcosystemDrawer={() => setIsEcosystemDrawerOpen(true)}
        onSelectSymbol={handleOpenInBridge}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenBrandStudio={() => setIsBrandModalOpen(true)}
        displayCurrency={displayCurrency}
      />

      {/* Main Workspace: Left Docked Sidebar (Desktop) + Central Content Stage */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
          onOpenBrandStudio={() => setIsBrandModalOpen(true)}
        />

        {/* Central Workspace Stage */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 pb-24 lg:pb-8">
          <div className="max-w-[1800px] w-full mx-auto">
            {/* Contextual Workspace Bar + Quick Desk Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 mb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2 text-xs min-w-0">
                  <span className="text-slate-500 font-medium hidden sm:inline whitespace-nowrap">
                    {activeMeta.group}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline shrink-0" />
                  <span className="text-sm font-bold text-white font-display tracking-tight truncate">
                    {activeMeta.label}
                  </span>
                </div>

                {/* Quick Core Desk Jump Strip (Desktop XL) */}
                <div className="hidden xl:flex items-center gap-1 pl-3 border-l border-white/[0.08] text-[11px]">
                  {(
                    [
                      { id: 'BRIDGE', label: getModuleMeta('BRIDGE').label, icon: Layers },
                      { id: 'EA_LAUNCHER', label: getModuleMeta('EA_LAUNCHER').label, icon: Smartphone },
                      { id: 'EAMERGE', label: getModuleMeta('EAMERGE').label, icon: GitMerge },
                      { id: 'AVIATOR', label: getModuleMeta('AVIATOR').label, icon: Flame },
                    ] as const
                  ).map((desk) => {
                    const DeskIcon = desk.icon;
                    const active = currentTab === desk.id;
                    return (
                      <button
                        key={desk.id}
                        type="button"
                        onClick={() => setCurrentTab(desk.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap ${
                          active
                            ? `${accent.bgClass} ${accent.softClass} border ${accent.borderClass}`
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                        }`}
                      >
                        <DeskIcon className="w-3 h-3" />
                        <span>{desk.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                {/* Active Glass UI Style Quick Switcher Pill */}
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] backdrop-blur-md text-[11px] font-medium text-slate-200 transition whitespace-nowrap"
                  title="Switch Glass UI Style & Theme Palette"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${accent.textClass}`} />
                  <span>{activeGlassMeta.label} Glass</span>
                </button>

                {/* Unboxed Margin & Auto-Pilot Readout */}
                <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] backdrop-blur-md border border-white/[0.09] text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">
                    Free{' '}
                    <b className="text-slate-100">
                      ${Math.round(freeMargin).toLocaleString()}
                    </b>
                  </span>
                  <span className="text-slate-700" aria-hidden="true">|</span>
                  <span className={automatedSettings.masterAutoTrading ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    Auto-Pilot {automatedSettings.masterAutoTrading ? 'ON' : 'PAUSED'}
                  </span>
                </div>

                {/* Live UTC Session Killzone */}
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0F141E] border border-white/[0.08] text-[11px] font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-200 font-semibold">{sessionInfo.label}</span>
                  <span className="text-slate-500">· {utcClock}</span>
                </div>

                {/* Display Currency Switcher (USD / ZAR) */}
                <div className="flex items-center bg-[#0F141E] p-0.5 rounded-lg border border-white/[0.08] text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('USD')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      displayCurrency === 'USD'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    USD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('ZAR')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      displayCurrency === 'ZAR'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ZAR
                  </button>
                </div>

                {/* Voice Dispatch Controls Popover */}
                <VoiceSettingsPopover />

                {/* Quick AI Chart Scanner Action */}
                {currentTab !== 'AI_SCANNER' && (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('AI_SCANNER')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0F141E] hover:bg-[#141B29] border border-cyan-500/30 text-cyan-300 text-xs font-medium transition whitespace-nowrap"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Scan Chart</span>
                  </button>
                )}
              </div>
            </div>

            {currentTab === 'ALGOMAX' && (
              <AlgoMaxPublicView onOpenAdminPortal={() => setCurrentTab('ALGOADMIN')} />
            )}

            {currentTab === 'ALGOADMIN' && (
              <AlgoAdminPortalView onOpenPublicSite={() => setCurrentTab('ALGOMAX')} />
            )}

            {currentTab === 'EA_LAUNCHER' && (
              <EAMobileLauncherView
                displayCurrency={displayCurrency}
                onCurrencyChange={handleCurrencyChange}
                onOpenAIScanner={() => setCurrentTab('AI_SCANNER')}
                onOpenInBridge={handleOpenInBridge}
                onOpenConverterAdmin={() => setCurrentTab('EACONVERTER')}
              />
            )}

            {currentTab === 'NEXUS' && <Nexus2KanteView />}

            {currentTab === 'AVIATOR' && <NguniAviatorApp />}

            {currentTab === 'WORKSPACE' && <GoogleWorkspaceHubView />}

            {currentTab === 'AI_SCANNER' && (
              <AIChartScannerView
                displayCurrency={displayCurrency}
                onOpenInBridge={handleOpenInBridge}
              />
            )}

            {currentTab === 'BRIDGE' && (
              <UnifiedOmniTradeBridgeView
                onOpenOrderModal={handleOpenOrderModal}
                onOpenWorkspaceHub={() => setCurrentTab('WORKSPACE')}
                onOpenAIScanner={() => setCurrentTab('AI_SCANNER')}
                activeSymbol={activeSymbol}
                onSymbolChange={setActiveSymbol}
                displayCurrency={displayCurrency}
                onCurrencyChange={handleCurrencyChange}
              />
            )}

            {currentTab === 'AUTOTRADE' && <AutomatedTradingHubView />}

            {currentTab === 'LIQUIDITY_EDGE' && <LiquidityEdgeEAView />}

            {currentTab === 'MAP' && <GlobalLiquidityMapView />}

            {currentTab === 'SCRIPTS' && <HighLevelScriptsVaultView />}

            {currentTab === 'EASYWAY' && (
              <EasyWay2TradeView onExecuteSignal={handleExecuteSignalDirect} />
            )}

            {currentTab === 'EMERGE' && <EmergePropView />}

            {currentTab === 'EACONNECT' && <EAConnectView />}

            {currentTab === 'EAVAULT' && <EAVaultView />}

            {currentTab === 'EACONVERTER' && (
              <EAConverterAdminView
                onOpenMobileLauncher={() => setCurrentTab('EA_LAUNCHER')}
              />
            )}
            {currentTab === 'EAMIGRATE' && <EAMigrateProView />}
            {currentTab === 'TRADEPORT' && <TradePortEAView />}
            {currentTab === 'EAMATRIX' && <EAMatrixView />}
            {currentTab === 'ALGOHOST' && <AlgoHostView />}
            {currentTab === 'EACENTRAL' && <EACentralView />}
            {currentTab === 'ITRADEBOT' && <ITradeBotView />}
            {currentTab === 'EAMERGE' && <EAMergeView />}

            {/* Sovereign Full IP & Ownership Attribution Strip */}
            {brand.showOwnershipStrip && (
              <footer className="mt-8 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <ShieldCheck className={`w-3.5 h-3.5 ${accent.textClass}`} />
                    <span>{brand.brandName}</span>
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>Owner: <strong className="text-slate-200">{brand.ownerName}</strong></span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>{brand.ownerEntity}</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono text-emerald-400">{brand.licenseOwnership}</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500 tabular-nums">IP Hash 0x{ownershipHash.slice(0, 8)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F141E] hover:bg-[#161D2B] border border-white/[0.08] text-slate-200 hover:text-white font-medium transition whitespace-nowrap"
                >
                  <KeyRound className={`w-3.5 h-3.5 ${accent.textClass}`} />
                  <span>Brand &amp; Ownership Studio</span>
                </button>
              </footer>
            )}
          </div>
        </main>
      </div>

      {/* Desktop Bottom Exposure & Action Bar */}
      <BottomBar onOpenKillSwitch={() => setIsKillSwitchOpen(true)} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenEcosystemDrawer={() => setIsEcosystemDrawerOpen(true)}
      />

      {/* Mobile Ecosystem Action Drawer */}
      <MobileEcosystemDrawer
        isOpen={isEcosystemDrawerOpen}
        onClose={() => setIsEcosystemDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
        onOpenBrandStudio={() => setIsBrandModalOpen(true)}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setCurrentTab}
        onQuickTrade={(sym, side) => handleOpenOrderModal(sym, side)}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
        onOpenBrandStudio={() => setIsBrandModalOpen(true)}
        displayCurrency={displayCurrency}
        onToggleCurrency={() =>
          handleCurrencyChange(displayCurrency === 'USD' ? 'ZAR' : 'USD')
        }
      />

      {/* Brand & Full Ownership Studio Modal */}
      <BrandOwnershipModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />

      {/* Order Execution Modal */}
      <OrderExecutionModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialSymbol={modalSymbol}
        initialSide={modalSide}
      />

      {/* MT5 Broker Credentials Modal */}
      <MT5BrokerConnectionModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
      />

      {/* Global Emergency Kill Switch Modal */}
      <KillSwitchModal
        isOpen={isKillSwitchOpen}
        positionCount={positions.length}
        pendingCount={pendingOrders.length}
        onClose={() => setIsKillSwitchOpen(false)}
        onConfirm={executeKillSwitch}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrandProvider>
        <TradingProvider>
          <MainApp />
        </TradingProvider>
      </BrandProvider>
    </ErrorBoundary>
  );
}
