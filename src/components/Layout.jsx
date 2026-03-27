import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, PlusCircle, Truck, Building2, MapPin, DollarSign, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const nav = [
  { to: '/', label: 'Load Board', icon: LayoutGrid },
  { to: '/post', label: 'Post Load', icon: PlusCircle },
  { to: '/carriers', label: 'Carriers', icon: Truck },
  { to: '/shippers', label: 'Shippers', icon: Building2 },
  { to: '/tracking', label: 'Tracking', icon: MapPin },
  { to: '/finance', label: 'Finance', icon: DollarSign },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { stats } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">FL</div>
          <div>
            <div className="font-bold text-white text-sm">FreightLink</div>
            <div className="text-slate-400 text-xs">Brokerage Platform</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-slate-700">
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <div className="text-blue-400 font-bold text-lg">{stats.activeLoads}</div>
            <div className="text-slate-400 text-xs">Active</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <div className="text-green-400 font-bold text-lg">
              {(stats.pendingCommission / 1000).toFixed(0)}K
            </div>
            <div className="text-slate-400 text-xs">Pending KES</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700">
          <div className="text-slate-500 text-xs text-center">FreightLink MVP v1.0</div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <div className="text-xs text-slate-500">Welcome back</div>
            <div className="text-sm font-semibold text-slate-800">FreightLink Operations</div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {stats.totalLoads} total loads
            </span>
            <span className="text-slate-300">|</span>
            <span>KES {stats.receivedCommission.toLocaleString()} earned</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
