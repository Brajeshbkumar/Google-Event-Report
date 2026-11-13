export type WavelengthMode = 'natural' | 'uv-chromatic' | 'subdermal' | 'undertone';

export type StudioLighting = 'daylight' | 'candlelit' | 'editorial-flash';

export type CurationCategory = 'all' | 'cosmetics' | 'couture' | 'evening';

export type DermalConcern =
  | 'Barrier Resilience'
  | 'Pigment Uniformity'
  | 'Micro-Hydration'
  | 'Contour Firmness';

export type SeasonalPalette =
  | 'Cool Winter'
  | 'Warm Autumn'
  | 'Neutral Dusk'
  | 'Clear Spring';

export interface DermalMetrics {
  hydration: number;
  barrierIntegrity: number;
  pigmentStability: number;
  melaninIndex: number;
}

export interface PaletteSwatch {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  finish: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  archetype: string;
  season: SeasonalPalette;
  undertone: 'Cool Porcelain' | 'Warm Olive-Amber' | 'Neutral Ivory' | 'Deep Espresso-Gold';
  email: string;
  portraitKey: 'camille' | 'elena';
  metrics: DermalMetrics;
  concerns: DermalConcern[];
  swatches: PaletteSwatch[];
  confidenceScore: number;
  lastScannedLabel: string;
  notes: string;
}

export interface CurationItem {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<CurationCategory, 'all'>;
  houseLine: string;
  priceEur: number;
  imageKey: 'serum' | 'creme' | 'lipstick' | 'blazer' | 'gown' | 'cape';
  compatibleSeasons: SeasonalPalette[];
  targetConcerns: DermalConcern[];
  swatches: PaletteSwatch[];
  composition: string;
  description: string;
}

export interface BagItem {
  item: CurationItem;
  selectedSwatch: PaletteSwatch;
  quantity: number;
  bespokeNote: string;
}

export interface OrderFormInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
}

export interface ConfirmedOrder {
  orderNumber: string;
  clientName: string;
  createdAt: string;
  items: Array<{
    title: string;
    swatchName: string;
    quantity: number;
    priceEur: number;
  }>;
  subtotalEur: number;
  courierFeeEur: number;
  totalEur: number;
}

export interface ClientIntakeInput {
  name: string;
  email: string;
  archetype: string;
  season: SeasonalPalette;
  undertone: ClientProfile['undertone'];
}

export const COMPLIMENTARY_COURIER_THRESHOLD_EUR = 650;
export const STANDARD_COURIER_FEE_EUR = 35;

