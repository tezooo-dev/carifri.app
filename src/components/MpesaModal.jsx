import { useState } from 'react';
import { X, Smartphone, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';

const STEPS = {
  FORM:       'form',
  PROCESSING: 'processing',
  SUCCESS:    'success',
  FAILED:     'failed',
};

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0'))  return '254' + digits.slice(1);
  if (digits.startsWith('254')) return digits;
  return digits;
}

export default function MpesaModal({ loadId, onClose }) {
  const { loads, settings, markCommissionReceived } = useApp();
  const { push: notify } = useNotifications();
  const load = loads.find(l => l.id === loadId);
  const [step,   setStep]   = useState(STEPS.FORM);
  const [phone,  setPhone]  = useState(settings.companyPhone || '');
  const [ref,    setRef]    = useState('');
  const cur = settings.currency;

  if (!load) return null;

  async function requestPayment(e) {
    e.preventDefault();
    setStep(STEPS.PROCESSING);

    // Simulate STK push delay (2.5 – 4s)
    const delay = 2500 + Math.random() * 1500;
    await new Promise(r => setTimeout(r, delay));

    // 90% success rate simulation
    if (Math.random() > 0.1) {
      const refCode = `MPE${Date.now().toString().slice(-8).toUpperCase()}`;
      setRef(refCode);
      setStep(STEPS.SUCCESS);
    } else {
      setStep(STEPS.FAILED);
    }
  }

  function confirmSuccess() {
    markCommissionReceived(load.id);
    notify(
      'M-Pesa Payment Confirmed',
      `${cur} ${load.commission.toLocaleString()} received for load ${load.id}. Ref: ${ref}`,
      'success'
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Smartphone size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">M-Pesa Payment</div>
              <div className="text-xs text-slate-500">Commission Collection</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Amount summary */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5 text-center">
            <div className="text-xs text-green-700 font-medium mb-1">Commission Amount</div>
            <div className="text-3xl font-bold text-green-800">{cur} {load.commission.toLocaleString()}</div>
            <div className="text-xs text-green-600 mt-1">Load {load.id} · {load.origin} → {load.destination}</div>
          </div>

          {/* FORM step */}
          {step === STEPS.FORM && (
            <form onSubmit={requestPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">+</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="254 7XX XXX XXX"
                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Formatted: {phone ? `+${formatPhone(phone)}` : 'Enter number above'}
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <Shield size={14} className="shrink-0 mt-0.5 text-green-500" />
                An STK push will be sent to the phone above. Approve the prompt to complete payment.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors"
              >
                Request {cur} {load.commission.toLocaleString()} via M-Pesa
              </button>
            </form>
          )}

          {/* PROCESSING step */}
          {step === STEPS.PROCESSING && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-green-600 animate-spin" />
              </div>
              <div className="font-semibold text-slate-900 mb-1">STK Push Sent</div>
              <div className="text-sm text-slate-500 mb-4">
                Check your phone at <span className="font-mono font-bold">+{formatPhone(phone)}</span>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <div className="text-xs text-slate-400 mt-4">Waiting for M-Pesa confirmation…</div>
            </div>
          )}

          {/* SUCCESS step */}
          {step === STEPS.SUCCESS && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <div className="font-bold text-slate-900 text-lg mb-1">Payment Successful!</div>
              <div className="text-sm text-slate-500 mb-1">
                {cur} {load.commission.toLocaleString()} received
              </div>
              <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg inline-block mb-5 text-slate-600">
                Ref: {ref}
              </div>
              <button
                onClick={confirmSuccess}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600"
              >
                Confirm &amp; Close
              </button>
            </div>
          )}

          {/* FAILED step */}
          {step === STEPS.FAILED && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <div className="font-bold text-slate-900 text-lg mb-1">Payment Failed</div>
              <div className="text-sm text-slate-500 mb-5">
                The request was cancelled or timed out. Please try again.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(STEPS.FORM)}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
