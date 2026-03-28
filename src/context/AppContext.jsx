import { createContext, useContext } from 'react';
import { initialLoads, initialCarriers, initialShippers } from '../data/store';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from './ToastContext';
import { useNotifications } from './NotificationContext';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  companyName: 'FreightLink Brokerage',
  companyPhone: '+254 700 000 000',
  companyEmail: 'ops@freightlink.co.ke',
  commissionRate: 8,   // percent
  currency: 'KES',
  country: 'Kenya',
};

export function AppProvider({ children }) {
  const toast = useToast();
  const { push: notify } = useNotifications();
  const [loads,    setLoads]    = useLocalStorage('fl_loads',    initialLoads);
  const [carriers, setCarriers] = useLocalStorage('fl_carriers', initialCarriers);
  const [shippers, setShippers] = useLocalStorage('fl_shippers', initialShippers);
  const [settings, setSettings] = useLocalStorage('fl_settings', DEFAULT_SETTINGS);

  const rate = (settings.commissionRate ?? 8) / 100;

  function addLoad(load) {
    setLoads(prev => [load, ...prev]);
    setShippers(prev =>
      prev.map(s =>
        s.id === load.shipperId
          ? { ...s, totalLoads: s.totalLoads + 1, totalSpend: s.totalSpend + load.freightAmount }
          : s
      )
    );
    toast(`Load ${load.id} posted — ${load.origin} → ${load.destination}`, 'success');
    notify('New Load Posted', `${load.id}: ${load.origin} → ${load.destination} | ${load.commodity}`, 'success');
  }

  function updateLoad(id, changes) {
    setLoads(prev => prev.map(l => (l.id === id ? { ...l, ...changes } : l)));
  }

  function assignCarrier(loadId, carrierId) {
    const now = new Date().toLocaleString('en-KE', { hour12: false }).replace(',', '');
    const carrier = carriers.find(c => c.id === carrierId);
    setLoads(prev =>
      prev.map(l => {
        if (l.id !== loadId) return l;
        return {
          ...l,
          carrierId,
          status: 'Booked',
          timeline: l.timeline.map(t =>
            t.event === 'Carrier Assigned' ? { ...t, time: now, done: true } : t
          ),
        };
      })
    );
    setCarriers(prev =>
      prev.map(c => (c.id === carrierId ? { ...c, totalLoads: c.totalLoads + 1 } : c))
    );
    toast(`${carrier?.name ?? 'Carrier'} assigned to ${loadId}`, 'success');
    notify('Carrier Assigned', `${carrier?.name ?? 'Carrier'} assigned to load ${loadId}`, 'success');
  }

  function markPickedUp(loadId) {
    const now = new Date().toLocaleString('en-KE', { hour12: false }).replace(',', '');
    setLoads(prev =>
      prev.map(l => {
        if (l.id !== loadId) return l;
        return {
          ...l,
          status: 'In Transit',
          timeline: l.timeline.map(t => {
            if (t.event === 'Picked Up')  return { ...t, time: now, done: true };
            if (t.event === 'In Transit') return { ...t, time: now, done: true };
            return t;
          }),
        };
      })
    );
    toast(`${loadId} picked up — now In Transit`, 'success');
    notify('Shipment Picked Up', `Load ${loadId} is now In Transit`, 'info');
  }

  function markDelivered(loadId) {
    const now = new Date().toLocaleString('en-KE', { hour12: false }).replace(',', '');
    const load = loads.find(l => l.id === loadId);
    setLoads(prev =>
      prev.map(l => {
        if (l.id !== loadId) return l;
        return {
          ...l,
          status: 'Delivered',
          timeline: l.timeline.map(t =>
            t.event === 'Delivered' ? { ...t, time: now, done: true } : t
          ),
        };
      })
    );
    const commStr = `${settings.currency} ${load?.commission?.toLocaleString() ?? ''}`;
    toast(`${loadId} delivered — ${commStr} commission pending`, 'success');
    notify('Load Delivered ✓', `${loadId} delivered. Commission ${commStr} is now pending collection.`, 'success');
  }

  function cancelLoad(loadId) {
    setLoads(prev => prev.map(l => (l.id === loadId ? { ...l, status: 'Cancelled' } : l)));
    toast(`Load ${loadId} cancelled`, 'error');
    notify('Load Cancelled', `Load ${loadId} has been cancelled`, 'error');
  }

  function markCommissionReceived(loadId) {
    const load = loads.find(l => l.id === loadId);
    setLoads(prev =>
      prev.map(l => (l.id === loadId ? { ...l, commissionReceived: true } : l))
    );
    const commAmt = `${settings.currency} ${load?.commission?.toLocaleString() ?? ''}`;
    toast(`Commission ${commAmt} received for ${loadId}`, 'success');
    notify('Commission Received 💰', `${commAmt} commission collected for load ${loadId}`, 'success');
  }

  function addCarrier(carrier) {
    setCarriers(prev => [carrier, ...prev]);
    toast(`${carrier.name} added to your network`, 'success');
  }

  function updateCarrierVerification(carrierId, verified) {
    setCarriers(prev =>
      prev.map(c => (c.id === carrierId ? { ...c, verified } : c))
    );
    toast(verified ? 'Carrier verified' : 'Verification removed', 'info');
  }

  function updateSettings(changes) {
    setSettings(prev => ({ ...prev, ...changes }));
    toast('Settings saved', 'success');
  }

  function resetData() {
    setLoads(initialLoads);
    setCarriers(initialCarriers);
    setShippers(initialShippers);
    toast('Demo data restored', 'info');
  }

  const stats = {
    totalLoads: loads.length,
    activeLoads: loads.filter(l => ['Available', 'Booked', 'In Transit'].includes(l.status)).length,
    totalCommission: loads.filter(l => l.status !== 'Cancelled').reduce((sum, l) => sum + l.commission, 0),
    receivedCommission: loads.filter(l => l.commissionReceived).reduce((sum, l) => sum + l.commission, 0),
    pendingCommission: loads
      .filter(l => !l.commissionReceived && l.status !== 'Cancelled')
      .reduce((sum, l) => sum + l.commission, 0),
    totalFreight: loads.filter(l => l.status !== 'Cancelled').reduce((sum, l) => sum + l.freightAmount, 0),
  };

  return (
    <AppContext.Provider value={{
      loads, carriers, shippers, stats, settings, rate,
      addLoad, updateLoad, assignCarrier, markPickedUp, markDelivered,
      cancelLoad, markCommissionReceived, addCarrier, updateCarrierVerification,
      updateSettings, resetData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
