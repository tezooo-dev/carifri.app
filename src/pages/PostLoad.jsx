import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRUCK_TYPES, COMMODITIES, COMMISSION_RATE } from '../data/store';

const CITIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru', 'Thika', 'Machakos', 'Nyeri', 'Malindi', 'Garissa'];

const empty = {
  origin: '',
  destination: '',
  commodity: '',
  weight: '',
  truckType: '',
  pickupDate: '',
  deliveryDate: '',
  freightAmount: '',
  advance: '',
  cargoInsurance: false,
  shipperContact: '',
  shipperPhone: '',
  shipperEmail: '',
  shipperId: '',
  specialInstructions: '',
};

export default function PostLoad() {
  const { addLoad, shippers } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);

  const commission = form.freightAmount
    ? Math.round(parseFloat(form.freightAmount) * COMMISSION_RATE)
    : 0;

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function selectShipper(id) {
    const s = shippers.find(sh => sh.id === id);
    if (!s) { set('shipperId', ''); return; }
    setForm(f => ({
      ...f,
      shipperId: s.id,
      shipperContact: s.contact,
      shipperPhone: s.phone,
      shipperEmail: s.email,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const id = `FL-${String(Date.now()).slice(-4)}`;
    const now = new Date().toLocaleString('en-KE', { hour12: false }).replace(',', '');
    addLoad({
      id,
      ...form,
      weight: Number(form.weight),
      freightAmount: Number(form.freightAmount),
      advance: Number(form.advance) || 0,
      commission,
      commissionReceived: false,
      status: 'Available',
      carrierId: null,
      timeline: [
        { event: 'Load Posted', time: now, done: true },
        { event: 'Carrier Assigned', time: '', done: false },
        { event: 'Picked Up', time: '', done: false },
        { event: 'In Transit', time: '', done: false },
        { event: 'Delivered', time: '', done: false },
      ],
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Load Posted!</h2>
        <p className="text-slate-500 mb-1">
          Your load from <strong>{form.origin}</strong> to <strong>{form.destination}</strong> is now live.
        </p>
        <p className="text-sm text-green-600 font-medium mb-6">
          Estimated commission: KES {commission.toLocaleString()}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setForm(empty); setSubmitted(false); }}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            Post Another
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Go to Load Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Post New Load</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the shipment details to list it on the board.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Route */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Route</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Origin *</label>
              <select
                required
                value={form.origin}
                onChange={e => set('origin', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Destination *</label>
              <select
                required
                value={form.destination}
                onChange={e => set('destination', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Pickup Date *</label>
              <input
                type="date"
                required
                value={form.pickupDate}
                onChange={e => set('pickupDate', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Delivery Date *</label>
              <input
                type="date"
                required
                value={form.deliveryDate}
                onChange={e => set('deliveryDate', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Cargo Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Commodity *</label>
              <select
                required
                value={form.commodity}
                onChange={e => set('commodity', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select commodity</option>
                {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Weight (kg) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
                placeholder="e.g. 15000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Truck Type *</label>
              <select
                required
                value={form.truckType}
                onChange={e => set('truckType', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.cargoInsurance}
                  onChange={e => set('cargoInsurance', e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-slate-700">Cargo Insurance Required</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Special Instructions</label>
            <textarea
              value={form.specialInstructions}
              onChange={e => set('specialInstructions', e.target.value)}
              rows={2}
              placeholder="e.g. Handle with care, temperature requirements..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Finance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Financials</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Freight Amount (KES) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.freightAmount}
                onChange={e => set('freightAmount', e.target.value)}
                placeholder="e.g. 150000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Advance Payment (KES)</label>
              <input
                type="number"
                min="0"
                value={form.advance}
                onChange={e => set('advance', e.target.value)}
                placeholder="e.g. 75000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Commission calculator */}
          {commission > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <Calculator size={18} className="text-emerald-600 shrink-0" />
              <div className="text-sm">
                <span className="text-slate-600">Your commission (8%): </span>
                <span className="font-bold text-emerald-700 text-base">KES {commission.toLocaleString()}</span>
                <span className="text-slate-400 ml-2 text-xs">
                  on KES {Number(form.freightAmount).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Shipper */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Shipper / Client</h3>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Select Existing Client</label>
            <select
              value={form.shipperId}
              onChange={e => selectShipper(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Or enter manually below --</option>
              {shippers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Contact Name *</label>
              <input
                type="text"
                required
                value={form.shipperContact}
                onChange={e => set('shipperContact', e.target.value)}
                placeholder="John Doe"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone *</label>
              <input
                type="tel"
                required
                value={form.shipperPhone}
                onChange={e => set('shipperPhone', e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={form.shipperEmail}
                onChange={e => set('shipperEmail', e.target.value)}
                placeholder="contact@company.co.ke"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Post Load to Board
        </button>
      </form>
    </div>
  );
}
