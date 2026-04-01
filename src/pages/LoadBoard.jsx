import { useState, useEffect } from 'react';
import {
  Search, ChevronDown, CheckCircle, XCircle, Truck, Package, MapPin,
  Gavel, Star, Clock, ArrowRight, X, Zap, Filter, Eye, FileText,
  Plus, Trash2, Calculator, AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AssignCarrierModal from '../components/AssignCarrierModal';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { MARKETS } from '../data/markets';
import { usePDF } from '../hooks/usePDF';
import { estimateTransit } from '../lib/transitCalc';

const STATUS_COLORS = {
  Available:   'bg-emerald-100 text-emerald-700',
  Bidding:     'bg-violet-100 text-violet-700',
  Booked:      'bg-blue-100 text-blue-700',
  'In Transit':'bg-amber-100 text-amber-700',
  Delivered:   'bg-slate-100 text-slate-600',
  Cancelled:   'bg-red-100 text-red-600',
};

// ── Service type options ──────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { key: 'FTL',         label: 'FTL',         sub: 'Full Truckload'     },
  { key: 'LTL',         label: 'LTL',         sub: 'Less Than Truckload'},
  { key: 'Dray',        label: 'Dray',        sub: 'Drayage / Port'     },
  { key: 'Intermodal',  label: 'Intermodal',  sub: 'Rail + Truck'       },
  { key: 'Partial',     label: 'Partial',     sub: 'Partial Truckload'  },
  { key: 'Expedited',   label: 'Expedited',   sub: 'Time-Critical'      },
];

const ACCESSORIAL_TYPES = [
  'Fuel Surcharge', 'Detention / Wait Time', 'Lumper Service',
  'Layover / Stop-Off', 'TONU (Truck Ordered Not Used)',
  'Overweight / Oversize Permit', 'Liftgate', 'Inside Delivery',
  'Residential Delivery', 'Notify Before Delivery', 'Re-delivery',
  'Hazmat Handling', 'Refrigeration', 'Custom / Other',
];

