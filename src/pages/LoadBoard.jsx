import { useState } from 'react';
import {
  Search, ChevronDown, ChevronUp, CheckCircle, XCircle,
  Truck, Share2, AlertTriangle, Package, MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AssignCarrierModal from '../components/AssignCarrierModal';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  Available:   'bg-emerald-100 text-emerald-700',
  Booked:      'bg-blue-100 text-blue-700',
  'In Transit':'bg-amber-100 text-amber-700',
  Delivered:   'bg-slate-100 text-slate-600',
  Cancelled:   'bg-red-100 text-red-600',
};

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest first'   },
  { value: 'oldest',  label: 'Oldest first'   },
  { value: 'freight', label: 'Highest freight' },
  { value: 'pickup',  label: 'Pickup date'     },
];

export default function LoadBoard() {
  const { loads, carriers, settings, markPickedUp, markDelivered, cancelLoad } = useApp();
  const navigate = useNavigate();
  const [filter,      setFilter]      = useState('All');
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState('newest');
  const [expanded,    setExpanded]    = useState(null);
  const [assignModal, setAssignModal] = useState(null);

  const statuses = ['All', 'Available', 'Booked', 'In Transit', 'Delivered', 'Cancelled'];

  const filtered = loads
    .filter(l => {
      const matchStatus = filter === 'All' || l.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        l.origin.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.commodity.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        (l.shipperContact || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'oldest')  return 0;   // insertion order reversed
      if (sort === 'freight') return b.freightAmount - a.freightAmount;
      if (sort === 'pickup')  return a.pickupDate.localeCompare(b.pickupDate);
      return 0; // newest = default array order (addLoad prepends)
    });

  function whatsapp(load) {
    const carrier = carriers.find(c => c.id === load.carrierId);
    const text = encodeURIComponent(
      `*${settings.companyName} — Load ${load.id}*\n` +
      `Route: ${load.origin} → ${load.destination}\n` +
      `Commodity: ${load.commodity} | ${load.weight.toLocaleString()} kg\n` +
      `Pickup: ${load.pickupDate} | Truck: ${load.truckType}\n` +
      `Contact: ${load.shipperContact} ${load.shipperPhone}`
    );
    const phone = carrier ? carrier.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === 'All' ? loads.length : loads.filter(l => l.status === s).length;
    return acc;
  }, {});

  const cur = settings.currency;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Load Board</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {counts['All']} loads · {counts['In Transit']} in transit · {counts['Available']} available
          </p>
        </div>
        <button
          onClick={() => navigate('/post')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <Package size={15} /> Post Load
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {s} <span className="opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city, commodity, load ID, or shipper..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Load list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 gap-3">
            <Package size={32} className="opacity-30" />
            <p className="text-sm">No loads match your filters.</p>
            <button onClick={() => { setFilter('All'); setSearch(''); }} className="text-xs text-blue-600 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {filtered.map(load => {
          const carrier = carriers.find(c => c.id === load.carrierId);
          const isExpanded = expanded === load.id;

          return (
            <div key={load.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Row */}
              <button
                className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : load.id)}
              >
                {/* Left: status dot */}
                <div className="mt-1 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    load.status === 'Available'   ? 'bg-emerald-400' :
                    load.status === 'Booked'      ? 'bg-blue-500' :
                    load.status === 'In Transit'  ? 'bg-amber-400 animate-pulse' :
                    load.status === 'Delivered'   ? 'bg-slate-400' :
                    'bg-red-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400">{load.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[load.status]}`}>
                      {load.status}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {load.truckType}
                    </span>
                    {load.cargoInsurance && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Insured</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    {load.origin}
                    <span className="text-slate-300 font-normal">→</span>
                    {load.destination}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span>{load.commodity}</span>
                    <span>·</span>
                    <span>{load.weight.toLocaleString()} kg</span>
                    <span>·</span>
                    <span>Pickup {load.pickupDate}</span>
                    {carrier && <><span>·</span><span className="text-blue-600 font-medium">{carrier.name}</span></>}
                  </div>
                </div>

                <div className="text-right ml-2 shrink-0">
                  <div className="text-sm font-bold text-slate-900">{cur} {load.freightAmount.toLocaleString()}</div>
                  <div className="text-xs text-emerald-600 font-medium">+{load.commission.toLocaleString()}</div>
                  {isExpanded
                    ? <ChevronUp size={14} className="mt-1.5 ml-auto text-slate-400" />
                    : <ChevronDown size={14} className="mt-1.5 ml-auto text-slate-400" />
                  }
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                    {[
                      ['Delivery Date',   load.deliveryDate],
                      ['Advance Paid',    `${cur} ${load.advance.toLocaleString()}`],
                      ['Cargo Insurance', load.cargoInsurance ? 'Yes ✓' : 'No'],
                      ['Shipper',         load.shipperContact],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-slate-400 mb-0.5">{label}</div>
                        <div className="font-semibold text-slate-800">{val}</div>
                      </div>
                    ))}
                  </div>

                  {load.specialInstructions && (
                    <div className="flex items-start gap-2 mb-4 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {load.specialInstructions}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {load.status === 'Available' && (
                      <button
                        onClick={() => setAssignModal(load.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                      >
                        <Truck size={13} /> Assign Carrier
                      </button>
                    )}
                    {load.status === 'Booked' && (
                      <button
                        onClick={() => markPickedUp(load.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600"
                      >
                        <Truck size={13} /> Mark Picked Up
                      </button>
                    )}
                    {(load.status === 'Booked' || load.status === 'In Transit') && (
                      <button
                        onClick={() => markDelivered(load.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle size={13} /> Mark Delivered
                      </button>
                    )}
                    {load.status !== 'Delivered' && load.status !== 'Cancelled' && (
                      <button
                        onClick={() => whatsapp(load)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600"
                      >
                        <Share2 size={13} />
                        {load.carrierId ? 'WhatsApp Carrier' : 'Share on WhatsApp'}
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/tracking', { state: { loadId: load.id } })}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-white"
                    >
                      <MapPin size={13} /> Track
                    </button>
                    {(load.status === 'Available' || load.status === 'Booked') && (
                      <button
                        onClick={() => cancelLoad(load.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 ml-auto"
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {assignModal && (
        <AssignCarrierModal
          loadId={assignModal}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}
