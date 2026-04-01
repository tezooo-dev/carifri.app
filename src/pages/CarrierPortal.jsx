import { useState, useEffect, useCallback } from 'react';
import {
  Truck, MapPin, FileText, AlertTriangle, Search, Plus, X,
  CheckCircle, Clock, Package, Send, Trash2, ChevronDown,
  ArrowRight, RefreshCw, BookOpen, Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../lib/api';

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const DOC_TYPES    = ['BOL', 'Rate Confirmation', 'Proof of Delivery', 'Invoice', 'Weight Ticket', 'Customs Doc', 'Insurance COI', 'Other'];
const DISPUTE_TYPES = ['Rate Dispute', 'Detention / Wait Time', 'Damage Claim', 'Accessorial Charge', 'Payment Delay', 'Load Information Error', 'General'];

const STATUS_BADGE = {
  Available:   'bg-emerald-100 text-emerald-700',
  Bidding:     'bg-violet-100 text-violet-700',
  Booked:      'bg-blue-100 text-blue-700',
  'In Transit':'bg-amber-100 text-amber-700',
  Delivered:   'bg-slate-100 text-slate-600',
  Cancelled:   'bg-red-100 text-red-600',
};

// ── Tracking Code Lookup ──────────────────────────────────────────────────────
function TrackingCodeRef({ onClose }) {
  const [codes,    setCodes]    = useState([]);
  const [filter,   setFilter]   = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.get('/carrier-portal/tracking-codes').then(r => setCodes(r.data)).catch(() => {});
  }, []);

  const cats = [...new Set(codes.map(c => c.category))].sort();
  const shown = codes.filter(c => {
    const matchCat = !category || c.category === category;
    const matchQ   = !filter || c.code.toLowerCase().includes(filter.toLowerCase()) ||
                               c.message.toLowerCase().includes(filter.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600"/> Tracking Code Reference
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>
        <div className="px-6 pt-4 pb-2 flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Search code or message…"
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 sticky top-0">
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Code</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Category</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Message</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shown.map(c => (
                <tr key={c.code} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono font-bold text-blue-700">{c.code}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.category}</span>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">{c.message}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{c.description}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No codes match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Load Detail Panel ─────────────────────────────────────────────────────────
function LoadPanel({ load, carrier, onClose, onRefresh }) {
  const [tab,       setTab]       = useState('tracking');
  const [trackCode, setTrackCode] = useState('');
  const [trackLoc,  setTrackLoc]  = useState('');
  const [trackNote, setTrackNote] = useState('');
  const [sending,   setSending]   = useState(false);
  const [events,    setEvents]    = useState([]);
  const [docs,      setDocs]      = useState([]);
  const [disputes,  setDisputes]  = useState([]);
  const [codeLookup, setCodeLookup] = useState(null);
  const [docForm,   setDocForm]   = useState({ docType: 'BOL', name: '', url: '', notes: '' });
  const [dispForm,  setDispForm]  = useState({ subject: '', description: '', disputeType: 'General' });

  useEffect(() => {
    api.get(`/carrier-portal/tracking/${load.id}`).then(r => setEvents(r.data)).catch(() => {});
    api.get(`/carrier-portal/documents/${load.id}`).then(r => setDocs(r.data)).catch(() => {});
    api.get(`/carrier-portal/disputes?loadId=${load.id}`).then(r => setDisputes(r.data)).catch(() => {});
  }, [load.id]);

  // Live code lookup as carrier types
  useEffect(() => {
    if (!trackCode.trim()) { setCodeLookup(null); return; }
    const t = setTimeout(() => {
      api.get(`/carrier-portal/tracking-codes/${trackCode.trim()}`)
        .then(r => setCodeLookup(r.data))
        .catch(() => setCodeLookup(null));
    }, 300);
    return () => clearTimeout(t);
  }, [trackCode]);

  async function submitTracking(e) {
    e.preventDefault();
    if (!trackCode.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/carrier-portal/tracking/${load.id}`, {
        carrierId: carrier.id,
        code:      trackCode.trim().toUpperCase(),
        location:  trackLoc,
        notes:     trackNote,
      });
      setEvents(prev => [...prev, data]);
      setTrackCode(''); setTrackLoc(''); setTrackNote(''); setCodeLookup(null);
      onRefresh();
    } finally { setSending(false); }
  }

  async function submitDoc(e) {
    e.preventDefault();
    if (!docForm.name.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/carrier-portal/documents/${load.id}`, {
        carrierId: carrier.id, ...docForm,
      });
      setDocs(prev => [data, ...prev]);
      setDocForm({ docType: 'BOL', name: '', url: '', notes: '' });
    } finally { setSending(false); }
  }

  async function deleteDoc(id) {
    await api.delete(`/carrier-portal/documents/${id}`);
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  async function submitDispute(e) {
    e.preventDefault();
    if (!dispForm.subject.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post('/carrier-portal/disputes', {
        loadId: load.id, carrierId: carrier.id, ...dispForm,
      });
      setDisputes(prev => [data, ...prev]);
      setDispForm({ subject: '', description: '', disputeType: 'General' });
    } finally { setSending(false); }
  }

  const tabs = [
    { key: 'tracking', label: 'Tracking', icon: MapPin },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'disputes', label: 'Disputes', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-400">{load.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[load.status]||'bg-slate-100 text-slate-600'}`}>{load.status}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{load.origin} → {load.destination}</h2>
            <p className="text-xs text-slate-400">{load.commodity} · {(load.weight||0).toLocaleString()} kg · {load.truck_type}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={13}/> {t.label}
              {t.key==='documents' && docs.length > 0 && (
                <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 text-[10px]">{docs.length}</span>
              )}
              {t.key==='disputes' && disputes.length > 0 && (
                <span className="bg-red-100 text-red-600 rounded-full px-1.5 text-[10px]">{disputes.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Tracking Tab ── */}
          {tab === 'tracking' && (
            <div className="space-y-5">
              {/* Submit event */}
              <form onSubmit={submitTracking} className="space-y-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-800 mb-1">Add Tracking Update</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Tracking Code *</label>
                    <input value={trackCode} onChange={e => setTrackCode(e.target.value.toUpperCase())}
                      className={`mt-1 ${inputCls} font-mono`} placeholder="e.g. X1, X6, D1…"/>
                    {codeLookup && (
                      <div className="mt-1 text-xs bg-white border border-emerald-200 text-emerald-700 rounded px-2 py-1">
                        <span className="font-bold">{codeLookup.code}</span> → {codeLookup.message}
                      </div>
                    )}
                    {trackCode && !codeLookup && (
                      <div className="mt-1 text-xs text-amber-600">Free-text — will be used as-is</div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Current Location</label>
                    <input value={trackLoc} onChange={e => setTrackLoc(e.target.value)}
                      className={`mt-1 ${inputCls}`} placeholder="e.g. Chicago, IL"/>
                  </div>
                </div>
                <input value={trackNote} onChange={e => setTrackNote(e.target.value)}
                  className={inputCls} placeholder="Notes (optional)…"/>
                <button type="submit" disabled={sending || !trackCode.trim()}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send size={13}/> {sending ? 'Submitting…' : 'Submit Tracking Event'}
                </button>
              </form>

              {/* Event timeline */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Event History</div>
                {events.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No tracking events yet. Add the first update above.
                  </div>
                ) : (
                  <div className="relative space-y-3">
                    <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200"/>
                    {[...events].reverse().map((ev, i) => (
                      <div key={ev.id} className="flex gap-3 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                          i===0 ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-300 text-slate-500'}`}>
                          {ev.code.slice(0,2)}
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1 text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{ev.message}</span>
                            <span className="font-mono text-xs text-slate-400">{ev.code}</span>
                          </div>
                          {ev.location && <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={10}/> {ev.location}</div>}
                          {ev.notes && <div className="text-xs text-slate-400 mt-0.5">{ev.notes}</div>}
                          <div className="text-xs text-slate-400 mt-1">{ev.event_time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Documents Tab ── */}
          {tab === 'documents' && (
            <div className="space-y-5">
              <form onSubmit={submitDoc} className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-700 mb-1">Add Document</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Document Type</label>
                    <select value={docForm.docType} onChange={e => setDocForm(f => ({...f, docType: e.target.value}))}
                      className={`mt-1 ${inputCls}`}>
                      {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Document Name *</label>
                    <input required value={docForm.name} onChange={e => setDocForm(f => ({...f, name: e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="e.g. BOL-12345.pdf"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">URL / Link (optional)</label>
                  <input type="url" value={docForm.url} onChange={e => setDocForm(f => ({...f, url: e.target.value}))}
                    className={inputCls} placeholder="https://drive.google.com/…"/>
                </div>
                <input value={docForm.notes} onChange={e => setDocForm(f => ({...f, notes: e.target.value}))}
                  className={inputCls} placeholder="Notes (optional)…"/>
                <button type="submit" disabled={sending}
                  className="w-full py-2 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Plus size={13}/> {sending ? 'Adding…' : 'Add Document'}
                </button>
              </form>

              <div className="space-y-2">
                {docs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No documents yet. Add BOL, POD, invoices above.
                  </div>
                ) : docs.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <FileText size={18} className="text-blue-500 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{d.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">{d.doc_type}</span>
                        {d.uploaded_by && <span>by {d.uploaded_by}</span>}
                        <span>{d.created_at?.slice(0,10)}</span>
                      </div>
                      {d.notes && <div className="text-xs text-slate-400 mt-0.5">{d.notes}</div>}
                    </div>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline shrink-0">Open</a>
                    )}
                    <button onClick={() => deleteDoc(d.id)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Disputes Tab ── */}
          {tab === 'disputes' && (
            <div className="space-y-5">
              <form onSubmit={submitDispute} className="space-y-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-red-800 mb-1">Submit Dispute or Concern</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Dispute Type</label>
                    <select value={dispForm.disputeType} onChange={e => setDispForm(f => ({...f, disputeType: e.target.value}))}
                      className={`mt-1 ${inputCls}`}>
                      {DISPUTE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Subject *</label>
                    <input required value={dispForm.subject} onChange={e => setDispForm(f => ({...f, subject: e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="Brief summary"/>
                  </div>
                </div>
                <textarea rows={3} value={dispForm.description}
                  onChange={e => setDispForm(f => ({...f, description: e.target.value}))}
                  className={`${inputCls} resize-none`} placeholder="Describe the issue in detail…"/>
                <button type="submit" disabled={sending}
                  className="w-full py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <AlertTriangle size={13}/> {sending ? 'Submitting…' : 'Submit Dispute'}
                </button>
              </form>

              <div className="space-y-2">
                {disputes.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No disputes filed for this load.
                  </div>
                ) : disputes.map(d => (
                  <div key={d.id} className="p-3 bg-white border border-slate-200 rounded-xl text-sm">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800">{d.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.status==='Open'?'bg-red-100 text-red-700':
                        d.status==='Resolved'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>
                        {d.status}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{d.dispute_type}</span>
                    </div>
                    {d.description && <p className="text-xs text-slate-600 mb-1">{d.description}</p>}
                    {d.resolution && (
                      <div className="text-xs bg-emerald-50 text-emerald-700 rounded p-2 mt-1">
                        <span className="font-semibold">Resolution:</span> {d.resolution}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">{d.created_at?.slice(0,10)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Carrier Portal Page ──────────────────────────────────────────────────
export default function CarrierPortal() {
  const { carriers, settings } = useApp();
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [loads,    setLoads]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [showCodes, setShowCodes] = useState(false);
  const [search,   setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const carrier = carriers.find(c => c.id === selectedCarrier);

  const fetchLoads = useCallback(async () => {
    if (!selectedCarrier) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/carrier-portal/loads?carrierId=${selectedCarrier}&market=${settings.market}`);
      setLoads(data);
    } finally { setLoading(false); }
  }, [selectedCarrier, settings.market]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const shown = loads.filter(l => {
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchQ = !search || `${l.id} ${l.origin} ${l.destination} ${l.commodity}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchQ;
  });

  const openLoad = async (load) => {
    setSelected(load);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Portal</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your assigned loads, add tracking updates, submit documents and disputes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCodes(true)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            <BookOpen size={14}/> Tracking Codes
          </button>
          {selectedCarrier && (
            <button onClick={fetchLoads} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <RefreshCw size={16}/>
            </button>
          )}
        </div>
      </div>

      {/* Carrier selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Select Carrier</label>
        <select value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)}
          className="w-full max-w-sm border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">-- Choose a carrier --</option>
          {carriers.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}{c.verified ? ' ✓' : ''} · {c.location}
            </option>
          ))}
        </select>
        {carrier && (
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={15} className="text-blue-600"/>
            </div>
            <div>
              <span className="font-semibold">{carrier.name}</span>
              {carrier.verified && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
              <div className="text-xs text-slate-400">{carrier.truckCount} trucks · ★{carrier.rating?.toFixed(1)} · {carrier.location}</div>
            </div>
          </div>
        )}
      </div>

      {!selectedCarrier ? (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <Truck size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">Select a carrier above to view their loads</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search loads…"
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {['Booked','In Transit','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Stats */}
          {loads.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                ['Total Loads',  loads.length,                                                  'text-slate-700'],
                ['In Transit',   loads.filter(l=>l.status==='In Transit').length,               'text-amber-600'],
                ['Delivered',    loads.filter(l=>l.status==='Delivered').length,                'text-emerald-600'],
                ['Booked',       loads.filter(l=>l.status==='Booked').length,                   'text-blue-600'],
              ].map(([label, val, cls]) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <div className={`text-xl font-bold ${cls}`}>{val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Load list */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw size={24} className="mx-auto mb-2 animate-spin opacity-40"/>
              <p className="text-sm">Loading loads…</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="text-center py-14 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Package size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="font-medium">{loads.length === 0 ? 'No loads assigned to this carrier yet' : 'No loads match your filters'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shown.map(l => (
                <div key={l.id} onClick={() => openLoad(l)}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50">
                    <Package size={16} className="text-slate-500 group-hover:text-blue-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">{l.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[l.status]||'bg-slate-100 text-slate-600'}`}>{l.status}</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">
                      {l.origin} <ArrowRight size={12} className="inline text-slate-400"/> {l.destination}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {l.commodity} · {(l.weight||0).toLocaleString()} kg · {l.truck_type}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-xs text-slate-400">
                    <span>{l.pickup_date || '—'}</span>
                    <span className="text-slate-300">→</span>
                    <span>{l.delivery_date || '—'}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 shrink-0"/>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCodes && <TrackingCodeRef onClose={() => setShowCodes(false)}/>}
      {selected && carrier && (
        <LoadPanel
          load={selected}
          carrier={carrier}
          onClose={() => setSelected(null)}
          onRefresh={fetchLoads}
        />
      )}
    </div>
  );
}
