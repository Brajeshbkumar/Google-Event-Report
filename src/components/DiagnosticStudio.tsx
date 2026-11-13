import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine, ArrowRight, Check, MessageSquare, Mic, MapPin } from 'lucide-react';
import {
  ALL_CONCERNS,
  PORTRAIT_ASSETS,
  WAVELENGTH_MODES,
} from '../data/atelierData';
import type {
  ClientProfile,
  DermalConcern,
  WavelengthMode,
} from '../utils/atelierEngine';
import { AtelierImage } from './AtelierImage';

interface DiagnosticStudioProps {
  clients: ClientProfile[];
  activeClient: ClientProfile;
  onSelectClient: (clientId: string) => void;
  wavelength: WavelengthMode;
  onChangeWavelength: (mode: WavelengthMode) => void;
  onToggleConcern: (concern: DermalConcern) => void;
  onRunScan: () => void;
  isScanning: boolean;
  diagnosticNote: string;
  highMatchCount: number;
  onNavigateCuration: () => void;
  onOpenConsultation: (options: { mode?: 'text' | 'voice'; maps?: boolean }) => void;
}

function getVitalStatusLabel(value: number, inverted = false): {
  label: string;
  toneClass: string;
} {
  if (inverted) {
    return value <= 45
      ? { label: 'Low Melanin', toneClass: 'text-[#4edea3]' }
      : { label: 'Balanced Melanin', toneClass: 'text-[#F59E0B]' };
  }
  if (value >= 88) {
    return { label: 'Optimal', toneClass: 'text-[#4edea3]' };
  }
  if (value >= 78) {
    return { label: 'Nominal', toneClass: 'text-[#4edea3]' };
  }
  return { label: 'Reinforce', toneClass: 'text-[#F59E0B]' };
}

