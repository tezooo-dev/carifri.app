import { useState, useEffect } from 'react';
import { Save, Building2, Phone, Mail, Percent, Globe, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MARKETS } from '../data/markets';

const input = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

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

export default function Settings() {
  const { settings, saveSettings } = useApp();
  const [form,  setForm]  = useState({ ...settings });
  const [dirty, setDirty] = useState(false);
  const [saving,setSaving] = useState(false);

  // Sync form when settings load from API
  useEffect(() => { setForm({ ...settings }); }, [settings.market]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setDirty(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try { await saveSettings(form); setDirty(false); } finally { setSaving(false); }
  }

  function selectMarket(mktId) {
    const mkt = MARKETS[mktId];
    set('market',   mktId);
    set('currency', mkt.currency);
    set('country',  mkt.name);
  }

  const exampleFreight = form.currency === 'INR' ? 200000 :
                         form.currency === 'USD' ? 2000 :
                         form.currency === 'CAD' ? 3000 : 200000;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your brokerage profile and market preferences</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Market Switcher */}
        <Section title="Active Market">
          <p className="text-xs text-slate-500 mb-4">
            Switch your active freight market. All loads, carriers, and shippers will update to reflect the selected region.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(MARKETS).map(mkt => {
              const active = form.market === mkt.id;
              return (
                <button
                  key={mkt.id}
                  type="button"
                  onClick={() => selectMarket(mkt.id)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                    ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  {active && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white"/>
                    </div>
                  )}
                  <span className="text-3xl">{mkt.flag}</span>
                  <div>
                    <div className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{mkt.name}</div>
                    <div className="text-xs text-slate-400">{mkt.currency}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {form.market !== settings.market && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Switching market will reload all data for {MARKETS[form.market]?.name}. Save to apply.
            </div>
          )}
        </Section>

        {/* Company profile */}
        <Section title="Company Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name">
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  className={`${input} pl-9`} placeholder="Your Brokerage Ltd"/>
              </div>
            </Field>
            <Field label="Business Phone">
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="tel" value={form.companyPhone} onChange={e => set('companyPhone', e.target.value)}
                  className={`${input} pl-9`} placeholder="+1 800 000 0000"/>
              </div>
            </Field>
            <Field label="Business Email">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="email" value={form.companyEmail} onChange={e => set('companyEmail', e.target.value)}
                  className={`${input} pl-9`} placeholder="ops@yourbrokerage.com"/>
              </div>
            </Field>
            <Field label="Country">
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" value={form.country} onChange={e => set('country', e.target.value)}
                  className={`${input} pl-9`}/>
              </div>
            </Field>
          </div>
        </Section>

        {/* Financial */}
        <Section title="Financial Settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Commission Rate (%)" hint="Applied to all new loads. Existing loads are unaffected.">
              <div className="relative">
                <Percent size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="number" min="1" max="50" step="0.5"
                  value={form.commissionRate}
                  onChange={e => set('commissionRate', parseFloat(e.target.value) || 8)}
                  className={`${input} pl-9`}/>
              </div>
            </Field>
            <Field label="Currency">
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className={input}>
                {['KES','INR','CAD','USD','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
            <span className="text-slate-600">On a {form.currency} {exampleFreight.toLocaleString()} load: </span>
            <span className="font-bold text-emerald-700">
              {form.currency} {(exampleFreight * (form.commissionRate / 100)).toLocaleString()} commission
            </span>
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={!dirty || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <Save size={16}/> {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
        </div>
      </form>
    </div>
  );
}
