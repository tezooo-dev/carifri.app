import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

/**
 * Fire-and-forget analytics event.
 * Events are silently dropped if the user is not authenticated or the request fails.
 */
export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback((event, category = 'general', meta = {}) => {
    if (!user) return;
    api.post('/analytics/event', { event, category, meta }).catch(() => {});
  }, [user]);

  return { track };
}

/**
 * Automatically fires a page_view event on every route change.
 * Drop this hook inside Layout so it runs for every authenticated page.
 */
export function usePageTracking() {
  const location    = useLocation();
  const { track }   = useAnalytics();
  const prevPath    = useRef(null);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    track('page_view', 'navigation', { page: location.pathname });
  }, [location.pathname, track]);
}
