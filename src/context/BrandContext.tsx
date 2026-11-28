import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MainNavTab } from '../components/layout/Sidebar';
import { sha256Hex } from '../lib/crypto';

export type BrandAccentTheme =
  | 'CYAN'
  | 'GOLD'
  | 'EMERALD'
  | 'CRIMSON'
  | 'PURPLE'
  | 'BLUE'
  | 'ORANGE';

export type GlassStyleMode = 'LIQUID' | 'NEON' | 'MINIMAL' | 'COMMAND' | 'MECH';

export interface BrandConfig {
  brandName: string;
  brandTagline: string;
  ownerName: string;
  ownerEntity: string;
  ownerEmail: string;
  licenseOwnership: string;
  accentTheme: BrandAccentTheme;
  glassStyle: GlassStyleMode;
  showOwnershipStrip: boolean;
  moduleOverrides: Partial<Record<MainNavTab, string>>;
}

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brandName: 'APEX SOVEREIGN',
  brandTagline: 'Proprietary Quant OS · Autonomous DMA Infrastructure',
  ownerName: 'Thulani Myeni',
  ownerEntity: 'Myeni Quantitative Capital (Pty) Ltd',
  ownerEmail: 'thulanimyeni19712@gmail.com',
  licenseOwnership: '100% FULL SOURCE & IP OWNERSHIP',
  accentTheme: 'CYAN',
  glassStyle: 'LIQUID',
  showOwnershipStrip: true,
  moduleOverrides: {},
};

export const GLASS_STYLE_META: Record<
  GlassStyleMode,
  { label: string; description: string }
> = {
  LIQUID: { label: 'Liquid', description: 'Translucent obsidian glass with ambient refraction' },
  NEON: { label: 'Neon', description: 'Crisp border aura & illuminated specular edge' },
  MINIMAL: { label: 'Minimal', description: 'Low-contrast smoked architectural glass' },
  COMMAND: { label: 'Command', description: 'High-density tactical frosted desk' },
  MECH: { label: 'Mech', description: 'Angular precision cyber-hud glass' },
};

export const BRAND_ACCENT_META: Record<
  BrandAccentTheme,
  {
    label: string;
    hex: string;
    rgb: string;
    textClass: string;
    bgClass: string;
    bgSolidClass: string;
    borderClass: string;
    softClass: string;
  }
> = {
  CYAN: {
    label: 'Obsidian Cyan',
    hex: '#06b6d4',
    rgb: '6, 182, 212',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/15',
    bgSolidClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    borderClass: 'border-cyan-500/40',
    softClass: 'text-cyan-300',
  },
  PURPLE: {
    label: 'Nexus Purple',
    hex: '#a855f7',
    rgb: '168, 85, 247',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/15',
    bgSolidClass: 'bg-purple-500 hover:bg-purple-400 text-white',
    borderClass: 'border-purple-500/40',
    softClass: 'text-purple-300',
  },
  BLUE: {
    label: 'Electric Blue',
    hex: '#3b82f6',
    rgb: '59, 130, 246',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15',
    bgSolidClass: 'bg-blue-500 hover:bg-blue-400 text-white',
    borderClass: 'border-blue-500/40',
    softClass: 'text-blue-300',
  },
  EMERALD: {
    label: 'Emerald Alpha',
    hex: '#10b981',
    rgb: '16, 185, 129',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15',
    bgSolidClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    borderClass: 'border-emerald-500/40',
    softClass: 'text-emerald-300',
  },
  GOLD: {
    label: 'Sovereign Gold',
    hex: '#f59e0b',
    rgb: '245, 158, 11',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15',
    bgSolidClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    borderClass: 'border-amber-500/40',
    softClass: 'text-amber-300',
  },
  ORANGE: {
    label: 'Solar Orange',
    hex: '#f97316',
    rgb: '249, 115, 22',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500/15',
    bgSolidClass: 'bg-orange-500 hover:bg-orange-400 text-slate-950',
    borderClass: 'border-orange-500/40',
    softClass: 'text-orange-300',
  },
  CRIMSON: {
    label: 'Titanium Crimson',
    hex: '#f43f5e',
    rgb: '244, 63, 94',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500/15',
    bgSolidClass: 'bg-rose-500 hover:bg-rose-400 text-white',
    borderClass: 'border-rose-500/40',
    softClass: 'text-rose-300',
  },
};

