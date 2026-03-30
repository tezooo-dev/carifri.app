import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle, Truck } from 'lucide-react';
import api from '../lib/api';

export default function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token') || '';

  const [valid,    setValid]    = useState(null); // null=checking, true, false
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!token) { setValid(false); return; }
    api.get(`/auth/verify-reset-token?token=${token}`)
      .then(r => setValid(r.data.valid))
      .catch(() => setValid(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-900/50">
            <Truck size={30} className="text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-white mt-3">FreightLink</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {valid === null && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">Verifying reset link…</p>
            </div>
          )}

          {valid === false && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-600"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Link expired or invalid</h2>
              <p className="text-slate-500 text-sm mb-6">This reset link has expired or has already been used. Reset links are valid for 1 hour.</p>
              <Link to="/forgot-password" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Request New Link
              </Link>
            </div>
          )}

          {valid === true && !done && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <KeyRound size={20} className="text-blue-600"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">New password</h2>
                  <p className="text-slate-500 text-sm">Choose a strong password</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {loading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            </>
          )}

          {done && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Password updated!</h2>
              <p className="text-slate-500 text-sm">Redirecting to sign in…</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
