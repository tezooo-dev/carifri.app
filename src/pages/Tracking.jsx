import { useState, useEffect } from 'react';
import {
  Search, CheckCircle, Circle, Clock, Phone, MapPin, Truck,
  Package, ArrowRight, Share2, X, ChevronRight, Shield, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Step definitions mapped to timeline event names
const STEPS = [
  { key: 'Load Posted',       label: 'Posted',    short: 'Posted'    },
  { key: 'Carrier Assigned',  label: 'Assigned',  short: 'Assigned'  },
  { key: 'Picked Up',         label: 'Picked Up', short: 'Picked Up' },
  { key: 'In Transit',        label: 'In Transit',short: 'Transit'   },
  { key: 'Delivered',         label: 'Delivered', short: 'Done'      },
];

const STATUS_META = {
  Available:   { color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-400' },
  Booked:      { color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    dot: 'bg-blue-500'    },
  'In Transit':{ color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   dot: 'bg-amber-400'   },
  Delivered:   { color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
  Cancelled:   { color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     dot: 'bg-red-400'     },
};

function StepBar({ timeline, status }) {
  const steps = STEPS.map(s => {
    const event = timeline.find(t => t.key === s.key || t.event === s.key);
    return { ...s, done: event?.done ?? false, time: event?.time ?? '' };
  });

  const doneCount = steps.filter(s => s.done).length;
  const progress = ((doneCount - 1) / (steps.length - 1)) * 100;
  const isCancelled = status === 'Cancelled';

  return (
    <div className="px-2 py-4">
      {/* Track line */}
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 rounded-full" />
        <div
          className={`absolute top-4 left-0 h-1 rounded-full transition-all duration-700 ${isCancelled ? 'bg-red-400' : 'bg-blue-500'}`}
          style={{ width: `${isCancelled ? 100 : Math.max(0, progress)}%` }}
        />

        {/* Step dots */}
        <div className="relative flex justify-between">
          {steps.map((step, i) => {
            const isActive = step.done && (i === doneCount - 1);
            return (
              <div key={step.key} className="flex flex-col items-center" style={{ flex: i === 0 || i === steps.length - 1 ? '0 0 auto' : '1' }}>
                <div className={`
                  w-9 h-9 rounded-full border-2 flex items-center justify-center z-10
                  transition-all duration-300
                  ${isCancelled
                    ? 'bg-red-100 border-red-300 text-red-400'
                    : step.done
                      ? isActive && status !== 'Delivered'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                        : 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-300'
                  }
                `}>
                  {step.done && !isCancelled
                    ? <CheckCircle size={16} />
                    : <Circle size={16} />
                  }
                </div>
                {/* Pulse ring for active step */}
                {isActive && !isCancelled && status !== 'Delivered' && (
                  <div className="absolute w-9 h-9 rounded-full border-2 border-blue-400 animate-ping opacity-40" />
                )}
                <div className="mt-2 text-center">
                  <div className={`text-xs font-semibold hidden sm:block ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </div>
                  <div className={`text-xs font-semibold sm:hidden ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.short}
                  </div>
                  {step.time && (
                    <div className="text-xs text-slate-400 mt-0.5 hidden md:block">{step.time.split(' ')[0]}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RouteVisual({ origin, destination, status }) {
  const meta = STATUS_META[status] || STATUS_META['Available'];
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
      {/* Origin */}
      <div className="text-center shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-1">
          <Package size={18} className="text-white" />
        </div>
        <div className="text-xs font-bold text-slate-900">{origin}</div>
        <div className="text-xs text-slate-400">Origin</div>
      </div>

      {/* Route line */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        <div className="flex-1 border-t-2 border-dashed border-slate-300" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${meta.bg} ${meta.border} ${meta.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${status === 'In Transit' ? 'animate-pulse' : ''}`} />
          {status}
        </div>
        <div className="flex-1 border-t-2 border-dashed border-slate-300" />
      </div>

      {/* Destination */}
      <div className="text-center shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
          status === 'Delivered' ? 'bg-emerald-600' : 'bg-slate-300'
        }`}>
          <MapPin size={18} className="text-white" />
        </div>
        <div className="text-xs font-bold text-slate-900">{destination}</div>
        <div className="text-xs text-slate-400">Destination</div>
      </div>
    </div>
  );
}

function LoadCard({ load, onSelect, active }) {
  const meta = STATUS_META[load.status] || STATUS_META['Available'];
  return (
    <button
      onClick={() => onSelect(load)}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-slate-500">{load.id}</span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{load.origin} → {load.destination}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${meta.bg} ${meta.color}`}>
          {load.status}
        </span>
      </div>
      <div className="text-xs text-slate-500">{load.commodity} · {load.truckType}</div>
      {/* Mini step indicators */}
      <div className="flex gap-1 mt-2">
        {STEPS.map(s => {
          const ev = load.timeline.find(t => t.event === s.key);
          return (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full ${ev?.done ? 'bg-blue-500' : 'bg-slate-200'}`}
            />
          );
        })}
      </div>
    </button>
  );
}

export default function Tracking() {
  const { loads, carriers, markPickedUp, markDelivered, assignCarrier } = useApp();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('active'); // 'active' | 'all'
  const [now, setNow] = useState(new Date());

  // Tick clock for "live" feel
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const activeLoads = loads.filter(l => ['Booked', 'In Transit'].includes(l.status));
  const allTrackable = loads.filter(l => l.status !== 'Cancelled');

  const displayLoads = tab === 'active' ? activeLoads : allTrackable;

  function handleSearch(e) {
    e.preventDefault();
    const found = loads.find(l => l.id.toLowerCase() === query.trim().toLowerCase());
    if (found) { setSelectedId(found.id); setNotFound(false); }
    else { setSelectedId(null); setNotFound(true); }
  }

  function handleSelect(load) {
    setSelectedId(load.id);
    setNotFound(false);
    setQuery(load.id);
  }

  // Always read fresh from store
  const live = selectedId ? loads.find(l => l.id === selectedId) : null;
  const carrier = live ? carriers.find(c => c.id === live.carrierId) : null;

  const doneSteps = live ? live.timeline.filter(t => t.done).length : 0;
  const totalSteps = live ? live.timeline.length : 5;
  const progress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  function whatsappCarrier(c, load) {
    const text = encodeURIComponent(
      `Hi ${c.contact}, status update on FreightLink Load ${load.id}:\n` +
      `${load.origin} → ${load.destination} | ${load.commodity}\n` +
      `Please confirm current position.`
    );
    window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Tracking</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Real-time shipment status · Last updated {now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT PANEL — load list */}
        <div className="lg:w-80 shrink-0 space-y-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setNotFound(false); }}
                placeholder="Load ID, e.g. FL-001"
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Go
            </button>
          </form>

          {notFound && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              No load found for "{query}"
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-medium">
            <button
              onClick={() => setTab('active')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Active ({activeLoads.length})
            </button>
            <button
              onClick={() => setTab('all')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${tab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All ({allTrackable.length})
            </button>
          </div>

          {/* Load list */}
          <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
            {displayLoads.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No {tab === 'active' ? 'active' : ''} shipments
              </div>
            )}
            {displayLoads.map(l => (
              <LoadCard
                key={l.id}
                load={l}
                onSelect={handleSelect}
                active={selectedId === l.id}
              />
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — detail view */}
        <div className="flex-1 min-w-0">
          {!live ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MapPin size={32} className="opacity-40" />
              </div>
              <p className="font-medium text-slate-500">Select a shipment to track</p>
              <p className="text-sm mt-1">Click any load from the list or search by Load ID</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-400">{live.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(STATUS_META[live.status] || STATUS_META['Available']).bg} ${(STATUS_META[live.status] || STATUS_META['Available']).color}`}>
                        {live.status}
                      </span>
                      {live.cargoInsurance && (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Shield size={10} /> Insured
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{live.origin} → {live.destination}</h2>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {live.commodity} · {live.weight.toLocaleString()} kg · {live.truckType}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedId(null); setQuery(''); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Route visual */}
                <RouteVisual origin={live.origin} destination={live.destination} status={live.status} />

                {/* Step bar */}
                <StepBar timeline={live.timeline} status={live.status} />

                {/* Progress */}
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${live.status === 'Cancelled' ? 'bg-red-400' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{progress}% complete</span>
                </div>
              </div>

              {/* Timeline detail */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Event Log</h3>
                <div className="space-y-0">
                  {live.timeline.map((step, i) => (
                    <div key={step.event} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          step.done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'
                        }`}>
                          {step.done ? <CheckCircle size={13} /> : <Circle size={13} />}
                        </div>
                        {i < live.timeline.length - 1 && (
                          <div className={`w-px flex-1 my-1 ${step.done ? 'bg-blue-200' : 'bg-slate-100'}`} style={{ minHeight: 20 }} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className={`text-sm font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.event}
                        </div>
                        {step.time ? (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Clock size={11} /> {step.time}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300 mt-0.5">Awaiting</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Carrier */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Truck size={15} className="text-slate-400" /> Carrier
                  </h3>
                  {carrier ? (
                    <>
                      <div className="text-sm font-bold text-slate-900">{carrier.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{carrier.contact}</div>
                      <div className="text-xs text-blue-600 mt-0.5">{carrier.phone}</div>
                      <div className="flex gap-2 mt-3">
                        <a
                          href={`tel:${carrier.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          <Phone size={12} /> Call
                        </a>
                        <button
                          onClick={() => whatsappCarrier(carrier, live)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                        >
                          <Share2 size={12} /> WhatsApp
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No carrier assigned yet</div>
                  )}
                </div>

                {/* Shipment details */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Package size={15} className="text-slate-400" /> Shipment
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ['Pickup',   live.pickupDate],
                      ['Delivery', live.deliveryDate],
                      ['Freight',  `KES ${live.freightAmount.toLocaleString()}`],
                      ['Advance',  `KES ${live.advance.toLocaleString()}`],
                      ['Shipper',  live.shipperContact],
                      ['Phone',    live.shipperPhone],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}</span>
                        <span className="font-medium text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special instructions */}
              {live.specialInstructions && (
                <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{live.specialInstructions}</span>
                </div>
              )}

              {/* Action buttons */}
              {live.status !== 'Delivered' && live.status !== 'Cancelled' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {live.status === 'Booked' && (
                      <button
                        onClick={() => markPickedUp(live.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600"
                      >
                        <Truck size={15} /> Mark Picked Up
                      </button>
                    )}
                    {(live.status === 'Booked' || live.status === 'In Transit') && (
                      <button
                        onClick={() => markDelivered(live.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
                      >
                        <CheckCircle size={15} /> Mark Delivered
                      </button>
                    )}
                    {carrier && (
                      <button
                        onClick={() => whatsappCarrier(carrier, live)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600"
                      >
                        <Share2 size={15} /> Update via WhatsApp
                      </button>
                    )}
                    {carrier && (
                      <a
                        href={`tel:${carrier.phone}`}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                      >
                        <Phone size={15} /> Call Driver
                      </a>
                    )}
                  </div>
                </div>
              )}

              {live.status === 'Delivered' && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-emerald-800">Shipment Delivered</div>
                    <div className="text-xs text-emerald-600">
                      {live.commissionReceived
                        ? `Commission of KES ${live.commission.toLocaleString()} received.`
                        : `Commission of KES ${live.commission.toLocaleString()} pending collection.`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
