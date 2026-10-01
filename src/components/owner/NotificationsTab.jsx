import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  CheckCheck,
  Loader2,
  Trash2,
  ShoppingBag,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  getOwnerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteOwnerNotification,
  deleteAllOwnerNotifications,
  formatKolkataDateTime
} from '../../services/restaurantService';

export default function NotificationsTab({ onSelectTab, onNotificationsUpdated }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOwnerNotifications();
      setNotifications(data || []);
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

  const handleDeleteNotification = async (notificationId) => {
    setDeletingId(notificationId);
    try {
      await deleteOwnerNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (onNotificationsUpdated) onNotificationsUpdated();
    } catch (err) {
      console.error('Failed to delete notification:', err);
      // Remove optimistically from state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (onNotificationsUpdated) onNotificationsUpdated();
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deleteAllOwnerNotifications();
      setNotifications([]);
      setShowClearAllConfirm(false);
      if (onNotificationsUpdated) onNotificationsUpdated();
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
      setNotifications([]);
      setShowClearAllConfirm(false);
      if (onNotificationsUpdated) onNotificationsUpdated();
    } finally {
      setDeletingAll(false);
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
            <span className="text-xs text-stone-500">
              ({notifications.length} total)
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Realtime notifications when new orders are placed, payments submitted or status changes.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              disabled={markingAll}
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all active:scale-95 disabled:opacity-50"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              disabled={deletingAll}
              onClick={() => setShowClearAllConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 text-xs font-semibold border border-rose-800/60 transition-all active:scale-95 disabled:opacity-50"
              title="Delete all notifications"
            >
              {deletingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Delete All</span>
            </button>
          )}
        </div>
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
          {notifications.map((notif) => {
            const formattedDateTime = formatKolkataDateTime(notif.created_at);
            return (
              <div
                key={notif.id}
                onClick={() => {
                  handleMarkAsRead(notif);
                  if (notif.order_id && onSelectTab) {
                    onSelectTab('orders', notif.order_id);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group relative ${
                  notif.is_read
                    ? 'bg-stone-900/50 border-stone-800/80 text-stone-400 hover:border-stone-700'
                    : 'bg-stone-900 border-brand-500/40 text-stone-200 shadow-md shadow-brand-950/20 hover:border-brand-500/70'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    notif.is_read
                      ? 'bg-stone-800 text-stone-500 border-stone-700'
                      : 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm truncate ${
                        notif.is_read ? 'font-medium text-stone-300' : 'font-bold text-white'
                      }`}
                    >
                      {notif.title}
                    </h3>

                    {/* Date & Time badge in Asia/Kolkata (Requirement 3) */}
                    <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-brand-300 font-medium">
                      <Calendar className="w-3 h-3 text-amber-500/80" />
                      <span>{formattedDateTime}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    {notif.message || notif.body}
                  </p>

                  {/* Click to open details hint if order attached */}
                  {notif.order_id && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-brand-400 font-semibold">
                      <span>Click to view order</span>
                      <span>→</span>
                    </div>
                  )}
                </div>

                {/* Unread indicator */}
                {!notif.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0 self-center" />
                )}

                {/* Single Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notif.id);
                  }}
                  disabled={deletingId === notif.id}
                  className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all shrink-0 active:scale-90"
                  title="Delete this notification"
                  aria-label="Delete this notification"
                >
                  {deletingId === notif.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-outfit font-black text-lg">Clear Notifications?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to delete all <strong className="text-white">{notifications.length} notifications</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={deletingAll}
                onClick={handleConfirmDeleteAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>DELETE ALL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
