import portraitCamille from '../assets/images/atelier_portrait_camille_1794550045006.jpg';
import portraitElena from '../assets/images/atelier_portrait_elena_1794550043512.jpg';
import coutureBlazer from '../assets/images/couture_silk_blazer_1794550043487.jpg';
import cosmeticSerum from '../assets/images/cosmetic_elixir_serum_1794550044114.jpg';
import cosmeticLipstick from '../assets/images/cosmetic_velvet_lipstick_1794550043776.jpg';
import coutureGown from '../assets/images/couture_evening_drape_1794550044588.jpg';
import cosmeticCreme from '../assets/images/cosmetic_barrier_creme_1794550067359.jpg';
import coutureCape from '../assets/images/couture_cashmere_cape_1794550066159.jpg';

import type {
  ClientProfile,
  ConfirmedOrder,
  CurationItem,
  DermalConcern,
  StudioLighting,
  WavelengthMode,
} from '../utils/atelierEngine';

export const PORTRAIT_ASSETS: Record<ClientProfile['portraitKey'], string> = {
  camille: portraitCamille,
  elena: portraitElena,
};

export const ITEM_ASSETS: Record<CurationItem['imageKey'], string> = {
  serum: cosmeticSerum,
  creme: cosmeticCreme,
  lipstick: cosmeticLipstick,
  blazer: coutureBlazer,
  gown: coutureGown,
  cape: coutureCape,
};

export const ALL_CONCERNS: DermalConcern[] = [
  'Barrier Resilience',
  'Micro-Hydration',
  'Pigment Uniformity',
  'Contour Firmness',
];

export const WAVELENGTH_MODES: Array<{
  id: WavelengthMode;
  label: string;
  spectrum: string;
  filterCss: string;
  tintOverlay: string;
}> = [
  {
    id: 'natural',
    label: 'Natural Studio',
    spectrum: '5600K Full Spectrum',
    filterCss: 'contrast(1.03) saturate(1.0)',
    tintOverlay: 'radial-gradient(circle at 50% 35%, rgba(208, 188, 255, 0.08), transparent 65%)',
  },
  {
    id: 'uv-chromatic',
    label: 'UV Chromatic',
    spectrum: '365nm Melanometry',
    filterCss: 'contrast(1.22) saturate(0.75) hue-rotate(12deg) brightness(0.96)',
    tintOverlay:
      'radial-gradient(circle at 48% 36%, rgba(99, 102, 241, 0.28), rgba(139, 92, 246, 0.14) 55%, transparent 80%)',
  },
  {
    id: 'subdermal',
    label: 'Sub-Dermal',
    spectrum: 'Cross-Polarized 620nm',
    filterCss: 'contrast(1.14) saturate(1.18) brightness(0.98)',
    tintOverlay:
      'radial-gradient(circle at 50% 38%, rgba(16, 185, 129, 0.22), rgba(11, 15, 23, 0.25) 70%)',
  },
  {
    id: 'undertone',
    label: 'Undertone Key',
    spectrum: 'CIELAB Reflectance',
    filterCss: 'contrast(1.08) saturate(1.12) sepia(0.08)',
    tintOverlay:
      'radial-gradient(circle at 52% 38%, rgba(251, 113, 133, 0.2), rgba(245, 158, 11, 0.12) 60%, transparent 80%)',
  },
];

