export interface GroundingPlaceLink {
  title: string;
  uri: string;
  reviewSnippets: string[];
}

export interface FollowUpContextSummary {
  clientName: string;
  season: string;
  undertone: string;
  archetype: string;
  hydration: number;
  barrierIntegrity: number;
  pigmentStability: number;
  concerns: string[];
  suggestionTitle?: string;
  suggestionSubtitle?: string;
  suggestionComposition?: string;
  suggestionRationale?: string;
}

export interface ChatTurnMessage {
  role: 'user' | 'assistant';
  text: string;
  mapsPlaces?: GroundingPlaceLink[];
  usedMapsGrounding?: boolean;
}

const LOCATION_KEYWORDS = [
  'where',
  'near',
  'nearby',
  'closest',
  'paris',
  'boutique',
  'salon',
  'store',
  'clinic',
  'dermatolog',
  'facialist',
  'tailor',
  'atelier',
  'address',
  'directions',
  'neighborhood',
  'rue',
  'map',
  'visit',
  'location',
  'city',
  'london',
  'new york',
  'tokyo',
  'milan',
];

export function shouldUseMapsGrounding(
  question: string,
  forceMapsToggle: boolean,
): boolean {
  if (forceMapsToggle) return true;
  const normalized = question.toLowerCase();
  return LOCATION_KEYWORDS.some((kw) => normalized.includes(kw));
}

export function buildAtelierSystemInstruction(
  ctx: FollowUpContextSummary,
  useMaps: boolean,
): string {
  const suggestionSection = ctx.suggestionTitle
    ? `Focused Suggestion: ${ctx.suggestionTitle} (${ctx.suggestionSubtitle ?? 'Atelier Piece'}). Composition/Origin: ${ctx.suggestionComposition ?? 'Bespoke Atelier'}. Diagnostic Rationale: ${ctx.suggestionRationale ?? 'Calibrated to client undertone.'}`
    : 'Focused Subject: Overall Dermal Calibration & Seasonal Palette.';

  const mapsNote = useMaps
    ? 'When recommending physical boutiques, dermatology clinics, facialists, or tailoring houses, use Google Maps grounding to cite real, verified places with accurate names and neighborhood context.'
    : 'Provide precise, grounded dermatological formulation guidance and Parisian couture styling advice tailored to the client profile.';

  return [
    'You are the Senior Diagnostic Formulator & Couture Stylist at Luminous Atelier (24 Rue du Faubourg Saint-Honoré, Paris).',
    'Speak with poised, understated luxury and clinical precision. Keep responses concise (2-4 focused sentences or short clean bullets), avoiding hype.',
    `Active Client: ${ctx.clientName} | Archetype: ${ctx.archetype} | Seasonal Key: ${ctx.season} | Undertone: ${ctx.undertone}.`,
    `Dermal Vitals: Hydration ${ctx.hydration}%, Barrier Integrity ${ctx.barrierIntegrity}%, Pigment Stability ${ctx.pigmentStability}%. Active Targets: ${ctx.concerns.join(', ') || 'General Balance'}.`,
    suggestionSection,
    mapsNote,
  ].join('\n');
}

export function extractMapsGroundingPlaces(
  rawChunks: unknown,
): GroundingPlaceLink[] {
  if (!Array.isArray(rawChunks)) return [];

  const seenUris = new Set<string>();
  const places: GroundingPlaceLink[] = [];

  for (const chunk of rawChunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const maps = (chunk as { maps?: unknown }).maps;
    if (!maps || typeof maps !== 'object') continue;

    const mapsObj = maps as {
      uri?: unknown;
      title?: unknown;
      placeAnswerSources?: {
        reviewSnippets?: Array<{ content?: unknown; text?: unknown }>;
      };
    };

    const uri = typeof mapsObj.uri === 'string' ? mapsObj.uri.trim() : '';
    const title =
      typeof mapsObj.title === 'string' && mapsObj.title.trim().length > 0
        ? mapsObj.title.trim()
        : 'Verified Atelier Place';

    if (!uri || seenUris.has(uri)) continue;
    seenUris.add(uri);

    const snippetsRaw = mapsObj.placeAnswerSources?.reviewSnippets;
    const reviewSnippets: string[] = [];
    if (Array.isArray(snippetsRaw)) {
      for (const s of snippetsRaw) {
        if (s && typeof s === 'object') {
          const text =
            typeof s.content === 'string'
              ? s.content
              : typeof s.text === 'string'
                ? s.text
                : '';
          if (text.trim()) {
            reviewSnippets.push(text.trim());
          }
        }
      }
    }

    places.push({ title, uri, reviewSnippets });
  }

  return places;
}

