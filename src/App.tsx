import { useEffect, useMemo, useState } from 'react';
import {
  CURATION_CATALOG,
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  WAVELENGTH_MODES,
} from './data/atelierData';
import {
  calculateBagSummary,
  computeDermalScan,
  filterCurations,
  scoreItemCompatibility,
  type BagItem,
  type ClientIntakeInput,
  type ClientProfile,
  type ConfirmedOrder,
  type CurationCategory,
  type CurationItem,
  type DermalConcern,
  type OrderFormInput,
  type PaletteSwatch,
  type WavelengthMode,
} from './utils/atelierEngine';
import { MobileNavStrip, TopNav, type StudioView } from './components/TopNav';
import { DiagnosticStudio } from './components/DiagnosticStudio';
import { CurationView } from './components/CurationView';
import { ComparativeStudio } from './components/ComparativeStudio';
import { DossierView } from './components/DossierView';
import { ItemDetailSheet } from './components/ItemDetailSheet';
import { AtelierBagDrawer } from './components/AtelierBagDrawer';
import { ConsultationSheet } from './components/ConsultationSheet';
import type { FollowUpContextSummary } from './utils/consultationHelpers';

const STORAGE_KEYS = {
  clients: 'luminous_atelier_clients_v1',
  activeClientId: 'luminous_atelier_active_client_v1',
  bag: 'luminous_atelier_bag_v1',
  orders: 'luminous_atelier_orders_v1',
};

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<StudioView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'curation' || v === 'comparative' || v === 'dossier') {
      return v;
    }
    return 'diagnostic';
  });

  const [clients, setClients] = useState<ClientProfile[]>(() =>
    readStoredJson(STORAGE_KEYS.clients, INITIAL_CLIENTS),
  );
  const [activeClientId, setActiveClientId] = useState<string>(() =>
    readStoredJson(STORAGE_KEYS.activeClientId, INITIAL_CLIENTS[0].id),
  );
  const [bagItems, setBagItems] = useState<BagItem[]>(() =>
    readStoredJson(STORAGE_KEYS.bag, []),
  );
  const [orders, setOrders] = useState<ConfirmedOrder[]>(() =>
    readStoredJson(STORAGE_KEYS.orders, INITIAL_ORDERS),
  );

  const [wavelength, setWavelength] = useState<WavelengthMode>('natural');
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [diagnosticNote, setDiagnosticNote] = useState<string>(
    'Balanced specular illumination confirms surface clarity and natural lipid sheen across the malar zone.',
  );

  // Curation filter state
  const [category, setCategory] = useState<CurationCategory>('all');
  const [query, setQuery] = useState('');
  const [onlyHighMatch, setOnlyHighMatch] = useState(false);

  // Overlays & toast feedback
  const [inspectedItem, setInspectedItem] = useState<CurationItem | null>(null);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [consultationState, setConsultationState] = useState<{
    isOpen: boolean;
    mode: 'text' | 'voice';
    maps: boolean;
    item?: CurationItem;
    rationale?: string;
  }>({
    isOpen: false,
    mode: 'text',
    maps: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
      localStorage.setItem(
        STORAGE_KEYS.activeClientId,
        JSON.stringify(activeClientId),
      );
      localStorage.setItem(STORAGE_KEYS.bag, JSON.stringify(bagItems));
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [clients, activeClientId, bagItems, orders]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) ?? clients[0],
    [clients, activeClientId],
  );

  const filteredCurations = useMemo(
    () =>
      filterCurations(CURATION_CATALOG, {
        category,
        query,
        onlyHighMatch,
        profile: activeClient,
      }),
    [category, query, onlyHighMatch, activeClient],
  );

  const highMatchCount = useMemo(
    () =>
      CURATION_CATALOG.filter(
        (item) => scoreItemCompatibility(item, activeClient).score >= 90,
      ).length,
    [activeClient],
  );

  const bagSummary = useMemo(() => calculateBagSummary(bagItems), [bagItems]);

  const handleChangeWavelength = (mode: WavelengthMode) => {
    setWavelength(mode);
    const result = computeDermalScan(activeClient, mode, activeClient.concerns);
    setDiagnosticNote(result.diagnosticNote);
  };

  const handleToggleConcern = (concern: DermalConcern) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== activeClient.id) return client;
        const exists = client.concerns.includes(concern);
        const nextConcerns = exists
          ? client.concerns.filter((c) => c !== concern)
          : [...client.concerns, concern];
        return { ...client, concerns: nextConcerns };
      }),
    );
  };

  const handleRunScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    const nextSeed = (scanCount % 3) - 1;
    setScanCount((c) => c + 1);

    window.setTimeout(() => {
      const scanResult = computeDermalScan(
        activeClient,
        wavelength,
        activeClient.concerns,
        nextSeed,
      );
      const waveLabel =
        WAVELENGTH_MODES.find((w) => w.id === wavelength)?.label ?? 'Studio';
      const nowLabel = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setClients((prev) =>
        prev.map((client) =>
          client.id === activeClient.id
            ? {
                ...client,
                metrics: scanResult.metrics,
                confidenceScore: scanResult.confidenceScore,
                lastScannedLabel: `Today · ${nowLabel} CET`,
              }
            : client,
        ),
      );
      setDiagnosticNote(scanResult.diagnosticNote);
      setIsScanning(false);
      setToastMessage(
        `${waveLabel} scan complete · Confidence ${scanResult.confidenceScore}%`,
      );
    }, 850);
  };

  const handleAddToBag = (
    item: CurationItem,
    swatch: PaletteSwatch,
    bespokeNote = '',
  ) => {
    setBagItems((prev) => {
      const existingIndex = prev.findIndex(
        (entry) =>
          entry.item.id === item.id &&
          entry.selectedSwatch.id === swatch.id &&
          entry.bespokeNote === bespokeNote,
      );
      if (existingIndex >= 0) {
        return prev.map((entry, idx) =>
          idx === existingIndex
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        );
      }
      return [...prev, { item, selectedSwatch: swatch, quantity: 1, bespokeNote }];
    });
    setToastMessage(`Added ${item.title} (${swatch.name}) to Atelier Bag`);
  };

  const handleUpdateBagQuantity = (index: number, delta: number) => {
    setBagItems((prev) =>
      prev
        .map((entry, idx) =>
          idx === index ? { ...entry, quantity: entry.quantity + delta } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const handleRemoveBagItem = (index: number) => {
    setBagItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmOrder = (form: OrderFormInput): ConfirmedOrder => {
    const summary = calculateBagSummary(bagItems);
    const orderNum = `LA-${2042 + orders.length}`;
    const newOrder: ConfirmedOrder = {
      orderNumber: orderNum,
      clientName: form.fullName.trim(),
      createdAt: '12 Nov 2026',
      items: bagItems.map((entry) => ({
        title: entry.item.title,
        swatchName: entry.selectedSwatch.name,
        quantity: entry.quantity,
        priceEur: entry.item.priceEur,
      })),
      subtotalEur: summary.subtotalEur,
      courierFeeEur: summary.courierFeeEur,
      totalEur: summary.totalEur,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setBagItems([]);
    return newOrder;
  };

  const handleRegisterClient = (input: ClientIntakeInput) => {
    const isWarm =
      input.season === 'Warm Autumn' || input.season === 'Clear Spring';
    const id = `${input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newClient: ClientProfile = {
      id,
      name: input.name.trim(),
      email: input.email.trim(),
      archetype: input.archetype.trim(),
      season: input.season,
      undertone: input.undertone,
      portraitKey: isWarm ? 'elena' : 'camille',
      metrics: {
        hydration: 84,
        barrierIntegrity: 89,
        pigmentStability: 87,
        melaninIndex: isWarm ? 52 : 31,
      },
      concerns: ['Barrier Resilience', 'Micro-Hydration'],
      swatches: isWarm
        ? [
            {
              id: `sw-${id}-1`,
              name: 'Ambre Doré',
              primaryHex: '#B45309',
              secondaryHex: '#F59E0B',
              finish: 'Satin Cashmere',
            },
            {
              id: `sw-${id}-2`,
              name: 'Cuivre Rosé',
              primaryHex: '#881337',
              secondaryHex: '#FB7185',
              finish: 'Luminous Satin',
            },
          ]
        : [
            {
              id: `sw-${id}-1`,
              name: 'Obsidian Iris',
              primaryHex: '#312E81',
              secondaryHex: '#D0BCFF',
              finish: 'Duchesse Silk',
            },
            {
              id: `sw-${id}-2`,
              name: 'Velours Prune',
              primaryHex: '#581C4B',
              secondaryHex: '#FB7185',
              finish: 'Matte Velvet',
            },
          ],
      confidenceScore: 95,
      lastScannedLabel: 'Pending First Calibration',
      notes: `New salon profile calibrated for ${input.season} (${input.undertone}) · ${input.archetype.trim()}.`,
    };

    setClients((prev) => [newClient, ...prev]);
    setActiveClientId(newClient.id);
    setToastMessage(`Loaded ${newClient.name} into Diagnostic Studio`);
  };

  return (
    <div className="relative min-h-screen bg-[#0B0F17] text-[#F8FAFC]">
      {/* Subtle Ambient Obsidian Salon Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-[#6366F1]/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-[#FB7185]/8 blur-[140px]" />
      </div>

      <TopNav
        activeView={activeView}
        onSelectView={setActiveView}
        bagCount={bagSummary.itemCount}
        onOpenBag={() => setIsBagOpen(true)}
      />

      <main className="relative z-10 mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <MobileNavStrip activeView={activeView} onSelectView={setActiveView} />

        {activeView === 'diagnostic' && (
          <DiagnosticStudio
            clients={clients}
            activeClient={activeClient}
            onSelectClient={(id) => {
              setActiveClientId(id);
              const next = clients.find((c) => c.id === id);
              if (next) {
                const res = computeDermalScan(next, wavelength, next.concerns);
                setDiagnosticNote(res.diagnosticNote);
              }
            }}
            wavelength={wavelength}
            onChangeWavelength={handleChangeWavelength}
            onToggleConcern={handleToggleConcern}
            onRunScan={handleRunScan}
            isScanning={isScanning}
            diagnosticNote={diagnosticNote}
            highMatchCount={highMatchCount}
            onNavigateCuration={() => setActiveView('curation')}
            onOpenConsultation={({ mode = 'text', maps = false }) =>
              setConsultationState({
                isOpen: true,
                mode,
                maps,
              })
            }
          />
        )}

        {activeView === 'curation' && (
          <CurationView
            activeClient={activeClient}
            filteredItems={filteredCurations}
            category={category}
            onChangeCategory={setCategory}
            query={query}
            onChangeQuery={setQuery}
            onlyHighMatch={onlyHighMatch}
            onToggleHighMatch={() => setOnlyHighMatch((v) => !v)}
            onResetFilters={() => {
              setCategory('all');
              setQuery('');
              setOnlyHighMatch(false);
            }}
            onInspectItem={(item) => setInspectedItem(item)}
            onQuickAdd={(item, swatch) => handleAddToBag(item, swatch)}
            onAskFollowUp={(item, rationale) =>
              setConsultationState({
                isOpen: true,
                mode: 'text',
                maps: false,
                item,
                rationale,
              })
            }
          />
        )}

        {activeView === 'comparative' && (
          <ComparativeStudio
            activeClient={activeClient}
            catalog={CURATION_CATALOG}
            onAddToBag={(item, swatch, note) => handleAddToBag(item, swatch, note)}
            onAskFollowUp={(item, rationale) =>
              setConsultationState({
                isOpen: true,
                mode: 'text',
                maps: false,
                item,
                rationale,
              })
            }
          />
        )}

        {activeView === 'dossier' && (
          <DossierView
            clients={clients}
            activeClient={activeClient}
            onSelectClient={(id) => {
              setActiveClientId(id);
              setActiveView('diagnostic');
            }}
            onRegisterClient={handleRegisterClient}
            orders={orders}
          />
        )}
      </main>

      <footer className="relative z-10 mt-14 border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 text-xs text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p className="font-display text-sm text-[#F8FAFC]">Luminous Atelier</p>
          <p>24 Rue du Faubourg Saint-Honoré, Paris · Private Dermal &amp; Couture Salon</p>
        </div>
      </footer>

      {/* Item Detail Modal */}
      {inspectedItem && (
        <ItemDetailSheet
          item={inspectedItem}
          activeClient={activeClient}
          compatibility={scoreItemCompatibility(inspectedItem, activeClient)}
          onClose={() => setInspectedItem(null)}
          onAddToBag={handleAddToBag}
          onAskFollowUp={(item, rationale) =>
            setConsultationState({
              isOpen: true,
              mode: 'text',
              maps: false,
              item,
              rationale,
            })
          }
        />
      )}

      {/* Slide-over Atelier Bag Drawer */}
      <AtelierBagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        bagItems={bagItems}
        activeClient={activeClient}
        onUpdateQuantity={handleUpdateBagQuantity}
        onRemoveItem={handleRemoveBagItem}
        onConfirmOrder={handleConfirmOrder}
        onBrowseCuration={() => setActiveView('curation')}
      />

      {/* Follow-Up Consultation Sheet (gemini-4-hydrogen + googleMaps + gemini-3.8-live) */}
      <ConsultationSheet
        isOpen={consultationState.isOpen}
        initialMode={consultationState.mode}
        initialMapsEnabled={consultationState.maps}
        onClose={() =>
          setConsultationState((prev) => ({ ...prev, isOpen: false }))
        }
        context={
          {
            clientName: activeClient.name,
            season: activeClient.season,
            undertone: activeClient.undertone,
            archetype: activeClient.archetype,
            hydration: activeClient.metrics.hydration,
            barrierIntegrity: activeClient.metrics.barrierIntegrity,
            pigmentStability: activeClient.metrics.pigmentStability,
            concerns: activeClient.concerns,
            suggestionTitle: consultationState.item?.title,
            suggestionSubtitle: consultationState.item?.subtitle,
            suggestionComposition: consultationState.item?.composition,
            suggestionRationale: consultationState.rationale ?? diagnosticNote,
          } satisfies FollowUpContextSummary
        }
      />

      {/* Ephemeral Action Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="atelier-glass-tier-3 fixed bottom-6 right-6 z-40 rounded-xl px-4 py-3 text-xs font-medium text-[#F8FAFC]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
