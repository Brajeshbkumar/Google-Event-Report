import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  buildAtelierSystemInstruction,
  extractMapsGroundingPlaces,
  formatGeminiApiError,
  shouldUseMapsGrounding,
  type ChatTurnMessage,
  type FollowUpContextSummary,
} from './src/utils/consultationHelpers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_PARIS_COORDS = { latitude: 48.8686, longitude: 2.3238 };

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add it in Settings > Secrets to enable Atelier Consultations.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/atelier/health', (_req, res) => {
    res.json({
      ok: true,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/atelier/follow-up', async (req, res) => {
    try {
      const {
        question,
        history = [],
        context,
        useMaps = false,
        coordinates,
      } = req.body as {
        question?: string;
        history?: ChatTurnMessage[];
        context?: FollowUpContextSummary;
        useMaps?: boolean;
        coordinates?: { latitude: number; longitude: number } | null;
      };

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ error: 'Please enter a follow-up question.' });
      }
      if (!context || typeof context.clientName !== 'string') {
        return res.status(400).json({ error: 'Missing active atelier client context.' });
      }

      const ai = getGeminiClient();
      const enableMaps = shouldUseMapsGrounding(question, Boolean(useMaps));
      const systemInstruction = buildAtelierSystemInstruction(context, enableMaps);

      const conversationTurns = [
        ...history.slice(-8).map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        })),
        {
          role: 'user',
          parts: [{ text: question.trim() }],
        },
      ];

      const latLng =
        coordinates &&
        typeof coordinates.latitude === 'number' &&
        typeof coordinates.longitude === 'number'
          ? {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }
          : DEFAULT_PARIS_COORDS;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationTurns,
        config: {
          systemInstruction,
          ...(enableMaps
            ? {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                  retrievalConfig: {
                    latLng,
                  },
                },
              }
            : {}),
        },
      });

      const answer =
        response.text?.trim() ||
        'I have reviewed your dermal profile, though no additional text was returned. Please try refining your question.';

      const rawChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const mapsPlaces = enableMaps ? extractMapsGroundingPlaces(rawChunks) : [];

      return res.json({
        answer,
        usedMapsGrounding: enableMaps,
        mapsPlaces,
      });
    } catch (err) {
      const { status, message } = formatGeminiApiError(err);
      return res.status(status).json({ error: message });
    }
  });

  const server = http.createServer(app);

  // WebSocket bridge for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const urlPath = (request.url || '').split('?')[0];
    if (urlPath === '/ws/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (clientWs: WebSocket) => {
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null =
      null;
    let isClosing = false;

    const sendSafe = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    clientWs.on('message', async (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString()) as {
          type?: string;
          context?: FollowUpContextSummary;
          audio?: string;
          text?: string;
        };

        if (parsed.type === 'init' && !liveSession) {
          const ai = getGeminiClient();
          const ctx: FollowUpContextSummary = parsed.context ?? {
            clientName: 'Atelier Client',
            season: 'Cool Winter',
            undertone: 'Cool Porcelain',
            archetype: 'Architectural Nocturne',
            hydration: 86,
            barrierIntegrity: 91,
            pigmentStability: 88,
            concerns: [],
          };

          const systemInstruction = `${buildAtelierSystemInstruction(ctx, false)}\nYou are speaking aloud in a real-time private salon voice consultation. Respond warmly, naturally, and concisely in spoken sentences.`;

          liveSession = await ai.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                },
              },
              systemInstruction,
            },
            callbacks: {
              onopen: () => {
                sendSafe({ type: 'ready' });
              },
              onmessage: (message: LiveServerMessage) => {
                const content = message.serverContent;
                if (content?.inputTranscription?.text) {
                  sendSafe({
                    type: 'inputTranscript',
                    text: content.inputTranscription.text,
                  });
                }
                if (content?.outputTranscription?.text) {
                  sendSafe({
                    type: 'outputTranscript',
                    text: content.outputTranscription.text,
                  });
                }
                for (const part of content?.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    sendSafe({
                      type: 'audio',
                      audio: part.inlineData.data,
                    });
                  }
                }
                if (content?.interrupted) {
                  sendSafe({ type: 'interrupted' });
                }
                if (content?.turnComplete) {
                  sendSafe({ type: 'turnComplete' });
                }
              },
              onerror: (err) => {
                const { message } = formatGeminiApiError(err);
                sendSafe({
                  type: 'error',
                  error: message,
                });
              },
              onclose: () => {
                if (!isClosing) {
                  sendSafe({ type: 'closed' });
                }
              },
            },
          });
          return;
        }

        if (!liveSession) return;

        if (parsed.audio) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (parsed.text && parsed.text.trim()) {
          liveSession.sendRealtimeInput({
            text: parsed.text.trim(),
          });
        }
      } catch (err) {
        const { message } = formatGeminiApiError(err);
        sendSafe({
          type: 'error',
          error: message,
        });
      }
    });

    clientWs.on('close', () => {
      isClosing = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore close errors
        }
        liveSession = null;
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Luminous Atelier server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Luminous Atelier server:', err);
  process.exit(1);
});
