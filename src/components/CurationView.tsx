import { Search, Plus, Eye, MessageSquare } from 'lucide-react';
import { ITEM_ASSETS } from '../data/atelierData';
import type {
  ClientProfile,
  CurationCategory,
  CurationItem,
  PaletteSwatch,
} from '../utils/atelierEngine';
import { AtelierImage } from './AtelierImage';

interface CurationViewProps {
  activeClient: ClientProfile;
  filteredItems: Array<{
    item: CurationItem;
    compatibility: {
      score: number;
      matchLabel: string;
      rationale: string;
    };
  }>;
  category: CurationCategory;
  onChangeCategory: (category: CurationCategory) => void;
  query: string;
  onChangeQuery: (query: string) => void;
  onlyHighMatch: boolean;
  onToggleHighMatch: () => void;
  onResetFilters: () => void;
  onInspectItem: (item: CurationItem) => void;
  onQuickAdd: (item: CurationItem, swatch: PaletteSwatch) => void;
  onAskFollowUp: (item: CurationItem, rationale: string) => void;
}

const CATEGORY_TABS: Array<{ id: CurationCategory; label: string }> = [
  { id: 'all', label: 'All Curations' },
  { id: 'cosmetics', label: 'Bespoke Cosmetics' },
  { id: 'couture', label: 'Parisian Couture' },
  { id: 'evening', label: 'Evening Capsule' },
];

export function CurationView({
  activeClient,
  filteredItems,
  category,
  onChangeCategory,
  query,
  onChangeQuery,
  onlyHighMatch,
  onToggleHighMatch,
  onResetFilters,
  onInspectItem,
  onQuickAdd,
  onAskFollowUp,
}: CurationViewProps) {
  return (
    <section aria-labelledby="curation-heading" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Tailored Lookbook · Calibrated for {activeClient.name}
          </p>
          <h1
            id="curation-heading"
            className="mt-1 font-display text-3xl font-medium tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl text-balance"
          >
            Bespoke <span className="italic text-[#ffb2b9]">Curation</span>
          </h1>
        </div>
        <p className="text-sm text-[#94A3B8] max-w-md">
          Cosmetic formulations and Parisian garments ranked by {activeClient.season}{' '}
          undertone harmony and active dermal telemetry.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Tactile Mode Switcher */}
        <div
          role="tablist"
          aria-label="Curation category filter"
          className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#0a0e16] p-1 border border-white/10"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeCategory(tab.id)}
                className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-[#262a33] text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(248,250,252,0.14)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Precision Search + High-Match Concentric Toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <label htmlFor="curation-search" className="sr-only">
              Search curations
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              id="curation-search"
              type="search"
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              placeholder="Search textiles, actives, shades"
              className="atelier-input w-full rounded-lg py-2 pl-9 pr-3 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={onlyHighMatch}
            onClick={onToggleHighMatch}
            className={`inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 border transition-all ${
              onlyHighMatch
                ? 'bg-[#1c2028] border-[#8B5CF6]/55 text-[#F8FAFC]'
                : 'bg-[#0a0e16]/70 border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                onlyHighMatch
                  ? 'border-[#d0bcff] ring-2 ring-[#8B5CF6]/35'
                  : 'border-[#94A3B8]/40'
              }`}
            >
              {onlyHighMatch && (
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
              )}
            </span>
            <span>90%+ Match Only</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="atelier-glass-tier-2 flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
          <p className="font-display text-2xl text-[#F8FAFC]">
            No Pieces Match Current Calibration
          </p>
          <p className="mt-2 max-w-md text-sm text-[#94A3B8]">
            Adjust your search terms or release the 90%+ compatibility threshold to view
            the full Paris salon archive.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="atelier-btn-secondary mt-6 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#F8FAFC]"
          >
            Reset Curation Filters
          </button>
        </div>
      ) : (
        /* 3:4 Couture Recommendation Tiles */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(({ item, compatibility }) => {
            const leadSwatch = item.swatches[0];
            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#121826] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d0bcff]/35 hover:shadow-[0_18px_40px_-14px_rgba(139,92,246,0.28)]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0a0e16]">
                  <AtelierImage
                    src={ITEM_ASSETS[item.imageKey]}
                    alt={`${item.title} — ${item.subtitle}`}
                    fallbackTitle={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {/* Top Compatibility Alignment */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-[#0B0F17]/80 to-transparent p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#cbd5e1]">
                      {item.houseLine}
                    </span>
                    <span className="text-xs font-semibold text-[#4edea3] tabular-nums">
                      {compatibility.score}% Match
                    </span>
                  </div>

                  {/* Measured Bottom Frosted Info Tray */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/85 to-transparent p-5 pt-16">
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <span>{item.subtitle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums text-[#F8FAFC] font-semibold">
                        €{item.priceEur.toLocaleString('en-US')}
                      </span>
                    </div>

                    <h2 className="mt-1 font-display text-2xl font-medium text-[#F8FAFC]">
                      {item.title}
                    </h2>

                    <p className="mt-1.5 text-xs text-[#cbd5e1] line-clamp-2">
                      {compatibility.rationale}
                    </p>

                    {/* Dual-tone Swatch Preview + Actions */}
                    <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full border border-white/25 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${leadSwatch.primaryHex} 50%, ${leadSwatch.secondaryHex} 50%)`,
                          }}
                        />
                        <span className="truncate text-xs text-[#94A3B8]">
                          {leadSwatch.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAskFollowUp(item, compatibility.rationale)}
                          aria-label={`Ask follow-up about ${item.title}`}
                          className="atelier-btn-secondary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#d0bcff] whitespace-nowrap"
                        >
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ask</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onInspectItem(item)}
                          aria-label={`Inspect ${item.title}`}
                          className="atelier-btn-secondary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#F8FAFC] whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickAdd(item, leadSwatch)}
                          aria-label={`Add ${item.title} to Atelier Bag`}
                          className="atelier-btn-primary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
