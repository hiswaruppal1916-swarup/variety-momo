import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  CheckCircle2,
  CheckCheck,
  ShoppingBag,
  ArrowRight,
  UtensilsCrossed,
  Bike,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CustomerNotificationModal() {
  const {
    isCustomerNotifOpen,
    closeCustomerNotif,
    customerNotifications,
    customerUnreadCount,
    markCustomerNotifRead,
    markAllCustomerNotifsRead,
    openOrderTracking
  } = useCart();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [markingAll, setMarkingAll] = useState(false);

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

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <div className="w-10 h-10 rounded-2xl bg-brand-600/30 border border-brand-500/40 text-brand-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
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

        {/* Filter Tabs & Mark All as Read */}
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

          {customerUnreadCount > 0 && (
            <button
              disabled={markingAll}
              onClick={handleMarkAll}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

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
                    ? 'bg-white hover:bg-stone-50 border-transparent text-stone-600'
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
                    <span className="text-[10px] text-stone-400 shrink-0 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(notif.created_at)}
                    </span>
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
      </div>
    </div>
  );
}
