import { useState, useEffect } from 'react';
import {
  X, ArrowRight, ArrowLeft, CheckCircle, Truck, LayoutGrid,
  MapPin, BarChart2, Users, DollarSign, Bot, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

const STORAGE_KEY = 'fl_onboarding_done';

const STEPS = [
  {
    key: 'welcome',
    title: 'Welcome to FreightLink TMS',
    subtitle: "You're set up and ready to go. Let's take a 2-minute tour of the key features.",
    icon: Zap,
    color: 'from-blue-500 to-blue-700',
    content: null,
  },
  {
    key: 'loads',
    title: 'Post & manage loads',
    subtitle: 'The Load Board is your command centre for all freight operations.',
    icon: LayoutGrid,
    color: 'from-emerald-500 to-emerald-700',
    content: [
      { heading: 'Post a Load', body: 'Click "Post Load" in the sidebar or the top-right button. Fill in origin, destination, commodity, weight, and truck type.' },
      { heading: 'Carrier Bidding', body: 'Carriers submit bids on your loads. Bids are sorted lowest-first. Accept the best bid to auto-assign the carrier.' },
      { heading: 'Status Flow', body: 'Available → Booked → In Transit → Delivered. Each transition is one click and timestamps automatically.' },
    ],
  },
  {
    key: 'carriers',
    title: 'Build your carrier network',
    subtitle: 'Enterprise-grade carrier profiles with contracts, insurance, and EDI.',
    icon: Truck,
    color: 'from-amber-500 to-amber-700',
    content: [
      { heading: 'Add a Carrier', body: 'Go to Carriers → Add Carrier (admin only). Enter name, contact, truck types, and location.' },
      { heading: 'Carrier Details', body: 'Click "Manage" on any carrier card to open the 5-tab drawer: Overview, Contacts, Contracts, Insurance, EDI.' },
      { heading: 'Verify Carriers', body: 'Verified carriers get a green badge and are preferred in AI Dispatch recommendations.' },
    ],
  },
  {
    key: 'tracking',
    title: 'Live shipment tracking',
    subtitle: 'See every active load on an interactive map with real-time position.',
    icon: MapPin,
    color: 'from-violet-500 to-violet-700',
    content: [
      { heading: 'Interactive Map', body: 'The Tracking page shows all In Transit loads on an OpenStreetMap. Click any marker for load details.' },
      { heading: 'Truck Position', body: 'Truck position is interpolated between origin and destination based on how long the load has been in transit.' },
      { heading: 'Show/Hide Map', body: 'Toggle the map view and switch to a list view if you prefer a table format.' },
    ],
  },
  {
    key: 'reports',
    title: 'Reports & analytics',
    subtitle: 'Detailed insights with powerful filters and multi-format export.',
    icon: BarChart2,
    color: 'from-rose-500 to-rose-700',
    content: [
      { heading: 'Filter Data', body: 'Filter reports by status, carrier, commodity, and date range to drill into exactly what you need.' },
      { heading: 'Export Options', body: 'Every report section has an Export button: download as CSV, Excel (.xlsx), or send directly by email.' },
      { heading: 'Usage Analytics', body: 'Admins can view platform usage metrics — active users, page views, and feature adoption — in the Analytics section.' },
    ],
  },
  {
    key: 'users',
    title: 'Manage your team',
    subtitle: 'Two roles keep your operations secure and well-organised.',
    icon: Users,
    color: 'from-cyan-500 to-cyan-700',
    content: [
      { heading: 'Admin Role', body: 'Full access to everything: create/delete users, add/remove carriers, manage settings, all reports and features.' },
      { heading: 'Operations Role', body: 'Day-to-day access: load board, carrier details and contracts, reports, finance, tracking, AI dispatch. Cannot add/remove carriers.' },
      { heading: 'Adding Users', body: 'Go to User Management (admin only) → Add User. Set name, email, password, role, and market.' },
    ],
  },
  {
    key: 'done',
    title: "You're all set!",
    subtitle: 'Start by posting your first load or adding your carrier network.',
    icon: CheckCircle,
    color: 'from-emerald-500 to-teal-600',
    content: null,
  },
];

export default function OnboardingWizard({ onClose }) {
  const [step, setStep] = useState(0);
  const navigate        = useNavigate();
  const { track }       = useAnalytics();
  const { user }        = useAuth();

  useEffect(() => {
    track('onboarding_started', 'onboarding');
  }, []);

  const current  = STEPS[step];
  const Icon     = current.icon;
  const isFirst  = step === 0;
  const isLast   = step === STEPS.length - 1;

  function next() {
    if (isLast) finish();
    else setStep(s => s + 1);
  }
  function back() { if (!isFirst) setStep(s => s - 1); }

  function finish(dest) {
    localStorage.setItem(STORAGE_KEY, '1');
    track('onboarding_completed', 'onboarding', { steps: STEPS.length });
    onClose();
    if (dest) navigate(dest);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${current.color} p-8 text-white relative`}>
          <button onClick={() => finish()} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X size={18}/>
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Icon size={26} className="text-white"/>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 className="text-2xl font-extrabold mb-2 leading-tight">{current.title}</h2>
          <p className="text-white/80 text-sm leading-relaxed">{current.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {current.content ? (
            <div className="space-y-4">
              {current.content.map(c => (
                <div key={c.heading} className="flex gap-3">
                  <div className="w-5 h-5 mt-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={12}/>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{c.heading}</div>
                    <div className="text-slate-500 text-sm mt-0.5 leading-relaxed">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : step === 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: LayoutGrid, label: 'Load Board', desc: 'Post & bid loads' },
                { icon: Truck,      label: 'Carriers',   desc: 'Enterprise profiles' },
                { icon: MapPin,     label: 'Tracking',   desc: 'Live GPS map' },
                { icon: BarChart2,  label: 'Reports',    desc: 'Export anywhere' },
                { icon: Users,      label: 'Team Roles', desc: 'Admin & Ops' },
                { icon: Bot,        label: 'AI Dispatch',desc: 'Smart matching' },
              ].map(f => {
                const FIcon = f.icon;
                return (
                  <div key={f.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FIcon size={15}/>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">{f.label}</div>
                    <div className="text-xs text-slate-400">{f.desc}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Done step */
            <div className="space-y-3">
              {[
                { label: 'Post your first load', to: '/post', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: 'Add your first carrier', to: '/carriers', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'Explore the dashboard', to: '/', color: 'bg-slate-50 text-slate-700 border-slate-200' },
                { label: 'Read the full user guide', to: '/guide', color: 'bg-violet-50 text-violet-700 border-violet-200' },
              ].map(a => (
                <button key={a.label} onClick={() => finish(a.to)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between transition-all hover:shadow-sm ${a.color}`}>
                  {a.label}
                  <ArrowRight size={14}/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button onClick={() => finish()} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button onClick={back}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <ArrowLeft size={14}/> Back
              </button>
            )}
            <button onClick={next}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ArrowRight size={14}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Call this in your app root to auto-show for first-time users */
export function useOnboarding() {
  const [show, setShow] = useState(false);
  const { user }        = useAuth();

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, [user]);

  return { show, dismiss: () => setShow(false) };
}