export const STUDIO_LIGHTING_MODES: Array<{
  id: StudioLighting;
  label: string;
  kelvin: string;
  filterCss: string;
  ambientClass: string;
}> = [
  {
    id: 'daylight',
    label: 'Daylight Atelier',
    kelvin: '5500K North Window',
    filterCss: 'brightness(1.03) contrast(1.02) saturate(1.02)',
    ambientClass: 'from-[#d0bcff]/10 via-transparent to-transparent',
  },
  {
    id: 'candlelit',
    label: 'Candlelit Salon',
    kelvin: '2700K Evening Amber',
    filterCss: 'brightness(0.95) contrast(1.08) saturate(1.08) sepia(0.14)',
    ambientClass: 'from-[#F59E0B]/18 via-[#FB7185]/8 to-transparent',
  },
  {
    id: 'editorial-flash',
    label: 'Editorial Flash',
    kelvin: '6200K Direct Strobe',
    filterCss: 'brightness(1.06) contrast(1.14) saturate(0.96)',
    ambientClass: 'from-[#8B5CF6]/18 via-transparent to-transparent',
  },
];

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'camille-laurent',
    name: 'Camille Laurent',
    archetype: 'Architectural Nocturne',
    season: 'Cool Winter',
    undertone: 'Cool Porcelain',
    email: 'camille.laurent@atelier-prive.fr',
    portraitKey: 'camille',
    metrics: {
      hydration: 87,
      barrierIntegrity: 93,
      pigmentStability: 89,
      melaninIndex: 28,
    },
    concerns: ['Barrier Resilience', 'Micro-Hydration'],
    swatches: [
      {
        id: 'sw-iris',
        name: 'Obsidian Iris',
        primaryHex: '#312E81',
        secondaryHex: '#D0BCFF',
        finish: 'Duchesse Silk',
      },
      {
        id: 'sw-plum',
        name: 'Velours Prune',
        primaryHex: '#581C4B',
        secondaryHex: '#FB7185',
        finish: 'Matte Velvet',
      },
      {
        id: 'sw-slate',
        name: 'Argent Nocturne',
        primaryHex: '#1E293B',
        secondaryHex: '#94A3B8',
        finish: 'Brushed Wool',
      },
    ],
    confidenceScore: 97,
    lastScannedLabel: '12 Nov · 18:40 CET',
    notes:
      'High-contrast cool porcelain clarity. Favors sculpted obsidian silhouettes paired with violet-indigo barrier actives and muted crimson velvet.',
  },
  {
    id: 'elena-vance',
    name: 'Elena Vance',
    archetype: 'Burnished Chiaroscuro',
    season: 'Warm Autumn',
    undertone: 'Warm Olive-Amber',
    email: 'elena.vance@atelier-prive.fr',
    portraitKey: 'elena',
    metrics: {
      hydration: 82,
      barrierIntegrity: 88,
      pigmentStability: 92,
      melaninIndex: 58,
    },
    concerns: ['Pigment Uniformity', 'Contour Firmness'],
    swatches: [
      {
        id: 'sw-amber',
        name: 'Ambre Doré',
        primaryHex: '#B45309',
        secondaryHex: '#F59E0B',
        finish: 'Satin Cashmere',
      },
      {
        id: 'sw-rose',
        name: 'Cuivre Rosé',
        primaryHex: '#881337',
        secondaryHex: '#FB7185',
        finish: 'Luminous Satin',
      },
      {
        id: 'sw-champagne',
        name: 'Sable Champagne',
        primaryHex: '#A88964',
        secondaryHex: '#E5D3B3',
        finish: 'Double-Faced Silk',
      },
    ],
    confidenceScore: 95,
    lastScannedLabel: '12 Nov · 16:15 CET',
    notes:
      'Radiant warm olive-amber balance. Excels in double-faced champagne cashmere, burnished rose-gold drapes, and ceramide-rich lipid renewal.',
  },
];

