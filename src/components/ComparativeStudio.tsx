import { useState } from 'react';
import { Plus, Sparkles, MessageSquare } from 'lucide-react';
import {
  ITEM_ASSETS,
  PORTRAIT_ASSETS,
  STUDIO_LIGHTING_MODES,
} from '../data/atelierData';
import {
  scoreItemCompatibility,
  type ClientProfile,
  type CurationItem,
  type PaletteSwatch,
  type StudioLighting,
} from '../utils/atelierEngine';
import { AtelierImage } from './AtelierImage';

interface ComparativeStudioProps {
  activeClient: ClientProfile;
  catalog: CurationItem[];
  onAddToBag: (item: CurationItem, swatch: PaletteSwatch, note: string) => void;
  onAskFollowUp: (item: CurationItem, rationale: string) => void;
}

export function ComparativeStudio({
  activeClient,
  catalog,
  onAddToBag,
  onAskFollowUp,
}: ComparativeStudioProps) {
  const [selectedItemId, setSelectedItemId] = useState(catalog[0].id);
  const [lighting, setLighting] = useState<StudioLighting>('daylight');
  const [veilOpacity, setVeilOpacity] = useState(26);

  const selectedItem =
    catalog.find((c) => c.id === selectedItemId) ?? catalog[0];
  const [selectedSwatchId, setSelectedSwatchId] = useState(
    selectedItem.swatches[0].id,
  );

  const activeSwatch =
    selectedItem.swatches.find((s) => s.id === selectedSwatchId) ??
    selectedItem.swatches[0];

  const activeLight =
    STUDIO_LIGHTING_MODES.find((l) => l.id === lighting) ??
    STUDIO_LIGHTING_MODES[0];

  const compatibility = scoreItemCompatibility(selectedItem, activeClient);

  const handleSelectItem = (item: CurationItem) => {
    setSelectedItemId(item.id);
    setSelectedSwatchId(item.swatches[0].id);
  };

  return (
    <section aria-labelledby="comparative-heading" className="space-y-8">
      {/* Header + Lighting Tactile Mode Switcher */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Side-by-Side Chromatic Workbench · {activeClient.name}
          </p>
          <h1
            id="comparative-heading"
            className="mt-1 font-display text-3xl font-medium tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl text-balance"
          >
            Clinical Scan vs. <span className="italic text-[#d0bcff]">Couture Render</span>
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="Studio lighting simulation"
          className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#0a0e16] p-1 border border-white/10"
        >
          {STUDIO_LIGHTING_MODES.map((mode) => {
            const active = lighting === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLighting(mode.id)}
                className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-[#262a33] text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(248,250,252,0.14)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Comparative Frames */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Client Dermal & Undertone Frame with Chromatic Veil */}
        <div className="atelier-glass-tier-2 flex flex-col justify-between rounded-2xl p-5 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Subject Complexion · {activeClient.undertone}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC]">
                {activeClient.name} · {activeClient.season}
              </p>
            </div>
            <span className="text-xs font-medium text-[#d0bcff] tabular-nums">
              {activeLight.kelvin}
            </span>
          </div>

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0e16] lg:h-[490px] lg:aspect-auto">
            <AtelierImage
              src={PORTRAIT_ASSETS[activeClient.portraitKey]}
              alt={`${activeClient.name} complexion under ${activeLight.label}`}
              fallbackTitle={activeClient.name}
              className="h-full w-full object-cover object-[50%_14%] transition-[filter] duration-300"
              style={{ filter: activeLight.filterCss }}
            />
            {/* Ambient Lighting Cast */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${activeLight.ambientClass}`}
            />
            {/* Interactive Chromatic Swatch Veil */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle at 50% 42%, ${activeSwatch.secondaryHex}, ${activeSwatch.primaryHex} 75%)`,
                opacity: veilOpacity / 100,
              }}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/40 to-transparent p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[#cbd5e1]">
                  Simulated Swatch Reflection: {activeSwatch.name}
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] tabular-nums">
                  {veilOpacity}% Veil
                </span>
              </div>
            </div>
          </div>

          {/* Veil Intensity Slider */}
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
            <label
              htmlFor="veil-intensity"
              className="text-xs font-medium text-[#94A3B8] whitespace-nowrap"
            >
              Chromatic Veil Density
            </label>
            <input
              id="veil-intensity"
              type="range"
              min={0}
              max={60}
              value={veilOpacity}
              onChange={(e) => setVeilOpacity(Number(e.target.value))}
              className="w-48 accent-[#8B5CF6]"
            />
          </div>
        </div>

        {/* Right: Paired Couture / Cosmetic Render */}
        <div className="atelier-glass-tier-2 flex flex-col justify-between rounded-2xl p-5 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Paired Atelier Piece · {selectedItem.houseLine}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC]">
                {selectedItem.title}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#4edea3] tabular-nums">
              {compatibility.score}% Harmony
            </span>
          </div>

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0e16] lg:h-[490px] lg:aspect-auto">
            <AtelierImage
              src={ITEM_ASSETS[selectedItem.imageKey]}
              alt={`${selectedItem.title} under ${activeLight.label}`}
              fallbackTitle={selectedItem.title}
              className="h-full w-full object-cover transition-[filter] duration-300"
              style={{ filter: activeLight.filterCss }}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 bg-gradient-to-tl ${activeLight.ambientClass}`}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/40 to-transparent p-5">
              <p className="text-xs text-[#4edea3]">{compatibility.matchLabel}</p>
              <p className="mt-1 text-xs text-[#cbd5e1]">{compatibility.rationale}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              {selectedItem.swatches.map((sw) => {
                const active = sw.id === activeSwatch.id;
                return (
                  <button
                    key={sw.id}
                    type="button"
                    onClick={() => setSelectedSwatchId(sw.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                      active
                        ? 'bg-[#1c2028] border-[#d0bcff]/60 text-[#F8FAFC]'
                        : 'bg-[#0a0e16]/70 border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 rounded-full border border-white/25"
                      style={{
                        background: `linear-gradient(135deg, ${sw.primaryHex} 50%, ${sw.secondaryHex} 50%)`,
                      }}
                    />
                    <span className="whitespace-nowrap">{sw.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onAskFollowUp(
                    selectedItem,
                    `${compatibility.rationale} · Viewed under ${activeLight.label} (${activeLight.kelvin}) with ${activeSwatch.name}`,
                  )
                }
                className="atelier-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-[#d0bcff] whitespace-nowrap"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ask Follow-Up</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onAddToBag(
                    selectedItem,
                    activeSwatch,
                    `Calibrated under ${activeLight.label}`,
                  )
                }
                className="atelier-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Add Paired Piece · €{selectedItem.priceEur.toLocaleString('en-US')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Piece Selector Strip */}
      <div className="atelier-surface-1 rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#d0bcff]" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Select Archive Piece to Compare
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {catalog.map((item) => {
            const active = item.id === selectedItem.id;
            const itemScore = scoreItemCompatibility(item, activeClient).score;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectItem(item)}
                aria-pressed={active}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'bg-[#1c2028] border-[#8B5CF6]/65 shadow-[0_0_20px_-6px_rgba(139,92,246,0.35)]'
                    : 'bg-[#0a0e16]/70 border-white/8 hover:border-white/20'
                }`}
              >
                <span className="text-[11px] font-semibold text-[#4edea3] tabular-nums">
                  {itemScore}% Match
                </span>
                <span className="mt-1 line-clamp-2 text-xs font-semibold text-[#F8FAFC]">
                  {item.title}
                </span>
                <span className="mt-1 text-[11px] text-[#94A3B8] tabular-nums">
                  €{item.priceEur.toLocaleString('en-US')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
