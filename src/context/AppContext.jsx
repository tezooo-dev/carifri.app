import { createContext, useContext, useState } from 'react';
import { initialLoads, initialCarriers, initialShippers } from '../data/store';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loads, setLoads] = useState(initialLoads);
  const [carriers, setCarriers] = useState(initialCarriers);
  const [shippers, setShippers] = useState(initialShippers);

  function addLoad(load) {
    setLoads(prev => [load, ...prev]);
    setShippers(prev =>
      prev.map(s =>
        s.id === load.shipperId
          ? { ...s, totalLoads: s.totalLoads + 1, totalSpend: s.totalSpend + load.freightAmount }
          : s
      )
    );
  }

  function updateLoad(id, changes) {
    setLoads(prev => prev.map(l => (l.id === id ? { ...l, ...changes } : l)));
  }

  function assignCarrier(loadId, carrierId) {
    const now = new Date().toLocaleString('en-KE', { hour12: false }).replace(',', '');
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
            if (t.event === 'Picked Up') return { ...t, time: now, done: true };
            if (t.event === 'In Transit') return { ...t, time: now, done: true };
            return t;
          }),
        };
      })
    );
  }

  function markDelivered(loadId) {
    const now = new Date().toLocaleString('en-KE', { hour12: false }).replace(',', '');
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
  }

  function cancelLoad(loadId) {
    setLoads(prev => prev.map(l => (l.id === loadId ? { ...l, status: 'Cancelled' } : l)));
  }

  function markCommissionReceived(loadId) {
    setLoads(prev =>
      prev.map(l => (l.id === loadId ? { ...l, commissionReceived: true } : l))
    );
  }

  function addCarrier(carrier) {
    setCarriers(prev => [carrier, ...prev]);
  }

  const stats = {
    totalLoads: loads.length,
    activeLoads: loads.filter(l => ['Available', 'Booked', 'In Transit'].includes(l.status)).length,
    totalCommission: loads.reduce((sum, l) => sum + l.commission, 0),
    receivedCommission: loads.filter(l => l.commissionReceived).reduce((sum, l) => sum + l.commission, 0),
    pendingCommission: loads.filter(l => !l.commissionReceived && l.status !== 'Cancelled').reduce((sum, l) => sum + l.commission, 0),
  };

  return (
    <AppContext.Provider value={{
      loads, carriers, shippers, stats,
      addLoad, updateLoad, assignCarrier, markPickedUp, markDelivered, cancelLoad,
      markCommissionReceived, addCarrier,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