export const CURATION_CATALOG: CurationItem[] = [
  {
    id: 'elixir-nuit-facette',
    title: "L'Élixir de Nuit Facetté",
    subtitle: 'Botanical Cellular Recovery Serum',
    category: 'cosmetics',
    houseLine: 'Maison Nocturne · Formule 04',
    priceEur: 290,
    imageKey: 'serum',
    compatibleSeasons: ['Cool Winter', 'Neutral Dusk', 'Warm Autumn'],
    targetConcerns: ['Barrier Resilience', 'Micro-Hydration'],
    swatches: [
      {
        id: 'elixir-iris',
        name: 'Iris Ectoin Complex',
        primaryHex: '#6366F1',
        secondaryHex: '#D0BCFF',
        finish: '30 ml Dropper',
      },
      {
        id: 'elixir-amber',
        name: 'Bakuchiol Amber Reserve',
        primaryHex: '#D97706',
        secondaryHex: '#FCD34D',
        finish: '30 ml Dropper',
      },
    ],
    composition: '2% Ectoin · Cold-Pressed Squalane · French Blue Iris',
    description:
      'Suspended inside faceted smoked-indigo glass, this nocturnal lipid elixir restores transepidermal water balance and calms reactive micro-inflammation overnight.',
  },
  {
    id: 'obsidiane-regenerative',
    title: 'Obsidiane Régénérative',
    subtitle: 'Clinical Barrier Integrity Crème',
    category: 'cosmetics',
    houseLine: 'Maison Dermatolique · Paris',
    priceEur: 245,
    imageKey: 'creme',
    compatibleSeasons: ['Cool Winter', 'Clear Spring', 'Neutral Dusk'],
    targetConcerns: ['Barrier Resilience', 'Micro-Hydration', 'Contour Firmness'],
    swatches: [
      {
        id: 'creme-velvet',
        name: 'Velvet Barrier Emulsion',
        primaryHex: '#10B981',
        secondaryHex: '#6FFbbe',
        finish: '50 ml Obsidian Jar',
      },
      {
        id: 'creme-rich',
        name: 'Intensive Lipid Balm',
        primaryHex: '#31353E',
        secondaryHex: '#94A3B8',
        finish: '50 ml Obsidian Jar',
      },
    ],
    composition: 'Ceramide NP-3 · Niacinamide 4% · Thermal Bio-Ferment',
    description:
      'Engineered to fortify compromised stratum corneum architecture with biomimetic lamellar lipids and weightless matte refraction.',
  },
  {
    id: 'velours-crimson-04',
    title: 'Velours Crimson No. 04',
    subtitle: 'Bespoke Couture Lip Pigment',
    category: 'cosmetics',
    houseLine: 'Maison Lune · Atelier Couleur',
    priceEur: 88,
    imageKey: 'lipstick',
    compatibleSeasons: ['Cool Winter', 'Warm Autumn', 'Clear Spring'],
    targetConcerns: ['Pigment Uniformity', 'Micro-Hydration'],
    swatches: [
      {
        id: 'lip-crimson',
        name: 'Velours Crimson',
        primaryHex: '#891933',
        secondaryHex: '#FB7185',
        finish: 'Fluted Matte',
      },
      {
        id: 'lip-rosewood',
        name: 'Bois de Rose Fumé',
        primaryHex: '#9F4A54',
        secondaryHex: '#FFB2B9',
        finish: 'Soft Cashmere',
      },
    ],
    composition: 'Hyaluronic Micro-Spheres · Camellia Seed Oil · Mineral Lake',
    description:
      'Calibrated against CIELAB skin undertone data in a fluted obsidian and brushed champagne cylinder for zero-feather architectural lip definition.',
  },
  {
    id: 'manteau-architectural-minuit',
    title: 'Manteau Architectural Minuit',
    subtitle: 'Sculpted Silk-Wool Atelier Coat',
    category: 'couture',
    houseLine: 'Luminous Couture · Rue Saint-Honoré',
    priceEur: 2450,
    imageKey: 'blazer',
    compatibleSeasons: ['Cool Winter', 'Neutral Dusk'],
    targetConcerns: ['Contour Firmness'],
    swatches: [
      {
        id: 'coat-midnight',
        name: 'Midnight Obsidian',
        primaryHex: '#0F131C',
        secondaryHex: '#6366F1',
        finish: 'Barathea Wool-Silk',
      },
      {
        id: 'coat-anthracite',
        name: 'Slate Noir',
        primaryHex: '#262A33',
        secondaryHex: '#94A3B8',
        finish: 'Twill Cashmere',
      },
    ],
    composition: '72% Virgin Barathea Wool · 28% Mulberry Silk Lining',
    description:
      'Cut on a razor-sharp Parisian block with concealed placket fastening and flared architectural skirt volume tailored to cold-undertone complexions.',
  },
  {
    id: 'robe-drapee-prune',
    title: 'Robe Drapée Prune & Or Rose',
    subtitle: 'Bias-Cut Evening Salon Gown',
    category: 'evening',
    houseLine: 'Haute Couture · Salon Privé',
    priceEur: 3800,
    imageKey: 'gown',
    compatibleSeasons: ['Warm Autumn', 'Cool Winter'],
    targetConcerns: ['Pigment Uniformity', 'Contour Firmness'],
    swatches: [
      {
        id: 'gown-prune',
        name: 'Prune & Or Rose',
        primaryHex: '#4C1D42',
        secondaryHex: '#F59E0B',
        finish: 'Metallic Lamé Silk',
      },
      {
        id: 'gown-amethyst',
        name: 'Améthyste Fumée',
        primaryHex: '#3B0764',
        secondaryHex: '#D0BCFF',
        finish: 'Crêpe de Chine',
      },
    ],
    composition: '100% Lyon Mulberry Silk · Hand-Pleated Metallic Lurex',
    description:
      'Hand-draped on the mannequin to catch warm salon candlelight and cool editorial flash equally, illuminating collarbones without washing out warm or cool undertones.',
  },
  {
    id: 'cape-cachemire-double-face',
    title: 'Cape Cachemire Double Face',
    subtitle: 'Reversible Twilight & Champagne Wrap',
    category: 'couture',
    houseLine: 'Maison Saint-Honoré · Capsule',
    priceEur: 1680,
    imageKey: 'cape',
    compatibleSeasons: ['Warm Autumn', 'Neutral Dusk', 'Clear Spring'],
    targetConcerns: ['Barrier Resilience'],
    swatches: [
      {
        id: 'cape-twilight',
        name: 'Twilight & Champagne',
        primaryHex: '#27323F',
        secondaryHex: '#D6B88D',
        finish: 'Double-Faced Cashmere',
      },
      {
        id: 'cape-obsidian',
        name: 'Obsidian & Sable',
        primaryHex: '#181C24',
        secondaryHex: '#C2A886',
        finish: 'Brushed Cashmere',
      },
    ],
    composition: '100% Double-Faced Grade-A Cashmere · Hand-Felled Edges',
    description:
      'Softly structured collar frames the jawline with a calibrated twilight slate outer and warm champagne interior for effortless transitional layering.',
  },
];

export const INITIAL_ORDERS: ConfirmedOrder[] = [
  {
    orderNumber: 'LA-2041',
    clientName: 'Camille Laurent',
    createdAt: '04 Nov 2026',
    items: [
      {
        title: "L'Élixir de Nuit Facetté",
        swatchName: 'Iris Ectoin Complex',
        quantity: 1,
        priceEur: 290,
      },
      {
        title: 'Obsidiane Régénérative',
        swatchName: 'Velvet Barrier Emulsion',
        quantity: 1,
        priceEur: 245,
      },
    ],
    subtotalEur: 535,
    courierFeeEur: 35,
    totalEur: 570,
  },
];
