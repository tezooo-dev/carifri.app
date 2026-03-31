import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, X, Edit3, Trash2, Check, ChevronDown, ChevronRight,
  AlertTriangle, Lock, Unlock, Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../lib/api';

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

// Permission groups for the UI
const PERM_GROUPS = [
  {
    label: 'User & Access Management',
    color: 'blue',
    perms: [
      { key: 'users.manage',  label: 'Manage Users',        desc: 'Create, edit, delete user accounts' },
      { key: 'roles.manage',  label: 'Manage Roles',        desc: 'Create and assign custom roles' },
      { key: 'clients.manage',label: 'Manage Clients',      desc: 'Super admin: manage all client companies' },
    ],
  },
  {
    label: 'Carriers',
    color: 'emerald',
    perms: [
      { key: 'carriers.view',         label: 'View Carriers',      desc: 'See carrier list and profiles' },
      { key: 'carriers.create',       label: 'Add Carriers',       desc: 'Create new carrier records' },
      { key: 'carriers.delete',       label: 'Remove Carriers',    desc: 'Delete carrier records' },
      { key: 'carriers.verify',       label: 'Verify Carriers',    desc: 'Mark carriers as verified' },
      { key: 'carrier_details.edit',  label: 'Edit Carrier Details','desc': 'Update contracts, insurance, EDI, compliance' },
    ],
  },
  {
    label: 'Loads & Operations',
    color: 'amber',
    perms: [
      { key: 'loads.manage',   label: 'Manage Loads',   desc: 'Post, assign, and update loads' },
      { key: 'shippers.view',  label: 'View Shippers',  desc: 'See shipper/client list' },
      { key: 'shippers.create',label: 'Add Shippers',   desc: 'Create new shipper records' },
      { key: 'shippers.delete',label: 'Remove Shippers',desc: 'Delete shipper records' },
      { key: 'tracking.view',  label: 'Live Tracking',  desc: 'View real-time load tracking map' },
    ],
  },
  {
    label: 'Finance & Reports',
    color: 'violet',
    perms: [
      { key: 'finance.view',  label: 'Finance Module', desc: 'View invoices, commissions, payments' },
      { key: 'reports.view',  label: 'Reports',        desc: 'Access analytics and export reports' },
      { key: 'billing.manage',label: 'Billing',        desc: 'Manage subscription and billing' },
    ],
  },
  {
    label: 'Tools & Settings',
    color: 'slate',
    perms: [
      { key: 'settings.edit', label: 'System Settings', desc: 'Edit company profile, commission rate, currency' },
      { key: 'ai.use',        label: 'AI Dispatch',     desc: 'Use AI-assisted load recommendations' },
      { key: 'tickets.view',  label: 'View Tickets',    desc: 'See support tickets' },
      { key: 'tickets.manage',label: 'Manage Tickets',  desc: 'Assign, resolve, and reply to tickets' },
      { key: 'help.view',     label: 'Help & Guides',   desc: 'Access knowledge base' },
    ],
  },
];

const GROUP_COLORS = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700'    },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700'  },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',badge: 'bg-violet-100 text-violet-700'},
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700'  },
};

