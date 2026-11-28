import React, { useState } from 'react';
import {
  useBrand,
  BRAND_ACCENT_META,
  GLASS_STYLE_META,
  BrandAccentTheme,
  GlassStyleMode,
  SOVEREIGN_MODULE_META,
} from '../../context/BrandContext';
import type { MainNavTab } from './Sidebar';
import {
  X,
  ShieldCheck,
  Palette,
  Download,
  RotateCcw,
  Check,
  Sparkles,
  KeyRound,
  Layers,
} from 'lucide-react';

interface BrandOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BRAND_PRESETS: Array<{
  label: string;
  brandName: string;
  brandTagline: string;
  accentTheme: BrandAccentTheme;
}> = [
  {
    label: 'Apex Sovereign',
    brandName: 'APEX SOVEREIGN',
    brandTagline: 'Proprietary Quant OS · Autonomous DMA Infrastructure',
    accentTheme: 'CYAN',
  },
  {
    label: 'Kante Quant Lab',
    brandName: 'KANTE QUANT',
    brandTagline: 'Private Institutional Execution & Bot Architecture',
    accentTheme: 'GOLD',
  },
  {
    label: 'Vanguard Alpha OS',
    brandName: 'VANGUARD ALPHA',
    brandTagline: 'Full-Stack Multi-Broker Trading & Cloud Fleet',
    accentTheme: 'EMERALD',
  },
  {
    label: 'Crimson Citadel',
    brandName: 'CRIMSON CITADEL',
    brandTagline: 'Ultra-Low-Latency Quantitative Execution Suite',
    accentTheme: 'CRIMSON',
  },
];

export const BrandOwnershipModal: React.FC<BrandOwnershipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    brand,
    accent,
    updateBrand,
    setModuleOverride,
    resetBrand,
    ownershipHash,
    exportOwnershipManifest,
  } = useBrand();

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'MODULES'>('IDENTITY');
  const [savedToast, setSavedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl glass-ultra border border-white/[0.14] rounded-2xl overflow-hidden flex flex-col max-h-[88vh] shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-[#090C12] border-b border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${accent.bgClass} border ${accent.borderClass} flex items-center justify-center ${accent.textClass} shrink-0`}>
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white font-display tracking-tight">
                  Brand &amp; Full Ownership Studio
                </h2>
                <span className="text-[10px] font-mono font-semibold text-emerald-400">
                  IP HASH 0x{ownershipHash.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Customize flagship identity, owner attribution, accent palette &amp; module names globally
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#161D2B] hover:bg-[#1E2738] text-slate-400 hover:text-white border border-white/[0.08] transition shrink-0"
            aria-label="Close studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="px-5 pt-3 bg-[#090C12] border-b border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('IDENTITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'IDENTITY'
                  ? accent.bgSolidClass
                  : 'bg-[#161D2B] text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Brand &amp; Ownership</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MODULES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'MODULES'
                  ? accent.bgSolidClass
                  : 'bg-[#161D2B] text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rename Any Page ({Object.keys(SOVEREIGN_MODULE_META).length})</span>
            </button>
          </div>

          {savedToast && (
            <div className="pb-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>{savedToast}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-5 flex-1 text-xs">
          {activeTab === 'IDENTITY' ? (
            <>
              {/* One-Click Identity Presets */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Sovereign Rebrand Presets</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BRAND_PRESETS.map((preset) => {
                    const isSelected = brand.brandName === preset.brandName;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          updateBrand({
                            brandName: preset.brandName,
                            brandTagline: preset.brandTagline,
                            accentTheme: preset.accentTheme,
                          });
                          triggerToast(`Applied ${preset.label} identity`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? `${accent.bgClass} ${accent.borderClass} text-white`
                            : 'bg-[#161D2B] border-white/[0.06] text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{preset.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {BRAND_ACCENT_META[preset.accentTheme].label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Identity & Legal Attribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Flagship Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand.brandName}
                    onChange={(e) => updateBrand({ brandName: e.target.value })}
                    placeholder="e.g. APEX SOVEREIGN"
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2B] border border-white/[0.1] text-white font-semibold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Proprietary License Statement
                  </label>
                  <input
                    type="text"
                    value={brand.licenseOwnership}
                    onChange={(e) => updateBrand({ licenseOwnership: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2B] border border-white/[0.1] text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Principal Owner Name
                  </label>
                  <input
                    type="text"
                    value={brand.ownerName}
                    onChange={(e) => updateBrand({ ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2B] border border-white/[0.1] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Legal Entity / Desk Name
                  </label>
                  <input
                    type="text"
                    value={brand.ownerEntity}
                    onChange={(e) => updateBrand({ ownerEntity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2B] border border-white/[0.1] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Owner Contact / License Email
                  </label>
                  <input
                    type="email"
                    value={brand.ownerEmail}
                    onChange={(e) => updateBrand({ ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2B] border border-white/[0.1] text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Platform Tagline
                  </label>
                  <input
                    type="text"
                    value={brand.brandTagline}
                    onChange={(e) => updateBrand({ brandTagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D2B] border border-white/[0.1] text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Signature Accent Theme Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Global Signature Accent Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(BRAND_ACCENT_META) as BrandAccentTheme[]).map((themeKey) => {
                    const meta = BRAND_ACCENT_META[themeKey];
                    const active = brand.accentTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => updateBrand({ accentTheme: themeKey })}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                          active
                            ? `${meta.bgClass} ${meta.borderClass} text-white`
                            : 'bg-[#161D2B]/70 border-white/[0.06] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span className="font-semibold text-[11px] truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Global Glass Style Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Global Glass UI Style (All Pages)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(GLASS_STYLE_META) as GlassStyleMode[]).map((styleKey) => {
                    const meta = GLASS_STYLE_META[styleKey];
                    const active = brand.glassStyle === styleKey;
                    return (
                      <button
                        key={styleKey}
                        type="button"
                        onClick={() => {
                          updateBrand({ glassStyle: styleKey });
                          triggerToast(`Glass Style set to ${meta.label}`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          active
                            ? `${accent.bgClass} ${accent.borderClass} text-white`
                            : 'bg-[#161D2B]/70 border-white/[0.06] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-[11px]">{meta.label}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {meta.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persistent Ownership Footer Strip Toggle */}
              <div className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.08] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Show Sovereign Ownership Attribution Strip Across Pages</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Displays your legal entity, owner license hash, and quick rebrand control on every workspace module.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={brand.showOwnershipStrip}
                  onChange={(e) => updateBrand({ showOwnershipStrip: e.target.checked })}
                  className="accent-cyan-500 w-4 h-4 rounded shrink-0"
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400">
                Rename any of the {Object.keys(SOVEREIGN_MODULE_META).length} workspace pages below. Changes take effect immediately across the sidebar, mobile drawer, header breadcrumbs, and command palette.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(SOVEREIGN_MODULE_META) as MainNavTab[]).map((tab) => {
                  const base = SOVEREIGN_MODULE_META[tab];
                  const val = brand.moduleOverrides?.[tab] ?? '';
                  return (
                    <div
                      key={tab}
                      className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">{base.group}</span>
                        <span className="font-mono text-slate-500">{tab}</span>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setModuleOverride(tab, e.target.value)}
                        placeholder={base.label}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#090C12] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#090C12] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetBrand();
                triggerToast('Restored default Sovereign branding');
              }}
              className="px-3 py-2 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportOwnershipManifest();
                triggerToast('Exported signed IP Ownership Manifest JSON');
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ownership Manifest</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition ${accent.bgSolidClass}`}
          >
            Done &amp; Apply Globally
          </button>
        </div>
      </div>
    </div>
  );
};
