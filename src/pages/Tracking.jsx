import { useState } from 'react';
import { Search, CheckCircle, Circle, Clock, Phone, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Tracking() {
  const { loads, carriers, markDelivered } = useApp();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    const found = loads.find(l => l.id.toLowerCase() === query.trim().toLowerCase());
    if (found) {
      setResult(found);
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
  }

  // Auto-refresh result when loads update
  const live = result ? loads.find(l => l.id === result.id) : null;
  const carrier = live ? carriers.find(c => c.id === live.carrierId) : null;

  const statusIndex = {
    Available: 0,
    Booked: 1,
    'In Transit': 2,
    Delivered: 4,
    Cancelled: -1,
  };

  const timelineEvents = live ? live.timeline : [];
  const doneCount = timelineEvents.filter(t => t.done).length;
  const progress = timelineEvents.length > 0 ? (doneCount / timelineEvents.length) * 100 : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Live Tracking</h1>
        <p className="text-slate-500 text-sm mt-1">Track any shipment by Load ID</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-lg">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter Load ID (e.g. FL-001)"
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          Track
        </button>
      </form>

      {notFound && (
        <div className="text-center py-8 text-slate-400">
          <MapPin size={32} className="mx-auto mb-2 opacity-30" />
          <p>No load found with ID "{query}". Check the Load Board for correct IDs.</p>
        </div>
      )}

      {/* Quick access */}
      {!live && !notFound && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Active Shipments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loads
              .filter(l => ['Booked', 'In Transit'].includes(l.status))
              .map(l => (
                <button
                  key={l.id}
                  onClick={() => { setResult(l); setQuery(l.id); setNotFound(false); }}
                  className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">{l.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      l.status === 'In Transit' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{l.status}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{l.origin} → {l.destination}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{l.commodity}</div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Tracking result */}
      {live && (
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="font-mono text-xs text-slate-400 mb-1">{live.id}</div>
                <h2 className="text-xl font-bold text-slate-900">{live.origin} → {live.destination}</h2>
                <div className="text-sm text-slate-500 mt-1">{live.commodity} · {live.weight.toLocaleString()} kg · {live.truckType}</div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                live.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                live.status === 'In Transit' ? 'bg-amber-100 text-amber-700' :
                live.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                live.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {live.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    live.status === 'Cancelled' ? 'bg-red-400' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {timelineEvents.map((step, i) => (
                <div key={step.event} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      step.done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.done
                        ? <CheckCircle size={14} />
                        : <Circle size={14} />
                      }
                    </div>
                    {i < timelineEvents.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.done ? 'bg-blue-200' : 'bg-slate-100'}`} style={{ minHeight: '20px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className={`text-sm font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.event}
                    </div>
                    {step.time ? (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Clock size={11} />
                        {step.time}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300 mt-0.5">Pending</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrier & Shipment details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {carrier && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Assigned Carrier</h3>
                <div className="text-sm text-slate-700 font-medium">{carrier.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{carrier.contact}</div>
                <div className="text-xs text-slate-500">{carrier.phone}</div>
                <a
                  href={`tel:${carrier.phone}`}
                  className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 w-fit"
                >
                  <Phone size={13} /> Call Driver
                </a>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Shipment Details</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup Date</span>
                  <span className="font-medium">{live.pickupDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery Date</span>
                  <span className="font-medium">{live.deliveryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Freight Value</span>
                  <span className="font-medium">KES {live.freightAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Insurance</span>
                  <span className="font-medium">{live.cargoInsurance ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipper</span>
                  <span className="font-medium">{live.shipperContact}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {(live.status === 'Booked' || live.status === 'In Transit') && (
            <div className="flex gap-3">
              <button
                onClick={() => markDelivered(live.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
              >
                <CheckCircle size={16} /> Mark Delivered
              </button>
              {carrier && (
                <a
                  href={`tel:${carrier.phone}`}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  <Phone size={16} /> Call Driver
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
