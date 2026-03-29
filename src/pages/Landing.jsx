import { useNavigate, Link } from 'react-router-dom';
import {
  Truck, BarChart2, MapPin, Users, ShieldCheck, Zap,
  Globe, FileText, ArrowRight, CheckCircle, Star,
  Package, DollarSign, Bot, LayoutGrid, ChevronRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: LayoutGrid,
    title: 'Smart Load Board',
    desc: 'Post loads, receive competitive carrier bids, auto-assign on lowest price — just like DAT and Truckstop but built into your TMS.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Truck,
    title: 'Enterprise Carrier Management',
    desc: 'Full carrier profiles with contracts, insurance certificates, EDI configuration, and verified contacts — inspired by Blue Yonder & Oracle TMS.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: MapPin,
    title: 'Live GPS Tracking',
    desc: 'Track shipments on an interactive map with real-time truck position interpolation. Powered by OpenStreetMap — no API key needed.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: BarChart2,
    title: 'Reports & Analytics',
    desc: 'Filter by status, carrier, commodity, and date range. Export to CSV, Excel, or email directly from the platform.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Bot,
    title: 'AI Dispatch Assistant',
    desc: 'Intelligent load matching and carrier recommendations powered by AI. Get suggested routes, optimal carriers, and rate guidance instantly.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Globe,
    title: 'Multi-Market Support',
    desc: 'Operate across Kenya, India, Canada, and the US from one platform. Each market has its own currencies, cities, truck types, and compliance rules.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    desc: 'Admin and Operations roles with granular permissions. Admins manage users and carriers; Ops teams handle day-to-day load and carrier work.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: DollarSign,
    title: 'Finance & Commissions',
    desc: 'Track freight charges, broker commissions, advances, and receivables. Auto-calculate commissions and monitor cash flow in one view.',
    color: 'bg-teal-50 text-teal-600',
  },
];

const MARKETS = [
  { flag: '🇰🇪', name: 'Kenya',  currency: 'KES', cities: 'Nairobi · Mombasa · Kisumu · Nakuru' },
  { flag: '🇮🇳', name: 'India',  currency: 'INR', cities: 'Mumbai · Delhi · Chennai · Bangalore' },
  { flag: '🇨🇦', name: 'Canada', currency: 'CAD', cities: 'Toronto · Vancouver · Calgary · Montreal' },
  { flag: '🇺🇸', name: 'USA',    currency: 'USD', cities: 'Chicago · Houston · Los Angeles · Dallas' },
];

