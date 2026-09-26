import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  CheckCheck,
  Loader2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import {
  getOwnerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/restaurantService';

export default function NotificationsTab({ onSelectTab, onNotificationsUpdated }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOwnerNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      if (onNotificationsUpdated) onNotificationsUpdated();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (onNotificationsUpdated) onNotificationsUpdated();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Owner Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Realtime notifications when new orders are placed, payments submitted or status changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            disabled={markingAll}
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all self-start sm:self-auto active:scale-95 disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800">
          <Bell className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No notifications yet.</p>
          <p className="text-xs text-stone-500 mt-1">Notifications about orders and payments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                handleMarkAsRead(notif);
                if (notif.order_id && onSelectTab) {
                  onSelectTab('orders', notif.order_id);
                }
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                notif.is_read
                  ? 'bg-stone-900/50 border-stone-800/80 text-stone-400'
                  : 'bg-stone-900 border-brand-500/40 text-stone-200 shadow-md shadow-brand-950/20'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  notif.is_read
                    ? 'bg-stone-800 text-stone-500 border-stone-700'
                    : 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm truncate ${
                      notif.is_read ? 'font-medium text-stone-300' : 'font-bold text-white'
                    }`}
                  >
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(notif.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </span>
                </div>

                <p className="text-xs text-stone-400 mt-0.5">{notif.message}</p>
              </div>

              {!notif.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
