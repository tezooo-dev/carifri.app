import { useState, useEffect, useCallback } from 'react';
import {
  Ticket, Plus, X, Search, Filter, MessageSquare, Clock,
  CheckCircle, AlertTriangle, ChevronDown, Send, Eye, EyeOff,
  Truck, Building2, Star, RefreshCw, Trash2, Tag, User,
  FileText, Zap, LifeBuoy, Settings2, ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Support', 'Document Request', 'Feature Request', 'Billing', 'Carrier Onboarding', 'Compliance', 'Load Issue', 'Other'];
const PRIORITIES  = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES    = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const SUBMITTER_TYPES = ['carrier', 'shipper', 'vendor', 'internal'];

const CATEGORY_ICON = {
  'Support':            LifeBuoy,
  'Document Request':   FileText,
  'Feature Request':    Zap,
  'Billing':            Star,
  'Carrier Onboarding': Truck,
  'Compliance':         CheckCircle,
  'Load Issue':         AlertTriangle,
  'Other':              Tag,
};

const STATUS_STYLE = {
  'Open':        'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Pending':     'bg-violet-100 text-violet-700',
  'Resolved':    'bg-emerald-100 text-emerald-700',
  'Closed':      'bg-slate-100 text-slate-500',
};

const PRIORITY_STYLE = {
  'Low':      'bg-slate-100 text-slate-600',
  'Medium':   'bg-blue-100 text-blue-700',
  'High':     'bg-amber-100 text-amber-700',
  'Critical': 'bg-red-100 text-red-700',
};

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

// ─── New Ticket Modal ─────────────────────────────────────────────────────────
function NewTicketModal({ onClose, onCreated, settings, carriers, shippers }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Support', priority: 'Medium',
    submitterName: '', submitterEmail: '', submitterType: 'carrier',
    submitterRef: '', loadRef: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/tickets', { ...form, market: settings.market });
      onCreated(res.data);
      onClose();
    } catch { /* toast handled by api interceptor */ }
    finally { setSaving(false); }
  }

  // Auto-fill submitter info from selected carrier/shipper
  function pickRef(type, id) {
    set('submitterType', type);
    set('submitterRef', id);
    if (type === 'carrier') {
      const c = carriers.find(x => x.id === id);
      if (c) { set('submitterName', c.contact || c.name); set('submitterEmail', c.email || ''); }
    } else if (type === 'shipper') {
      const s = shippers.find(x => x.id === id);
      if (s) { set('submitterName', s.contact); set('submitterEmail', s.email || ''); }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">New Ticket</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Submitter */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Submitted By</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Type</label>
                <select value={form.submitterType} onChange={e => set('submitterType', e.target.value)} className={`mt-1 ${inputCls}`}>
                  {SUBMITTER_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  {form.submitterType === 'carrier' ? 'Select Carrier' : form.submitterType === 'shipper' ? 'Select Shipper' : 'Reference'}
                </label>
                {form.submitterType === 'carrier' ? (
                  <select className={`mt-1 ${inputCls}`} value={form.submitterRef}
                    onChange={e => pickRef('carrier', e.target.value)}>
                    <option value="">-- Select or enter manually --</option>
                    {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : form.submitterType === 'shipper' ? (
                  <select className={`mt-1 ${inputCls}`} value={form.submitterRef}
                    onChange={e => pickRef('shipper', e.target.value)}>
                    <option value="">-- Select or enter manually --</option>
                    {shippers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <input value={form.submitterRef} onChange={e => set('submitterRef', e.target.value)}
                    className={`mt-1 ${inputCls}`} placeholder="Company / reference"/>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500">Contact Name *</label>
                <input required value={form.submitterName} onChange={e => set('submitterName', e.target.value)}
                  className={`mt-1 ${inputCls}`} placeholder="John Smith"/>
              </div>
              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input type="email" value={form.submitterEmail} onChange={e => set('submitterEmail', e.target.value)}
                  className={`mt-1 ${inputCls}`} placeholder="john@company.com"/>
              </div>
            </div>
          </div>

          {/* Ticket details */}
          <div>
            <label className="text-xs font-medium text-slate-600">Title *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              className={`mt-1 ${inputCls}`} placeholder="Brief description of the issue or request"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={`mt-1 ${inputCls}`}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={`mt-1 ${inputCls}`}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Load Reference (optional)</label>
            <input value={form.loadRef} onChange={e => set('loadRef', e.target.value)}
              className={`mt-1 ${inputCls}`} placeholder="e.g. FL-1234"/>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
              className={`mt-1 ${inputCls} resize-none`}
              placeholder="Provide full details, steps to reproduce, documents needed, etc."/>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Ticket'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Ticket Detail Panel ──────────────────────────────────────────────────────
function TicketDetail({ ticket: initial, users, onClose, onUpdated }) {
  const { user } = useAuth();
  const { can }  = usePermissions();
  const [ticket,    setTicket]    = useState(initial);
  const [comments,  setComments]  = useState(initial.comments || []);
  const [body,      setBody]      = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [updating,  setUpdating]  = useState(false);

  const CatIcon = CATEGORY_ICON[ticket.category] || Tag;

  async function updateField(patch) {
    setUpdating(true);
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, patch);
      setTicket(res.data);
      onUpdated(res.data);
    } finally { setUpdating(false); }
  }

  async function sendComment(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/tickets/${ticket.id}/comments`, { body, isInternal });
      setComments(prev => [...prev, res.data]);
      setBody('');
    } finally { setSending(false); }
  }

  const ago = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts.replace(' ', 'T'));
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <CatIcon size={18} className="text-blue-600"/>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-slate-400">{ticket.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[ticket.status]}`}>{ticket.status}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[ticket.priority]}`}>{ticket.priority}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5 leading-tight">{ticket.title}</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                {ticket.submitter_name} · {ticket.submitter_type} · {ago(ticket.created_at)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Controls row */}
          <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Status</label>
              <select value={ticket.status} disabled={updating}
                onChange={e => updateField({ status: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Priority</label>
              <select value={ticket.priority} disabled={updating}
                onChange={e => updateField({ priority: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {can('users.manage') && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Assign to</label>
                <select value={ticket.assigned_to || ''} disabled={updating}
                  onChange={e => updateField({ assignedTo: e.target.value })}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-6 pt-4 pb-2">
            {/* Submitter info */}
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 grid grid-cols-2 gap-2 mb-4">
              <div><span className="text-slate-400">Submitter</span><br/><span className="font-medium">{ticket.submitter_name}</span></div>
              <div><span className="text-slate-400">Email</span><br/><span className="font-medium">{ticket.submitter_email || '—'}</span></div>
              <div><span className="text-slate-400">Category</span><br/><span className="font-medium">{ticket.category}</span></div>
              <div><span className="text-slate-400">Type</span><br/><span className="font-medium capitalize">{ticket.submitter_type}</span></div>
              {ticket.load_ref && <div className="col-span-2"><span className="text-slate-400">Load Ref</span><br/><span className="font-mono font-medium">{ticket.load_ref}</span></div>}
              {ticket.assigned_to && <div className="col-span-2"><span className="text-slate-400">Assigned to</span><br/><span className="font-medium">{ticket.assigned_to}</span></div>}
            </div>

            {/* Description */}
            {ticket.description && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</div>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-3">{ticket.description}</div>
              </div>
            )}

            {/* Comments */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Activity ({comments.length})
            </div>
            <div className="space-y-3 mb-4">
              {comments.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No responses yet. Add the first reply below.
                </div>
              )}
              {comments.map(c => (
                <div key={c.id}
                  className={`rounded-xl p-3 text-sm ${c.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {c.author_name?.slice(0,2).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800 text-xs">{c.author_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                      c.author_role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                      {c.author_role}
                    </span>
                    {c.is_internal === 1 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <EyeOff size={9}/> Internal
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400">{ago(c.created_at)}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reply box */}
        <div className="px-6 py-4 border-t border-slate-200 shrink-0">
          <form onSubmit={sendComment} className="space-y-2">
            <textarea rows={3} value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write a reply or internal note…"
              className={`${inputCls} resize-none`}/>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-600">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-500"/>
                <EyeOff size={12} className="text-amber-500"/> Internal note (not visible to submitter)
              </label>
              <button type="submit" disabled={sending || !body.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                <Send size={12}/> {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tickets() {
  const { settings, carriers, shippers } = useApp();
  const { can }   = usePermissions();
  const [tickets,  setTickets]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showNew,  setShowNew]  = useState(false);
  const [selected, setSelected] = useState(null);

  // Filters
  const [search,   setSearch]   = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ market: settings.market });
      if (filterStatus)   params.set('status',   filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterPriority) params.set('priority', filterPriority);
      if (search)         params.set('q',        search);

      const [tRes, sRes, uRes] = await Promise.all([
        api.get(`/tickets?${params}`),
        api.get(`/tickets/stats?market=${settings.market}`),
        api.get('/users'),
      ]);
      setTickets(tRes.data);
      setStats(sRes.data);
      setUsers(uRes.data || []);
    } finally { setLoading(false); }
  }, [settings.market, filterStatus, filterCategory, filterPriority, search]);

  useEffect(() => { load(); }, [load]);

  function onCreated(t) {
    setTickets(prev => [t, ...prev]);
    setStats(prev => prev ? { ...prev, total: prev.total + 1 } : prev);
  }

  function onUpdated(updated) {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (selected?.id === updated.id) setSelected(s => ({ ...s, ...updated }));
  }

  const openDetail = async (t) => {
    const res = await api.get(`/tickets/${t.id}`);
    setSelected(res.data);
  };

  const ago = (ts) => {
    if (!ts) return '';
    const d = new Date(ts.replace(' ', 'T'));
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m`;
    if (s < 86400) return `${Math.floor(s/3600)}h`;
    return `${Math.floor(s/86400)}d`;
  };

  const statCards = stats ? [
    { label: 'Total Tickets',     value: stats.total,                          color: 'text-slate-700', bg: 'bg-white' },
    { label: 'Open',              value: stats.byStatus.find(s=>s.status==='Open')?.count || 0,          color: 'text-blue-700',    bg: 'bg-blue-50' },
    { label: 'In Progress',       value: stats.byStatus.find(s=>s.status==='In Progress')?.count || 0,  color: 'text-amber-700',   bg: 'bg-amber-50' },
    { label: 'Critical Open',     value: stats.openCritical,                   color: 'text-red-700',   bg: 'bg-red-50' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ticket Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Support requests, document submissions, and feature requests from carriers and vendors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Refresh" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <RefreshCw size={16}/>
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            <Plus size={15}/> New Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl border border-slate-100 p-4`}>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets, submitters…"
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Category quick-filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map(c => {
          const Icon = CATEGORY_ICON[c] || Tag;
          const active = filterCategory === c;
          return (
            <button key={c} onClick={() => setFilterCategory(active ? '' : c)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              <Icon size={11}/> {c}
            </button>
          );
        })}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-40"/>
          <p className="text-sm">Loading tickets…</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <Ticket size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium text-slate-500">No tickets found</p>
          <p className="text-sm mt-1">Create the first ticket or adjust your filters.</p>
          <button onClick={() => setShowNew(true)} className="mt-4 text-blue-600 text-sm hover:underline">+ New Ticket</button>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => {
            const CatIcon = CATEGORY_ICON[t.category] || Tag;
            return (
              <div key={t.id}
                onClick={() => openDetail(t)}
                className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group">

                {/* Icon */}
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50">
                  <CatIcon size={16} className="text-slate-500 group-hover:text-blue-600"/>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400">{t.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                    {t.load_ref && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{t.load_ref}</span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 text-sm mt-0.5 truncate">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    <span className="capitalize">{t.submitter_type}</span>: {t.submitter_name}
                    {t.submitter_email ? ` · ${t.submitter_email}` : ''}
                    {t.assigned_to ? ` · Assigned: ${t.assigned_to}` : ''}
                  </div>
                </div>

                {/* Right meta */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-xs text-slate-400">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t.category}</span>
                  <span>{ago(t.created_at)} ago</span>
                </div>

                <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 shrink-0"/>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={onCreated}
          settings={settings}
          carriers={carriers}
          shippers={shippers}
        />
      )}
      {selected && (
        <TicketDetail
          ticket={selected}
          users={users}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
