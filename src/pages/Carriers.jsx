import { useState } from 'react';
import { Star, Plus, X, Truck, Phone, CheckCircle, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRUCK_TYPES } from '../data/store';

export default function Carriers() {
  const { carriers, loads, addCarrier } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', contact: '', phone: '', email: '', location: '',
    truckTypes: [], truckCount: '',
  });

  function toggleTruckType(t) {
    setForm(f => ({
      ...f,
      truckTypes: f.truckTypes.includes(t)
        ? f.truckTypes.filter(x => x !== t)
        : [...f.truckTypes, t],
    }));
  }

  function handleAdd(e) {
    e.preventDefault();
    addCarrier({
      id: `c${Date.now()}`,
      ...form,
      truckCount: Number(form.truckCount),
      rating: 5.0,
      verified: false,
      totalLoads: 0,
    });
    setForm({ name: '', contact: '', phone: '', email: '', location: '', truckTypes: [], truckCount: '' });
    setShowForm(false);
  }

  function whatsappCarrier(carrier) {
    const text = encodeURIComponent(
      `Hi ${carrier.contact}, this is FreightLink brokerage. We have loads available for ${carrier.truckTypes.join(', ')} trucks. Are you available?`
    );
    const phone = carrier.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  function getCarrierActiveLoads(carrierId) {
    return loads.filter(l => l.carrierId === carrierId && ['Booked', 'In Transit'].includes(l.status)).length;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Network</h1>
          <p className="text-slate-500 text-sm mt-1">{carriers.length} carriers in your network</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Carrier'}
        </button>
      </div>

      {/* Add carrier form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">New Carrier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              ['Company Name', 'name', 'text', 'FastHaul Logistics'],
              ['Contact Person', 'contact', 'text', 'James Mwangi'],
              ['Phone', 'phone', 'tel', '+254 7XX XXX XXX'],
              ['Email', 'email', 'email', 'james@example.co.ke'],
              ['Base Location', 'location', 'text', 'Nairobi'],
              ['Number of Trucks', 'truckCount', 'number', '5'],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{label} *</label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-2">Truck Types *</label>
            <div className="flex flex-wrap gap-2">
              {TRUCK_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTruckType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.truckTypes.includes(t)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={form.truckTypes.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            Add to Network
          </button>
        </form>
      )}

      {/* Carrier grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {carriers.map(carrier => {
          const activeLoads = getCarrierActiveLoads(carrier.id);
          return (
            <div key={carrier.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{carrier.name}</h3>
                    {carrier.verified && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <CheckCircle size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{carrier.contact} · {carrier.location}</div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-amber-700">{carrier.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="font-bold text-slate-900 text-sm">{carrier.truckCount}</div>
                  <div className="text-xs text-slate-500">Trucks</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="font-bold text-slate-900 text-sm">{carrier.totalLoads}</div>
                  <div className="text-xs text-slate-500">Total Loads</div>
                </div>
                <div className={`rounded-lg p-2 ${activeLoads > 0 ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <div className={`font-bold text-sm ${activeLoads > 0 ? 'text-blue-600' : 'text-slate-900'}`}>{activeLoads}</div>
                  <div className="text-xs text-slate-500">Active Now</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {carrier.truckTypes.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    <Truck size={10} /> {t}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <a
                  href={`tel:${carrier.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Phone size={13} /> Call
                </a>
                <button
                  onClick={() => whatsappCarrier(carrier)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                >
                  <Share2 size={13} /> WhatsApp
                </button>
                <div className="ml-auto text-xs text-slate-400 flex items-center">{carrier.phone}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