export function buildSuggestedFollowUps(
  ctx: FollowUpContextSummary,
): Array<{ label: string; prompt: string; mapsRequired: boolean }> {
  if (ctx.suggestionTitle) {
    return [
      {
        label: 'Layering & Routine Fit',
        prompt: `How should ${ctx.clientName} layer or pair "${ctx.suggestionTitle}" given ${ctx.hydration}% hydration and ${ctx.concerns.join(', ') || 'her dermal profile'}?`,
        mapsRequired: false,
      },
      {
        label: 'Lighting & Undertone Nuance',
        prompt: `How does "${ctx.suggestionTitle}" read against ${ctx.undertone} undertones under evening candlelight versus daylight?`,
        mapsRequired: false,
      },
      {
        label: 'Nearby Salons & Boutiques',
        prompt: `Find top-rated luxury skincare salons, bespoke tailors, or dermatology spas near me where someone with a ${ctx.season} profile can get complementary care or alterations.`,
        mapsRequired: true,
      },
    ];
  }

  return [
    {
      label: 'Explain Dermal Priorities',
      prompt: `Based on ${ctx.hydration}% hydration and ${ctx.barrierIntegrity}% barrier integrity, what should ${ctx.clientName} prioritize first?`,
      mapsRequired: false,
    },
    {
      label: 'Capsule Wardrobe Pairing',
      prompt: `Which fabrics and lip shades best elevate a ${ctx.season} (${ctx.undertone}) palette for evening wear?`,
      mapsRequired: false,
    },
    {
      label: 'Nearby Clinics & Ateliers',
      prompt: `Recommend verified facialist clinics, apothecaries, or couture alteration ateliers near my location.`,
      mapsRequired: true,
    },
  ];
}

export function formatGeminiApiError(err: unknown): {
  status: number;
  message: string;
} {
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Unable to reach Atelier AI consultant.';

  if (rawMessage.includes('GEMINI_API_KEY')) {
    return { status: 503, message: rawMessage };
  }

  let parsedCode: number | undefined;
  let parsedStatus: string | undefined;
  let parsedMessage = rawMessage;

  const jsonMatch = rawMessage.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        error?: { code?: number; status?: string; message?: string };
      };
      if (parsed.error) {
        parsedCode = parsed.error.code;
        parsedStatus = parsed.error.status;
        if (typeof parsed.error.message === 'string' && parsed.error.message.trim()) {
          parsedMessage = parsed.error.message.trim();
        }
      }
    } catch {
      // Keep rawMessage when JSON snippet is not valid JSON
    }
  }

  if (
    parsedCode === 429 ||
    parsedStatus === 'RESOURCE_EXHAUSTED' ||
    rawMessage.includes('429') ||
    rawMessage.includes('RESOURCE_EXHAUSTED')
  ) {
    return {
      status: 429,
      message:
        'Gemini API quota limit reached for the configured key. Please wait briefly or select a key with available billing quota in Settings > Secrets.',
    };
  }

  if (parsedCode === 401 || parsedCode === 403) {
    return {
      status: parsedCode,
      message:
        'The configured Gemini API key could not be authorized for this model. Verify your key in Settings > Secrets.',
    };
  }

  if (parsedCode && parsedCode >= 400 && parsedCode < 500) {
    return { status: parsedCode, message: parsedMessage };
  }

  return { status: 500, message: parsedMessage };
}

