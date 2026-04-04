import { useState, useEffect } from 'react';
import {
  Globe, Plus, Building2, Users, CheckCircle2, XCircle,
  ChevronRight, RefreshCw, Trash2, AlertTriangle, Crown,
  TrendingUp, Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PLAN_BADGE = {
  trial:        { label: 'Trial',        color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  starter:      { label: 'Starter',      color: 'bg-blue-100 text-blue-700 border border-blue-200'   },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-700 border border-purple-200' },
};

const STATUS_BADGE = {
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700',         icon: XCircle     },
};

const MARKET_FLAGS = { kenya: '🇰🇪', india: '🇮🇳', canada: '🇨🇦', us: '🇺🇸' };

function useApi(token) {
  async function req(method, path, body) {
    const res = await fetch(`${API}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  return {
    get:    (path)        => req('GET', path),
    post:   (path, body)  => req('POST', path, body),
    patch:  (path, body)  => req('PATCH', path, body),
    delete: (path)        => req('DELETE', path),
  };
}

// ── Create company modal ────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '', slug: '', market: 'kenya',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { token } = useAuth();
  const api = useApi(token);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // Auto-generate slug from name
  function handleName(v) {
    set('name', v);
    set('slug', v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.post('/companies', form);
      onCreate(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus size={16} className="text-blue-600" />
            </div>
            <h2 className="font-bold text-slate-900">Create Company</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-light">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Company Name *</label>
              <input
                required value={form.name} onChange={e => handleName(e.target.value)}
                placeholder="e.g. Acme Freight"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Slug (URL key) *</label>
              <input
                required value={form.slug} onChange={e => set('slug', e.target.value)}
                placeholder="acme-freight"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Market *</label>
              <select
                value={form.market} onChange={e => set('market', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="kenya">🇰🇪 Kenya</option>
                <option value="india">🇮🇳 India</option>
                <option value="canada">🇨🇦 Canada</option>
                <option value="us">🇺🇸 United States</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">First Admin User</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                <input
                  required value={form.adminName} onChange={e => set('adminName', e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input
                  required type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)}
                  placeholder="admin@acme.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
                <input
                  required type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)}
                  placeholder="min 8 chars"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Company detail drawer ───────────────────────────────────────────────────
function CompanyDrawer({ company, onClose, onUpdate, onDelete, token }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const api = useApi(token);

  useEffect(() => {
    api.get(`/companies/${company.id}`)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company.id]);

  async function toggleStatus() {
    const newStatus = company.status === 'active' ? 'suspended' : 'active';
    const updated = await api.patch(`/companies/${company.id}`, { status: newStatus });
    onUpdate(updated);
  }

  async function handleDelete() {
    await api.delete(`/companies/${company.id}`);
    onDelete(company.id);
    onClose();
  }

  const planBadge = PLAN_BADGE[company.plan] || PLAN_BADGE.trial;
  const statusBadge = STATUS_BADGE[company.status] || STATUS_BADGE.active;
  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">
              {MARKET_FLAGS[company.market] || '🌍'}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{company.name}</h2>
              <p className="text-xs text-slate-400 font-mono">{company.slug}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-light">×</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status + Plan */}
          <div className="flex gap-2">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge.color}`}>
              <StatusIcon size={12} />
              {statusBadge.label}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${planBadge.color}`}>
              {planBadge.label}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {MARKET_FLAGS[company.market]} {company.market}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">{company.user_count ?? '—'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Users</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">{company.load_count ?? '—'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Loads</div>
            </div>
          </div>

          {/* Created at */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={12} />
            <span>Created {new Date(company.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {/* Users list */}
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <RefreshCw size={14} className="animate-spin" /> Loading users…
            </div>
          ) : detail?.users?.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Users</p>
              <div className="space-y-2">
                {detail.users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {u.avatar || u.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                    </div>
                    <span className={`ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <button
              onClick={toggleStatus}
              className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                company.status === 'active'
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {company.status === 'active' ? 'Suspend Company' : 'Reactivate Company'}
            </button>

            {!confirm ? (
              <button
                onClick={() => setConfirm(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Delete Company
              </button>
            ) : (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
                <p className="text-xs text-red-700 font-medium">This will delete all loads, carriers, users and data. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirm(false)}
                    className="flex-1 border border-slate-200 rounded-lg py-2 text-sm hover:bg-white">
                    Cancel
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700">
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Companies() {
  const { token } = useAuth();
  const api = useApi(token);

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected]     = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/companies');
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleCreate(result) {
    setCompanies(cs => [result.company, ...cs]);
  }

  function handleUpdate(updated) {
    setCompanies(cs => cs.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setSelected(s => s?.id === updated.id ? { ...s, ...updated } : s);
  }

  function handleDelete(id) {
    setCompanies(cs => cs.filter(c => c.id !== id));
  }

  const totalUsers = companies.reduce((s, c) => s + (parseInt(c.user_count) || 0), 0);
  const activeCount = companies.filter(c => c.status === 'active').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={22} className="text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
            <span className="ml-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              Super Admin
            </span>
          </div>
          <p className="text-slate-500 text-sm">Manage all FreightLink tenant companies across all markets.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          New Company
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Companies', value: companies.length, icon: Building2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active',          value: activeCount,       icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Users',     value: totalUsers,        icon: Users, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{loading ? '—' : value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Company list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading companies…
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Globe size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No companies yet. Create one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Company', 'Market', 'Plan', 'Status', 'Users', 'Created', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {companies.map(c => {
                const plan   = PLAN_BADGE[c.plan]   || PLAN_BADGE.trial;
                const status = STATUS_BADGE[c.status] || STATUS_BADGE.active;
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">
                          {MARKET_FLAGS[c.market] || '🌍'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{c.market}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${plan.color}`}>
                        {plan.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon size={11} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.user_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={16} className="text-slate-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {selected && (
        <CompanyDrawer
          company={selected}
          token={token}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
