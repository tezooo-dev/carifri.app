import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext(null);

// Demo users — in production replace with real auth (JWT, OAuth, etc.)
const USERS = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@freightlink.co.ke',
    password: 'admin123',
    role: 'Admin',
    avatar: 'AU',
  },
  {
    id: 'u2',
    name: 'James Dispatcher',
    email: 'dispatcher@freightlink.co.ke',
    password: 'dispatch123',
    role: 'Dispatcher',
    avatar: 'JD',
  },
  {
    id: 'u3',
    name: 'Finance Officer',
    email: 'finance@freightlink.co.ke',
    password: 'finance123',
    role: 'Finance',
    avatar: 'FO',
  },
];

export function AuthProvider({ children }) {
  const [session, setSession] = useLocalStorage('fl_session', null);
  const [error, setError] = useState('');

  const user = session ? USERS.find(u => u.id === session.userId) : null;

  function login(email, password) {
    const found = USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      setError('Invalid email or password.');
      return false;
    }
    setSession({ userId: found.id, loginTime: Date.now() });
    setError('');
    return true;
  }

  function logout() {
    setSession(null);
  }

  const clearError = useCallback(() => setError(''), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, clearError, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
