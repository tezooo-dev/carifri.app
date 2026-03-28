import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useLocalStorage('fl_notifications', []);

  const push = useCallback((title, body, type = 'info') => {
    const note = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title,
      body,
      type,   // 'success' | 'warning' | 'error' | 'info'
      time: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [note, ...prev].slice(0, 50)); // keep last 50
  }, [setNotifications]);

  const markRead = useCallback(id => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifications]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearAll = useCallback(() => setNotifications([]), [setNotifications]);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, push, markRead, markAllRead, clearAll, unread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
