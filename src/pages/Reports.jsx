import { useMemo, useState } from 'react';
import { BarChart2, Download, FileText, Mail, Filter, TrendingUp, Package,
  Award, DollarSign, Truck, Calendar, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { MARKETS } from '../data/markets';

// ── Utility ──────────────────────────────────────────────────────────────────
function isoWeek(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  return `${year}-W${String(Math.ceil(((d - jan1) / 86400000 + 1) / 7)).padStart(2,'0')}`;
}

// ── Bar chart component ───────────────────────────────────────────────────────
function BarChart({ data, color = 'blue', labelKey = 'label', valueKey = 'value', formatValue = v => v }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="flex items-end justify-between gap-1 h-40">
      {data.map((d,i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
          <span className="text-xs font-medium text-slate-600">{formatValue(d[valueKey])}</span>
          <div
            className={`w-full rounded-t-md bg-${color}-500 transition-all duration-500`}
            style={{ height: `${(d[valueKey] / max) * 100}%`, minHeight: d[valueKey] > 0 ? '4px' : '0' }}
          />
          <span className="text-xs text-slate-400 truncate w-full text-center">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────
function downloadCSV(data, filename) {
  const headers = Object.keys(data[0] || {});
  const rows    = data.map(r => headers.map(h => `"${(r[h]??'').toString().replace(/"/g,'""')}"`).join(','));
  const csv     = [headers.join(','), ...rows].join('\n');
  const blob    = new Blob([csv], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(data, sheetName, filename) {
  const ws  = XLSX.utils.json_to_sheet(data);
  const wb  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function emailReport(data, subject) {
  const headers = Object.keys(data[0] || {});
  const rows    = data.slice(0,20).map(r => headers.map(h => r[h]??'').join(' | '));
  const body    = [`FreightLink Report — ${subject}`, `Generated: ${new Date().toLocaleString()}`, '',
    headers.join(' | '), ...rows,
    data.length > 20 ? `\n... and ${data.length-20} more rows (attach full CSV for complete data)` : ''].join('\n');
  window.open(`mailto:?subject=${encodeURIComponent(`FreightLink: ${subject}`)}&body=${encodeURIComponent(body)}`);
}

function ExportMenu({ data, name }) {
  const [open, setOpen] = useState(false);
  const date = new Date().toISOString().split('T')[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(v=>!v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
        <Download size={13}/> Export <ChevronDown size={12}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            <button onClick={() => { downloadCSV(data, `${name}-${date}.csv`); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              <FileText size={14} className="text-green-600"/> CSV
            </button>
            <button onClick={() => { downloadExcel(data, name, `${name}-${date}.xlsx`); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              <FileText size={14} className="text-blue-600"/> Excel (.xlsx)
            </button>
            <button onClick={() => { emailReport(data, name); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              <Mail size={14} className="text-violet-600"/> Email
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['All','Available','Bidding','Booked','In Transit','Delivered','Cancelled'];

export default function Reports() {
  const { loads, carriers, shippers, settings } = useApp();
  const mkt = MARKETS[settings.market] || MARKETS.kenya;

  // Filters
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [statusFilter,setStatusFilter]= useState('All');
  const [carrierFilter,setCarrierFilter] = useState('All');
  const [commodityFilter,setCommodityFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const cur = settings.currency;

  // ── Apply filters ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return loads.filter(l => {
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;
      if (carrierFilter !== 'All' && l.carrierId !== carrierFilter) return false;
      if (commodityFilter !== 'All' && l.commodity !== commodityFilter) return false;
      if (dateFrom && l.created_at && l.created_at < dateFrom) return false;
      if (dateTo   && l.created_at && l.created_at > dateTo + 'T')   return false;
      return true;
    });
  }, [loads, statusFilter, carrierFilter, commodityFilter, dateFrom, dateTo]);

  // ── Tabular report data ────────────────────────────────────────────────────
  const loadReport = filtered.map(l => {
    const c = carriers.find(x => x.id === l.carrierId);
    const s = shippers.find(x => x.id === l.shipperId);
    return {
      'Load ID':        l.id,
      'Origin':         l.origin,
      'Destination':    l.destination,
      'Commodity':      l.commodity,
      'Weight (kg)':    l.weight,
      'Truck Type':     l.truckType,
      'Status':         l.status,
      'Pickup Date':    l.pickupDate,
      'Delivery Date':  l.deliveryDate,
      [`Freight (${cur})`]: l.freightAmount,
      [`Commission (${cur})`]: l.commission,
      'Comm. Received': l.commissionReceived ? 'Yes' : 'No',
      'Carrier':        c?.name ?? '—',
      'Shipper':        s?.name ?? l.shipperContact ?? '—',
    };
  });

  // ── Weekly aggregations ────────────────────────────────────────────────────
  const weeks = useMemo(() => {
    const now  = new Date();
    const data = {};
    for (let i = 7; i >= 0; i--) {
      const d  = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const wk = isoWeek(d.toISOString());
      data[wk] = { label: `W${wk.split('-W')[1]}`, commission: 0, loads: 0 };
    }
    loads.forEach(l => {
      if (!l.created_at) return;
      const wk = isoWeek(l.created_at);
      if (data[wk]) {
        data[wk].commission += l.commission || 0;
        data[wk].loads++;
      }
    });
    return Object.values(data);
  }, [loads]);

  // Top routes
  const topRoutes = useMemo(() => {
    const counts = {};
    filtered.forEach(l => {
      const key = `${l.origin} → ${l.destination}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6)
      .map(([route, count]) => ({ route, count, pct: Math.round(count / Math.max(filtered.length,1) * 100) }));
  }, [filtered]);

  // Top carriers
  const topCarriers = useMemo(() => {
    const counts = {};
    filtered.filter(l=>l.carrierId).forEach(l => {
      counts[l.carrierId] = (counts[l.carrierId]||0)+1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([cid,count]) => ({
      name: carriers.find(c=>c.id===cid)?.name ?? cid,
      count,
      pct: Math.round(count/Math.max(filtered.length,1)*100),
    }));
  }, [filtered, carriers]);

  // Revenue by commodity
  const byCommodity = useMemo(() => {
    const totals = {};
    filtered.filter(l=>l.status!=='Cancelled').forEach(l => {
      totals[l.commodity] = (totals[l.commodity]||0) + (l.freightAmount||0);
    });
    const sorted = Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([name,total]) => ({ name, total, pct: Math.round(total/max*100) }));
  }, [filtered]);

  // KPIs
  const kpis = useMemo(() => {
    const delivered = filtered.filter(l=>l.status==='Delivered');
    const onTime    = delivered.filter(l => {
      if (!l.deliveryDate || !l.pickupDate) return false;
      const ev = l.timeline.find(t=>t.event==='Delivered');
      return ev?.done && ev.time <= l.deliveryDate + ' 23:59';
    });
    const totalFreight  = filtered.reduce((s,l)=>s+(l.freightAmount||0),0);
    const totalComm     = filtered.reduce((s,l)=>s+(l.commission||0),0);
    const collectionRate = delivered.length
      ? Math.round(delivered.filter(l=>l.commissionReceived).length/delivered.length*100)
      : 0;
    return { totalFreight, totalComm, collectionRate,
      avgFreight: filtered.length ? Math.round(totalFreight/filtered.length) : 0,
      onTimePct:  delivered.length ? Math.round(onTime.length/delivered.length*100) : 0,
    };
  }, [filtered]);

  const uniqueCommodities = [...new Set(loads.map(l=>l.commodity))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mkt.flag} {mkt.name} · {filtered.length} loads shown
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(v=>!v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            <Filter size={14}/> Filters {(statusFilter!=='All'||carrierFilter!=='All'||commodityFilter!=='All'||dateFrom||dateTo) ? '●' : ''}
          </button>
          <ExportMenu data={loadReport} name="FreightLink-Loads"/>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Status</label>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Carrier</label>
            <select value={carrierFilter} onChange={e=>setCarrierFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="All">All Carriers</option>
              {carriers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Commodity</label>
            <select value={commodityFilter} onChange={e=>setCommodityFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="All">All Commodities</option>
              {uniqueCommodities.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="lg:col-span-5 flex justify-end">
            <button onClick={()=>{setStatusFilter('All');setCarrierFilter('All');setCommodityFilter('All');setDateFrom('');setDateTo('');}}
              className="text-xs text-red-500 hover:text-red-700">Clear all filters</button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['Total Freight',    `${cur} ${(kpis.totalFreight/1000).toFixed(0)}K`,  'blue'],
          ['Total Commission', `${cur} ${(kpis.totalComm/1000).toFixed(0)}K`,     'emerald'],
          ['Avg per Load',     `${cur} ${kpis.avgFreight.toLocaleString()}`,       'indigo'],
          ['Collection Rate',  `${kpis.collectionRate}%`,                          'amber'],
          ['On-Time %',        `${kpis.onTimePct}%`,                               'green'],
        ].map(([label,value,c]) => (
          <div key={label} className={`bg-${c}-50 border border-${c}-100 rounded-xl p-4`}>
            <div className={`text-xl font-bold text-${c}-700`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2"><TrendingUp size={15}/> Weekly Commission</h3>
            <ExportMenu data={weeks.map(w=>({'Week':w.label,'Commission':w.commission}))} name="Weekly-Commission"/>
          </div>
          <BarChart data={weeks} color="emerald" labelKey="label" valueKey="commission"
            formatValue={v => v>0 ? `${Math.round(v/1000)}K` : '0'}/>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2"><BarChart2 size={15}/> Weekly Load Volume</h3>
            <ExportMenu data={weeks.map(w=>({'Week':w.label,'Loads':w.loads}))} name="Weekly-Volumes"/>
          </div>
          <BarChart data={weeks} color="blue" labelKey="label" valueKey="loads"
            formatValue={v => String(v)}/>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top routes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Top Routes</h3>
            <ExportMenu data={topRoutes.map(r=>({'Route':r.route,'Loads':r.count,'Share (%)':r.pct}))} name="Top-Routes"/>
          </div>
          <div className="space-y-3">
            {topRoutes.map((r,i) => (
              <div key={r.route}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <span className="text-slate-400">#{i+1}</span> {r.route}
                  </span>
                  <span className="text-slate-500">{r.count} loads</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width:`${r.pct}%`}}/>
                </div>
              </div>
            ))}
            {topRoutes.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No data</div>}
          </div>
        </div>

        {/* Top carriers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Top Carriers</h3>
            <ExportMenu data={topCarriers.map(c=>({'Carrier':c.name,'Loads':c.count,'Share (%)':c.pct}))} name="Top-Carriers"/>
          </div>
          <div className="space-y-3">
            {topCarriers.map((c,i) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <Award size={11} className="text-amber-400"/> {c.name}
                  </span>
                  <span className="text-slate-500">{c.count} loads</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{width:`${c.pct}%`}}/>
                </div>
              </div>
            ))}
            {topCarriers.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No data</div>}
          </div>
        </div>

        {/* Revenue by commodity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Revenue by Commodity</h3>
            <ExportMenu data={byCommodity.map(c=>({'Commodity':c.name,[`Revenue (${cur})`]:c.total}))} name="Revenue-Commodity"/>
          </div>
          <div className="space-y-3">
            {byCommodity.map(c => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{c.name}</span>
                  <span className="text-slate-500">{cur} {(c.total/1000).toFixed(0)}K</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{width:`${c.pct}%`}}/>
                </div>
              </div>
            ))}
            {byCommodity.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No data</div>}
          </div>
        </div>
      </div>

      {/* Load Detail Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Load Report · {filtered.length} records</h3>
          <ExportMenu data={loadReport} name="FreightLink-Load-Report"/>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                {['Load ID','Route','Commodity','Weight','Status','Freight','Commission','Carrier','Pickup'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0,50).map(l => {
                const c = carriers.find(x=>x.id===l.carrierId);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{l.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{l.origin} → {l.destination}</td>
                    <td className="px-4 py-2.5 text-slate-600">{l.commodity}</td>
                    <td className="px-4 py-2.5 text-slate-600">{(l.weight||0).toLocaleString()} kg</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.status==='Delivered'?'bg-slate-100 text-slate-600':
                        l.status==='In Transit'?'bg-amber-100 text-amber-700':
                        l.status==='Booked'?'bg-blue-100 text-blue-700':
                        l.status==='Cancelled'?'bg-red-100 text-red-600':
                        'bg-emerald-100 text-emerald-700'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 text-right">{cur} {(l.freightAmount||0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-bold text-emerald-700 text-right">{cur} {(l.commission||0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{c?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{l.pickupDate || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 50 && (
            <div className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100 bg-slate-50">
              Showing first 50 of {filtered.length} records. Export for full data.
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No records match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