export const SOVEREIGN_MODULE_META: Record<
  MainNavTab,
  { group: string; label: string; subtext: string }
> = {
  BRIDGE: {
    group: 'Command & AI',
    label: 'Sovereign Omni-Bridge',
    subtext: 'Unified chart & DMA trade desk',
  },
  AI_SCANNER: {
    group: 'Command & AI',
    label: 'Vision Alpha Scanner',
    subtext: 'AI chart setup & trade builder',
  },
  AUTOTRADE: {
    group: 'Command & AI',
    label: 'Autonomous Risk Matrix',
    subtext: 'Zero-ruin guard & bot routing',
  },
  EAMERGE: {
    group: 'Execution & Bots',
    label: 'EA Merge Cloud',
    subtext: 'Multi-EA consensus & signal fusion',
  },
  EA_LAUNCHER: {
    group: 'Execution & Bots',
    label: 'Pocket EA Launcher',
    subtext: '11 proprietary mobile bot builds',
  },
  NEXUS: {
    group: 'Execution & Bots',
    label: 'Sovereign Scalper X2',
    subtext: 'Neural SMC & multi-ticket deck',
  },
  LIQUIDITY_EDGE: {
    group: 'Execution & Bots',
    label: 'Liquidity Sweep Pro',
    subtext: 'Session sweeps & order blocks',
  },
  AVIATOR: {
    group: 'Execution & Bots',
    label: 'Apex Crash Quant v6',
    subtext: 'Trajectory analytics & EA trade lab',
  },
  EASYWAY: {
    group: 'Execution & Bots',
    label: 'Velocity HFT Suite',
    subtext: 'Endgame HFT & Shadow River bots',
  },
  ALGOMAX: {
    group: 'Execution & Bots',
    label: 'Flagship Algo Suite',
    subtext: 'Institutional MT4/MT5 license suite',
  },
  EMERGE: {
    group: 'Prop & Analytics',
    label: 'Funded Desk Evaluator',
    subtext: 'Evaluation rules & certificates',
  },
  MAP: {
    group: 'Prop & Analytics',
    label: 'Global Liquidity Radar',
    subtext: 'LD4 / NY4 / TY3 exchange hubs',
  },
  SCRIPTS: {
    group: 'Prop & Analytics',
    label: 'Quant Source Vault',
    subtext: 'MQL5, PineScript & Python IP',
  },
  WORKSPACE: {
    group: 'Cloud & Infrastructure',
    label: 'Workspace Command',
    subtext: 'Calendar, Docs, Slides, Forms, Meet',
  },
  EACONNECT: {
    group: 'Cloud & Infrastructure',
    label: 'Cloud Copier Matrix',
    subtext: 'Multi-terminal VPS synchronization',
  },
  EAMATRIX: {
    group: 'Cloud & Infrastructure',
    label: 'EA Matrix Mobile Grid',
    subtext: 'Phone MT4/MT5 control & mentor copy',
  },
  ALGOHOST: {
    group: 'Cloud & Infrastructure',
    label: 'AlgoHost Pro VPS',
    subtext: 'Headless MT4/MT5 cloud containers',
  },
  EACENTRAL: {
    group: 'Cloud & Infrastructure',
    label: 'EA Central Mirror',
    subtext: 'Desktop EA to mobile client bridge',
  },
  EAMIGRATE: {
    group: 'Cloud & Infrastructure',
    label: 'Zero-PC Cloud Host',
    subtext: '24/7 hosted terminal fleet',
  },
  TRADEPORT: {
    group: 'Cloud & Infrastructure',
    label: 'Fixed-Term Port Host',
    subtext: 'Dedicated mobile execution ports',
  },
  EAVAULT: {
    group: 'Cloud & Infrastructure',
    label: 'Proprietary Key Vault',
    subtext: 'HWID licensing & .SET presets',
  },
  EACONVERTER: {
    group: 'Cloud & Infrastructure',
    label: 'White-Label App Studio',
    subtext: 'Custom rebranding & activations',
  },
  ALGOADMIN: {
    group: 'Cloud & Infrastructure',
    label: 'Master Owner Console',
    subtext: 'Full IP control, fleet & kill switch',
  },
  ITRADEBOT: {
    group: 'Execution & Bots',
    label: 'iTradeBot Studio AI',
    subtext: 'AI chart scan & no-code EA builder',
  },
};

