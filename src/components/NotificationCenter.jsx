import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, XCircle, X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TYPE_META = {
  success: { icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-50',  dot: 'bg-emerald-500' },
  warning: { icon: AlertCircle,  color: 'text-amber-500',   bg: 'bg-amber-50',    dot: 'bg-amber-500'   },
  error:   { icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50',      dot: 'bg-red-500'     },
  info:    { icon: Info,          color: 'text-blue-500',    bg: 'bg-blue-50',     dot: 'bg-blue-500'    },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationCenter() {
  const { notifications, unread, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(s => !s)}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              {unread > 0 && (
                <p className="text-xs text-slate-400">{unread} unread</p>
              )}
            </div>
            <div className="flex gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <CheckCheck size={15} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Clear all"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(note => {
                const meta = TYPE_META[note.type] || TYPE_META.info;
                const Icon = meta.icon;
                return (
                  <div
                    key={note.id}
                    onClick={() => markRead(note.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      note.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                      <Icon size={15} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-900 truncate">{note.title}</div>
                        {!note.read && (
                          <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0 mt-1`} />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{note.body}</div>
                      <div className="text-xs text-slate-400 mt-1">{timeAgo(note.time)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
