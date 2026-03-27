import { useState } from 'react';
import { Building2, Package, DollarSign, PlusCircle, History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const INDUSTRIES = ['Construction', 'FMCG', 'Retail', 'Energy', 'Manufacturing', 'Agriculture', 'Pharmaceuticals', 'Other'];

export default function Shippers() {
  const { shippers, loads } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  function getShipperLoads(shipperId) {
    return loads.filter(l => l.shipperId === shipperId);
  }

  const shipper = selected ? shippers.find(s => s.id === selected) : null;
  const shipperLoads = shipper ? getShipperLoads(shipper.id) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Shippers & Clients</h1>
        <p className="text-slate-500 text-sm mt-1">{shippers.length} clients in your portfolio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipper list */}
        <div className="lg:col-span-2 space-y-3">
          {shippers.map(s => {
            const sLoads = getShipperLoads(s.id);
            const activeCount = sLoads.filter(l => ['Available', 'Booked', 'In Transit'].includes(l.status)).length;
            return (
              <div
                key={s.id}
                onClick={() => setSelected(s.id === selected ? null : s.id)}
                className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${
                  selected === s.id ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                        <div className="text-xs text-slate-500">{s.industry} · {s.location}</div>
                      </div>
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {activeCount} active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-900 font-bold text-sm">
                      <Package size={13} className="text-blue-500" />
                      {s.totalLoads}
                    </div>
                    <div className="text-xs text-slate-500">Total Loads</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-900 font-bold text-sm">
                      <DollarSign size={13} className="text-emerald-500" />
                      {(s.totalSpend / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-slate-500">Total Spend</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <div className="font-bold text-sm text-emerald-700">
                      KES {Math.round(s.totalSpend * 0.08 / 1000).toLocaleString()}K
                    </div>
                    <div className="text-xs text-slate-500">Comm. Earned</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/post'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                  >
                    <PlusCircle size={13} /> New Load
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(s.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
                  >
                    <History size={13} /> View History
                  </button>
                  <div className="ml-auto text-xs text-slate-400 flex items-center">{s.contact}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load history panel */}
        <div className="lg:col-span-1">
          {shipper ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-4">
              <h3 className="font-bold text-slate-900 mb-1">{shipper.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{shipperLoads.length} loads total</p>
              <div className="space-y-2">
                {shipperLoads.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No loads yet</p>
                ) : (
                  shipperLoads.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <div className="font-mono text-xs text-slate-500">{l.id}</div>
                        <div className="text-xs font-medium text-slate-800">{l.origin} → {l.destination}</div>
                        <div className="text-xs text-slate-400">{l.commodity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">KES {(l.freightAmount / 1000).toFixed(0)}K</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          l.status === 'Delivered' ? 'bg-slate-100 text-slate-600' :
                          l.status === 'In Transit' ? 'bg-amber-100 text-amber-700' :
                          l.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{l.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click a shipper to view their load history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
