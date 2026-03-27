import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Truck, Share2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AssignCarrierModal from '../components/AssignCarrierModal';

const STATUS_COLORS = {
  Available: 'bg-emerald-100 text-emerald-700',
  Booked: 'bg-blue-100 text-blue-700',
  'In Transit': 'bg-amber-100 text-amber-700',
  Delivered: 'bg-slate-100 text-slate-600',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function LoadBoard() {
  const { loads, carriers, markDelivered, cancelLoad } = useApp();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [assignModal, setAssignModal] = useState(null);

  const statuses = ['All', 'Available', 'Booked', 'In Transit', 'Delivered', 'Cancelled'];

  const filtered = loads.filter(l => {
    const matchStatus = filter === 'All' || l.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.origin.toLowerCase().includes(q) ||
      l.destination.toLowerCase().includes(q) ||
      l.commodity.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function whatsapp(load) {
    const carrier = carriers.find(c => c.id === load.carrierId);
    const text = encodeURIComponent(
      `*FreightLink Load ${load.id}*\n` +
      `Route: ${load.origin} → ${load.destination}\n` +
      `Commodity: ${load.commodity} | ${load.weight.toLocaleString()} kg\n` +
      `Pickup: ${load.pickupDate}\n` +
      `Truck: ${load.truckType}\n` +
      `Contact: ${load.shipperContact} ${load.shipperPhone}`
    );
    const phone = carrier ? carrier.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === 'All' ? loads.length : loads.filter(l => l.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Load Board</h1>
        <p className="text-slate-500 text-sm mt-1">Manage all your freight loads</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by city, commodity, or load ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Load list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
            No loads found matching your criteria.
          </div>
        )}
        {filtered.map(load => {
          const carrier = carriers.find(c => c.id === load.carrierId);
          const isExpanded = expanded === load.id;

          return (
            <div key={load.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header row */}
              <button
                className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : load.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">{load.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[load.status]}`}>
                      {load.status}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {load.truckType}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span>{load.origin}</span>
                    <span className="text-slate-300">→</span>
                    <span>{load.destination}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{load.commodity}</span>
                    <span>·</span>
                    <span>{load.weight.toLocaleString()} kg</span>
                    <span>·</span>
                    <span>Pickup: {load.pickupDate}</span>
                    {carrier && (
                      <>
                        <span>·</span>
                        <span className="text-blue-600">{carrier.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <div className="text-sm font-bold text-slate-900">KES {load.freightAmount.toLocaleString()}</div>
                  <div className="text-xs text-green-600 font-medium">
                    +{load.commission.toLocaleString()} comm.
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="mt-1 ml-auto text-slate-400" /> : <ChevronDown size={16} className="mt-1 ml-auto text-slate-400" />}
                </div>
              </button>

              {/* Expanded actions */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                    <div>
                      <div className="text-slate-400 mb-0.5">Delivery Date</div>
                      <div className="font-medium">{load.deliveryDate}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-0.5">Advance Paid</div>
                      <div className="font-medium">KES {load.advance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-0.5">Cargo Insurance</div>
                      <div className="font-medium">{load.cargoInsurance ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-0.5">Shipper</div>
                      <div className="font-medium">{load.shipperContact}</div>
                    </div>
                  </div>

                  {load.specialInstructions && (
                    <div className="flex items-start gap-2 mb-3 p-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      {load.specialInstructions}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {load.status === 'Available' && (
                      <button
                        onClick={() => setAssignModal(load.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                      >
                        <Truck size={14} /> Assign Carrier
                      </button>
                    )}
                    {(load.status === 'Booked' || load.status === 'In Transit') && (
                      <>
                        <button
                          onClick={() => markDelivered(load.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
                        >
                          <CheckCircle size={14} /> Mark Delivered
                        </button>
                        <button
                          onClick={() => whatsapp(load)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                        >
                          <Share2 size={14} /> WhatsApp Carrier
                        </button>
                      </>
                    )}
                    {load.status === 'Available' && (
                      <button
                        onClick={() => whatsapp(load)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                      >
                        <Share2 size={14} /> Share on WhatsApp
                      </button>
                    )}
                    {(load.status === 'Available' || load.status === 'Booked') && (
                      <button
                        onClick={() => cancelLoad(load.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                      >
                        <XCircle size={14} /> Cancel
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