// ── Bid Modal ─────────────────────────────────────────────────────────────────
function BidModal({ load, carriers, settings, onClose, onBidSubmit, onAcceptBid }) {
  const [bids,        setBids]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [bidCarrier,  setBidCarrier]  = useState('');
  const [bidAmount,   setBidAmount]   = useState('');
  const [serviceType, setServiceType] = useState('FTL');
  const [serviceDays, setServiceDays] = useState('');
  const [etaHours,    setEtaHours]    = useState('');
  const [notes,       setNotes]       = useState('');
  const [accessorials, setAccessorials] = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  // ZIP-based transit calc
  const [originZip,   setOriginZip]   = useState('');
  const [destZip,     setDestZip]     = useState('');
  const [zipCountry,  setZipCountry]  = useState('us');
  const [calcResult,  setCalcResult]  = useState(null); // {distanceMiles, transitDays, ...}
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError,   setCalcError]   = useState('');
  const cur = settings.currency;

  async function runTransitCalc() {
    if (!originZip.trim() || !destZip.trim()) {
      setCalcError('Enter both origin and destination ZIP codes.');
      return;
    }
    setCalcLoading(true);
    setCalcError('');
    setCalcResult(null);
    try {
      const result = await estimateTransit(originZip.trim(), destZip.trim(), zipCountry);
      setCalcResult(result);
      setServiceDays(String(result.transitDays));
    } catch (err) {
      setCalcError(err.message || 'Could not look up ZIP codes. Check and try again.');
    } finally {
      setCalcLoading(false);
    }
  }

  useEffect(() => {
    api.get(`/bids/${load.id}`)
      .then(r => setBids(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load.id]);

  // Computed total shown in form
  const accessorialTotal = accessorials.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const grandTotal = (parseFloat(bidAmount) || 0) + accessorialTotal;

  function addAccessorial() {
    setAccessorials(prev => [...prev, { type: 'Fuel Surcharge', amount: '', note: '' }]);
  }
  function updateAcc(i, field, val) {
    setAccessorials(prev => prev.map((a, j) => j === i ? { ...a, [field]: val } : a));
  }
  function removeAcc(i) {
    setAccessorials(prev => prev.filter((_, j) => j !== i));
  }

  async function submitBid(e) {
    e.preventDefault();
    if (!bidCarrier || !bidAmount) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bids/${load.id}`, {
        carrierId:   bidCarrier,
        amount:      parseFloat(bidAmount),
        serviceType,
        serviceDays: serviceDays ? parseFloat(serviceDays) : null,
        etaHours:    etaHours    ? parseFloat(etaHours)    : null,
        notes,
        accessorials,
      });
      setBids(prev => [...prev, data].sort((a, b) => (a.totalAmount||a.amount) - (b.totalAmount||b.amount)));
      setBidAmount(''); setServiceType('FTL'); setServiceDays('');
      setEtaHours(''); setNotes(''); setBidCarrier(''); setAccessorials([]);
      onBidSubmit(load.id);
    } finally { setSubmitting(false); }
  }

  async function acceptBid(bid) {
    setSubmitting(true);
    try {
      await api.post(`/bids/${load.id}/accept/${bid.id}`);
      onAcceptBid(load.id, bid.carrier_id, bid.totalAmount || bid.amount);
      onClose();
    } finally { setSubmitting(false); }
  }

  const availableCarriers = carriers.filter(c => !bids.find(b => b.carrier_id === c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Gavel size={18} className="text-violet-600"/> Load Bidding Board
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {load.id} · {load.origin} → {load.destination} · {load.commodity}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Load summary */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-sm">
            <div><div className="text-xs text-slate-400">Freight</div>
              <div className="font-bold text-slate-900">{cur} {(load.freightAmount||0).toLocaleString()}</div></div>
            <div><div className="text-xs text-slate-400">Weight</div>
              <div className="font-bold text-slate-900">{(load.weight||0).toLocaleString()} kg</div></div>
            <div><div className="text-xs text-slate-400">Truck Type</div>
              <div className="font-bold text-slate-900">{load.truckType}</div></div>
          </div>

          {/* Current bids */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Current Bids ({bids.length})</h3>
              {bids.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium">
                  Best: {cur} {(bids[0]?.totalAmount || bids[0]?.amount || 0).toLocaleString()}
                </span>
              )}
            </div>
            {loading && <div className="text-xs text-slate-400 text-center py-4">Loading bids…</div>}
            {!loading && bids.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                <Gavel size={24} className="mx-auto mb-2 opacity-30"/>
                No bids yet. Invite a carrier below.
              </div>
            )}
            <div className="space-y-2">
              {bids.map((bid, i) => {
                const hasAcc = (bid.accessorials||[]).length > 0;
                return (
                  <div key={bid.id} className={`rounded-xl border p-3 ${
                    i===0 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i===0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{i+1}</div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{bid.carrier_name}</div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                            <span>★ {(bid.carrier_rating||4).toFixed(1)}</span>
                            {bid.service_type && (
                              <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">{bid.service_type}</span>
                            )}
                            {bid.service_days > 0 && (
                              <span className="flex items-center gap-0.5"><Clock size={10}/> {bid.service_days} day{bid.service_days!==1?'s':''}</span>
                            )}
                            {bid.eta_hours > 0 && (
                              <span>{bid.eta_hours}h ETA</span>
                            )}
                            {bid.notes && <span>· {bid.notes.slice(0, 35)}{bid.notes.length>35?'…':''}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-bold text-base ${i===0?'text-emerald-700':'text-slate-800'}`}>
                          {cur} {(bid.totalAmount||bid.amount||0).toLocaleString()}
                        </div>
                        {hasAcc && (
                          <div className="text-xs text-slate-400">
                            Base {cur} {(bid.amount||0).toLocaleString()}
                            {' + '}acc.
                          </div>
                        )}
                        <button onClick={() => acceptBid(bid)} disabled={submitting}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-1">
                          Accept
                        </button>
                      </div>
                    </div>
                    {/* Accessorial breakdown */}
                    {hasAcc && (
                      <div className="mt-2 pl-9 space-y-0.5">
                        {(bid.accessorials||[]).map((a, ai) => (
                          <div key={ai} className="flex justify-between text-xs text-slate-500">
                            <span>{a.type}{a.note ? ` — ${a.note}` : ''}</span>
                            <span className="font-medium">{cur} {(parseFloat(a.amount)||0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {bids.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg text-xs text-violet-700">
              <Zap size={13}/>
              Accept a bid to automatically assign the carrier, lock the freight amount, and move to Booked.
            </div>
          )}

          {/* ── Submit bid form ── */}
          {availableCarriers.length > 0 && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Invite a Carrier to Bid</h3>

              <form onSubmit={submitBid} className="space-y-4">
                {/* Carrier selector */}
                <select required value={bidCarrier} onChange={e => setBidCarrier(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select carrier…</option>
                  {availableCarriers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {(c.truckTypes||[]).join(', ')} · ★{c.rating?.toFixed(1)}{c.verified?' ✓':''}
                    </option>
                  ))}
                </select>

                {/* Service type buttons */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Service Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SERVICE_TYPES.map(s => (
                      <button key={s.key} type="button" onClick={() => setServiceType(s.key)}
                        className={`flex flex-col items-center py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-colors ${
                          serviceType === s.key
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <span className="font-bold">{s.label}</span>
                        <span className="font-normal text-slate-400 text-[10px] mt-0.5">{s.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ZIP-based transit calculator */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                    <Calculator size={13}/> Auto-Calculate Transit Days from ZIP Codes
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-1">
                      <label className="text-xs text-slate-500">Country</label>
                      <select value={zipCountry} onChange={e => setZipCountry(e.target.value)}
                        className="mt-1 w-full border border-slate-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="us">🇺🇸 US</option>
                        <option value="ca">🇨🇦 CA</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Origin ZIP</label>
                      <input value={originZip} onChange={e => setOriginZip(e.target.value)}
                        placeholder="e.g. 60601"
                        className="mt-1 w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), runTransitCalc())}/>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Destination ZIP</label>
                      <input value={destZip} onChange={e => setDestZip(e.target.value)}
                        placeholder="e.g. 77001"
                        className="mt-1 w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), runTransitCalc())}/>
                    </div>
                  </div>
                  <button type="button" onClick={runTransitCalc} disabled={calcLoading}
                    className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <Calculator size={12}/> {calcLoading ? 'Calculating…' : 'Calculate Transit Days (Excl. Holidays)'}
                  </button>
                  {calcError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle size={12}/> {calcError}
                    </div>
                  )}
                  {calcResult && (
                    <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs space-y-0.5">
                      <div className="font-semibold text-blue-800">
                        {calcResult.originCity} → {calcResult.destCity}
                      </div>
                      <div className="text-slate-600">
                        ~{calcResult.distanceMiles.toLocaleString()} miles
                        &nbsp;·&nbsp;
                        <span className="font-bold text-emerald-700">{calcResult.transitDays} transit day{calcResult.transitDays !== 1 ? 's' : ''}</span>
                        &nbsp;(weekends &amp; holidays excluded)
                      </div>
                      <div className="text-slate-400">Transit days auto-filled below ↓</div>
                    </div>
                  )}
                </div>

                {/* Amount + days + ETA */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-slate-600">Base Freight Rate ({cur}) *</label>
                    <input required type="number" step="1" min="0" value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`${Math.round((load.freightAmount||100000)*0.9)}`}/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Transit Days</label>
                    <input type="number" step="0.5" min="0" value={serviceDays}
                      onChange={e => setServiceDays(e.target.value)}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 2"/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">ETA (hours)</label>
                    <input type="number" step="0.5" min="0" value={etaHours}
                      onChange={e => setEtaHours(e.target.value)}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 8"/>
                  </div>
                </div>

                {/* Accessorial charges */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-600">Accessorial Charges (if applicable)</label>
                    <button type="button" onClick={addAccessorial}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      <Plus size={12}/> Add Charge
                    </button>
                  </div>
                  {accessorials.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No extra charges — click "Add Charge" to include detention, fuel surcharge, lumper, etc.</p>
                  )}
                  <div className="space-y-2">
                    {accessorials.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                        <select value={a.type} onChange={e => updateAcc(i, 'type', e.target.value)}
                          className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {ACCESSORIAL_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <input type="number" min="0" step="1" value={a.amount}
                          onChange={e => updateAcc(i, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="w-24 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                        <input type="text" value={a.note}
                          onChange={e => updateAcc(i, 'note', e.target.value)}
                          placeholder="Note (opt.)"
                          className="w-28 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                        <button type="button" onClick={() => removeAcc(i)}
                          className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={13}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total preview */}
                {grandTotal > 0 && (
                  <div className="flex justify-between items-center bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 text-sm">
                    <span className="text-slate-600">
                      Base {cur} {(parseFloat(bidAmount)||0).toLocaleString()}
                      {accessorialTotal > 0 && <> + acc. {cur} {accessorialTotal.toLocaleString()}</>}
                    </span>
                    <span className="font-bold text-violet-700 text-base">
                      Total: {cur} {grandTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Notes */}
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes to the broker (optional)…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>

                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Gavel size={14}/> {submitting ? 'Submitting…' : `Submit Bid — ${cur} ${grandTotal.toLocaleString()}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Load Board ───────────────────────────────────────────────────────────
export default function LoadBoard() {
  const { loads, carriers, settings, assignCarrier, cancelLoad, markPickedUp } = useApp();
  const { generateBOL, generateInvoice } = usePDF();
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('newest');
  const [statusFilter,setStatusFilter] = useState('All');
  const [assignId,   setAssignId]   = useState(null);
  const [bidLoadId,  setBidLoadId]  = useState(null);
  const [loads_,     setLoads_]     = useState(null); // local override after bid actions
  const navigate = useNavigate();
  const cur = settings.currency;
  const mkt = MARKETS[settings.market] || MARKETS.kenya;

  // Use local override if available (bid status changes), else from context
  const displayLoads = loads_ || loads;

  const STATUSES = ['All','Available','Bidding','Booked','In Transit','Delivered','Cancelled'];

  const filtered = displayLoads
    .filter(l => statusFilter === 'All' || l.status === statusFilter)
    .filter(l => {
      const q = search.toLowerCase();
      return (l.id+l.origin+l.destination+l.commodity+(carriers.find(c=>c.id===l.carrierId)?.name||'')).toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest')    return (b.created_at||'') > (a.created_at||'') ? 1 : -1;
      if (sortBy === 'oldest')    return (a.created_at||'') > (b.created_at||'') ? 1 : -1;
      if (sortBy === 'freight')   return (b.freightAmount||0) - (a.freightAmount||0);
      if (sortBy === 'pickup')    return (a.pickupDate||'') > (b.pickupDate||'') ? 1 : -1;
      return 0;
    });

  const bidLoad = bidLoadId ? displayLoads.find(l => l.id === bidLoadId) : null;

  // Called when a bid is submitted (update status to Bidding locally)
  function handleBidSubmit(loadId) {
    setLoads_(prev => (prev||loads).map(l => l.id===loadId ? {...l, status:'Bidding'} : l));
  }

  // Called when bid is accepted (assign carrier locally)
  function handleAcceptBid(loadId, carrierId, amount) {
    assignCarrier(loadId, carrierId);
    setBidLoadId(null);
    setLoads_(null);
  }

  const countsByStatus = {};
  STATUSES.slice(1).forEach(s => { countsByStatus[s] = displayLoads.filter(l=>l.status===s).length; });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Load Board</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mkt.flag} {mkt.name} · {displayLoads.filter(l=>l.status!=='Cancelled').length} active loads
          </p>
        </div>
        <button onClick={() => navigate('/post')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Package size={15}/> Post Load
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter===s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {s}
            {s!=='All' && countsByStatus[s] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter===s?'bg-white/20 text-white':'bg-slate-100 text-slate-500'}`}>
                {countsByStatus[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by ID, route, commodity, carrier…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="freight">Highest Freight</option>
          <option value="pickup">Pickup Date</option>
        </select>
      </div>

      {/* Load cards */}
      <div className="space-y-3">
        {filtered.map(load => {
          const carrier = carriers.find(c => c.id === load.carrierId);
          const isBidding = load.status === 'Bidding';
          return (
            <div key={load.id}
              className={`bg-white rounded-xl border-2 transition-all ${
                isBidding ? 'border-violet-300 shadow-sm shadow-violet-100' : 'border-slate-200'}`}>
              <div className="p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  {/* Load info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400">{load.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[load.status]||STATUS_COLORS.Available}`}>
                        {load.status}
                        {isBidding && ' 🔔'}
                      </span>
                      {load.cargoInsurance && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Insured</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-base font-bold text-slate-900 mb-1">
                      <MapPin size={14} className="text-blue-500 shrink-0"/>
                      {load.origin}
                      <ArrowRight size={14} className="text-slate-300 shrink-0"/>
                      {load.destination}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Package size={11}/> {load.commodity}</span>
                      <span className="flex items-center gap-1"><Truck size={11}/> {load.truckType}</span>
                      <span>{(load.weight||0).toLocaleString()} kg</span>
                      {load.pickupDate && <span className="flex items-center gap-1"><Clock size={11}/> {load.pickupDate}</span>}
                    </div>
                  </div>

                  {/* Freight & actions */}
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-slate-900">{cur} {(load.freightAmount||0).toLocaleString()}</div>
                    <div className="text-xs text-emerald-600 font-medium mb-2">
                      +{cur} {(load.commission||0).toLocaleString()} commission
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {/* View tracking */}
                      {['Booked','In Transit'].includes(load.status) && (
                        <button onClick={() => navigate(`/tracking?load=${load.id}`)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                          <Eye size={12}/> Track
                        </button>
                      )}
                      {/* Bid board */}
                      {['Available','Bidding'].includes(load.status) && (
                        <button onClick={() => setBidLoadId(load.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium ${
                            isBidding ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
                          <Gavel size={12}/> {isBidding ? 'View Bids' : 'Open Bidding'}
                        </button>
                      )}
                      {/* Direct assign */}
                      {load.status === 'Available' && (
                        <button onClick={() => setAssignId(load.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                          <CheckCircle size={12}/> Assign
                        </button>
                      )}
                      {/* Mark picked up */}
                      {load.status === 'Booked' && (
                        <button onClick={() => markPickedUp(load.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">
                          <Truck size={12}/> Picked Up
                        </button>
                      )}
                      {/* BOL PDF */}
                      {['Booked','In Transit','Delivered'].includes(load.status) && (
                        <button onClick={() => generateBOL(load)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                          <FileText size={12}/> BOL
                        </button>
                      )}
                      {/* Invoice PDF */}
                      {load.status === 'Delivered' && (
                        <button onClick={() => generateInvoice(load)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">
                          <FileText size={12}/> Invoice
                        </button>
                      )}
                      {/* Cancel */}
                      {['Available','Bidding','Booked'].includes(load.status) && (
                        <button onClick={() => cancelLoad(load.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                          <XCircle size={12}/> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Carrier info */}
                {carrier && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <Truck size={12} className="text-blue-400 shrink-0"/>
                    <span className="font-medium text-slate-700">{carrier.name}</span>
                    <span>·</span>
                    <span>{carrier.contact}</span>
                    <span>·</span>
                    <span>{carrier.phone}</span>
                    {carrier.verified && <span className="flex items-center gap-0.5 text-emerald-600 ml-1"><CheckCircle size={10}/> Verified</span>}
                  </div>
                )}

                {load.specialInstructions && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                    ⚠ {load.specialInstructions}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">{search ? `No loads matching "${search}"` : `No ${statusFilter!=='All'?statusFilter+' ':'' }loads`}</p>
        </div>
      )}

      {assignId && (
        <AssignCarrierModal
          loadId={assignId}
          onClose={() => setAssignId(null)}
          onAssign={(cid) => { assignCarrier(assignId, cid); setAssignId(null); }}
        />
      )}

      {bidLoad && (
        <BidModal
          load={bidLoad}
          carriers={carriers}
          settings={settings}
          onClose={() => setBidLoadId(null)}
          onBidSubmit={handleBidSubmit}
          onAcceptBid={handleAcceptBid}
        />
      )}
    </div>
  );
}