const TESTIMONIALS = [
  {
    name: 'Rajiv Mehta',
    role: 'Operations Director, IndoFreight Logistics',
    market: '🇮🇳',
    text: 'FreightLink replaced three separate tools we were using. The carrier bidding system alone saved us 12% on freight costs in the first month.',
    stars: 5,
  },
  {
    name: 'Sarah Mitchell',
    role: 'GM, PrairieHaul Canada',
    market: '🇨🇦',
    text: 'The multi-market support is exceptional. We manage our Canadian and US corridors from the same dashboard with separate currencies and carrier pools.',
    stars: 5,
  },
  {
    name: 'James Mwangi',
    role: 'CEO, East Africa Transport Group',
    market: '🇰🇪',
    text: 'Finally a TMS built for African logistics. M-Pesa integration, local carrier verification, and KES reporting out of the box.',
    stars: 5,
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '$149',
    period: '/mo',
    desc: 'Perfect for small brokerages getting started.',
    features: ['Up to 5 users', '500 loads/month', 'Load board + bidding', 'Carrier management', 'Basic reports', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$349',
    period: '/mo',
    desc: 'For growing brokerages with advanced needs.',
    features: ['Up to 20 users', 'Unlimited loads', 'All Starter features', 'AI Dispatch assistant', 'Advanced analytics', 'Excel/CSV export', '2 markets', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large operations across multiple markets.',
    features: ['Unlimited users', 'Unlimited loads', 'All Professional features', 'All 4 markets', 'EDI integration', 'Custom onboarding', 'Dedicated account manager', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">FL</div>
          <span className="font-bold text-slate-900 text-lg">FreightLink</span>
          <span className="hidden sm:block text-xs text-slate-400 ml-1">TMS</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#markets"  className="hover:text-slate-900 transition-colors">Markets</a>
          <a href="#pricing"  className="hover:text-slate-900 transition-colors">Pricing</a>
          <Link to="/guide"   className="hover:text-slate-900 transition-colors">User Guide</Link>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            Sign In
          </button>
          <button onClick={() => navigate('/login')}
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-6">
          <Zap size={12}/> Enterprise TMS · 4 Markets · AI-Powered
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          The freight brokerage<br/>
          <span className="text-blue-600">platform built for growth</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Manage loads, carriers, bidding, and commissions across Kenya, India, Canada, and the US —
          all from one powerful TMS. Inspired by Blue Yonder, Oracle TMS, and DAT.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300">
            Start Free Trial <ArrowRight size={18}/>
          </button>
          <Link to="/guide"
            className="flex items-center gap-2 px-8 py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-xl text-base transition-all bg-white hover:bg-slate-50">
            View User Guide
          </Link>
        </div>
        {/* Social proof */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          {['No credit card required', '14-day free trial', 'Cancel anytime'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500"/>{t}
            </span>
          ))}
        </div>
      </div>

      {/* Dashboard preview */}
      <div className="max-w-5xl mx-auto mt-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              {['bg-red-400','bg-amber-400','bg-emerald-400'].map(c => (
                <div key={c} className={`w-3 h-3 rounded-full ${c}`}/>
              ))}
            </div>
            <div className="flex-1 text-center text-xs text-slate-400 font-mono">freightlink.app/dashboard</div>
          </div>
          <div className="p-6 bg-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active Loads', value: '24', color: 'text-blue-600' },
              { label: 'Carriers',     value: '47', color: 'text-emerald-600' },
              { label: 'This Month',   value: 'KES 2.4M', color: 'text-amber-600' },
              { label: 'Commission',   value: 'KES 192K', color: 'text-violet-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 bg-slate-100">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-slate-600">Recent Loads</div>
              {[
                { id:'FL-089', route:'Nairobi → Mombasa', carrier:'FastHaul Logistics', status:'In Transit', color:'bg-amber-100 text-amber-700' },
                { id:'FL-088', route:'Mumbai → Delhi',    carrier:'IndoFreight Ltd',    status:'Delivered',  color:'bg-emerald-100 text-emerald-700' },
                { id:'FL-087', route:'Toronto → Calgary', carrier:'PrairieHaul Co.',    status:'Booked',     color:'bg-blue-100 text-blue-700' },
              ].map(l => (
                <div key={l.id} className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-50 text-sm">
                  <span className="font-mono text-xs text-slate-400 w-14">{l.id}</span>
                  <span className="flex-1 text-slate-700 truncate">{l.route}</span>
                  <span className="hidden sm:block text-slate-500 text-xs truncate flex-1">{l.carrier}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.color}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar/>
      <Hero/>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything your brokerage needs</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Built by taking the best from Blue Yonder, Oracle TMS, DAT, Truckstop, and uShip —
              and packaging it into one affordable, modern platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon size={22}/>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-base">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">One platform, four markets</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Each market has its own currencies, cities, truck types, and compliance requirements — all managed from a single login.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MARKETS.map(m => (
              <div key={m.name} className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-md transition-all">
                <div className="text-4xl mb-3">{m.flag}</div>
                <div className="font-bold text-slate-900 text-lg">{m.name}</div>
                <div className="text-blue-600 font-semibold text-sm mb-3">{m.currency}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{m.cities}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Trusted by freight teams worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400"/>)}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {t.name.split(' ').map(w=>w[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-1">{t.market} {t.name}</div>
                    <div className="text-slate-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 text-lg">Start free. Scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border-2 transition-all ${
                p.highlighted
                  ? 'border-blue-500 bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105'
                  : 'border-slate-200 bg-white'
              }`}>
                {p.highlighted && (
                  <div className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <div className={`text-lg font-bold mb-1 ${p.highlighted ? 'text-white' : 'text-slate-900'}`}>{p.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-4xl font-extrabold ${p.highlighted ? 'text-white' : 'text-slate-900'}`}>{p.price}</span>
                  {p.period && <span className={`text-sm ${p.highlighted ? 'text-blue-100' : 'text-slate-400'}`}>{p.period}</span>}
                </div>
                <p className={`text-sm mb-6 ${p.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>{p.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className={p.highlighted ? 'text-blue-200' : 'text-emerald-500'}/>
                      <span className={p.highlighted ? 'text-blue-50' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/login')}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    p.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {p.cta} <ChevronRight size={14} className="inline"/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to modernise your freight operations?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of freight brokerages across 4 countries. No credit card required.
          </p>
          <button onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-base shadow-xl">
            Start Your Free Trial <ArrowRight size={18}/>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">FL</div>
                <span className="font-bold text-white text-sm">FreightLink TMS</span>
              </div>
              <p className="text-xs leading-relaxed">Enterprise transport management for modern freight brokerages.</p>
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-3">Product</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing"  className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/guide"   className="hover:text-white transition-colors">User Guide</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-3">Markets</div>
              <ul className="space-y-2 text-sm">
                {MARKETS.map(m => <li key={m.name}>{m.flag} {m.name}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-3">Legal</div>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms"   className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span>© {new Date().getFullYear()} FreightLink TMS. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms"   className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
