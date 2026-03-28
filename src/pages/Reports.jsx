import { useMemo } from 'react';
import { BarChart2, TrendingUp, Route, Package, Award, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// Generate synthetic weekly history to make charts meaningful alongside seed data
function buildWeeklyHistory(loads) {
  const weeks = [];
  const base = new Date('2026-03-28');
  // Produce 8 weeks ending this week
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(base);
    weekStart.setDate(base.getDate() - w * 7);
    const label = weekStart.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });

    if (w === 0) {
      // Current week — use real data
      const weekLoads = loads.filter(l => l.status !== 'Cancelled');
      weeks.push({
        label,
        loads: weekLoads.length,
        freight: weekLoads.reduce((s, l) => s + l.freightAmount, 0),
        commission: weekLoads.reduce((s, l) => s + l.commission, 0),
      });
    } else {
      // Synthetic history with realistic growth curve
      const growth = 1 + (8 - w) * 0.08;
      const base_loads = Math.max(2, Math.round((3 + w) * growth * (0.8 + Math.random() * 0.4)));
      const base_freight = base_loads * (120000 + Math.round(Math.random() * 80000));
      weeks.push({
        label,
        loads: base_loads,
        freight: base_freight,
        commission: Math.round(base_freight * 0.08),
      });
    }
  }
  return weeks;
}

