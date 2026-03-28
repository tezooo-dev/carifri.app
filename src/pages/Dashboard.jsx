import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, Building2, DollarSign, TrendingUp, Clock,
  AlertCircle, CheckCircle, ArrowRight, PlusCircle, MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATUS_COLORS = {
  Available: { bar: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Booked:    { bar: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  'In Transit': { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200'   },
  Delivered: { bar: 'bg-slate-400',   text: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200'   },
  Cancelled: { bar: 'bg-red-300',     text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'     },
};

function StatCard({ icon: Icon, label, value, sub, color = 'blue', onClick }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    violet:  'bg-violet-50 text-violet-600',
  };
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md transition-all group w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </button>
  );
}

export default function Dashboard() {
  const { loads, carriers, shippers, stats } = useApp();
  const navigate = useNavigate();

  // Status breakdown
  const statusCounts = ['Available', 'Booked', 'In Transit', 'Delivered', 'Cancelled'].map(s => ({
    status: s,
    count: loads.filter(l => l.status === s).length,
  }));
  const maxCount = Math.max(...statusCounts.map(s => s.count), 1);

  // Loads needing action
  const needsCarrier = loads.filter(l => l.status === 'Available');
  const inTransit    = loads.filter(l => l.status === 'In Transit');
  const overdue      = loads.filter(l => l.status === 'Booked' && l.pickupDate < new Date().toISOString().slice(0, 10));

  // Top carriers
  const topCarriers = [...carriers].sort((a, b) => b.totalLoads - a.totalLoads).slice(0, 4);

  // Recent loads (last 5)
  const recentLoads = loads.slice(0, 5);

  // Commission collection rate
  const delivered = loads.filter(l => l.status === 'Delivered');
  const collectionRate = delivered.length
    ? Math.round((delivered.filter(l => l.commissionReceived).length / delivered.length) * 100)
    : 0;

  // Commodity breakdown
  const commodityCounts = loads.reduce((acc, l) => {
    acc[l.commodity] = (acc[l.commodity] || 0) + 1;
    return acc;
  }, {});
  const topCommodities = Object.entries(commodityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCommodity = Math.max(...topCommodities.map(([, c]) => c), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/post')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <PlusCircle size={16} /> Post New Load
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package} label="Total Loads" color="blue"
          value={stats.totalLoads}
          sub={`${stats.activeLoads} active right now`}
          onClick={() => navigate('/loads')}
        />
        <StatCard
          icon={TrendingUp} label="Commission Earned" color="emerald"
          value={`KES ${(stats.receivedCommission / 1000).toFixed(0)}K`}
          sub={`${collectionRate}% collection rate`}
          onClick={() => navigate('/finance')}
        />
        <StatCard
          icon={Clock} label="Pending Commission" color="amber"
          value={`KES ${(stats.pendingCommission / 1000).toFixed(0)}K`}
          sub={`${loads.filter(l => !l.commissionReceived && l.status !== 'Cancelled').length} loads outstanding`}
          onClick={() => navigate('/finance')}
        />
        <StatCard
          icon={Truck} label="Carrier Network" color="violet"
          value={carriers.length}
          sub={`${carriers.filter(c => c.verified).length} verified`}
          onClick={() => navigate('/carriers')}
        />
      </div>

      {/* Alerts row */}
      {(needsCarrier.length > 0 || overdue.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {needsCarrier.length > 0 && (
            <button
              onClick={() => navigate('/loads')}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              {needsCarrier.length} load{needsCarrier.length > 1 ? 's' : ''} need a carrier assigned
              <ArrowRight size={14} />
            </button>
          )}
          {overdue.length > 0 && (
            <button
              onClick={() => navigate('/loads')}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-800 hover:bg-red-100 transition-colors"
            >
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              {overdue.length} booked load{overdue.length > 1 ? 's' : ''} past pickup date
              <ArrowRight size={14} />
            </button>
          )}
          {inTransit.length > 0 && (
            <button
              onClick={() => navigate('/tracking')}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors"
            >
              <MapPin size={16} className="text-blue-500 shrink-0 animate-pulse" />
              {inTransit.length} shipment{inTransit.length > 1 ? 's' : ''} in transit
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Middle row: status breakdown + commodity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Load status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">Load Status Breakdown</h3>
          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => {
              const c = STATUS_COLORS[status];
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-slate-600 font-medium shrink-0">{status}</div>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${c.bar} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                      style={{ width: `${(count / maxCount) * 100}%`, minWidth: count > 0 ? '2rem' : '0' }}
                    >
                      {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                    </div>
                  </div>
                  {count === 0 && <span className="text-xs text-slate-400">0</span>}
                </div>
              );
            })}
          </div>

          {/* Mini legend */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900">{stats.totalLoads}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{stats.activeLoads}</div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">
                {loads.filter(l => l.status === 'Delivered').length}
              </div>
              <div className="text-xs text-slate-400">Delivered</div>
            </div>
          </div>
        </div>

        {/* Commodity breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">Top Commodities</h3>
          <div className="space-y-3">
            {topCommodities.map(([commodity, count]) => (
              <div key={commodity} className="flex items-center gap-3">
                <div className="w-28 text-xs text-slate-600 font-medium shrink-0 truncate">{commodity}</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${(count / maxCommodity) * 100}%`, minWidth: '2rem' }}
                  >
                    <span className="text-white text-xs font-bold">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400">
              Commission collection rate
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-emerald-700 shrink-0">{collectionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: recent loads + top carriers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent loads */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Recent Loads</h3>
            <button
              onClick={() => navigate('/loads')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLoads.map(l => {
              const c = STATUS_COLORS[l.status];
              return (
                <div
                  key={l.id}
                  onClick={() => navigate('/loads')}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${c.bar} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{l.id}</span>
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {l.origin} → {l.destination}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{l.commodity} · {l.weight.toLocaleString()} kg</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">KES {(l.freightAmount / 1000).toFixed(0)}K</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.bg} ${c.text} font-medium`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top carriers */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Top Carriers</h3>
            <button
              onClick={() => navigate('/carriers')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {topCarriers.map((carrier, idx) => (
              <div key={carrier.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{carrier.name}</div>
                  <div className="text-xs text-slate-400">{carrier.truckCount} trucks · {carrier.location}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-900">{carrier.totalLoads}</div>
                  <div className="text-xs text-slate-400">loads</div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipper summary footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
            <button
              onClick={() => navigate('/shippers')}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-blue-600 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Building2 size={12} />
                {shippers.length} active shippers
              </span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
