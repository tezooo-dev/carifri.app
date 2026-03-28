import { X, Printer, CheckCircle, Shield, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function InvoiceModal({ loadId, onClose }) {
  const { loads, carriers, shippers, settings } = useApp();
  const load = loads.find(l => l.id === loadId);
  const carrier = load ? carriers.find(c => c.id === load.carrierId) : null;
  const shipper = load ? shippers.find(s => s.id === load.shipperId) : null;
  const cur = settings.currency;

  if (!load) return null;

  const balance = load.freightAmount - load.advance;
  const invoiceDate = new Date().toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 print:hidden">
          <h2 className="font-bold text-slate-900">Invoice / Commission Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 text-sm" id="invoice-content">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">FL</div>
                <span className="font-bold text-slate-900 text-base">{settings.companyName}</span>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <div>{settings.companyPhone}</div>
                <div>{settings.companyEmail}</div>
                <div>{settings.country}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 mb-1">INVOICE</div>
              <div className="font-mono text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{load.id}</div>
              <div className="text-xs text-slate-500 mt-2">{invoiceDate}</div>
            </div>
          </div>

          {/* Bill to / Carrier */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bill To</div>
              <div className="font-bold text-slate-900">{shipper?.name ?? load.shipperContact}</div>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div>{load.shipperContact}</div>
                <div>{load.shipperPhone}</div>
                {load.shipperEmail && <div>{load.shipperEmail}</div>}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                <span className="flex items-center gap-1"><Truck size={11} /> Carrier</span>
              </div>
              {carrier ? (
                <div>
                  <div className="font-bold text-slate-900">{carrier.name}</div>
                  <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                    <div>{carrier.contact}</div>
                    <div>{carrier.phone}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Unassigned</div>
              )}
            </div>
          </div>

          {/* Shipment details table */}
          <table className="w-full mb-6 text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-slate-500 font-semibold">Description</th>
                <th className="text-right py-2 text-slate-500 font-semibold">Details</th>
                <th className="text-right py-2 text-slate-500 font-semibold">Amount ({cur})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5">
                  <div className="font-semibold text-slate-900">Freight Service</div>
                  <div className="text-slate-500">{load.origin} → {load.destination}</div>
                </td>
                <td className="py-2.5 text-right text-slate-600">
                  {load.commodity} · {load.weight.toLocaleString()} kg · {load.truckType}
                </td>
                <td className="py-2.5 text-right font-semibold text-slate-900">
                  {load.freightAmount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5">
                  <div className="font-semibold text-slate-900">Brokerage Commission</div>
                  <div className="text-slate-500">{settings.commissionRate}% of freight amount</div>
                </td>
                <td className="py-2.5 text-right text-slate-600">
                  Pickup: {load.pickupDate} · Delivery: {load.deliveryDate}
                </td>
                <td className="py-2.5 text-right font-bold text-emerald-700">
                  {load.commission.toLocaleString()}
                </td>
              </tr>
              {load.cargoInsurance && (
                <tr>
                  <td className="py-2.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Shield size={11} className="text-emerald-600" /> Cargo Insurance
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-slate-600">Included</td>
                  <td className="py-2.5 text-right text-slate-600">—</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Freight Total</span>
                <span className="font-semibold">{cur} {load.freightAmount.toLocaleString()}</span>
              </div>
              {load.advance > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Advance Paid</span>
                  <span className="font-semibold text-emerald-700">- {cur} {load.advance.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Balance Due</span>
                <span className="font-bold text-slate-900">{cur} {balance.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                <span className="font-bold text-slate-900">Your Commission</span>
                <span className="font-bold text-emerald-700 text-base">{cur} {load.commission.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm mb-6 ${
            load.commissionReceived
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <CheckCircle size={16} className="shrink-0" />
            <span>
              Commission is{' '}
              <strong>{load.commissionReceived ? 'RECEIVED' : 'PENDING'}</strong>
              {' '}· Load status: <strong>{load.status}</strong>
            </span>
          </div>

          {/* Footer */}
          <div className="text-xs text-slate-400 text-center border-t border-slate-100 pt-4">
            {settings.companyName} · {settings.companyPhone} · {settings.companyEmail}
            <br />
            Thank you for your business.
          </div>
        </div>
      </div>
    </div>
  );
}
