import { ShoppingBag } from 'lucide-react';

export type StudioView = 'diagnostic' | 'curation' | 'comparative' | 'dossier';

interface TopNavProps {
  activeView: StudioView;
  onSelectView: (view: StudioView) => void;
  bagCount: number;
  onOpenBag: () => void;
}

const NAV_ITEMS: Array<{ id: StudioView; label: string }> = [
  { id: 'diagnostic', label: 'Diagnostic Studio' },
  { id: 'curation', label: 'Curation' },
  { id: 'comparative', label: 'Comparative' },
  { id: 'dossier', label: 'Dossier' },
];

export function TopNav({
  activeView,
  onSelectView,
  bagCount,
  onOpenBag,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0F17]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-5 sm:px-8 lg:px-12">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectView('diagnostic')}
          className="font-display text-xl font-semibold tracking-tight text-[#F8FAFC] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-sm"
        >
          Luminous Atelier
        </button>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav
          aria-label="Primary studio navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-sm ${
                  isActive
                    ? 'text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#d0bcff]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Open Atelier Bag (${bagCount} items)`}
            className="atelier-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0bcff]"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Atelier Bag</span>
            <span className="tabular-nums opacity-90">({bagCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNavStrip({
  activeView,
  onSelectView,
}: {
  activeView: StudioView;
  onSelectView: (view: StudioView) => void;
}) {
  const MOBILE_LABELS: Record<StudioView, string> = {
    diagnostic: 'Studio',
    curation: 'Curation',
    comparative: 'Compare',
    dossier: 'Dossier',
  };

  return (
    <nav
      aria-label="Mobile studio navigation"
      className="md:hidden mb-5 grid grid-cols-4 gap-1 rounded-lg bg-[#121826] p-1 border border-white/10"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-md px-2 py-2 text-center text-[11px] font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-[#262a33] text-[#F8FAFC] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            {MOBILE_LABELS[item.id]}
          </button>
        );
      })}
    </nav>
  );
}
