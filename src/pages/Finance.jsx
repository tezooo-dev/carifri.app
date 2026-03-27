import { DollarSign, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Finance() {
  const { loads, carriers, markCommissionReceived, stats } = useApp();

  const commissionLoads = loads.filter(l => l.status !== 'Cancelled');

  function exportCSV() {
    const headers = ['Load ID', 'Route', 'Commodity', 'Freight (KES)', 'Commission (KES)', 'Status', 'Comm. Received'];
    const rows = commissionLoads.map(l => [
      l.id,
      `${l.origin} > ${l.destination}`,
      l.commodity,
      l.freightAmount,
      l.commission,
      l.status,
      l.commissionReceived ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'freightlink-commissions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalFreight = commissionLoads.reduce((sum, l) => sum + l.freightAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">Commission tracking & payment status</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <DollarSign size={14} /> Total Freight
          </div>
          <div className="text-xl font-bold text-slate-900">
            KES {(totalFreight / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{commissionLoads.length} loads</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <TrendingUp size={14} /> Total Commission
          </div>
          <div className="text-xl font-bold text-slate-900">
            KES {stats.totalCommission.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">8% of freight</div>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-xs mb-2">
            <CheckCircle size={14} /> Received
          </div>
          <div className="text-xl font-bold text-emerald-700">
            KES {stats.receivedCommission.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-500 mt-0.5">
            {commissionLoads.filter(l => l.commissionReceived).length} loads paid
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-2">
            <Clock size={14} /> Pending
          </div>
          <div className="text-xl font-bold text-amber-700">
            KES {stats.pendingCommission.toLocaleString()}
          </div>
          <div className="text-xs text-amber-500 mt-0.5">
            {commissionLoads.filter(l => !l.commissionReceived).length} loads outstanding
          </div>
        </div>
      </div>

      {/* Commission table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Commission Details</h3>
          <span className="text-xs text-slate-400">{commissionLoads.length} records</span>
        </div>

        {/* Mobile: card list */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {commissionLoads.map(l => {
            const carrier = carriers.find(c => c.id === l.carrierId);
            return (
              <div key={l.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-slate-400">{l.id}</div>
                    <div className="text-sm font-semibold text-slate-900">{l.origin} → {l.destination}</div>
                    <div className="text-xs text-slate-500">{l.commodity} · {carrier?.name || 'Unassigned'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">KES {l.commission.toLocaleString()}</div>
                    {l.commissionReceived ? (
                      <span className="text-xs text-emerald-600 font-medium">Received</span>
                    ) : (
                      <button
                        onClick={() => markCommissionReceived(l.id)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                        disabled={l.status !== 'Delivered'}
                      >
                        Mark Received
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Load ID</th>
                <th className="text-left px-5 py-3 font-medium">Route</th>
                <th className="text-left px-5 py-3 font-medium">Commodity</th>
                <th className="text-right px-5 py-3 font-medium">Freight</th>
                <th className="text-right px-5 py-3 font-medium">Commission</th>
                <th className="text-center px-5 py-3 font-medium">Load Status</th>
                <th className="text-center px-5 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissionLoads.map(l => {
                const carrier = carriers.find(c => c.id === l.carrierId);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-slate-500">{l.id}</div>
                      {carrier && <div className="text-xs text-slate-400">{carrier.name}</div>}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{l.origin} → {l.destination}</td>
                    <td className="px-5 py-3 text-slate-600">{l.commodity}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      KES {l.freightAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">
                      KES {l.commission.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'Delivered' ? 'bg-slate-100 text-slate-600' :
                        l.status === 'In Transit' ? 'bg-amber-100 text-amber-700' :
                        l.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {l.commissionReceived ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle size={13} /> Received
                        </span>
                      ) : (
                        <button
                          onClick={() => markCommissionReceived(l.id)}
                          disabled={l.status !== 'Delivered'}
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
