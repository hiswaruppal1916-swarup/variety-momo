import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  CheckCircle2,
  CheckCheck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  Bike,
  CreditCard,
  AlertCircle,
  Trash2,
  Calendar,
  BellRing
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKolkataDateTime } from '../services/restaurantService';
import {
  requestNotificationPermission,
  getFcmToken,
  registerCustomerOrdersPushInDatabase
} from '../lib/firebase';

export default function CustomerNotificationModal() {
  const {
    isCustomerNotifOpen,
    closeCustomerNotif,
    customerNotifications,
    customerUnreadCount,
    markCustomerNotifRead,
    markAllCustomerNotifsRead,
    deleteCustomerNotif,
    deleteAllCustomerNotifs,
    openOrderTracking,
    customerTokens
  } = useCart();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [markingAll, setMarkingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushGranted, setPushGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setPushGranted(true);
        const token = await getFcmToken();
        if (token && customerTokens && customerTokens.length > 0) {
          await registerCustomerOrdersPushInDatabase({
            trackingTokens: customerTokens,
            fcmToken: token
          });
        }
      }
    } catch (e) {
      console.warn('[FCM] Enable push from modal failed:', e);
    } finally {
      setEnablingPush(false);
    }
  };

  if (!isCustomerNotifOpen) return null;

  const filteredNotifs = customerNotifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.is_read;
    return true;
  });

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read && notif.tracking_token) {
      await markCustomerNotifRead(notif.id, notif.tracking_token);
    }
    closeCustomerNotif();
    if (notif.order_number && notif.tracking_token) {
      openOrderTracking(notif.order_number, notif.tracking_token);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllCustomerNotifsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteOne = async (e, notif) => {
    e.stopPropagation();
    setDeletingId(notif.id);
    try {
      await deleteCustomerNotif(notif.id, notif.tracking_token);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmClearAll = async () => {
    setDeletingAll(true);
    try {
      await deleteAllCustomerNotifs();
      setShowClearConfirm(false);
    } finally {
      setDeletingAll(false);
    }
  };

  const getNotifIcon = (notif) => {
    if (notif.type === 'PAYMENT' || notif.title?.toLowerCase().includes('payment')) {
      return <CreditCard className="w-4 h-4 text-emerald-600" />;
    }
    if (notif.order_type === 'DINE_IN') {
      return <UtensilsCrossed className="w-4 h-4 text-brand-600" />;
    }
    return <Bike className="w-4 h-4 text-brand-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={closeCustomerNotif}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeCustomerNotif}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition-all border border-stone-700 active:scale-95 shrink-0"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="w-9 h-9 rounded-2xl bg-brand-600/30 border border-brand-500/40 text-brand-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-extrabold text-white text-base">
                  Notifications
                </h3>
                {customerUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                    {customerUnreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Live updates for your Variety Momo orders
              </p>
            </div>
          </div>

          <button
            onClick={closeCustomerNotif}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs, Mark Read, and Delete All */}
        <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All ({customerNotifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'UNREAD'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-brand-600'
              }`}
            >
              Unread ({customerUnreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {customerUnreadCount > 0 && (
              <button
                disabled={markingAll}
                onClick={handleMarkAll}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}

            {customerNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>

        {/* Push Enable Banner if not granted */}
        {!pushGranted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'denied' && (
          <div className="px-4 py-2.5 bg-amber-50/90 border-b border-amber-200/80 flex items-center justify-between gap-3 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-amber-950 text-xs">Get Live Phone Alerts</div>
                <div className="text-[10px] text-amber-800 leading-tight">Beep on phone when orders update</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={enablingPush}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1 disabled:opacity-50"
            >
              <span>{enablingPush ? 'Enabling...' : 'Enable'}</span>
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-stone-100/80">
          {filteredNotifs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-outfit font-bold text-stone-900 text-sm">
                  {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Updates on your orders and payments will appear right here in real-time.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 border ${
                  notif.is_read
                    ? 'bg-white hover:bg-stone-50 border-stone-100 text-stone-600'
                    : 'bg-brand-50/60 hover:bg-brand-50/90 border-brand-200/80 text-stone-900 shadow-xs'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    notif.is_read
                      ? 'bg-stone-100 text-stone-500 border-stone-200'
                      : 'bg-brand-100 text-brand-700 border-brand-200'
                  }`}
                >
                  {getNotifIcon(notif)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs truncate ${
                        notif.is_read ? 'font-semibold text-stone-800' : 'font-extrabold text-stone-950'
                      }`}
                    >
                      {notif.title}
                    </span>

                    <button
                      type="button"
                      disabled={deletingId === notif.id}
                      onClick={(e) => handleDeleteOne(e, notif)}
                      className="p-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 ml-1"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Date and Time in Asia/Kolkata (Requirement 3) */}
                  <div className="text-[10px] text-stone-500 font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-600 shrink-0" />
                    <span>{formatKolkataDateTime(notif.created_at)}</span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {notif.body}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      {notif.order_number && (
                        <span className="font-mono font-bold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-md">
                          #{notif.order_number}
                        </span>
                      )}
                      {notif.order_type && (
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          {notif.order_type === 'DINE_IN' ? 'Dine-In' : 'Delivery'}
                        </span>
                      )}
                    </div>

                    <span className="font-bold text-brand-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>View Order</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear All Confirmation Dialog */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 max-w-xs w-full space-y-3 shadow-2xl border border-stone-200 text-stone-900 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h4 className="font-outfit font-extrabold text-stone-900 text-base">
                  Delete All Notifications?
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  This will remove all notifications from your list. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={deletingAll}
                  onClick={handleConfirmClearAll}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {deletingAll ? 'Deleting...' : 'DELETE ALL'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