export function DiagnosticStudio({
  clients,
  activeClient,
  onSelectClient,
  wavelength,
  onChangeWavelength,
  onToggleConcern,
  onRunScan,
  isScanning,
  diagnosticNote,
  highMatchCount,
  onNavigateCuration,
  onOpenConsultation,
}: DiagnosticStudioProps) {
  const [liveMirrorOn, setLiveMirrorOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeWave =
    WAVELENGTH_MODES.find((w) => w.id === wavelength) ?? WAVELENGTH_MODES[0];

  useEffect(() => {
    if (!liveMirrorOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;

    async function enableCamera() {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Optical camera feed is unavailable in this browser; displaying studio calibration render.',
        );
        setLiveMirrorOn(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            'Camera permission declined or no lens detected; continuing with studio portrait render.',
          );
          setLiveMirrorOn(false);
        }
      }
    }

    enableCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [liveMirrorOn]);

  const vitals = [
    {
      label: 'Epidermal Hydration',
      value: `${activeClient.metrics.hydration}%`,
      status: getVitalStatusLabel(activeClient.metrics.hydration),
    },
    {
      label: 'Barrier Integrity',
      value: `${activeClient.metrics.barrierIntegrity}%`,
      status: getVitalStatusLabel(activeClient.metrics.barrierIntegrity),
    },
    {
      label: 'Pigment Stability',
      value: `${activeClient.metrics.pigmentStability}%`,
      status: getVitalStatusLabel(activeClient.metrics.pigmentStability),
    },
    {
      label: 'Melanin Index',
      value: `${activeClient.metrics.melaninIndex}%`,
      status: getVitalStatusLabel(activeClient.metrics.melaninIndex, true),
    },
  ];

  return (
    <section aria-labelledby="diagnostic-heading" className="space-y-8">
      {/* Workspace Toolbar */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Private Salon · Biometric Dermal &amp; Chromatic Analysis
          </p>
          <h1
            id="diagnostic-heading"
            className="font-display text-3xl font-medium tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl text-balance"
          >
            Chromatic <span className="italic text-[#d0bcff]">Dermal Metrics</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
            <span>{activeClient.name}</span>
            <span aria-hidden="true">·</span>
            <span>{activeClient.season}</span>
            <span aria-hidden="true">·</span>
            <span>{activeClient.undertone}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Last scan {activeClient.lastScannedLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Client Switcher */}
          <div
            role="group"
            aria-label="Active client profile"
            className="flex items-center gap-1 rounded-lg bg-[#0a0e16] p-1 border border-white/10"
          >
            {clients.map((client) => {
              const selected = client.id === activeClient.id;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => onSelectClient(client.id)}
                  aria-pressed={selected}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    selected
                      ? 'bg-[#262a33] text-[#F8FAFC] shadow-sm border border-white/10'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {client.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setLiveMirrorOn((prev) => !prev)}
            aria-pressed={liveMirrorOn}
            className="atelier-btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap shrink-0"
          >
            {liveMirrorOn ? (
              <>
                <CameraOff className="h-3.5 w-3.5 text-[#ffb2b9]" aria-hidden="true" />
                <span>Close Mirror</span>
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-[#d0bcff]" aria-hidden="true" />
                <span>Live Mirror</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRunScan}
            disabled={isScanning}
            className="atelier-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isScanning ? 'Scanning Wavelengths...' : 'Run Biometric Scan'}</span>
          </button>
        </div>
      </div>

      {cameraError && (
        <div
          role="status"
          className="rounded-lg border border-[#F59E0B]/30 bg-[#181c24] px-4 py-3 text-xs text-[#F8FAFC]"
        >
          {cameraError}
        </div>
      )}

      {/* Main 12-Column Split Studio */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left 7 Columns: Biometric Scan Panel */}
        <div
          className={`atelier-glass-tier-2 flex flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-7 ${
            isScanning ? 'atelier-lens-active' : ''
          }`}
        >
          {/* Upper Quadrant: Wavelength Metadata & Tactile Mode Switcher */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Optical Feed · {activeWave.spectrum}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC] tabular-nums">
                Confidence {activeClient.confidenceScore}% · CIELAB Calibrated
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Optical wavelength mode"
              className="grid grid-cols-2 sm:flex items-center gap-1 rounded-lg bg-[#0a0e16] p-1 border border-white/10"
            >
              {WAVELENGTH_MODES.map((mode) => {
                const active = mode.id === wavelength;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChangeWavelength(mode.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                      active
                        ? 'bg-[#262a33] text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(248,250,252,0.14)]'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none overflow-hidden rounded-xl border border-white/10 bg-[#0a0e16] aspect-[3/4] lg:aspect-auto lg:h-[540px]">
            {liveMirrorOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transition-[filter] duration-300"
                style={{ filter: activeWave.filterCss }}
              />
            ) : (
              <AtelierImage
                src={PORTRAIT_ASSETS[activeClient.portraitKey]}
                alt={`${activeClient.name} biometric dermal studio portrait`}
                fallbackTitle={activeClient.name}
                className="h-full w-full object-cover object-[50%_14%] transition-[filter] duration-300"
                style={{ filter: activeWave.filterCss }}
              />
            )}

            {/* Subtle Spectral Tint Layer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{ background: activeWave.tintOverlay }}
            />

            {/* Precision Corner Reticules */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-5 border border-white/10 rounded-lg"
            >
              <span className="absolute -top-px -left-px h-4 w-4 border-t-2 border-l-2 border-[#d0bcff]/70 rounded-tl-sm" />
              <span className="absolute -top-px -right-px h-4 w-4 border-t-2 border-r-2 border-[#d0bcff]/70 rounded-tr-sm" />
              <span className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-[#d0bcff]/70 rounded-bl-sm" />
              <span className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-[#d0bcff]/70 rounded-br-sm" />
            </div>

            {/* Active Biometric Sweep Line */}
            {isScanning && (
              <div
                aria-hidden="true"
                className="animate-scan-sweep pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-[#8B5CF6]/45 to-transparent border-b border-[#d0bcff]"
              />
            )}

            {/* Measured Bottom Contrast Scrim */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/45 to-transparent p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#d0bcff]">
                    {activeClient.archetype}
                  </p>
                  <p className="mt-1 font-display text-xl text-[#F8FAFC]">
                    {activeClient.name}
                  </p>
                </div>
                <p className="text-xs font-medium text-[#cbd5e1] tabular-nums">
                  {activeWave.label}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Telemetry Note */}
          <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-[#94A3B8] max-w-2xl">
              {diagnosticNote}
            </p>
          </div>
        </div>

        {/* Right 5 Columns: Clinical Vitals, Concentric Selection Nodes & Couture Swatches */}
        <div className="atelier-glass-tier-2 flex flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-5">
          <div className="space-y-7">
            {/* Clinical Vital Readouts */}
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-medium text-[#F8FAFC]">
                  Clinical <span className="italic">Vitals</span>
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4edea3]">
                  Telemetry Active
                </span>
              </div>

              <div className="mt-4 divide-y divide-white/10 rounded-xl bg-[#0a0e16]/75 border border-white/8 px-4">
                {vitals.map((vital) => (
                  <div
                    key={vital.label}
                    className="flex items-center justify-between py-3.5 gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F8FAFC]">
                        {vital.label}
                      </p>
                      <p className={`text-xs font-medium ${vital.status.toneClass}`}>
                        {vital.status.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-md bg-[#10B981]/10 border border-[#10B981]/25 px-2.5 py-1">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                      />
                      <span className="text-sm font-semibold text-[#F8FAFC] tabular-nums">
                        {vital.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concentric Selection Nodes for Dermal Focus */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Active Calibration Targets
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {ALL_CONCERNS.map((concern) => {
                  const selected = activeClient.concerns.includes(concern);
                  return (
                    <button
                      key={concern}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => onToggleConcern(concern)}
                      className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-medium transition-all border ${
                        selected
                          ? 'bg-[#1c2028] border-[#8B5CF6]/50 text-[#F8FAFC]'
                          : 'bg-[#0a0e16]/60 border-white/8 text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {/* Concentric Selection Node */}
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                          selected
                            ? 'border-[#d0bcff] ring-2 ring-[#8B5CF6]/35'
                            : 'border-[#94A3B8]/40'
                        }`}
                      >
                        {selected && (
                          <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                        )}
                      </span>
                      <span className="truncate">{concern}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Couture Palette Chips */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Calibrated Undertone Swatches · {activeClient.season}
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {activeClient.swatches.map((swatch) => (
                  <div
                    key={swatch.id}
                    className="flex items-center gap-2.5 rounded-full bg-[#121826]/90 border border-white/10 px-3 py-1.5"
                  >
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${swatch.primaryHex} 50%, ${swatch.secondaryHex} 50%)`,
                      }}
                    />
                    <span className="text-xs font-medium text-[#F8FAFC] whitespace-nowrap">
                      {swatch.name}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] whitespace-nowrap">
                      · {swatch.finish}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Route to Curation & Consultation */}
          <div className="mt-7 space-y-3 border-t border-white/10 pt-5">
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              {activeClient.notes}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => onOpenConsultation({ mode: 'text', maps: false })}
                className="atelier-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#d0bcff] whitespace-nowrap"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ask Follow-Up</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenConsultation({ mode: 'voice', maps: false })}
                className="atelier-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap"
              >
                <Mic className="h-3.5 w-3.5 text-[#d0bcff]" aria-hidden="true" />
                <span>Voice Salon</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenConsultation({ mode: 'text', maps: true })}
                className="atelier-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#4edea3] whitespace-nowrap"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Nearby Salons</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onNavigateCuration}
              className="atelier-btn-luxury flex w-full items-center justify-between rounded-lg px-4 py-3 text-xs font-bold tracking-wide"
            >
              <span>
                Explore {highMatchCount} Bespoke Curations for {activeClient.name}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-Width 4-Column Summary Strip Below Hero Split */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="atelier-surface-1 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Sartorial Archetype
          </p>
          <p className="mt-1.5 font-display text-lg text-[#F8FAFC]">
            {activeClient.archetype}
          </p>
        </div>
        <div className="atelier-surface-1 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Seasonal Color Key
          </p>
          <p className="mt-1.5 font-display text-lg text-[#ffb2b9]">
            {activeClient.season}
          </p>
        </div>
        <div className="atelier-surface-1 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Signature Matches
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
            <Check className="h-4 w-4 text-[#4edea3]" aria-hidden="true" />
            <span>{highMatchCount} Curated Pieces</span>
          </p>
        </div>
        <div className="atelier-surface-1 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Scan Confidence
          </p>
          <p className="mt-1.5 text-lg font-semibold text-[#d0bcff] tabular-nums">
            {activeClient.confidenceScore}% Validated
          </p>
        </div>
      </div>
    </section>
  );
}