const STORAGE_KEY = 'sovereign_brand_manifest_v1';

interface BrandContextValue {
  brand: BrandConfig;
  accent: (typeof BRAND_ACCENT_META)[BrandAccentTheme];
  updateBrand: (patch: Partial<BrandConfig>) => void;
  setModuleOverride: (tab: MainNavTab, customTitle: string) => void;
  resetBrand: () => void;
  getModuleMeta: (tab: MainNavTab) => { group: string; label: string; subtext: string };
  ownershipHash: string;
  exportOwnershipManifest: () => void;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_BRAND_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_BRAND_CONFIG;
      const parsed = JSON.parse(raw) as Partial<BrandConfig>;
      return {
        ...DEFAULT_BRAND_CONFIG,
        ...parsed,
        glassStyle: parsed.glassStyle || DEFAULT_BRAND_CONFIG.glassStyle,
        moduleOverrides: {
          ...DEFAULT_BRAND_CONFIG.moduleOverrides,
          ...(parsed.moduleOverrides || {}),
        },
      };
    } catch {
      return DEFAULT_BRAND_CONFIG;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
    } catch {
      // Ignore storage quota errors cleanly
    }
    const accentMeta = BRAND_ACCENT_META[brand.accentTheme] || BRAND_ACCENT_META.CYAN;
    document.documentElement.style.setProperty('--brand-accent', accentMeta.hex);
    document.documentElement.style.setProperty('--brand-accent-rgb', accentMeta.rgb);
    document.documentElement.setAttribute(
      'data-glass-style',
      (brand.glassStyle || 'LIQUID').toLowerCase()
    );
  }, [brand]);

  const updateBrand = useCallback((patch: Partial<BrandConfig>) => {
    setBrand((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  const setModuleOverride = useCallback((tab: MainNavTab, customTitle: string) => {
    setBrand((prev) => {
      const nextOverrides = { ...prev.moduleOverrides };
      if (!customTitle.trim()) {
        delete nextOverrides[tab];
      } else {
        nextOverrides[tab] = customTitle.trim();
      }
      return {
        ...prev,
        moduleOverrides: nextOverrides,
      };
    });
  }, []);

  const resetBrand = useCallback(() => {
    setBrand(DEFAULT_BRAND_CONFIG);
  }, []);

  const getModuleMeta = useCallback(
    (tab: MainNavTab) => {
      const base = SOVEREIGN_MODULE_META[tab];
      const override = brand.moduleOverrides?.[tab];
      return {
        ...base,
        label: override && override.trim() ? override.trim() : base.label,
      };
    },
    [brand.moduleOverrides]
  );

  const ownershipHash = sha256Hex(
    `${brand.brandName}|${brand.ownerEntity}|${brand.ownerEmail}|${brand.licenseOwnership}`
  )
    .slice(0, 16)
    .toUpperCase();

  const exportOwnershipManifest = useCallback(() => {
    const manifest = {
      schema: 'SOVEREIGN_IP_OWNERSHIP_MANIFEST_V1',
      issuedAt: new Date().toISOString(),
      verificationHash: `0x${ownershipHash}`,
      ownership: {
        brandName: brand.brandName,
        brandTagline: brand.brandTagline,
        ownerName: brand.ownerName,
        ownerEntity: brand.ownerEntity,
        ownerEmail: brand.ownerEmail,
        rights: brand.licenseOwnership,
        accentTheme: brand.accentTheme,
      },
      modules: (Object.keys(SOVEREIGN_MODULE_META) as MainNavTab[]).map((tab) => ({
        id: tab,
        group: SOVEREIGN_MODULE_META[tab].group,
        displayTitle: brand.moduleOverrides?.[tab] || SOVEREIGN_MODULE_META[tab].label,
        description: SOVEREIGN_MODULE_META[tab].subtext,
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_ownership_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [brand, ownershipHash]);

  const accent = BRAND_ACCENT_META[brand.accentTheme] || BRAND_ACCENT_META.CYAN;

  return (
    <BrandContext.Provider
      value={{
        brand,
        accent,
        updateBrand,
        setModuleOverride,
        resetBrand,
        getModuleMeta,
        ownershipHash,
        exportOwnershipManifest,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = (): BrandContextValue => {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error('useBrand must be used inside a BrandProvider');
  }
  return ctx;
};
