import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, getAccessToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // restoring session
  const [error,   setError]   = useState('');

  // On mount: try to restore session from stored refresh token
  useEffect(() => {
    const rt = localStorage.getItem('fl_refresh');
    if (!rt) { setLoading(false); return; }

    api.post('/auth/refresh', { refreshToken: rt })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('fl_refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.accessToken);
      localStorage.setItem('fl_refresh', data.refreshToken);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      return false;
    }
  }

  async function logout() {
    const rt = localStorage.getItem('fl_refresh');
    try { await api.post('/auth/logout', { refreshToken: rt }); } catch {}
    localStorage.removeItem('fl_refresh');
    setAccessToken(null);
    setUser(null);
  }

  const clearError = useCallback(() => setError(''), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, clearError, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