function PermissionSelector({ selected, onChange }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (k) => setExpanded(e => ({ ...e, [k]: !e[k] }));
  const has    = (p)  => selected.includes(p);

  function togglePerm(p) {
    onChange(has(p) ? selected.filter(x => x !== p) : [...selected, p]);
  }
  function toggleGroup(g) {
    const keys = g.perms.map(p => p.key);
    const allOn = keys.every(k => has(k));
    if (allOn) {
      onChange(selected.filter(k => !keys.includes(k)));
    } else {
      const merged = [...new Set([...selected, ...keys])];
      onChange(merged);
    }
  }

  return (
    <div className="space-y-3">
      {PERM_GROUPS.map(g => {
        const c = GROUP_COLORS[g.color] || GROUP_COLORS.slate;
        const allOn = g.perms.every(p => has(p.key));
        const someOn = g.perms.some(p => has(p.key));
        const open = expanded[g.label];
        return (
          <div key={g.label} className={`border ${c.border} rounded-xl overflow-hidden`}>
            <div className={`${c.bg} flex items-center px-4 py-3 cursor-pointer`} onClick={() => toggle(g.label)}>
              <input type="checkbox" checked={allOn} ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                onChange={() => toggleGroup(g)}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 accent-blue-600 mr-3"/>
              <span className="font-semibold text-sm text-slate-800 flex-1">{g.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${c.badge}`}>
                {g.perms.filter(p => has(p.key)).length}/{g.perms.length}
              </span>
              {open ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
            </div>
            {open && (
              <div className="divide-y divide-slate-100">
                {g.perms.map(p => (
                  <label key={p.key} className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={has(p.key)} onChange={() => togglePerm(p.key)}
                      className="w-4 h-4 accent-blue-600 mt-0.5"/>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{p.label}</div>
                      <div className="text-xs text-slate-400">{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoleDrawer({ role: initial, onClose, onSaved, settings }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:        initial?.name        || '',
    description: initial?.description || '',
    permissions: initial?.permissions || [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/roles/${initial.id}`, form);
      } else {
        res = await api.post('/roles', { ...form, market: settings.market });
      }
      onSaved(res.data, isEdit);
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Role' : 'Create Custom Role'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>
        <form onSubmit={save} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Role Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className={`mt-1 ${inputCls}`} placeholder="e.g. Dispatcher, Billing Manager…"/>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className={`mt-1 ${inputCls}`} placeholder="What this role is responsible for"/>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">
              Permissions ({form.permissions.length} selected)
            </label>
            <PermissionSelector
              selected={form.permissions}
              onChange={v => set('permissions', v)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Save size={14} className="inline mr-1.5"/>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
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

export default function RoleManagement() {
  const { settings } = useApp();
  const { can }      = usePermissions();
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer,  setDrawer]  = useState(null); // null | 'new' | role object

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/roles?market=${settings.market}`);
      setRoles(res.data);
    } finally { setLoading(false); }
  }, [settings.market]);

  useEffect(() => { load(); }, [load]);

  function onSaved(role, isEdit) {
    if (isEdit) setRoles(prev => prev.map(r => r.id === role.id ? { ...role, permissions: JSON.parse(role.permissions || '[]') } : r));
    else setRoles(prev => [...prev, { ...role, permissions: JSON.parse(role.permissions || '[]') }]);
  }

  async function deleteRole(id) {
    if (!window.confirm('Delete this custom role? Users assigned to it will fall back to their base role.')) return;
    await api.delete(`/roles/${id}`);
    setRoles(prev => prev.filter(r => r.id !== id));
  }

  if (!can('roles.manage')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Lock size={36} className="mb-3 opacity-40"/>
        <p className="font-semibold">Access Denied</p>
        <p className="text-sm mt-1">You need the <strong>roles.manage</strong> permission to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create custom roles with granular module permissions for your team.
          </p>
        </div>
        <button onClick={() => setDrawer('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus size={15}/> Create Role
        </button>
      </div>

      {/* Built-in roles info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Shield size={14}/> Built-in Roles (read-only)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { role: 'super_admin', label: 'Super Admin', desc: 'Full system access. FreightLink IT team only. Can manage all client companies.', color: 'text-red-700 bg-red-50' },
            { role: 'admin',       label: 'Admin',       desc: 'Full company access. Can manage users, roles, carriers, settings, and billing.',  color: 'text-blue-700 bg-blue-100' },
            { role: 'operations',  label: 'Operations',  desc: 'Load board, carrier viewing, finance, tracking. Cannot add/remove carriers or manage users.', color: 'text-emerald-700 bg-emerald-50' },
          ].map(r => (
            <div key={r.role} className={`${r.color} rounded-lg px-3 py-2`}>
              <div className="font-bold">{r.label}</div>
              <div className="mt-0.5 leading-relaxed">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom roles */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Custom Roles ({roles.length})</h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">Loading roles…</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
          <Shield size={32} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No custom roles yet</p>
          <p className="text-sm mt-1">Create a role like "Dispatcher" or "Billing Manager" with specific module access.</p>
          <button onClick={() => setDrawer('new')} className="mt-4 text-blue-600 text-sm hover:underline">+ Create first role</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(r => {
            const permCount = (r.permissions || []).length;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{r.name}</div>
                    {r.description && <div className="text-xs text-slate-400 mt-0.5">{r.description}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setDrawer(r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit3 size={13}/>
                    </button>
                    <button onClick={() => deleteRole(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-1.5">{permCount} permission{permCount !== 1 ? 's' : ''} granted</div>
                  <div className="flex flex-wrap gap-1">
                    {(r.permissions || []).slice(0, 6).map(p => (
                      <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                    {permCount > 6 && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">+{permCount - 6} more</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {drawer && (
        <RoleDrawer
          role={drawer === 'new' ? null : drawer}
          onClose={() => setDrawer(null)}
          onSaved={onSaved}
          settings={settings}
        />
      )}
    </div>
  );
}
