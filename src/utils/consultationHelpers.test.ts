import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAtelierSystemInstruction,
  buildSuggestedFollowUps,
  extractMapsGroundingPlaces,
  formatGeminiApiError,
  shouldUseMapsGrounding,
} from './consultationHelpers';
import { base64PCM16ToFloat32, float32ToBase64PCM16 } from './liveAudio';

const sampleContext = {
  clientName: 'Camille Laurent',
  season: 'Cool Winter',
  undertone: 'Cool Porcelain',
  archetype: 'Architectural Nocturne',
  hydration: 87,
  barrierIntegrity: 93,
  pigmentStability: 89,
  concerns: ['Barrier Resilience', 'Micro-Hydration'],
  suggestionTitle: "L'Élixir de Nuit Facetté",
  suggestionSubtitle: 'Botanical Cellular Recovery Serum',
  suggestionComposition: '2% Ectoin · Cold-Pressed Squalane',
  suggestionRationale: 'Calibrated for Cool Winter · targets Barrier Resilience',
};

test('shouldUseMapsGrounding detects location intent and respects toggle', () => {
  assert.equal(shouldUseMapsGrounding('Can I layer this serum at night?', false), false);
  assert.equal(shouldUseMapsGrounding('Where is a facialist salon near me?', false), true);
  assert.equal(shouldUseMapsGrounding('Which boutiques in Paris carry silk?', false), true);
  assert.equal(shouldUseMapsGrounding('Explain Ectoin percentage', true), true);
});

test('extractMapsGroundingPlaces deduplicates URIs and extracts review snippets', () => {
  const chunks = [
    {
      maps: {
        uri: 'https://maps.google.com/?cid=101',
        title: 'Atelier Saint-Honoré Spa',
        placeAnswerSources: {
          reviewSnippets: [
            { content: 'Exceptional dermal barrier facials.' },
            { text: 'Quiet private suites.' },
          ],
        },
      },
    },
    {
      maps: {
        uri: 'https://maps.google.com/?cid=101',
        title: 'Duplicate Entry',
      },
    },
    { web: { uri: 'https://example.com', title: 'Ignore web chunk' } },
  ];

  const places = extractMapsGroundingPlaces(chunks);
  assert.equal(places.length, 1);
  assert.equal(places[0].title, 'Atelier Saint-Honoré Spa');
  assert.deepEqual(places[0].reviewSnippets, [
    'Exceptional dermal barrier facials.',
    'Quiet private suites.',
  ]);
});

test('buildAtelierSystemInstruction & buildSuggestedFollowUps include client and suggestion context', () => {
  const instruction = buildAtelierSystemInstruction(sampleContext, true);
  assert.ok(instruction.includes('Camille Laurent'));
  assert.ok(instruction.includes("L'Élixir de Nuit Facetté"));
  assert.ok(instruction.includes('Google Maps grounding'));

  const suggestions = buildSuggestedFollowUps(sampleContext);
  assert.equal(suggestions.length, 3);
  assert.equal(suggestions.some((s) => s.mapsRequired), true);
});

test('PCM16 audio round-trip preserves signal polarity and bounds', () => {
  const input = new Float32Array([0, 0.5, -0.5, 1, -1]);
  const b64 = float32ToBase64PCM16(input);
  const decoded = base64PCM16ToFloat32(b64);

  assert.equal(decoded.length, input.length);
  assert.ok(Math.abs(decoded[0]) < 0.001);
  assert.ok(Math.abs(decoded[1] - 0.5) < 0.01);
  assert.ok(Math.abs(decoded[2] + 0.5) < 0.01);
});

test('formatGeminiApiError maps 429 quota JSON and missing key cleanly', () => {
  const quotaErr = new Error(
    'got status: 429 Too Many Requests. {"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}',
  );
  const formattedQuota = formatGeminiApiError(quotaErr);
  assert.equal(formattedQuota.status, 429);
  assert.ok(formattedQuota.message.includes('quota limit reached'));

  const keyErr = new Error('GEMINI_API_KEY is not configured.');
  assert.equal(formatGeminiApiError(keyErr).status, 503);
});

