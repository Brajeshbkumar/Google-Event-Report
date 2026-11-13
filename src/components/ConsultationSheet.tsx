import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  MapPin,
  ExternalLink,
  Volume2,
  MessageSquare,
} from 'lucide-react';
import {
  buildSuggestedFollowUps,
  type ChatTurnMessage,
  type FollowUpContextSummary,
} from '../utils/consultationHelpers';
import {
  base64PCM16ToFloat32,
  float32ToBase64PCM16,
} from '../utils/liveAudio';

interface ConsultationSheetProps {
  isOpen: boolean;
  context: FollowUpContextSummary;
  initialMode?: 'text' | 'voice';
  initialMapsEnabled?: boolean;
  onClose: () => void;
}

interface VoiceTranscriptEntry {
  id: string;
  speaker: 'You' | 'Atelier Consultant';
  text: string;
}

export function ConsultationSheet({
  isOpen,
  context,
  initialMode = 'text',
  initialMapsEnabled = false,
  onClose,
}: ConsultationSheetProps) {
  const [mode, setMode] = useState<'text' | 'voice'>(initialMode);
  const [mapsEnabled, setMapsEnabled] = useState(initialMapsEnabled);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatTurnMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  // Live API Voice state
  const [voiceState, setVoiceState] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [micActive, setMicActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [voiceTranscripts, setVoiceTranscripts] = useState<VoiceTranscriptEntry[]>(
    [],
  );

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const suggestedPrompts = useMemo(
    () => buildSuggestedFollowUps(context),
    [context],
  );

  // Reset conversation when target suggestion changes while closed or reopened
  useEffect(() => {
    setMode(initialMode);
    setMapsEnabled(initialMapsEnabled);
  }, [initialMode, initialMapsEnabled, context.suggestionTitle, context.clientName]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceTranscripts]);

  // Clean up Live Voice session on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function stopPlaybackQueue() {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped sources
      }
    }
    activeSourcesRef.current = [];
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  }

  function stopVoiceSession() {
    stopPlaybackQueue();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }
    setMicActive(false);
    setVoiceState('idle');
  }

  function schedulePcm24kChunk(base64Audio: string) {
    const outCtx = outputCtxRef.current;
    if (!outCtx) return;

    const float32 = base64PCM16ToFloat32(base64Audio);
    if (float32.length === 0) return;

    const audioBuffer = outCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = outCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outCtx.destination);

    const startTime = Math.max(outCtx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    activeSourcesRef.current.push(source);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (s) => s !== source,
      );
    };
  }

  async function resolveCoordinates(): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    if (coords) return coords;
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(next);
          resolve(next);
        },
        () => resolve(null),
        { timeout: 2500, maximumAge: 60000 },
      );
    });
  }

  async function submitFollowUp(
    promptText: string,
    forceMaps = mapsEnabled,
  ) {
    const trimmed = promptText.trim();
    if (!trimmed || isSending) return;

    setTextError(null);
    const userTurn: ChatTurnMessage = { role: 'user', text: trimmed };
    const nextHistory = [...messages, userTurn];
    setMessages(nextHistory);
    setQuestion('');
    setIsSending(true);

    try {
      const geoCoords = forceMaps ? await resolveCoordinates() : coords;

      const res = await fetch('/api/atelier/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: messages,
          context,
          useMaps: forceMaps,
          coordinates: geoCoords,
        }),
      });

      const data = (await res.json()) as {
        answer?: string;
        mapsPlaces?: ChatTurnMessage['mapsPlaces'];
        usedMapsGrounding?: boolean;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Unable to reach Atelier consultant.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || '',
          mapsPlaces: data.mapsPlaces ?? [],
          usedMapsGrounding: Boolean(data.usedMapsGrounding),
        },
      ]);
    } catch (err) {
      setTextError(
        err instanceof Error
          ? err.message
          : 'Unable to complete consultation request.',
      );
    } finally {
      setIsSending(false);
    }
  }

  async function startVoiceSession() {
    if (voiceState === 'connecting' || voiceState === 'connected') return;

    setVoiceError(null);
    setVoiceState('connecting');

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const outCtx = new AudioCtx({ sampleRate: 24000 });
      outputCtxRef.current = outCtx;
      nextStartTimeRef.current = outCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'init', context }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type?: string;
            audio?: string;
            text?: string;
            error?: string;
          };

          if (msg.type === 'ready') {
            setVoiceState('connected');
            void startMicrophoneCapture(ws);
          } else if (msg.type === 'audio' && msg.audio) {
            schedulePcm24kChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            stopPlaybackQueue();
          } else if (msg.type === 'inputTranscript' && msg.text) {
            appendTranscript('You', msg.text);
          } else if (msg.type === 'outputTranscript' && msg.text) {
            appendTranscript('Atelier Consultant', msg.text);
          } else if (msg.type === 'error' && msg.error) {
            setVoiceError(msg.error);
            setVoiceState('error');
          } else if (msg.type === 'closed') {
            setVoiceState('idle');
            setMicActive(false);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onerror = () => {
        setVoiceError('WebSocket connection to Live Voice studio failed.');
        setVoiceState('error');
      };

      ws.onclose = () => {
        setMicActive(false);
        setVoiceState((prev) => (prev === 'error' ? 'error' : 'idle'));
      };
    } catch (err) {
      setVoiceError(
        err instanceof Error ? err.message : 'Unable to initialize audio contexts.',
      );
      setVoiceState('error');
    }
  }

  async function startMicrophoneCapture(ws: WebSocket) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError(
        'Microphone capture unavailable; connected in text-to-voice mode.',
      );
      setMicActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const inCtx = new AudioCtx({ sampleRate: 16000 });
      inputCtxRef.current = inCtx;

      const source = inCtx.createMediaStreamSource(stream);
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inCtx.destination);

      processor.onaudioprocess = (e) => {
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const base64Pcm = float32ToBase64PCM16(channelData);
        socket.send(JSON.stringify({ audio: base64Pcm }));
      };

      setMicActive(true);
    } catch {
      setVoiceError(
        'Microphone permission not granted; you can still type follow-ups below for live spoken replies.',
      );
      setMicActive(false);
    }
  }

  function appendTranscript(
    speaker: VoiceTranscriptEntry['speaker'],
    chunkText: string,
  ) {
    setVoiceTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: `${last.text}${chunkText}` },
        ];
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          speaker,
          text: chunkText,
        },
      ];
    });
  }

  function handleSendVoiceText(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = voicePrompt.trim();
    if (!trimmed) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: trimmed }));
      setVoiceTranscripts((prev) => [
        ...prev,
        { id: `${Date.now()}-u`, speaker: 'You', text: trimmed },
      ]);
      setVoicePrompt('');
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0B0F17]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-sheet-title"
    >
      <div className="atelier-glass-tier-3 flex h-full w-full max-w-xl flex-col justify-between overflow-hidden p-6 sm:p-7">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#d0bcff]">
                Atelier Follow-Up Consultation
              </p>
              <h2
                id="consultation-sheet-title"
                className="mt-1 font-display text-2xl font-medium text-[#F8FAFC]"
              >
                {context.suggestionTitle ?? `${context.clientName} Calibration`}
              </h2>
              <p className="mt-0.5 text-xs text-[#94A3B8]">
                {context.clientName} · {context.season} · Hydration{' '}
                <span className="tabular-nums">{context.hydration}%</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Consultation Sheet"
              className="atelier-btn-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#F8FAFC]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div
            role="tablist"
            aria-label="Consultation mode"
            className="grid grid-cols-2 gap-1 rounded-lg bg-[#0a0e16] p-1 border border-white/10"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'text'}
              onClick={() => setMode('text')}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors duration-100 ${
                mode === 'text'
                  ? 'bg-[#262a33] border-white/15 text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(248,250,252,0.14)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Follow-Up &amp; Maps Q&amp;A</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'voice'}
              onClick={() => setMode('voice')}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors duration-100 ${
                mode === 'voice'
                  ? 'bg-[#262a33] border-white/15 text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(248,250,252,0.14)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Live Voice Salon</span>
            </button>
          </div>
        </div>

        {/* Mode 1: Text & Google Maps Grounding */}
        {mode === 'text' ? (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-1">
              {/* Quick Follow-Up Suggestions */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Suggested Follow-Up Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.mapsRequired) setMapsEnabled(true);
                        void submitFollowUp(item.prompt, item.mapsRequired || mapsEnabled);
                      }}
                      className="atelier-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC]"
                    >
                      {item.mapsRequired && (
                        <MapPin className="h-3 w-3 text-[#4edea3]" aria-hidden="true" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation Thread */}
              {messages.length === 0 ? (
                <div className="rounded-xl border border-white/8 bg-[#0a0e16]/70 p-5 text-xs leading-relaxed text-[#94A3B8]">
                  Ask any follow-up question about{' '}
                  <span className="text-[#F8FAFC] font-medium">
                    {context.suggestionTitle ?? 'this dermal calibration'}
                  </span>
                  —such as ingredient layering, lighting contrast, or verified nearby
                  boutiques and facialist clinics via Google Maps.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-4 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'ml-8 bg-[#262a33] border border-white/10 text-[#F8FAFC]'
                          : 'mr-4 bg-[#121826]/90 border border-[#8B5CF6]/25 text-[#dfe2ee]'
                      }`}
                    >
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        {msg.role === 'user'
                          ? context.clientName
                          : msg.usedMapsGrounding
                            ? 'Atelier Consultant · Google Maps Grounded'
                            : 'Atelier Consultant'}
                      </p>
                      <div className="whitespace-pre-wrap text-xs sm:text-sm">
                        {msg.text}
                      </div>

                      {msg.mapsPlaces && msg.mapsPlaces.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4edea3]">
                            Verified Google Maps Locations
                          </p>
                          <ul className="space-y-2">
                            {msg.mapsPlaces.map((place) => (
                              <li
                                key={place.uri}
                                className="rounded-lg bg-[#0a0e16]/80 border border-white/8 p-2.5"
                              >
                                <a
                                  href={place.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d0bcff] hover:underline"
                                >
                                  <MapPin className="h-3.5 w-3.5 text-[#4edea3] shrink-0" aria-hidden="true" />
                                  <span>{place.title}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                </a>
                                {place.reviewSnippets.length > 0 && (
                                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                                    “{place.reviewSnippets[0]}”
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  {isSending && (
                    <div className="mr-4 rounded-xl border border-[#8B5CF6]/25 bg-[#121826]/90 p-4 text-xs text-[#94A3B8]">
                      Consulting Luminous Atelier intelligence...
                    </div>
                  )}
                  <div ref={scrollEndRef} />
                </div>
              )}

              {textError && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#ffb4ab]/35 bg-[#93000a]/30 px-3.5 py-2.5 text-xs text-[#ffdad6]"
                >
                  {textError}
                </div>
              )}
            </div>

            {/* Bottom Follow-Up Input + Maps Grounding Toggle */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitFollowUp(question);
              }}
              className="space-y-3 border-t border-white/10 pt-4"
            >
              <button
                type="button"
                role="switch"
                aria-checked={mapsEnabled}
                onClick={() => setMapsEnabled((v) => !v)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                  mapsEnabled
                    ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#4edea3]'
                    : 'bg-[#0a0e16]/70 border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Include Nearby Boutiques &amp; Salons (Google Maps)</span>
                </span>
                <span className="font-semibold">
                  {mapsEnabled ? 'Enabled' : 'Auto'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <label htmlFor="follow-up-input" className="sr-only">
                  Ask a follow-up question
                </label>
                <input
                  id="follow-up-input"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about layering, undertones, or nearby salons..."
                  className="atelier-input flex-1 rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
                />
                <button
                  type="submit"
                  disabled={isSending || question.trim().length === 0}
                  aria-label="Send follow-up question"
                  className="atelier-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ask</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Mode 2: Live API Real-Time Voice Conversation (gemini-3.8-live) */
          <div className="flex flex-1 flex-col justify-between py-5 overflow-hidden">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="rounded-2xl border border-white/10 bg-[#0a0e16]/80 p-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#8B5CF6]/40 bg-[#6366F1]/15">
                  {voiceState === 'connected' && micActive ? (
                    <Mic className="h-6 w-6 text-[#d0bcff]" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-6 w-6 text-[#d0bcff]" aria-hidden="true" />
                  )}
                </div>
                <p className="font-display text-xl text-[#F8FAFC]">
                  {voiceState === 'connected'
                    ? 'Live Consultation Active'
                    : voiceState === 'connecting'
                      ? 'Connecting to Live Voice Salon...'
                      : 'Real-Time Atelier Voice Session'}
                </p>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Speak naturally about{' '}
                  <span className="text-[#F8FAFC]">
                    {context.suggestionTitle ?? `${context.clientName}'s calibration`}
                  </span>{' '}
                  for instant spoken guidance from your salon formulator.
                </p>

                <div className="mt-4 flex justify-center gap-3">
                  {voiceState === 'connected' || voiceState === 'connecting' ? (
                    <button
                      type="button"
                      onClick={stopVoiceSession}
                      className="atelier-btn-secondary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#ffb2b9] border-[#ffb2b9]/35"
                    >
                      <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>End Voice Session</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startVoiceSession()}
                      className="atelier-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white"
                    >
                      <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Start Voice Consultation</span>
                    </button>
                  )}
                </div>
              </div>

              {voiceError && (
                <div
                  role="status"
                  className="rounded-lg border border-[#F59E0B]/35 bg-[#181c24] px-3.5 py-2.5 text-xs text-[#F8FAFC]"
                >
                  {voiceError}
                </div>
              )}

              {/* Live Transcription Stream */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Live Session Transcript
                </p>
                {voiceTranscripts.length === 0 ? (
                  <p className="rounded-xl border border-white/8 bg-[#0a0e16]/60 p-4 text-xs text-[#94A3B8]">
                    Spoken dialogue and real-time audio transcriptions will appear here
                    once your voice session begins.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {voiceTranscripts.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                          entry.speaker === 'You'
                            ? 'ml-8 bg-[#262a33] text-[#F8FAFC]'
                            : 'mr-4 bg-[#121826] border border-[#8B5CF6]/25 text-[#dfe2ee]'
                        }`}
                      >
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          {entry.speaker}
                        </p>
                        <p>{entry.text}</p>
                      </div>
                    ))}
                    <div ref={scrollEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Optional Text Prompt inside Live Session */}
            <form
              onSubmit={handleSendVoiceText}
              className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4"
            >
              <label htmlFor="voice-text-prompt" className="sr-only">
                Send text prompt to live voice session
              </label>
              <input
                id="voice-text-prompt"
                type="text"
                value={voicePrompt}
                onChange={(e) => setVoicePrompt(e.target.value)}
                disabled={voiceState !== 'connected'}
                placeholder={
                  voiceState === 'connected'
                    ? 'Or type a prompt for a live spoken reply...'
                    : 'Start Voice Consultation above to connect...'
                }
                className="atelier-input flex-1 rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/55 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={voiceState !== 'connected' || voicePrompt.trim().length === 0}
                className="atelier-btn-primary rounded-lg px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                Speak
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
