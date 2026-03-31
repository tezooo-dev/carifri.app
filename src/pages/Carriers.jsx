import { useState } from 'react';
import {
  Star, Plus, X, Truck, Phone, Mail, MapPin, CheckCircle, Shield,
  FileText, Wifi, Users, ChevronDown, ChevronRight, Edit3, Trash2,
  AlertTriangle, Building2, Globe, ClipboardList, BadgeCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { MARKETS } from '../data/markets';
import api from '../lib/api';

const TABS = ['Overview', 'Contacts', 'Contracts', 'Insurance', 'EDI', 'Compliance'];
const TAB_ICONS = [Truck, Users, ClipboardList, Shield, Wifi, BadgeCheck];

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}/>
      ))}
      <span className="ml-1 text-xs text-slate-500">{value.toFixed(1)}</span>
    </div>
  );
}

function AddCarrierModal({ onClose, onSave, market }) {
  const mkt = MARKETS[market] || MARKETS.kenya;
  const [form, setForm] = useState({
    name:'', contact:'', phone:'', email:'', location:'',
    truckTypes:[], truckCount:1, rating:4.0,
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  }

  function toggleTruckType(t) {
    set('truckTypes', form.truckTypes.includes(t)
      ? form.truckTypes.filter(x => x !== t)
      : [...form.truckTypes, t]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Add Carrier</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600">Company Name *</label>
              <input type="text" required value={form.name} onChange={e => set('name',e.target.value)} className={`mt-1 ${inputCls}`} placeholder="ABC Logistics"/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Contact Person</label>
              <input type="text" value={form.contact} onChange={e => set('contact',e.target.value)} className={`mt-1 ${inputCls}`}/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone',e.target.value)} className={`mt-1 ${inputCls}`}/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input type="email" value={form.email} onChange={e => set('email',e.target.value)} className={`mt-1 ${inputCls}`}/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Base Location</label>
              <input type="text" value={form.location} onChange={e => set('location',e.target.value)} className={`mt-1 ${inputCls}`}/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Fleet Size</label>
              <input type="number" min="1" value={form.truckCount} onChange={e => set('truckCount',+e.target.value)} className={`mt-1 ${inputCls}`}/>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Initial Rating</label>
              <select value={form.rating} onChange={e => set('rating',+e.target.value)} className={`mt-1 ${inputCls}`}>
                {[5,4.5,4,3.5,3,2].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Truck Types Operated</label>
            <div className="flex flex-wrap gap-1.5">
              {mkt.truckTypes.map(t => (
                <button type="button" key={t} onClick={() => toggleTruckType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    form.truckTypes.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Carrier'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CarrierDetailDrawer({ carrier: initialCarrier, loads, onClose }) {
  const [carrier, setCarrier] = useState(initialCarrier);
  const [tab,     setTab]     = useState('Overview');
  const [saving,  setSaving]  = useState(false);

  // Local editable state for each tab
  const [contacts,   setContacts]   = useState(carrier.contacts  || []);
  const [contracts,  setContracts]  = useState(carrier.contracts || []);
  const [insurance,  setInsurance]  = useState(carrier.insurance || {});
  const [edi,        setEdi]        = useState(carrier.ediConfig || {});
  const [compliance, setCompliance] = useState({
    mcNumber:      carrier.mcNumber      || '',
    dotNumber:     carrier.dotNumber     || '',
    authorityType: carrier.authorityType || '',
    w9OnFile:      carrier.w9OnFile      || false,
    coiOnFile:     carrier.coiOnFile     || false,
    cvorNumber:    carrier.cvorNumber    || '',
    nscNumber:     carrier.nscNumber     || '',
    iftaNumber:    carrier.iftaNumber    || '',
    cvorStatus:    carrier.cvorStatus    || '',
  });

  const carrierLoads = loads.filter(l => l.carrierId === carrier.id);

  async function saveContacts() {
    setSaving(true);
    try { await api.put(`/carrier-details/${carrier.id}/contacts`, { contacts }); } finally { setSaving(false); }
  }
  async function saveContracts() {
    setSaving(true);
    try { await api.put(`/carrier-details/${carrier.id}/contracts`, { contracts }); } finally { setSaving(false); }
  }
  async function saveInsurance() {
    setSaving(true);
    try { await api.put(`/carrier-details/${carrier.id}/insurance`, { insurance }); } finally { setSaving(false); }
  }
  async function saveEdi() {
    setSaving(true);
    try { await api.put(`/carrier-details/${carrier.id}/edi`, { ediConfig: edi }); } finally { setSaving(false); }
  }
  async function saveCompliance() {
    setSaving(true);
    try { await api.put(`/carrier-details/${carrier.id}/compliance`, compliance); } finally { setSaving(false); }
  }

  function addContact() {
    setContacts(prev => [...prev, { name:'', role:'', phone:'', email:'', type:'Primary' }]);
  }
  function addContract() {
    setContracts(prev => [...prev, { type:'Spot', startDate:'', endDate:'', ratePerKm:'', minLoads:'', notes:'' }]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-blue-600"/>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{carrier.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating value={carrier.rating}/>
                  {carrier.verified && (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={11}/> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-1"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0 overflow-x-auto">
          {TABS.map((t, i) => {
            const Icon = TAB_ICONS[i];
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  tab===t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={13}/> {t}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Overview ── */}
          {tab === 'Overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Fleet Size',    carrier.truckCount + ' trucks', Building2],
                  ['Total Loads',   carrier.totalLoads + ' completed', ClipboardList],
                  ['Base Location', carrier.location, MapPin],
                  ['Phone',        carrier.phone, Phone],
                  ['Email',        carrier.email, Mail],
                  ['Market Loads', carrierLoads.length + ' assigned', Truck],
                ].map(([k,v,Icon]) => v ? (
                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Icon size={12}/> {k}</div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{v}</div>
                  </div>
                ) : null)}
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">Truck Types</div>
                <div className="flex flex-wrap gap-1.5">
                  {(carrier.truckTypes || []).map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">{t}</span>
                  ))}
                  {(!carrier.truckTypes || carrier.truckTypes.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No truck types specified</span>
                  )}
                </div>
              </div>

              {carrierLoads.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-2">Recent Loads</div>
                  <div className="space-y-1.5">
                    {carrierLoads.slice(0,5).map(l => (
                      <div key={l.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs">
                        <span className="font-mono text-slate-400">{l.id}</span>
                        <span className="text-slate-600">{l.origin} → {l.destination}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          l.status==='Delivered'?'bg-slate-100 text-slate-600':
                          l.status==='In Transit'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Contacts ── */}
          {tab === 'Contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Manage people to contact at this carrier for dispatch, billing, EDI, and emergencies.</p>
                <button onClick={addContact} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={12}/> Add Contact
                </button>
              </div>
              {contacts.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No contacts yet. Add the dispatch, billing, or EDI contact.
                </div>
              )}
              {contacts.map((c, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Full Name</label>
                      <input value={c.name} onChange={e => { const nc=[...contacts]; nc[i]={...nc[i],name:e.target.value}; setContacts(nc); }}
                        className={`mt-1 ${inputCls}`} placeholder="John Smith"/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Role</label>
                      <select value={c.type} onChange={e => { const nc=[...contacts]; nc[i]={...nc[i],type:e.target.value}; setContacts(nc); }}
                        className={`mt-1 ${inputCls}`}>
                        {['Primary','Dispatch','Billing','EDI / IT','Emergency','Driver Relations'].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Phone</label>
                      <input type="tel" value={c.phone} onChange={e => { const nc=[...contacts]; nc[i]={...nc[i],phone:e.target.value}; setContacts(nc); }}
                        className={`mt-1 ${inputCls}`}/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Email</label>
                      <input type="email" value={c.email} onChange={e => { const nc=[...contacts]; nc[i]={...nc[i],email:e.target.value}; setContacts(nc); }}
                        className={`mt-1 ${inputCls}`}/>
                    </div>
                  </div>
                  <button onClick={() => setContacts(prev => prev.filter((_,j) => j!==i))}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash2 size={11}/> Remove
                  </button>
                </div>
              ))}
              {contacts.length > 0 && (
                <button onClick={saveContacts} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Contacts'}
                </button>
              )}
            </div>
          )}

          {/* ── Contracts ── */}
          {tab === 'Contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Track contract types, rates, and validity periods.</p>
                <button onClick={addContract} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={12}/> Add Contract
                </button>
              </div>
              {contracts.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No contracts on file. Add a spot, dedicated, or lane contract.
                </div>
              )}
              {contracts.map((c,i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Contract Type</label>
                      <select value={c.type} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],type:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls}`}>
                        {['Spot','Dedicated Lane','Volume Commitment','Master Service Agreement','Owner-Operator'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Rate per km</label>
                      <input type="number" step="0.01" value={c.ratePerKm} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],ratePerKm:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls}`} placeholder="0.00"/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Start Date</label>
                      <input type="date" value={c.startDate} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],startDate:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls}`}/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">End Date</label>
                      <input type="date" value={c.endDate} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],endDate:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls}`}/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Min Loads / Month</label>
                      <input type="number" value={c.minLoads} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],minLoads:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls}`} placeholder="0"/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Liability Cap</label>
                      <input type="text" value={c.liabilityCap||''} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],liabilityCap:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls}`} placeholder="e.g. $100,000"/>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Notes</label>
                      <textarea rows={2} value={c.notes} onChange={e => { const nc=[...contracts]; nc[i]={...nc[i],notes:e.target.value}; setContracts(nc); }}
                        className={`mt-1 ${inputCls} resize-none`} placeholder="Special terms, lane restrictions…"/>
                    </div>
                  </div>
                  <button onClick={() => setContracts(prev => prev.filter((_,j)=>j!==i))}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash2 size={11}/> Remove
                  </button>
                </div>
              ))}
              {contracts.length > 0 && (
                <button onClick={saveContracts} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Contracts'}
                </button>
              )}
            </div>
          )}

          {/* ── Insurance ── */}
          {tab === 'Insurance' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Record insurance and liability certificates for compliance.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Auto Liability', 'autoLiability', 'Policy number', '2,000,000'],
                  ['Cargo Insurance', 'cargoInsurance', 'Policy number', '500,000'],
                  ['General Liability', 'generalLiability', 'Policy number', '1,000,000'],
                  ['Workers Comp', 'workersComp', 'Policy number', '—'],
                ].map(([label, key, placeholder, minCoverage]) => (
                  <div key={key} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={14} className="text-blue-500"/>
                      <span className="text-sm font-semibold text-slate-800">{label}</span>
                      <span className="ml-auto text-xs text-slate-400">Min: {minCoverage}</span>
                    </div>
                    <div className="space-y-2">
                      <input placeholder={`${placeholder}`} value={insurance[key+'Policy']||''}
                        onChange={e => setInsurance(p=>({...p,[key+'Policy']:e.target.value}))}
                        className={inputCls}/>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Coverage amount" value={insurance[key+'Amount']||''}
                          onChange={e => setInsurance(p=>({...p,[key+'Amount']:e.target.value}))}
                          className={inputCls}/>
                        <input type="date" placeholder="Expiry date" value={insurance[key+'Expiry']||''}
                          onChange={e => setInsurance(p=>({...p,[key+'Expiry']:e.target.value}))}
                          className={inputCls}/>
                      </div>
                      <input type="text" placeholder="Insurer name" value={insurance[key+'Insurer']||''}
                        onChange={e => setInsurance(p=>({...p,[key+'Insurer']:e.target.value}))}
                        className={inputCls}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> Operating Authority</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Licence / MC Number</label>
                    <input value={insurance.licenceNumber||''} onChange={e => setInsurance(p=>({...p,licenceNumber:e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="MC-123456 / IEP-789"/>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Expiry Date</label>
                    <input type="date" value={insurance.licenceExpiry||''} onChange={e => setInsurance(p=>({...p,licenceExpiry:e.target.value}))}
                      className={`mt-1 ${inputCls}`}/>
                  </div>
                </div>
              </div>
              <button onClick={saveInsurance} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Insurance Details'}
              </button>
            </div>
          )}

          {/* ── EDI ── */}
          {tab === 'EDI' && (
            <div className="space-y-5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                EDI (Electronic Data Interchange) allows automated load tendering, status updates (214), and invoicing (210) with your carrier's systems.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">EDI Provider / VAN</label>
                  <select value={edi.provider||''} onChange={e => setEdi(p=>({...p,provider:e.target.value}))} className={`mt-1 ${inputCls}`}>
                    <option value="">None / Direct</option>
                    {['SPS Commerce','TrueCommerce','OpenText (GXS)','Cleo','DiCentral','Descartes','Sterling Commerce','Amazon EDI'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">ISA/GS Qualifier</label>
                  <input value={edi.isaQualifier||''} onChange={e => setEdi(p=>({...p,isaQualifier:e.target.value}))}
                    className={`mt-1 ${inputCls}`} placeholder="01, 08, ZZ…"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Carrier EDI ID (ISA06)</label>
                  <input value={edi.carrierId||''} onChange={e => setEdi(p=>({...p,carrierId:e.target.value}))}
                    className={`mt-1 ${inputCls}`} placeholder="CARRIERID12345"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Our EDI ID (ISA08)</label>
                  <input value={edi.senderId||''} onChange={e => setEdi(p=>({...p,senderId:e.target.value}))}
                    className={`mt-1 ${inputCls}`} placeholder="FREIGHTLINK0001"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">SFTP Host</label>
                  <input value={edi.sftpHost||''} onChange={e => setEdi(p=>({...p,sftpHost:e.target.value}))}
                    className={`mt-1 ${inputCls}`} placeholder="sftp.carrier.com"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">SFTP Username</label>
                  <input value={edi.sftpUser||''} onChange={e => setEdi(p=>({...p,sftpUser:e.target.value}))}
                    className={`mt-1 ${inputCls}`}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">AS2 URL</label>
                  <input value={edi.as2Url||''} onChange={e => setEdi(p=>({...p,as2Url:e.target.value}))}
                    className={`mt-1 ${inputCls}`} placeholder="https://as2.carrier.com/receive"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">AS2 Partner ID</label>
                  <input value={edi.as2PartnerId||''} onChange={e => setEdi(p=>({...p,as2PartnerId:e.target.value}))}
                    className={`mt-1 ${inputCls}`}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Enabled Transaction Sets</label>
                <div className="flex flex-wrap gap-2">
                  {['204 (Motor Carrier Load Tender)','210 (Freight Invoice)','214 (Shipment Status)','997 (Functional Acknowledgement)','990 (Response to Load Tender)','211 (Motor Carrier Bill)'].map(t => {
                    const key = t.split(' ')[0];
                    return (
                      <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={!!(edi.txSets||{})[key]}
                          onChange={e => setEdi(p => ({ ...p, txSets: { ...(p.txSets||{}), [key]: e.target.checked } }))}/>
                        {t}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Notes / Special Instructions</label>
                <textarea rows={3} value={edi.notes||''} onChange={e => setEdi(p=>({...p,notes:e.target.value}))}
                  className={`mt-1 ${inputCls} resize-none`} placeholder="e.g. All 214s must be sent within 15 minutes of status change…"/>
              </div>
              <button onClick={saveEdi} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save EDI Config'}
              </button>
            </div>
          )}

          {/* ── Compliance ── */}
          {tab === 'Compliance' && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500">Track regulatory compliance fields for US (FMCSA) and Canadian (Transport Canada) carrier requirements.</p>

              {/* US Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🇺🇸</span>
                  <span className="text-sm font-bold text-slate-800">US (FMCSA) Compliance</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">MC Number (Motor Carrier)</label>
                    <input value={compliance.mcNumber} onChange={e => setCompliance(p=>({...p,mcNumber:e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="MC-123456"/>
                    <p className="text-xs text-slate-400 mt-0.5">Issued by FMCSA for interstate commerce</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">USDOT Number</label>
                    <input value={compliance.dotNumber} onChange={e => setCompliance(p=>({...p,dotNumber:e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="DOT-1234567"/>
                    <p className="text-xs text-slate-400 mt-0.5">Required for all interstate commercial carriers</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Operating Authority Type</label>
                    <select value={compliance.authorityType} onChange={e => setCompliance(p=>({...p,authorityType:e.target.value}))}
                      className={`mt-1 ${inputCls}`}>
                      <option value="">Select…</option>
                      <option value="Common Carrier">Common Carrier</option>
                      <option value="Contract Carrier">Contract Carrier</option>
                      <option value="Broker Authority">Broker Authority</option>
                      <option value="Freight Forwarder">Freight Forwarder</option>
                      <option value="Owner-Operator">Owner-Operator</option>
                    </select>
                  </div>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={compliance.w9OnFile} onChange={e => setCompliance(p=>({...p,w9OnFile:e.target.checked}))}
                        className="w-4 h-4 accent-blue-600"/>
                      <span className="text-sm text-slate-700">W-9 on File</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={compliance.coiOnFile} onChange={e => setCompliance(p=>({...p,coiOnFile:e.target.checked}))}
                        className="w-4 h-4 accent-blue-600"/>
                      <span className="text-sm text-slate-700">Certificate of Insurance (COI) on File</span>
                    </label>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                  <div className="font-semibold">FMCSA Insurance Minimums</div>
                  <div>• General Freight: $750,000 liability</div>
                  <div>• Hazmat / Oil: $1,000,000 – $5,000,000</div>
                  <div>• Household Goods: $300,000</div>
                  <div>Verify at: safer.fmcsa.dot.gov</div>
                </div>
              </div>

              {/* Canada Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🇨🇦</span>
                  <span className="text-sm font-bold text-slate-800">Canada (Transport Canada) Compliance</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">CVOR Number</label>
                    <input value={compliance.cvorNumber} onChange={e => setCompliance(p=>({...p,cvorNumber:e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="e.g. 123456789ON"/>
                    <p className="text-xs text-slate-400 mt-0.5">Commercial Vehicle Operator Registration (Ontario MTO)</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">CVOR Safety Rating</label>
                    <select value={compliance.cvorStatus} onChange={e => setCompliance(p=>({...p,cvorStatus:e.target.value}))}
                      className={`mt-1 ${inputCls}`}>
                      <option value="">Unknown</option>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Satisfactory Unaudited">Satisfactory Unaudited</option>
                      <option value="Conditional">Conditional</option>
                      <option value="Unsatisfactory">Unsatisfactory</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">NSC Number (National Safety Code)</label>
                    <input value={compliance.nscNumber} onChange={e => setCompliance(p=>({...p,nscNumber:e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="NSC-123456"/>
                    <p className="text-xs text-slate-400 mt-0.5">Required for all Canadian provinces / territories</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">IFTA Account Number</label>
                    <input value={compliance.iftaNumber} onChange={e => setCompliance(p=>({...p,iftaNumber:e.target.value}))}
                      className={`mt-1 ${inputCls}`} placeholder="e.g. ON123456789"/>
                    <p className="text-xs text-slate-400 mt-0.5">International Fuel Tax Agreement (US+Canada cross-border)</p>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-xs text-red-800 space-y-1">
                  <div className="font-semibold">Canadian Insurance Minimums</div>
                  <div>• BC / AB / ON / QC: $2,000,000 liability (public)</div>
                  <div>• Cargo: $250,000 recommended</div>
                  <div>• ELD Mandate applies to vehicles ≥ 4,500 kg GVWR</div>
                  <div>Verify CVOR: ontario.ca/cvor-abstract</div>
                </div>
              </div>

              {/* Cross-border note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <div className="font-semibold mb-1">Cross-Border (USMCA / CUSMA) Requirements</div>
                <div>For US↔Canada loads: carrier must hold both MC# (US) and CVOR/NSC (Canada). IFTA required for fuel tax reporting across jurisdictions. ACE/ACI eManifest filing required 30 min before border crossing.</div>
              </div>

              <button onClick={saveCompliance} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Compliance Data'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Carriers() {
  const { carriers, loads, settings, addCarrier, toggleVerifyCarrier, removeCarrier } = useApp();
  const { can } = usePermissions();
  const [showAdd,  setShowAdd]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');

  const mkt = MARKETS[settings.market] || MARKETS.kenya;

  const filtered = carriers.filter(c =>
    `${c.name} ${c.contact} ${c.location} ${(c.truckTypes||[]).join(' ')}`.toLowerCase()
      .includes(search.toLowerCase())
  );

  const verified   = carriers.filter(c => c.verified).length;
  const avgRating  = carriers.length ? (carriers.reduce((s,c) => s+c.rating,0)/carriers.length).toFixed(1) : '—';
  const totalFleet = carriers.reduce((s,c) => s+(c.truckCount||0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mkt.flag} {mkt.name} · {carriers.length} carriers · {verified} verified
          </p>
        </div>
        {can('carriers.create') && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            <Plus size={15}/> Add Carrier
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          ['Total Carriers', carriers.length, 'text-blue-600',    'bg-blue-50'],
          ['Verified',       verified,         'text-emerald-600','bg-emerald-50'],
          ['Avg Rating',     avgRating+'★',    'text-amber-600',  'bg-amber-50'],
          ['Total Fleet',    totalFleet+' trucks','text-slate-600','bg-slate-100'],
        ].map(([label, value, textCls, bgCls]) => (
          <div key={label} className={`${bgCls} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${textCls}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Truck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search carriers, locations, truck types…"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      {/* Carrier grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => {
          const cLoads = loads.filter(l => l.carrierId === c.id);
          const active = cLoads.filter(l => ['Booked','In Transit'].includes(l.status)).length;
          const hasInsurance = c.insurance && Object.keys(c.insurance||{}).length > 2;
          const hasContracts = (c.contracts||[]).length > 0;
          const hasEdi       = !!(c.ediConfig?.provider || c.ediConfig?.carrierId);
          return (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-slate-500"/>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
                    <div className="text-xs text-slate-400 truncate">{c.contact}</div>
                  </div>
                </div>
                {c.verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle size={11}/> Verified
                  </span>
                )}
              </div>

              <StarRating value={c.rating}/>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1"><MapPin size={11}/> {c.location}</div>
                <div className="flex items-center gap-1"><Truck size={11}/> {c.truckCount} trucks</div>
                <div className="flex items-center gap-1"><Phone size={11}/> {c.phone||'—'}</div>
                <div className="flex items-center gap-1">
                  <span className={active > 0 ? 'text-emerald-500' : 'text-slate-300'}>●</span>
                  {active} active load{active !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Truck types */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {(c.truckTypes||[]).slice(0,3).map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>
                ))}
                {(c.truckTypes||[]).length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">+{c.truckTypes.length-3}</span>
                )}
              </div>

              {/* Badges: insurance, contracts, EDI */}
              <div className="flex gap-1.5 mt-2.5">
                {hasInsurance && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">Insurance ✓</span>}
                {hasContracts && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Contract ✓</span>}
                {hasEdi       && <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">EDI ✓</span>}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => setSelected(c)}
                  className="flex-1 text-xs py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-1">
                  <Edit3 size={11}/> Manage
                </button>
                {can('carriers.verify') && (
                  <button onClick={() => toggleVerifyCarrier(c.id)}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 ${
                      c.verified ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    <CheckCircle size={11}/> {c.verified ? 'Unverify' : 'Verify'}
                  </button>
                )}
                {can('carriers.delete') && (
                  <button onClick={() => removeCarrier(c.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Truck size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">{search ? `No carriers matching "${search}"` : 'No carriers yet'}</p>
          {can('carriers.create') && <button onClick={() => setShowAdd(true)} className="text-blue-600 text-sm mt-2 hover:underline">Add your first carrier</button>}
        </div>
      )}

      {showAdd && can('carriers.create') && <AddCarrierModal onClose={() => setShowAdd(false)} onSave={addCarrier} market={settings.market}/>}
      {selected && (
        <CarrierDetailDrawer
          carrier={selected}
          loads={loads}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
