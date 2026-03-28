import { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, FileText, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import InvoiceModal from '../components/InvoiceModal';
import MpesaModal from '../components/MpesaModal';

export default function Finance() {
  const { loads, carriers, markCommissionReceived, stats, settings } = useApp();
  const [invoiceId, setInvoiceId] = useState(null);
  const [mpesaId,   setMpesaId]   = useState(null);
  const [filterPaid, setFilterPaid] = useState('all'); // 'all' | 'pending' | 'received'

  const cur = settings.currency;
  const commissionLoads = loads
    .filter(l => l.status !== 'Cancelled')
    .filter(l => {
      if (filterPaid === 'pending')  return !l.commissionReceived;
      if (filterPaid === 'received') return l.commissionReceived;
      return true;
    });

  function exportCSV() {
    const headers = ['Load ID', 'Route', 'Commodity', `Freight (${cur})`, `Commission (${cur})`, 'Status', 'Comm. Received'];
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

  const totalFreight = loads.filter(l => l.status !== 'Cancelled').reduce((s, l) => s + l.freightAmount, 0);
  const collectionRate = (() => {
    const delivered = loads.filter(l => l.status === 'Delivered');
    return delivered.length
      ? Math.round((delivered.filter(l => l.commissionReceived).length / delivered.length) * 100)
      : 0;
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Ledger</h1>
          <p className="text-slate-500 text-sm mt-0.5">Commission tracking · {collectionRate}% collection rate</p>
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
            {cur} {(totalFreight / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {loads.filter(l => l.status !== 'Cancelled').length} loads
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
            <TrendingUp size={14} /> Total Commission
          </div>
          <div className="text-xl font-bold text-slate-900">
            {cur} {stats.totalCommission.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{settings.commissionRate}% of freight</div>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-xs mb-2">
            <CheckCircle size={14} /> Received
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {cur} {stats.receivedCommission.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-500 mt-0.5">
            {loads.filter(l => l.commissionReceived).length} loads paid
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-2">
            <Clock size={14} /> Pending
          </div>
          <div className="text-xl font-bold text-amber-700">
            {cur} {stats.pendingCommission.toLocaleString()}
          </div>
          <div className="text-xs text-amber-500 mt-0.5">
            {loads.filter(l => !l.commissionReceived && l.status !== 'Cancelled').length} outstanding
          </div>
        </div>
      </div>

      {/* Collection rate bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 mb-4 flex items-center gap-4">
        <span className="text-xs text-slate-500 shrink-0">Collection rate</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <span className="text-sm font-bold text-emerald-700 shrink-0">{collectionRate}%</span>
      </div>

      {/* Commission table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-slate-900 text-sm">Commission Details</h3>
          {/* Filter tabs */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            {[['all', 'All'], ['pending', 'Pending'], ['received', 'Received']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterPaid(val)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterPaid === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {commissionLoads.map(l => {
            const carrier = carriers.find(c => c.id === l.carrierId);
            return (
              <div key={l.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-slate-400">{l.id}</div>
                    <div className="text-sm font-semibold text-slate-900">{l.origin} → {l.destination}</div>
                    <div className="text-xs text-slate-500">{l.commodity} · {carrier?.name ?? 'Unassigned'}</div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-sm font-bold text-emerald-700">{cur} {l.commission.toLocaleString()}</div>
                    <button
                      onClick={() => setInvoiceId(l.id)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 justify-end"
                    >
                      <FileText size={11} /> Invoice
                    </button>
                    {l.commissionReceived ? (
                      <span className="text-xs text-emerald-600 font-medium block">Received</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setMpesaId(l.id)}
                          disabled={l.status !== 'Delivered'}
                          className="flex items-center gap-0.5 text-xs text-green-700 hover:underline font-medium justify-end disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Smartphone size={11} /> M-Pesa
                        </button>
                        <button
                          onClick={() => markCommissionReceived(l.id)}
                          disabled={l.status !== 'Delivered'}
                          className="text-xs text-slate-400 hover:underline block disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Manual
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Load</th>
                <th className="text-left px-5 py-3 font-medium">Route</th>
                <th className="text-left px-5 py-3 font-medium">Commodity</th>
                <th className="text-right px-5 py-3 font-medium">Freight</th>
                <th className="text-right px-5 py-3 font-medium">Commission</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-center px-5 py-3 font-medium">Payment</th>
                <th className="text-center px-5 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissionLoads.map(l => {
                const carrier = carriers.find(c => c.id === l.carrierId);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-slate-400">{l.id}</div>
                      {carrier && <div className="text-xs text-slate-400">{carrier.name}</div>}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{l.origin} → {l.destination}</td>
                    <td className="px-5 py-3 text-slate-600">{l.commodity}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      {cur} {l.freightAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">
                      {cur} {l.commission.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'Delivered'   ? 'bg-slate-100 text-slate-600' :
                        l.status === 'In Transit'  ? 'bg-amber-100 text-amber-700' :
                        l.status === 'Booked'      ? 'bg-blue-100 text-blue-700'   :
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
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => setMpesaId(l.id)}
                            disabled={l.status !== 'Delivered'}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Smartphone size={11} /> M-Pesa
                          </button>
                          <button
                            onClick={() => markCommissionReceived(l.id)}
                            disabled={l.status !== 'Delivered'}
                            className="text-xs text-slate-400 hover:text-slate-600 underline disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Manual
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setInvoiceId(l.id)}
                        className="flex items-center gap-1 mx-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <FileText size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {commissionLoads.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            No records match the current filter.
          </div>
        )}
      </div>

      {invoiceId && (
        <InvoiceModal loadId={invoiceId} onClose={() => setInvoiceId(null)} />
      )}
      {mpesaId && (
        <MpesaModal loadId={mpesaId} onClose={() => setMpesaId(null)} />
      )}
    </div>
  );
}
