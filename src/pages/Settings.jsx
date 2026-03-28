import { useState } from 'react';
import { Save, RefreshCw, Building2, Phone, Mail, Percent, Globe, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CURRENCIES = ['KES', 'USD', 'UGX', 'TZS', 'ETB'];
const COUNTRIES  = ['Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Rwanda'];

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-5">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const input = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

export default function Settings() {
  const { settings, updateSettings, resetData } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [dirty, setDirty] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
  }

  function save(e) {
    e.preventDefault();
    updateSettings(form);
    setDirty(false);
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetData();
    setConfirmReset(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your brokerage profile and preferences</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Company profile */}
        <Section title="Company Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name">
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  className={`${input} pl-9`} placeholder="Your Brokerage Ltd"
                />
              </div>
            </Field>
            <Field label="Business Phone">
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel" value={form.companyPhone} onChange={e => set('companyPhone', e.target.value)}
                  className={`${input} pl-9`} placeholder="+254 700 000 000"
                />
              </div>
            </Field>
            <Field label="Business Email">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" value={form.companyEmail} onChange={e => set('companyEmail', e.target.value)}
                  className={`${input} pl-9`} placeholder="ops@yourbrokerage.co.ke"
                />
              </div>
            </Field>
            <Field label="Country">
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={form.country} onChange={e => set('country', e.target.value)}
                  className={`${input} pl-9`}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </Field>
          </div>
        </Section>

        {/* Financial settings */}
        <Section title="Financial Settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Commission Rate (%)"
              hint="Applied automatically to all new loads. Current loads are unaffected."
            >
              <div className="relative">
                <Percent size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number" min="1" max="50" step="0.5"
                  value={form.commissionRate}
                  onChange={e => set('commissionRate', parseFloat(e.target.value) || 8)}
                  className={`${input} pl-9`}
                />
              </div>
            </Field>
            <Field label="Currency">
              <select
                value={form.currency} onChange={e => set('currency', e.target.value)}
                className={input}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Live commission preview */}
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
            <span className="text-slate-600">On a KES 200,000 load, your commission will be </span>
            <span className="font-bold text-emerald-700">
              KES {(200000 * (form.commissionRate / 100)).toLocaleString()}
            </span>
          </div>
        </Section>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!dirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={16} /> Save Settings
          </button>
          {dirty && (
            <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-8 bg-white rounded-xl border border-red-200 p-5">
        <h3 className="font-semibold text-red-700 text-sm uppercase tracking-wide mb-3">Danger Zone</h3>
        <p className="text-sm text-slate-500 mb-4">
          Reset all loads, carriers, and shippers back to the original demo data. This cannot be undone.
        </p>
        {confirmReset && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3 text-sm text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            Are you sure? All your changes will be lost.
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${
              confirmReset
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                : 'border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            <RefreshCw size={14} />
            {confirmReset ? 'Yes, Reset Everything' : 'Reset Demo Data'}
          </button>
          {confirmReset && (
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