function clampMetric(value: number, min = 40, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function computeDermalScan(
  profile: ClientProfile,
  wavelength: WavelengthMode,
  concerns: DermalConcern[],
  seedOffset = 0,
): {
  metrics: DermalMetrics;
  confidenceScore: number;
  diagnosticNote: string;
} {
  const base = profile.metrics;
  const concernModifier = concerns.length * 1.5;

  let hydrationDelta = 0;
  let barrierDelta = 0;
  let pigmentDelta = 0;
  let melaninDelta = 0;
  let confidenceBonus = 0;
  let diagnosticNote = '';

  switch (wavelength) {
    case 'natural':
      hydrationDelta = 1 + seedOffset;
      barrierDelta = 1;
      pigmentDelta = 0;
      melaninDelta = 0;
      confidenceBonus = 1;
      diagnosticNote =
        'Balanced specular illumination confirms surface clarity and natural lipid sheen across the malar zone.';
      break;
    case 'uv-chromatic':
      hydrationDelta = -2;
      barrierDelta = 1;
      pigmentDelta = 3 + seedOffset;
      melaninDelta = 2;
      confidenceBonus = 2;
      diagnosticNote =
        '365nm UV chromatic capture isolates subsurface melanin distribution and recommends antioxidant shielding.';
      break;
    case 'subdermal':
      hydrationDelta = 4 + seedOffset;
      barrierDelta = 3;
      pigmentDelta = -1;
      melaninDelta = 0;
      confidenceBonus = 2;
      diagnosticNote =
        'Cross-polarized sub-dermal reading highlights micro-capillary hydration reservoirs and barrier lipid density.';
      break;
    case 'undertone':
      hydrationDelta = 1;
      barrierDelta = 0;
      pigmentDelta = 2 + seedOffset;
      melaninDelta = 1;
      confidenceBonus = 3;
      diagnosticNote =
        'Spectrophotometric undertone calibration aligns fabric reflectance and mineral pigments to your seasonal key.';
      break;
  }

  const barrierPenalty = concerns.includes('Barrier Resilience') ? -2 : 1;
  const hydrationPenalty = concerns.includes('Micro-Hydration') ? -2 : 2;
  const pigmentPenalty = concerns.includes('Pigment Uniformity') ? -2 : 1;

  const metrics: DermalMetrics = {
    hydration: clampMetric(base.hydration + hydrationDelta + hydrationPenalty),
    barrierIntegrity: clampMetric(base.barrierIntegrity + barrierDelta + barrierPenalty),
    pigmentStability: clampMetric(base.pigmentStability + pigmentDelta + pigmentPenalty),
    melaninIndex: clampMetric(base.melaninIndex + melaninDelta, 18, 92),
  };

  const confidenceScore = clampMetric(
    94 + confidenceBonus - Math.min(3, Math.floor(concernModifier / 3)),
    88,
    99,
  );

  return {
    metrics,
    confidenceScore,
    diagnosticNote,
  };
}

export function scoreItemCompatibility(
  item: CurationItem,
  profile: ClientProfile,
): {
  score: number;
  matchLabel: 'Atelier Signature Match' | 'Harmonized Selection' | 'Complementary Accent';
  rationale: string;
} {
  let score = 74;
  const seasonMatch = item.compatibleSeasons.includes(profile.season);
  if (seasonMatch) {
    score += 16;
  }

  const matchingConcerns = item.targetConcerns.filter((c) => profile.concerns.includes(c));
  score += Math.min(9, matchingConcerns.length * 5);

  if (profile.metrics.hydration < 80 && item.targetConcerns.includes('Micro-Hydration')) {
    score += 3;
  }
  if (profile.metrics.barrierIntegrity < 85 && item.targetConcerns.includes('Barrier Resilience')) {
    score += 2;
  }

  const finalScore = clampMetric(score, 68, 99);

  let matchLabel: 'Atelier Signature Match' | 'Harmonized Selection' | 'Complementary Accent' =
    'Complementary Accent';
  if (finalScore >= 92) {
    matchLabel = 'Atelier Signature Match';
  } else if (finalScore >= 82) {
    matchLabel = 'Harmonized Selection';
  }

  const rationaleParts: string[] = [];
  if (seasonMatch) {
    rationaleParts.push(`Calibrated for ${profile.season} (${profile.undertone})`);
  } else {
    rationaleParts.push(`Editorial contrast pairing for ${profile.season}`);
  }
  if (matchingConcerns.length > 0) {
    rationaleParts.push(`targets ${matchingConcerns.join(' & ')}`);
  }

  return {
    score: finalScore,
    matchLabel,
    rationale: rationaleParts.join(' · '),
  };
}

export function filterCurations(
  items: CurationItem[],
  options: {
    category: CurationCategory;
    query: string;
    onlyHighMatch: boolean;
    profile: ClientProfile;
  },
): Array<{ item: CurationItem; compatibility: ReturnType<typeof scoreItemCompatibility> }> {
  const normalizedQuery = options.query.trim().toLowerCase();

  return items
    .map((item) => ({
      item,
      compatibility: scoreItemCompatibility(item, options.profile),
    }))
    .filter(({ item, compatibility }) => {
      if (options.category !== 'all' && item.category !== options.category) {
        return false;
      }
      if (options.onlyHighMatch && compatibility.score < 90) {
        return false;
      }
      if (normalizedQuery.length > 0) {
        const haystack = [
          item.title,
          item.subtitle,
          item.houseLine,
          item.composition,
          item.description,
          ...item.swatches.map((s) => s.name),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      }
      return true;
    })
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}

export function calculateBagSummary(bagItems: BagItem[]): {
  itemCount: number;
  subtotalEur: number;
  courierFeeEur: number;
  totalEur: number;
  remainingForComplimentaryEur: number;
} {
  const itemCount = bagItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotalEur = bagItems.reduce(
    (sum, entry) => sum + entry.item.priceEur * entry.quantity,
    0,
  );
  const courierFeeEur =
    subtotalEur === 0 || subtotalEur >= COMPLIMENTARY_COURIER_THRESHOLD_EUR
      ? 0
      : STANDARD_COURIER_FEE_EUR;
  const totalEur = subtotalEur + courierFeeEur;
  const remainingForComplimentaryEur = Math.max(
    0,
    COMPLIMENTARY_COURIER_THRESHOLD_EUR - subtotalEur,
  );

  return {
    itemCount,
    subtotalEur,
    courierFeeEur,
    totalEur,
    remainingForComplimentaryEur,
  };
}

export function validateOrderForm(form: OrderFormInput): Partial<Record<keyof OrderFormInput, string>> {
  const errors: Partial<Record<keyof OrderFormInput, string>> = {};

  if (form.fullName.trim().length < 2) {
    errors.fullName = 'Enter the client full name (at least 2 characters).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address for the atelier dossier.';
  }
  if (form.phone.trim().replace(/\D/g, '').length < 7) {
    errors.phone = 'Enter a valid private courier contact number.';
  }
  if (form.address.trim().length < 5) {
    errors.address = 'Enter a complete street address.';
  }
  if (form.postalCode.trim().length < 3) {
    errors.postalCode = 'Enter a valid postal code.';
  }

  return errors;
}

export function validateClientIntakeForm(
  form: ClientIntakeInput,
): Partial<Record<keyof ClientIntakeInput, string>> {
  const errors: Partial<Record<keyof ClientIntakeInput, string>> = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Client name must be at least 2 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Provide a valid client email address.';
  }
  if (form.archetype.trim().length < 3) {
    errors.archetype = 'Specify a sartorial archetype (e.g. Sculpted Minimalist).';
  }

  return errors;
}
