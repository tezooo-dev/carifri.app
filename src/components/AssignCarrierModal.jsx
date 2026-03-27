import { useState } from 'react';
import { X, Star, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AssignCarrierModal({ loadId, onClose }) {
  const { carriers, loads, assignCarrier } = useApp();
  const load = loads.find(l => l.id === loadId);
  const [selected, setSelected] = useState(null);

  function handleAssign() {
    if (!selected) return;
    assignCarrier(loadId, selected);
    onClose();
  }

  const compatible = carriers.filter(c => c.truckTypes.includes(load?.truckType));
  const others = carriers.filter(c => !c.truckTypes.includes(load?.truckType));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Assign Carrier</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loadId} · {load?.truckType} · {load?.origin} → {load?.destination}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {compatible.length > 0 && (
            <div className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">
              <CheckCircle size={12} /> Compatible with {load?.truckType}
            </div>
          )}
          {[...compatible, ...others].map(carrier => (
            <label
              key={carrier.id}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                selected === carrier.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${!compatible.includes(carrier) ? 'opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="carrier"
                value={carrier.id}
                checked={selected === carrier.id}
                onChange={() => setSelected(carrier.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900">{carrier.name}</span>
                  {carrier.verified && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>
                  )}
                  {!compatible.includes(carrier) && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">No {load?.truckType}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {carrier.rating}
                  </span>
                  <span>{carrier.truckCount} trucks</span>
                  <span>{carrier.location}</span>
                  <span>{carrier.totalLoads} loads done</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {carrier.truckTypes.map(t => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Assign Carrier
          </button>
        </div>
      </div>
    </div>
  );
}
