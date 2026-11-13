import { useState } from 'react';
import { X, Check, ShoppingBag, MessageSquare } from 'lucide-react';
import { ITEM_ASSETS } from '../data/atelierData';
import type {
  ClientProfile,
  CurationItem,
  PaletteSwatch,
} from '../utils/atelierEngine';
import { AtelierImage } from './AtelierImage';

interface ItemDetailSheetProps {
  item: CurationItem;
  activeClient: ClientProfile;
  compatibility: {
    score: number;
    matchLabel: string;
    rationale: string;
  };
  onClose: () => void;
  onAddToBag: (item: CurationItem, swatch: PaletteSwatch, bespokeNote: string) => void;
  onAskFollowUp: (item: CurationItem, rationale: string) => void;
}

export function ItemDetailSheet({
  item,
  activeClient,
  compatibility,
  onClose,
  onAddToBag,
  onAskFollowUp,
}: ItemDetailSheetProps) {
  const [selectedSwatch, setSelectedSwatch] = useState<PaletteSwatch>(item.swatches[0]);
  const [bespokeNote, setBespokeNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToBag(item, selectedSwatch, bespokeNote.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F17]/80 p-4 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-sheet-title"
    >
      <div className="atelier-glass-tier-3 relative grid max-h-[92vh] w-full max-w-4xl grid-cols-1 overflow-y-auto rounded-3xl md:grid-cols-12">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close piece details"
          className="atelier-btn-secondary absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[#F8FAFC]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Left 5 Columns: Lookbook Photograph */}
        <div className="relative aspect-[3/4] md:col-span-5 md:aspect-auto md:min-h-[520px] bg-[#0a0e16]">
          <AtelierImage
            src={ITEM_ASSETS[item.imageKey]}
            alt={item.title}
            fallbackTitle={item.title}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F17]/90 to-transparent p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4edea3] tabular-nums">
              {compatibility.score}% {compatibility.matchLabel}
            </p>
            <p className="mt-1 text-xs text-[#cbd5e1]">
              Calibrated for {activeClient.name} · {activeClient.season}
            </p>
          </div>
        </div>

        {/* Right 7 Columns: Calibration & Purchase Module */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-between p-6 sm:p-8 md:col-span-7"
        >
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                {item.houseLine} · {item.subtitle}
              </p>
              <h2
                id="detail-sheet-title"
                className="mt-1.5 font-display text-3xl font-medium text-[#F8FAFC]"
              >
                {item.title}
              </h2>
              <p className="mt-2 text-xl font-semibold text-[#d0bcff] tabular-nums">
                €{item.priceEur.toLocaleString('en-US')}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-[#cbd5e1]">
              {item.description}
            </p>

            {/* Composition & Dermal Rationale */}
            <div className="space-y-3 rounded-xl bg-[#0a0e16]/75 border border-white/8 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Composition &amp; Textile Origin
                </p>
                <p className="mt-1 text-xs text-[#F8FAFC]">{item.composition}</p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Diagnostic Rationale
                </p>
                <p className="mt-1 text-xs text-[#4edea3]">{compatibility.rationale}</p>
              </div>
            </div>

            {/* Swatch / Variant Selector */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Select Atelier Finish / Shade
              </p>
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {item.swatches.map((swatch) => {
                  const selected = swatch.id === selectedSwatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => setSelectedSwatch(swatch)}
                      aria-pressed={selected}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                        selected
                          ? 'bg-[#1c2028] border-[#8B5CF6]/60 text-[#F8FAFC]'
                          : 'bg-[#0a0e16]/60 border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden="true"
                          className="h-5 w-5 rounded-full border border-white/25 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${swatch.primaryHex} 50%, ${swatch.secondaryHex} 50%)`,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#F8FAFC]">
                            {swatch.name}
                          </p>
                          <p className="truncate text-[11px] text-[#94A3B8]">
                            {swatch.finish}
                          </p>
                        </div>
                      </div>
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-[#d0bcff] shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bespoke Tailoring / Monogram Note */}
            <div>
              <label
                htmlFor="bespoke-note"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]"
              >
                Tailoring or Formulation Note (Optional)
              </label>
              <input
                id="bespoke-note"
                type="text"
                value={bespokeNote}
                onChange={(e) => setBespokeNote(e.target.value)}
                placeholder="e.g. Monogram C.L. inside collar, or fragrance-free base"
                className="atelier-input mt-2 w-full rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/55"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskFollowUp(item, compatibility.rationale);
              }}
              className="atelier-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-4 py-3 text-xs font-semibold text-[#d0bcff] whitespace-nowrap"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ask Follow-Up</span>
            </button>
            <button
              type="submit"
              className="atelier-btn-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-xs font-semibold text-white whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>
                Add to Atelier Bag · €{item.priceEur.toLocaleString('en-US')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
