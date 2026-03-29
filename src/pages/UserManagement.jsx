import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
  ShieldCheck, UserCog, RefreshCw, AlertTriangle,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useApp } from '../context/AppContext';
import { MARKETS } from '../data/markets';

const ROLE_META = {
  admin:      { label: 'Admin',      color: 'bg-blue-100 text-blue-700',    icon: ShieldCheck },
  operations: { label: 'Operations', color: 'bg-emerald-100 text-emerald-700', icon: UserCog  },
};

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.operations;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      <Icon size={10}/>{meta.label}
    </span>
  );
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'operations', market: '', avatar: '' };

export default function UserManagement() {
  const navigate        = useNavigate();
  const { user: me }    = useAuth();
  const { can }         = usePermissions();
  const { settings }    = useApp();

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editUser,   setEditUser]   = useState(null); // user being edited
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [deleteConf, setDeleteConf] = useState(null); // user to delete
  const [error,      setError]      = useState('');

  const market = settings.market || 'kenya';
  const mkt    = MARKETS[market] || MARKETS.kenya;

  // Guard — only admins can access this page
  useEffect(() => {
    if (!can('users.manage')) {
      navigate('/', { replace: true });
    }
  }, [can, navigate]);

  useEffect(() => {
    loadUsers();
  }, [market]);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?market=${market}`);
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditUser(null);
    setForm({ ...EMPTY_FORM, market });
    setShowPw(false);
    setError('');
    setShowForm(true);
  }

  function openEdit(u) {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, market: u.market, avatar: u.avatar });
    setShowPw(false);
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditUser(null);
  }

  async function handleSave() {
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    if (!editUser && !form.password.trim()) { setError('Password is required for new users.'); return; }

    setSaving(true);
    try {
      if (editUser) {
        const body = { name: form.name, email: form.email, role: form.role, market: form.market };
        if (form.password) body.password = form.password;
        const { data } = await api.put(`/users/${editUser.id}`, body);
        setUsers(prev => prev.map(u => u.id === editUser.id ? data : u));
      } else {
        const { data } = await api.post('/users', form);
        setUsers(prev => [...prev, data]);
      }
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u) {
    try {
      await api.delete(`/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleteConf(null);
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" size={24}/> User Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mkt.flag} {mkt.name} · {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw size={16}/>
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16}/> Add User
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={14}/>{error}
        </div>
      )}

      {/* Role summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const count = users.filter(u => u.role === role).length;
          const Icon = meta.icon;
          return (
            <div key={role} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.color}`}>
                <Icon size={20}/>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{count}</div>
                <div className="text-slate-500 text-sm">{meta.label} user{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1.5 font-medium text-blue-700 mb-2"><ShieldCheck size={14}/> Admin</div>
            <ul className="space-y-1 text-slate-600">
              {['All pages & features','Create / delete users','Add / remove carriers','Add / remove shippers','System settings','Carrier contracts, insurance, EDI'].map(p => (
                <li key={p} className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 shrink-0"/>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-medium text-emerald-700 mb-2"><UserCog size={14}/> Operations</div>
            <ul className="space-y-1 text-slate-600">
              {[
                { text: 'Load board (post, bid, assign)', ok: true },
                { text: 'Carrier view + contracts/insurance/EDI', ok: true },
                { text: 'Reports & finance', ok: true },
                { text: 'Tracking, AI Dispatch, Help', ok: true },
                { text: 'Add / remove carriers', ok: false },
                { text: 'User management & settings', ok: false },
              ].map(p => (
                <li key={p.text} className="flex items-center gap-1.5">
                  {p.ok
                    ? <Check size={12} className="text-emerald-500 shrink-0"/>
                    : <X    size={12} className="text-red-400 shrink-0"/>}
                  <span className={p.ok ? '' : 'text-slate-400 line-through'}>{p.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* User table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2"/>Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Users size={32} className="mx-auto mb-2 opacity-30"/>No users found
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-600 font-medium">User</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">Market</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isSelf = u.id === me?.id;
                const mktInfo = MARKETS[u.market] || MARKETS.kenya;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {u.avatar || u.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {u.name} {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                          </div>
                          <div className="text-slate-400 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role}/></td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                      {mktInfo.flag} {mktInfo.name}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={14}/>
                        </button>
                        {!isSelf && (
                          <button onClick={() => setDeleteConf(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={closeForm}/>
          <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg">
                {editUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={closeForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle size={14}/>{error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Doe"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@company.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={editUser ? '••••••••' : 'Min 6 characters'}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROLE_META).map(([r, meta]) => {
                    const Icon = meta.icon;
                    const selected = form.role === r;
                    return (
                      <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        <Icon size={18}/>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {form.role === 'admin'
                    ? 'Full access including user management and carrier add/remove.'
                    : 'Load board, carrier details, reports, finance, tracking. Cannot add/remove carriers or manage users.'}
                </p>
              </div>

              {/* Market */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Market</label>
                <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(MARKETS).map(([key, m]) => (
                    <option key={key} value={key}>{m.flag} {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Avatar initials preview */}
              {form.name && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {form.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-600">Avatar preview · initials auto-generated</div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button onClick={closeForm} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {saving && <RefreshCw size={14} className="animate-spin"/>}
                {editUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteConf(null)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600"/>
            </div>
            <h3 className="font-bold text-slate-900 text-center text-lg mb-1">Delete User?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              <strong>{deleteConf.name}</strong> ({deleteConf.email}) will be permanently removed and their sessions revoked.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConf(null)}
                className="flex-1 border border-slate-200 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConf)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
