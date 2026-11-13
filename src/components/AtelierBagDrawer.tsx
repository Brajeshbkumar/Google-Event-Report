import { useState } from 'react';
import { X, Minus, Plus, Trash2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { ITEM_ASSETS } from '../data/atelierData';
import {
  calculateBagSummary,
  COMPLIMENTARY_COURIER_THRESHOLD_EUR,
  validateOrderForm,
  type BagItem,
  type ClientProfile,
  type ConfirmedOrder,
  type OrderFormInput,
} from '../utils/atelierEngine';
import { AtelierImage } from './AtelierImage';

interface AtelierBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bagItems: BagItem[];
  activeClient: ClientProfile;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onConfirmOrder: (form: OrderFormInput) => ConfirmedOrder;
  onBrowseCuration: () => void;
}

export function AtelierBagDrawer({
  isOpen,
  onClose,
  bagItems,
  activeClient,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmOrder,
  onBrowseCuration,
}: AtelierBagDrawerProps) {
  const [form, setForm] = useState<OrderFormInput>({
    fullName: activeClient.name,
    email: activeClient.email,
    phone: '',
    address: '',
    postalCode: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OrderFormInput, string>>
  >({});
  const [receipt, setReceipt] = useState<ConfirmedOrder | null>(null);

  if (!isOpen) return null;

  const summary = calculateBagSummary(bagItems);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateOrderForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    const confirmed = onConfirmOrder(form);
    setReceipt(confirmed);
  };

  const handleClose = () => {
    setReceipt(null);
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0B0F17]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bag-drawer-title"
    >
      <div className="atelier-glass-tier-3 flex h-full w-full max-w-lg flex-col justify-between overflow-y-auto p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Private Atelier Selection
            </p>
            <h2
              id="bag-drawer-title"
              className="font-display text-2xl font-medium text-[#F8FAFC]"
            >
              Atelier Bag <span className="tabular-nums text-lg text-[#d0bcff]">({summary.itemCount})</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Atelier Bag"
            className="atelier-btn-secondary flex h-9 w-9 items-center justify-center rounded-full text-[#F8FAFC]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Confirmed Receipt State */}
        {receipt ? (
          <div className="my-auto space-y-6 py-8">
            <div className="rounded-2xl border border-[#10B981]/35 bg-[#10B981]/10 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-[#4edea3] shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4edea3]">
                    Private Order Confirmed
                  </p>
                  <h3 className="font-display text-2xl text-[#F8FAFC] tabular-nums">
                    Order #{receipt.orderNumber} Confirmed
                  </h3>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#cbd5e1]">
                Prepared for {receipt.clientName}. Your bespoke items have been logged
                in the Client Dossier and scheduled for Paris white-glove courier
                dispatch.
              </p>

              <div className="mt-4 divide-y divide-white/10 border-t border-white/10 pt-3 text-xs">
                {receipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-2 gap-4">
                    <span className="text-[#F8FAFC]">
                      {it.quantity}× {it.title} · {it.swatchName}
                    </span>
                    <span className="tabular-nums text-[#cbd5e1]">
                      €{(it.priceEur * it.quantity).toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-semibold text-[#F8FAFC]">
                  <span>Total Charged</span>
                  <span className="tabular-nums">
                    €{receipt.totalEur.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="atelier-btn-primary w-full rounded-lg px-5 py-3 text-xs font-semibold text-white"
            >
              Return to Studio
            </button>
          </div>
        ) : bagItems.length === 0 ? (
          /* Empty State */
          <div className="my-auto flex flex-col items-center justify-center py-14 text-center">
            <ShoppingBag className="mb-4 h-10 w-10 text-[#94A3B8]/50" aria-hidden="true" />
            <h3 className="font-display text-2xl text-[#F8FAFC]">
              Your Atelier Bag is Empty
            </h3>
            <p className="mt-2 max-w-xs text-sm text-[#94A3B8]">
              Explore calibrated formulations and Parisian couture pieces matched to{' '}
              {activeClient.name}.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose();
                onBrowseCuration();
              }}
              className="atelier-btn-primary mt-6 rounded-lg px-5 py-2.5 text-xs font-semibold text-white"
            >
              Browse Curations
            </button>
          </div>
        ) : (
          /* Active Bag + Checkout Verification Form */
          <div className="flex flex-1 flex-col justify-between gap-6 py-5">
            {/* Complimentary Courier Status */}
            <div className="rounded-xl bg-[#0a0e16]/80 border border-white/8 p-3.5 text-xs">
              {summary.remainingForComplimentaryEur === 0 ? (
                <p className="text-[#4edea3] font-medium">
                  Complimentary Paris white-glove courier unlocked.
                </p>
              ) : (
                <p className="text-[#cbd5e1]">
                  Add{' '}
                  <span className="font-semibold text-[#F8FAFC] tabular-nums">
                    €{summary.remainingForComplimentaryEur.toLocaleString('en-US')}
                  </span>{' '}
                  more for complimentary courier (threshold €
                  {COMPLIMENTARY_COURIER_THRESHOLD_EUR}).
                </p>
              )}
            </div>

            {/* Itemized List */}
            <ul className="space-y-3" aria-label="Items in Atelier Bag">
              {bagItems.map((entry, idx) => (
                <li
                  key={`${entry.item.id}-${entry.selectedSwatch.id}-${idx}`}
                  className="flex gap-3.5 rounded-xl bg-[#121826]/80 border border-white/8 p-3"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#0a0e16]">
                    <AtelierImage
                      src={ITEM_ASSETS[entry.item.imageKey]}
                      alt={entry.item.title}
                      fallbackTitle={entry.item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base text-[#F8FAFC]">
                          {entry.item.title}
                        </p>
                        <p className="truncate text-xs text-[#94A3B8]">
                          {entry.selectedSwatch.name}
                        </p>
                        {entry.bespokeNote && (
                          <p className="mt-0.5 truncate text-[11px] text-[#d0bcff]">
                            Note: {entry.bespokeNote}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        aria-label={`Remove ${entry.item.title}`}
                        className="text-[#94A3B8] hover:text-[#ffb4ab] p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-[#0a0e16] border border-white/10 px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, -1)}
                          aria-label={`Decrease quantity of ${entry.item.title}`}
                          className="p-1 text-[#94A3B8] hover:text-[#F8FAFC]"
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums text-[#F8FAFC]">
                          {entry.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, 1)}
                          aria-label={`Increase quantity of ${entry.item.title}`}
                          className="p-1 text-[#94A3B8] hover:text-[#F8FAFC]"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold text-[#F8FAFC] tabular-nums">
                        €{(entry.item.priceEur * entry.quantity).toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Totals & Private Delivery Form */}
            <form
              onSubmit={handlePlaceOrder}
              noValidate
              className="space-y-4 border-t border-white/10 pt-5"
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-[#F8FAFC]">
                    €{summary.subtotalEur.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>White-Glove Courier</span>
                  <span className="tabular-nums text-[#F8FAFC]">
                    {summary.courierFeeEur === 0
                      ? 'Complimentary'
                      : `€${summary.courierFeeEur}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-semibold text-[#F8FAFC]">
                  <span>Total</span>
                  <span className="tabular-nums">
                    €{summary.totalEur.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Client Courier &amp; Fitting Verification
                </p>

                <div>
                  <label htmlFor="order-name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="order-name"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Client Full Name"
                    className="atelier-input w-full rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="order-email" className="sr-only">
                      Email Address
                    </label>
                    <input
                      id="order-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email Address"
                      className="atelier-input w-full rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
                    />
                    {errors.email && (
                      <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="order-phone" className="sr-only">
                      Phone Number
                    </label>
                    <input
                      id="order-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Private Phone"
                      className="atelier-input w-full rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="order-address" className="sr-only">
                      Street Address
                    </label>
                    <input
                      id="order-address"
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Rue / Street Address"
                      className="atelier-input w-full rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
                    />
                    {errors.address && (
                      <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="order-postal" className="sr-only">
                      Postal Code
                    </label>
                    <input
                      id="order-postal"
                      type="text"
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm({ ...form, postalCode: e.target.value })
                      }
                      placeholder="Postal Code"
                      className="atelier-input w-full rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/60"
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-[11px] text-[#ffb4ab]">{errors.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="atelier-btn-luxury w-full rounded-lg px-5 py-3 text-xs font-bold tracking-wide"
              >
                Confirm Bespoke Order · €{summary.totalEur.toLocaleString('en-US')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