function BarGroup({ weeks, field, label, formatValue, color }) {
  const max = Math.max(...weeks.map(w => w[field]), 1);
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-3">{label}</div>
      <div className="flex items-end gap-1.5 h-28">
        {weeks.map((w, i) => {
          const pct = (w[field] / max) * 100;
          const isLast = i === weeks.length - 1;
          return (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {formatValue(w[field])}
              </div>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${isLast ? color : 'bg-slate-200 group-hover:bg-slate-300'}`}
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* X axis labels */}
      <div className="flex gap-1.5 mt-1">
        {weeks.map((w, i) => (
          <div key={w.label} className={`flex-1 text-center text-xs ${i === weeks.length - 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
            {w.label.split(' ')[1]}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 text-center mt-0.5">
        {weeks[0].label} — {weeks[weeks.length - 1].label}
      </div>
    </div>
  );
}

function StatRow({ rank, label, sub, value, pct }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{label}</div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-sm font-bold text-slate-900 shrink-0">{value}</div>
    </div>
  );
}

export default function Reports() {
  const { loads, carriers, shippers, stats, settings } = useApp();
  const navigate = useNavigate();
  const cur = settings.currency;

  const weeks = useMemo(() => buildWeeklyHistory(loads), [loads]);

  // 8-week totals
  const period = {
    loads:      weeks.reduce((s, w) => s + w.loads, 0),
    freight:    weeks.reduce((s, w) => s + w.freight, 0),
    commission: weeks.reduce((s, w) => s + w.commission, 0),
  };

  // Top routes by count
  const routeCounts = loads
    .filter(l => l.status !== 'Cancelled')
    .reduce((acc, l) => {
      const key = `${l.origin} → ${l.destination}`;
      if (!acc[key]) acc[key] = { loads: 0, freight: 0 };
      acc[key].loads++;
      acc[key].freight += l.freightAmount;
      return acc;
    }, {});
  const topRoutes = Object.entries(routeCounts)
    .map(([route, d]) => ({ route, ...d }))
    .sort((a, b) => b.loads - a.loads)
    .slice(0, 5);
  const maxRoute = Math.max(...topRoutes.map(r => r.loads), 1);

  // Top carriers by completed loads
  const topCarriers = [...carriers]
    .sort((a, b) => b.totalLoads - a.totalLoads)
    .slice(0, 5);
  const maxCarrier = Math.max(...topCarriers.map(c => c.totalLoads), 1);

  // Commodity revenue
  const commodityRev = loads
    .filter(l => l.status !== 'Cancelled')
    .reduce((acc, l) => {
      acc[l.commodity] = (acc[l.commodity] || 0) + l.freightAmount;
      return acc;
    }, {});
  const topCommodities = Object.entries(commodityRev)
    .map(([name, rev]) => ({ name, rev, commission: Math.round(rev * (settings.commissionRate / 100)) }))
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 5);
  const maxComm = Math.max(...topCommodities.map(c => c.rev), 1);

  // Shipper ranking
  const topShippers = [...shippers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
  const maxSpend = Math.max(...topShippers.map(s => s.totalSpend), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">8-week rolling performance · {settings.companyName}</p>
      </div>

      {/* Period summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package,   label: '8-Week Loads',      value: period.loads,                     sub: `${stats.activeLoads} active now`,           color: 'bg-blue-50 text-blue-600'   },
          { icon: TrendingUp,label: 'Total Freight',      value: `${cur} ${(period.freight/1000000).toFixed(2)}M`,  sub: 'across all shipments',   color: 'bg-violet-50 text-violet-600' },
          { icon: BarChart2, label: 'Commission Earned',  value: `${cur} ${(period.commission/1000).toFixed(0)}K`,  sub: `${settings.commissionRate}% rate`, color: 'bg-emerald-50 text-emerald-600' },
          { icon: Award,     label: 'Top Carrier',        value: topCarriers[0]?.name?.split(' ')[0] ?? '—', sub: `${topCarriers[0]?.totalLoads ?? 0} loads`, color: 'bg-amber-50 text-amber-600' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-5">Weekly Commission ({cur})</h3>
          <BarGroup
            weeks={weeks}
            field="commission"
            label="Commission earned per week"
            formatValue={v => `${cur} ${v.toLocaleString()}`}
            color="bg-emerald-500"
          />
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>8-week total</span>
            <span className="font-bold text-emerald-700">{cur} {period.commission.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-5">Weekly Loads Moved</h3>
          <BarGroup
            weeks={weeks}
            field="loads"
            label="Loads per week"
            formatValue={v => `${v} loads`}
            color="bg-blue-500"
          />
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>8-week total</span>
            <span className="font-bold text-blue-700">{period.loads} loads</span>
          </div>
        </div>
      </div>

      {/* Bottom section: top routes + top carriers + commodities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top routes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Route size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900 text-sm">Top Routes</h3>
          </div>
          <div className="space-y-4">
            {topRoutes.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
            {topRoutes.map((r, i) => (
              <StatRow
                key={r.route}
                rank={i + 1}
                label={r.route}
                sub={`${cur} ${r.freight.toLocaleString()}`}
                value={`${r.loads}x`}
                pct={(r.loads / maxRoute) * 100}
              />
            ))}
          </div>
          <button
            onClick={() => navigate('/loads')}
            className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            View all loads <ArrowRight size={12} />
          </button>
        </div>

        {/* Top carriers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Award size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900 text-sm">Top Carriers</h3>
          </div>
          <div className="space-y-4">
            {topCarriers.map((c, i) => (
              <StatRow
                key={c.id}
                rank={i + 1}
                label={c.name}
                sub={`Rating ${c.rating} · ${c.location}`}
                value={`${c.totalLoads} loads`}
                pct={(c.totalLoads / maxCarrier) * 100}
              />
            ))}
          </div>
          <button
            onClick={() => navigate('/carriers')}
            className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            View carrier network <ArrowRight size={12} />
          </button>
        </div>

        {/* Commodity revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Package size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-900 text-sm">Revenue by Commodity</h3>
          </div>
          <div className="space-y-4">
            {topCommodities.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
            {topCommodities.map((c, i) => (
              <StatRow
                key={c.name}
                rank={i + 1}
                label={c.name}
                sub={`Comm: ${cur} ${c.commission.toLocaleString()}`}
                value={`${cur} ${(c.rev / 1000).toFixed(0)}K`}
                pct={(c.rev / maxComm) * 100}
              />
            ))}
          </div>

          {/* Shipper mini table */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-500 mb-3">Top Clients by Spend</div>
            <div className="space-y-2">
              {topShippers.slice(0, 3).map(s => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span className="text-slate-600 truncate">{s.name}</span>
                  <span className="font-semibold text-slate-900 shrink-0 ml-2">
                    {cur} {(s.totalSpend / 1000000).toFixed(1)}M
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
