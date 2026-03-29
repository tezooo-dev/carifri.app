import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  companyName: 'FreightLink Brokerage', companyPhone: '', companyEmail: '',
  commissionRate: 8, currency: 'KES', country: 'Kenya', market: 'kenya',
};

export function AppProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { push: notify } = useNotifications();

  const [loads,       setLoads]       = useState([]);
  const [carriers,    setCarriers]    = useState([]);
  const [shippers,    setShippers]    = useState([]);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [loadingData, setLoadingData] = useState(false);

  const market = settings.market || user?.market || 'kenya';

  // ── Fetch all data for the active market ─────────────────────────────────────
  const fetchAll = useCallback(async (mkt) => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      const [l, c, s, st] = await Promise.all([
        api.get(`/loads?market=${mkt}`),
        api.get(`/carriers?market=${mkt}`),
        api.get(`/shippers?market=${mkt}`),
        api.get('/settings'),
      ]);
      setLoads(l.data);
      setCarriers(c.data);
      setShippers(s.data);
      setSettings({
        companyName:    st.data.company_name    ?? DEFAULT_SETTINGS.companyName,
        companyPhone:   st.data.company_phone   ?? '',
        companyEmail:   st.data.company_email   ?? '',
        commissionRate: st.data.commission_rate ?? 8,
        currency:       st.data.currency        ?? 'KES',
        country:        st.data.country         ?? 'Kenya',
        market:         st.data.market          ?? 'kenya',
      });
    } catch (err) {
      console.error('AppContext fetchAll:', err);
    } finally {
      setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchAll(user?.market || 'kenya');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Load mutations ────────────────────────────────────────────────────────────
  async function addLoad(data) {
    const { data: load } = await api.post('/loads', { ...data, market });
    setLoads(prev => [load, ...prev]);
    notify('New Load Posted', `${load.origin} → ${load.destination}`, 'success');
  }

  async function assignCarrier(loadId, carrierId) {
    const { data: load } = await api.patch(`/loads/${loadId}/assign`, { carrierId });
    setLoads(prev => prev.map(l => l.id === loadId ? load : l));
    const c = carriers.find(c => c.id === carrierId);
    notify('Carrier Assigned', c?.name ?? 'Carrier assigned', 'success');
  }

  async function markPickedUp(loadId) {
    const { data: load } = await api.patch(`/loads/${loadId}/pickup`);
    setLoads(prev => prev.map(l => l.id === loadId ? load : l));
    notify('Shipment Picked Up', `Load ${loadId} is now in transit`, 'info');
  }

  async function markDelivered(loadId) {
    const { data: load } = await api.patch(`/loads/${loadId}/deliver`);
    setLoads(prev => prev.map(l => l.id === loadId ? load : l));
    notify('Load Delivered ✓', `Load ${loadId} delivered successfully`, 'success');
  }

  async function cancelLoad(loadId) {
    await api.patch(`/loads/${loadId}/cancel`);
    setLoads(prev => prev.map(l => l.id === loadId ? { ...l, status: 'Cancelled' } : l));
    notify('Load Cancelled', `Load ${loadId} has been cancelled`, 'error');
  }

  async function markCommissionReceived(loadId) {
    const { data: load } = await api.patch(`/loads/${loadId}/commission`);
    setLoads(prev => prev.map(l => l.id === loadId ? load : l));
    notify('Commission Received 💰', `Commission for ${loadId} marked as received`, 'success');
  }

  // ── Carrier mutations ─────────────────────────────────────────────────────────
  async function addCarrier(data) {
    const { data: carrier } = await api.post('/carriers', { ...data, market });
    setCarriers(prev => [...prev, carrier]);
  }

  async function toggleVerifyCarrier(carrierId) {
    await api.patch(`/carriers/${carrierId}/verify`);
    setCarriers(prev => prev.map(c =>
      c.id === carrierId ? { ...c, verified: !c.verified } : c
    ));
  }

  async function removeCarrier(carrierId) {
    await api.delete(`/carriers/${carrierId}`);
    setCarriers(prev => prev.filter(c => c.id !== carrierId));
  }

  // ── Shipper mutations ─────────────────────────────────────────────────────────
  async function addShipper(data) {
    const { data: shipper } = await api.post('/shippers', { ...data, market });
    setShippers(prev => [...prev, shipper]);
  }

  async function removeShipper(shipperId) {
    await api.delete(`/shippers/${shipperId}`);
    setShippers(prev => prev.filter(s => s.id !== shipperId));
  }

  // ── Settings ──────────────────────────────────────────────────────────────────
  async function saveSettings(updates) {
    const { data } = await api.put('/settings', updates);
    const next = {
      companyName:    data.company_name,
      companyPhone:   data.company_phone,
      companyEmail:   data.company_email,
      commissionRate: data.commission_rate,
      currency:       data.currency,
      country:        data.country,
      market:         data.market,
    };
    setSettings(next);
    if (updates.market && updates.market !== market) {
      await fetchAll(updates.market);
    }
    notify('Settings Saved', 'Company settings updated', 'success');
  }

  // ── Computed stats ────────────────────────────────────────────────────────────
  const activeMkt = loads.filter(l => l.status !== 'Cancelled');
  const stats = {
    totalLoads:         activeMkt.length,
    activeLoads:        loads.filter(l => ['Booked','In Transit'].includes(l.status)).length,
    availableLoads:     loads.filter(l => l.status === 'Available').length,
    totalCarriers:      carriers.length,
    verifiedCarriers:   carriers.filter(c => c.verified).length,
    totalCommission:    activeMkt.reduce((s, l) => s + (l.commission || 0), 0),
    receivedCommission: loads.filter(l => l.commissionReceived).reduce((s, l) => s + (l.commission || 0), 0),
    pendingCommission:  loads.filter(l => !l.commissionReceived && l.status !== 'Cancelled')
                             .reduce((s, l) => s + (l.commission || 0), 0),
  };

  const rate = (settings.commissionRate || 8) / 100;

  return (
    <AppContext.Provider value={{
      loads, carriers, shippers, settings, stats, rate, market, loadingData,
      addLoad, assignCarrier, markPickedUp, markDelivered, cancelLoad,
      markCommissionReceived, addCarrier, toggleVerifyCarrier, removeCarrier,
      addShipper, removeShipper, saveSettings, fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
