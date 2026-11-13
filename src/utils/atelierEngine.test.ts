import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBagSummary,
  computeDermalScan,
  filterCurations,
  scoreItemCompatibility,
  validateClientIntakeForm,
  validateOrderForm,
  type ClientProfile,
  type CurationItem,
} from './atelierEngine';

const sampleClient: ClientProfile = {
  id: 'client-1',
  name: 'Camille Laurent',
  archetype: 'Architectural Nocturne',
  season: 'Cool Winter',
  undertone: 'Cool Porcelain',
  email: 'camille@laurent-paris.fr',
  portraitKey: 'camille',
  metrics: {
    hydration: 84,
    barrierIntegrity: 91,
    pigmentStability: 88,
    melaninIndex: 31,
  },
  concerns: ['Barrier Resilience', 'Micro-Hydration'],
  swatches: [
    {
      id: 'sw-1',
      name: 'Obsidian Iris',
      primaryHex: '#312E81',
      secondaryHex: '#D0BCFF',
      finish: 'Silk Satin',
    },
  ],
  confidenceScore: 96,
  lastScannedLabel: 'Today, 18:40 CET',
  notes: 'Cool porcelain tone responds cleanly to violet-tinted mineral shields.',
};

const sampleItems: CurationItem[] = [
  {
    id: 'item-1',
    title: "L'Élixir de Nuit Facetté",
    subtitle: 'Cellular Lipid Serum',
    category: 'cosmetics',
    houseLine: 'Laboratoire Nocturne',
    priceEur: 290,
    imageKey: 'serum',
    compatibleSeasons: ['Cool Winter', 'Neutral Dusk'],
    targetConcerns: ['Barrier Resilience', 'Micro-Hydration'],
    swatches: [
      {
        id: 's1',
        name: 'Iris Botanical',
        primaryHex: '#6366F1',
        secondaryHex: '#D0BCFF',
        finish: 'Concentrate',
      },
    ],
    composition: 'Squalane, Ectoin, Blue Tansy',
    description: 'Nighttime barrier restoration concentrate.',
  },
  {
    id: 'item-2',
    title: 'Cape Cachemire Double Face',
    subtitle: 'Sculpted Cashmere Outer',
    category: 'couture',
    houseLine: 'Maison Saint-Honoré',
    priceEur: 1680,
    imageKey: 'cape',
    compatibleSeasons: ['Warm Autumn'],
    targetConcerns: ['Contour Firmness'],
    swatches: [
      {
        id: 's2',
        name: 'Warm Champagne',
        primaryHex: '#D6B88D',
        secondaryHex: '#262A33',
        finish: 'Brushed Cashmere',
      },
    ],
    composition: '100% Inner Mongolian Cashmere',
    description: 'Architectural draped outerwear.',
  },
];

test('computeDermalScan clamps metrics and adjusts per wavelength', () => {
  const subdermal = computeDermalScan(sampleClient, 'subdermal', ['Micro-Hydration']);
  assert.ok(subdermal.metrics.hydration <= 99 && subdermal.metrics.hydration >= 40);
  assert.ok(subdermal.metrics.barrierIntegrity > sampleClient.metrics.barrierIntegrity);
  assert.ok(subdermal.diagnosticNote.includes('sub-dermal'));

  const uv = computeDermalScan(sampleClient, 'uv-chromatic', ['Pigment Uniformity']);
  assert.ok(uv.metrics.pigmentStability >= 40);
  assert.ok(uv.confidenceScore >= 88 && uv.confidenceScore <= 99);
});

test('scoreItemCompatibility ranks seasonal and concern matches higher', () => {
  const matchA = scoreItemCompatibility(sampleItems[0], sampleClient);
  const matchB = scoreItemCompatibility(sampleItems[1], sampleClient);

  assert.ok(matchA.score > matchB.score);
  assert.equal(matchA.matchLabel, 'Atelier Signature Match');
  assert.ok(matchA.rationale.includes('Cool Winter'));
});

test('filterCurations filters by category, search query, and high-match toggle', () => {
  const onlyCosmetics = filterCurations(sampleItems, {
    category: 'cosmetics',
    query: '',
    onlyHighMatch: false,
    profile: sampleClient,
  });
  assert.equal(onlyCosmetics.length, 1);
  assert.equal(onlyCosmetics[0].item.id, 'item-1');

  const queryMatch = filterCurations(sampleItems, {
    category: 'all',
    query: 'cashmere',
    onlyHighMatch: false,
    profile: sampleClient,
  });
  assert.equal(queryMatch.length, 1);
  assert.equal(queryMatch[0].item.id, 'item-2');

  const highOnly = filterCurations(sampleItems, {
    category: 'all',
    query: '',
    onlyHighMatch: true,
    profile: sampleClient,
  });
  assert.equal(highOnly.length, 1);
  assert.equal(highOnly[0].item.id, 'item-1');
});

test('calculateBagSummary computes courier threshold and totals accurately', () => {
  const empty = calculateBagSummary([]);
  assert.equal(empty.subtotalEur, 0);
  assert.equal(empty.courierFeeEur, 0);
  assert.equal(empty.totalEur, 0);

  const underThreshold = calculateBagSummary([
    {
      item: sampleItems[0],
      selectedSwatch: sampleItems[0].swatches[0],
      quantity: 1,
      bespokeNote: '',
    },
  ]);
  assert.equal(underThreshold.subtotalEur, 290);
  assert.equal(underThreshold.courierFeeEur, 35);
  assert.equal(underThreshold.totalEur, 325);
  assert.equal(underThreshold.remainingForComplimentaryEur, 360);

  const overThreshold = calculateBagSummary([
    {
      item: sampleItems[1],
      selectedSwatch: sampleItems[1].swatches[0],
      quantity: 1,
      bespokeNote: '',
    },
  ]);
  assert.equal(overThreshold.courierFeeEur, 0);
  assert.equal(overThreshold.totalEur, 1680);
  assert.equal(overThreshold.remainingForComplimentaryEur, 0);
});

test('validateOrderForm and validateClientIntakeForm reject invalid input', () => {
  const orderErrors = validateOrderForm({
    fullName: 'A',
    email: 'not-an-email',
    phone: '123',
    address: 'Rue',
    postalCode: '1',
  });
  assert.ok(orderErrors.fullName);
  assert.ok(orderErrors.email);
  assert.ok(orderErrors.phone);
  assert.ok(orderErrors.address);
  assert.ok(orderErrors.postalCode);

  const validOrder = validateOrderForm({
    fullName: 'Camille Laurent',
    email: 'camille@laurent-paris.fr',
    phone: '+33 1 42 68 55 00',
    address: '24 Rue du Faubourg Saint-Honoré',
    postalCode: '75008',
  });
  assert.deepEqual(validOrder, {});

  const intakeErrors = validateClientIntakeForm({
    name: '',
    email: 'bad',
    archetype: 'X',
    season: 'Cool Winter',
    undertone: 'Cool Porcelain',
  });
  assert.ok(intakeErrors.name);
  assert.ok(intakeErrors.email);
  assert.ok(intakeErrors.archetype);
});
