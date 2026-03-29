import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LayoutGrid, PlusCircle, Truck, Building2,
  MapPin, DollarSign, BarChart2, Settings, Menu, X, Bot, LogOut, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MARKETS } from '../data/markets';
import NotificationCenter from './NotificationCenter';

const NAV = [
  { to: '/',         label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/loads',    label: 'Load Board',   icon: LayoutGrid      },
  { to: '/post',     label: 'Post Load',    icon: PlusCircle      },
  { to: '/carriers', label: 'Carriers',     icon: Truck           },
  { to: '/shippers', label: 'Shippers',     icon: Building2       },
  { to: '/tracking', label: 'Tracking',     icon: MapPin          },
  { to: '/finance',  label: 'Finance',      icon: DollarSign      },
  { to: '/reports',  label: 'Reports',      icon: BarChart2       },
  { to: '/ai',       label: 'AI Dispatch',  icon: Bot             },
  { to: '/help',     label: 'Help & Guides',icon: BookOpen        },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { stats, settings, loadingData } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mkt = MARKETS[settings.market] || MARKETS.kenya;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo + market badge */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">FL</div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white text-sm truncate">{settings.companyName}</div>
            <div className="text-slate-400 text-xs flex items-center gap-1">
              <span>{mkt.flag}</span> {mkt.name} · {mkt.currency}
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white shrink-0">
            <X size={16}/>
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-1.5 px-3 py-3 border-b border-slate-700/60">
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <div className="text-blue-400 font-bold">{stats.activeLoads}</div>
            <div className="text-slate-400 text-xs">Active</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <div className="text-amber-400 font-bold text-xs leading-tight">
              {mkt.symbol}{(stats.pendingCommission / 1000).toFixed(0)}K
            </div>
            <div className="text-slate-400 text-xs">Pending</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to==='/'} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
              <Icon size={17}/> {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings + user */}
        <div className="px-2 py-3 border-t border-slate-700/60 space-y-0.5">
          <NavLink to="/settings" onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
            <Settings size={17}/> Settings
          </NavLink>
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-slate-400">{user.role}</div>
              </div>
              <button onClick={handleLogout} title="Log out" className="text-slate-400 hover:text-red-400 shrink-0">
                <LogOut size={15}/>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)}/>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button onClick={() => setOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <Menu size={20}/>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400">
              Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}
              {loadingData && <span className="ml-2 text-blue-500 animate-pulse">· Loading…</span>}
            </div>
            <div className="text-sm font-semibold text-slate-800 truncate">{settings.companyName}</div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            {/* Market badge */}
            <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg font-medium">
              {mkt.flag} {mkt.name}
            </span>
            {stats.activeLoads > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                {stats.activeLoads} active
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span>{mkt.symbol} {stats.receivedCommission.toLocaleString()} earned</span>
          </div>
          <NotificationCenter/>
          <button onClick={() => navigate('/post')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
            <PlusCircle size={13}/> Post Load
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
