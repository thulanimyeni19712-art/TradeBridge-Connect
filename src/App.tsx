import React, { useState, useEffect } from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { TopHeader } from './components/layout/TopHeader';
import { Sidebar, MainNavTab } from './components/layout/Sidebar';
import { BottomBar } from './components/layout/BottomBar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileEcosystemDrawer } from './components/layout/MobileEcosystemDrawer';
import { CommandPaletteModal } from './components/layout/CommandPaletteModal';
import { TradingBridgeView } from './components/bridge/TradingBridgeView';
import { OrderExecutionModal } from './components/bridge/OrderExecutionModal';
import { KillSwitchModal } from './components/bridge/PartialCloseModal';
import { AutomatedTradingHubView } from './components/automated/AutomatedTradingHubView';
import { HighLevelScriptsVaultView } from './components/scripts/HighLevelScriptsVaultView';
import { EasyWay2TradeView } from './components/easyway2trade/EasyWay2TradeView';
import { EmergePropView } from './components/emerge/EmergePropView';
import { EAConnectView } from './components/eaconnect/EAConnectView';
import { EAVaultView } from './components/eavault/EAVaultView';
import { EAConverterAdminView } from './components/eaconverter/EAConverterAdminView';
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
import { OrderSide } from './types/trading';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<MainNavTab>('BRIDGE');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState<boolean>(false);
  const [isEcosystemDrawerOpen, setIsEcosystemDrawerOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [modalSymbol, setModalSymbol] = useState<string>('XAUUSD');
  const [modalSide, setModalSide] = useState<OrderSide>('BUY');
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState<boolean>(false);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

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

  const { positions, pendingOrders, executeKillSwitch, executeOrder } = useTrading();

  const handleOpenOrderModal = (symbol = 'XAUUSD', side: OrderSide = 'BUY') => {
    setModalSymbol(symbol);
    setModalSide(side);
    setIsOrderModalOpen(true);
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

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300 relative overflow-x-hidden font-mono">
      {/* UIDEX Ambient Lighting Grid & Holographic Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-gradient-to-bl from-amber-500/8 via-rose-500/4 to-transparent rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/8 via-cyan-500/4 to-transparent rounded-full blur-[180px]" />
        <div className="absolute inset-0 hud-grid opacity-30" />
      </div>

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

      {/* Institutional Top Header with Real-Time Ticker & Capital Shield */}
      <TopHeader
        onOpenOrderModal={() => handleOpenOrderModal('XAUUSD', 'BUY')}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenEcosystemDrawer={() => setIsEcosystemDrawerOpen(true)}
        onSelectSymbol={(sym) => handleOpenOrderModal(sym, 'BUY')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace: Left Docked Sidebar (Desktop) + Central Content Stage */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Docked Control Deck (Desktop Only, hidden on mobile) */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        />

        {/* Central Workspace Stage with Mobile Bottom Clearance */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 max-w-[1800px] w-full mx-auto pb-24 lg:pb-8">
          {currentTab === 'ALGOMAX' && (
            <AlgoMaxPublicView onOpenAdminPortal={() => setCurrentTab('ALGOADMIN')} />
          )}

          {currentTab === 'ALGOADMIN' && (
            <AlgoAdminPortalView onOpenPublicSite={() => setCurrentTab('ALGOMAX')} />
          )}

          {currentTab === 'NEXUS' && <Nexus2KanteView />}

          {currentTab === 'AVIATOR' && <NguniAviatorApp />}

          {currentTab === 'BRIDGE' && (
            <UnifiedOmniTradeBridgeView onOpenOrderModal={handleOpenOrderModal} />
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

          {currentTab === 'EACONVERTER' && <EAConverterAdminView />}
          {currentTab === 'EAMIGRATE' && <EAMigrateProView />}
          {currentTab === 'TRADEPORT' && <TradePortEAView />}
        </main>
      </div>

      {/* Desktop Institutional Bottom Status & Latency Telemetry (Hidden on Mobile) */}
      <BottomBar onOpenKillSwitch={() => setIsKillSwitchOpen(true)} />

      {/* Mobile-First Fixed Bottom Navigation Bar (Visible on Mobile < lg) */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenEcosystemDrawer={() => setIsEcosystemDrawerOpen(true)}
      />

      {/* Mobile-First Ecosystem Action Sheet / Drawer */}
      <MobileEcosystemDrawer
        isOpen={isEcosystemDrawerOpen}
        onClose={() => setIsEcosystemDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
      />

      {/* Global Command Palette / Quick Deck Modal (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setCurrentTab}
        onQuickTrade={(sym, side) => handleOpenOrderModal(sym, side)}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
      />

      {/* Global Order Execution Ticket Modal (Responsive Bottom-Sheet on Mobile) */}
      <OrderExecutionModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialSymbol={modalSymbol}
        initialSide={modalSide}
      />

      {/* Global MT5 Real Broker Credentials Modal (Responsive Bottom-Sheet on Mobile) */}
      <MT5BrokerConnectionModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
      />

      {/* Global Emergency Kill Switch Modal (Responsive Bottom-Sheet on Mobile) */}
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
      <TradingProvider>
        <MainApp />
      </TradingProvider>
    </ErrorBoundary>
  );
}
