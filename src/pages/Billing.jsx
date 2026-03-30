import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard, CheckCircle, Zap, Users, Globe, BarChart2,
  ArrowRight, ShieldCheck, AlertTriangle, RefreshCw, ExternalLink,
} from 'lucide-react';
import api from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$149',
    period: '/mo',
    desc: 'Perfect for small brokerages.',
    color: 'border-slate-200',
    features: ['Up to 5 users', '500 loads/month', 'Load board + bidding', 'Carrier management', 'Basic reports', 'Email support'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: '$349',
    period: '/mo',
    desc: 'For growing brokerages.',
    color: 'border-blue-500',
    highlight: true,
    features: ['Up to 20 users', 'Unlimited loads', 'AI Dispatch', 'Advanced analytics', 'Excel export', '2 markets', 'Priority support'],
  },
];

const STATUS_META = {
  trialing:  { color: 'bg-amber-100 text-amber-700',   label: 'Free Trial',     icon: Zap          },
  active:    { color: 'bg-emerald-100 text-emerald-700', label: 'Active',        icon: CheckCircle  },
  expired:   { color: 'bg-red-100 text-red-700',        label: 'Trial Expired', icon: AlertTriangle },
  canceled:  { color: 'bg-slate-100 text-slate-700',    label: 'Cancelled',     icon: AlertTriangle },
  past_due:  { color: 'bg-red-100 text-red-700',        label: 'Past Due',      icon: AlertTriangle },
};

export default function Billing() {
  const { isAdmin }     = usePermissions();
  const [params]        = useSearchParams();
  const [sub,    setSub]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [portalLoading,   setPortalLoading]   = useState(false);

  const successMsg   = params.get('success')   === '1';
  const cancelledMsg = params.get('cancelled') === '1';

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try {
      const { data } = await api.get('/billing/status');
      setSub(data);
    } catch { setSub({ plan: 'trial', status: 'trialing' }); }
    finally  { setLoading(false); }
  }

  async function startCheckout(plan) {
    setCheckoutLoading(plan);
    try {
      const { data } = await api.post('/billing/checkout', { plan });
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start checkout. Check Stripe config.');
    } finally {
      setCheckoutLoading('');
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { data } = await api.post('/billing/portal');
      window.open(data.url, '_blank');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  }

  const meta = STATUS_META[sub?.status] || STATUS_META.trialing;
  const StatusIcon = meta.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="text-blue-600" size={24}/> Billing & Subscription
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your FreightLink TMS subscription</p>
      </div>

      {/* Success/cancel banners */}
      {successMsg && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <CheckCircle size={16}/> Subscription activated! Welcome to FreightLink TMS.
        </div>
      )}
      {cancelledMsg && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-700 text-sm font-medium">
          <AlertTriangle size={16}/> Checkout cancelled. You can subscribe anytime below.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw size={24} className="animate-spin mr-2"/> Loading…
        </div>
      ) : (
        <>
          {/* Current status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Current Plan</div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-slate-900 capitalize">{sub?.plan || 'Trial'}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                    <StatusIcon size={12}/>{meta.label}
                  </span>
                </div>
                {sub?.trialEnd && sub.status === 'trialing' && (
                  <p className="text-xs text-slate-400 mt-1">
                    Trial ends {new Date(sub.trialEnd).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
                  </p>
                )}
                {sub?.current_period_end && sub.status === 'active' && (
                  <p className="text-xs text-slate-400 mt-1">
                    Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
                  </p>
                )}
              </div>
              {isAdmin() && sub?.status === 'active' && (
                <button onClick={openPortal} disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60">
                  {portalLoading ? <RefreshCw size={14} className="animate-spin"/> : <ExternalLink size={14}/>}
                  Manage / Cancel
                </button>
              )}
            </div>

            {(sub?.status === 'expired' || sub?.status === 'canceled') && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle size={14}/> Your access is limited. Subscribe to restore full access.
              </div>
            )}
          </div>

          {/* Plan cards */}
          {isAdmin() && sub?.status !== 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {PLANS.map(p => (
                <div key={p.key} className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                  p.highlight ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-slate-200'
                }`}>
                  {p.highlight && (
                    <div className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full inline-block mb-3">
                      Most Popular
                    </div>
                  )}
                  <div className="text-lg font-bold text-slate-900 mb-1">{p.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-slate-400 text-sm">{p.period}</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{p.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle size={13} className="text-emerald-500 shrink-0"/>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => startCheckout(p.key)} disabled={!!checkoutLoading}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      p.highlight
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    } disabled:opacity-60`}>
                    {checkoutLoading === p.key
                      ? <RefreshCw size={14} className="animate-spin"/>
                      : <ArrowRight size={14}/>}
                    {checkoutLoading === p.key ? 'Redirecting…' : `Subscribe · ${p.price}/mo`}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Feature highlights */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">What's included in all plans</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: BarChart2, text: 'Load Board + Bidding' },
                { icon: Users,     text: 'Carrier Management' },
                { icon: Globe,     text: 'Multi-Market Support' },
                { icon: ShieldCheck, text: 'Role-Based Access' },
                { icon: BarChart2, text: 'Reports + CSV/Excel' },
                { icon: Zap,       text: 'AI Dispatch' },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.text} className="flex items-center gap-2 text-sm text-slate-600">
                    <Icon size={14} className="text-blue-500 shrink-0"/>{f.text}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              All subscriptions include a 14-day free trial. No credit card required to start.
              Questions? Email <a href="mailto:billing@freightlink.app" className="text-blue-500 hover:underline">billing@freightlink.app</a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
