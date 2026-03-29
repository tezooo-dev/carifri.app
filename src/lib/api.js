import axios from 'axios';

// Points at /api/* which Vite proxies to localhost:3001 in dev,
// and should be served from the same origin in production.
const api = axios.create({ baseURL: '/api', timeout: 10000 });

// ── Token management ──────────────────────────────────────────────────────────
let _accessToken = null;

export function setAccessToken(t) { _accessToken = t; }
export function getAccessToken()  { return _accessToken; }

// Inject token on every request
api.interceptors.request.use(cfg => {
  if (_accessToken) cfg.headers.Authorization = `Bearer ${_accessToken}`;
  return cfg;
});

// On 401 try a silent refresh, then retry once
api.interceptors.response.use(
  r => r,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const rt = localStorage.getItem('fl_refresh');
      if (rt) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt });
          setAccessToken(data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('fl_refresh');
          setAccessToken(null);
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
