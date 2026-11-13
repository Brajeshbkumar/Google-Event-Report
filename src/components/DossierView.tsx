import { useState } from 'react';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { PORTRAIT_ASSETS } from '../data/atelierData';
import {
  validateClientIntakeForm,
  type ClientIntakeInput,
  type ClientProfile,
  type ConfirmedOrder,
  type SeasonalPalette,
} from '../utils/atelierEngine';
import { AtelierImage } from './AtelierImage';

interface DossierViewProps {
  clients: ClientProfile[];
  activeClient: ClientProfile;
  onSelectClient: (clientId: string) => void;
  onRegisterClient: (input: ClientIntakeInput) => void;
  orders: ConfirmedOrder[];
}

const SEASONS: SeasonalPalette[] = [
  'Cool Winter',
  'Warm Autumn',
  'Neutral Dusk',
  'Clear Spring',
];

const UNDERTONES: ClientProfile['undertone'][] = [
  'Cool Porcelain',
  'Warm Olive-Amber',
  'Neutral Ivory',
  'Deep Espresso-Gold',
];

export function DossierView({
  clients,
  activeClient,
  onSelectClient,
  onRegisterClient,
  orders,
}: DossierViewProps) {
  const [form, setForm] = useState<ClientIntakeInput>({
    name: '',
    email: '',
    archetype: '',
    season: 'Cool Winter',
    undertone: 'Cool Porcelain',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ClientIntakeInput, string>>
  >({});
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateClientIntakeForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setCreatedBanner(null);
      return;
    }
    setErrors({});
    onRegisterClient(form);
    setCreatedBanner(`${form.name.trim()} added to the Private Client Dossier.`);
    setForm({
      name: '',
      email: '',
      archetype: '',
      season: 'Cool Winter',
      undertone: 'Cool Porcelain',
    });
  };

  return (
    <section aria-labelledby="dossier-heading" className="space-y-10">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
          Private Client Registry &amp; Archive
        </p>
        <h1
          id="dossier-heading"
          className="mt-1 font-display text-3xl font-medium tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl text-balance"
        >
          Client <span className="italic text-[#ffb2b9]">Dossier</span>
        </h1>
      </div>

      {/* Grid: Client Profiles + New Client Intake */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Registered Clients */}
        <div className="space-y-4 lg:col-span-7">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Registered Salon Profiles ({clients.length})
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {clients.map((client) => {
              const isActive = client.id === activeClient.id;
              return (
                <article
                  key={client.id}
                  className={`atelier-glass-tier-2 flex flex-col justify-between rounded-2xl p-5 transition-all ${
                    isActive
                      ? 'border-[#8B5CF6]/60 shadow-[0_0_24px_-8px_rgba(139,92,246,0.3)]'
                      : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-14 overflow-hidden rounded-lg border border-white/10 bg-[#0a0e16] shrink-0">
                        <AtelierImage
                          src={PORTRAIT_ASSETS[client.portraitKey]}
                          alt={client.name}
                          fallbackTitle={client.name}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#d0bcff]">
                          {client.season}
                        </p>
                        <h3 className="mt-0.5 truncate font-display text-xl text-[#F8FAFC]">
                          {client.name}
                        </h3>
                        <p className="truncate text-xs text-[#94A3B8]">
                          {client.archetype}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/8 py-3 text-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          Hydration
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC] tabular-nums">
                          {client.metrics.hydration}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          Barrier
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC] tabular-nums">
                          {client.metrics.barrierIntegrity}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          Pigment
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#F8FAFC] tabular-nums">
                          {client.metrics.pigmentStability}%
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#94A3B8]">
                      {client.notes}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectClient(client.id)}
                    aria-pressed={isActive}
                    className={`mt-4 w-full rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#10B981]/15 border border-[#10B981]/35 text-[#4edea3]'
                        : 'atelier-btn-secondary text-[#F8FAFC]'
                    }`}
                  >
                    {isActive ? 'Active Studio Profile' : 'Load in Studio'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        {/* New Client Intake Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="atelier-glass-tier-2 rounded-2xl p-6 lg:col-span-5"
        >
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-4 w-4 text-[#d0bcff]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-medium text-[#F8FAFC]">
              Register Private Client
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Create a calibrated profile for biometric scanning and lookbook ranking.
          </p>

          {createdBanner && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 rounded-lg border border-[#10B981]/35 bg-[#10B981]/10 px-3.5 py-2.5 text-xs text-[#4edea3]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{createdBanner}</span>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="intake-name"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]"
              >
                Client Full Name
              </label>
              <input
                id="intake-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Margaux Delacroix"
                className="atelier-input mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/55"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[#ffb4ab]">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="intake-email"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]"
              >
                Private Email
              </label>
              <input
                id="intake-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="margaux@atelier-paris.fr"
                className="atelier-input mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/55"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#ffb4ab]">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="intake-archetype"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]"
              >
                Sartorial Archetype
              </label>
              <input
                id="intake-archetype"
                type="text"
                value={form.archetype}
                onChange={(e) => setForm({ ...form, archetype: e.target.value })}
                placeholder="e.g. Sculpted Minimalist"
                className="atelier-input mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/55"
              />
              {errors.archetype && (
                <p className="mt-1 text-xs text-[#ffb4ab]">{errors.archetype}</p>
              )}
            </div>

            {/* Concentric Selection Nodes: Season */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Seasonal Color Key
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SEASONS.map((season) => {
                  const selected = form.season === season;
                  return (
                    <button
                      key={season}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setForm({ ...form, season })}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        selected
                          ? 'bg-[#1c2028] border-[#8B5CF6]/55 text-[#F8FAFC]'
                          : 'bg-[#0a0e16]/60 border-white/8 text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-[#d0bcff] ring-2 ring-[#8B5CF6]/35'
                            : 'border-[#94A3B8]/40'
                        }`}
                      >
                        {selected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                        )}
                      </span>
                      <span className="truncate">{season}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Undertone Selector */}
            <div>
              <label
                htmlFor="intake-undertone"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]"
              >
                Complexion Undertone
              </label>
              <select
                id="intake-undertone"
                value={form.undertone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    undertone: e.target.value as ClientProfile['undertone'],
                  })
                }
                className="atelier-input mt-1.5 w-full rounded-lg bg-[#121826] px-3.5 py-2.5 text-sm text-[#F8FAFC]"
              >
                {UNDERTONES.map((tone) => (
                  <option key={tone} value={tone} className="bg-[#121826]">
                    {tone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="atelier-btn-primary mt-6 w-full rounded-lg px-5 py-3 text-xs font-semibold text-white"
          >
            Create Calibrated Profile
          </button>
        </form>
      </div>

      {/* Confirmed Order Ledger */}
      <div className="atelier-surface-1 overflow-hidden rounded-2xl">
        <div className="border-b border-white/8 px-6 py-4">
          <h2 className="font-display text-2xl font-medium text-[#F8FAFC]">
            Bespoke Order Ledger
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/8 bg-[#0a0e16]/60 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              <tr>
                <th className="px-6 py-3.5">Order Ref</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Curated Pieces</th>
                <th className="px-6 py-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {orders.map((order) => (
                <tr key={order.orderNumber} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-[#d0bcff] tabular-nums whitespace-nowrap">
                    #{order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-[#94A3B8] tabular-nums whitespace-nowrap">
                    {order.createdAt}
                  </td>
                  <td className="px-6 py-4 text-[#F8FAFC] whitespace-nowrap">
                    {order.clientName}
                  </td>
                  <td className="px-6 py-4 text-xs text-[#cbd5e1]">
                    {order.items
                      .map((it) => `${it.quantity}× ${it.title} (${it.swatchName})`)
                      .join(' · ')}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[#F8FAFC] tabular-nums whitespace-nowrap">
                    €{order.totalEur.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
