import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Bell,
  BellRing,
  LogOut,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { getOwnerSession, logoutOwner } from '../services/authService';
import {
  getOwnerDashboardStats,
  getPaymentVerificationQueue,
  getOwnerNotifications,
  subscribeToOwnerEvents
} from '../services/restaurantService';
import {
  checkFcmSupport,
  requestNotificationPermission,
  getFcmToken,
  registerPushSubscriptionInDatabase,
  unregisterPushSubscription
} from '../lib/firebase';

import OwnerSidebar from '../components/owner/OwnerSidebar';
import OverviewTab from '../components/owner/OverviewTab';
import OrdersTab from '../components/owner/OrdersTab';
import PaymentsTab from '../components/owner/PaymentsTab';
import MenuTab from '../components/owner/MenuTab';
import CategoriesTab from '../components/owner/CategoriesTab';
import DeliveryZonesTab from '../components/owner/DeliveryZonesTab';
import TablesTab from '../components/owner/TablesTab';
import SettingsTab from '../components/owner/SettingsTab';
import OffersTab from '../components/owner/OffersTab';
import GalleryTab from '../components/owner/GalleryTab';
import ReviewsTab from '../components/owner/ReviewsTab';
import NotificationsTab from '../components/owner/NotificationsTab';
import PushDiagnosticModal from '../components/owner/PushDiagnosticModal';

export default function OwnerDashboard({ onNavigate, initialOrderId = null }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(initialOrderId ? 'orders' : 'overview');
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [ordersScope, setOrdersScope] = useState('TODAY');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [previousTab, setPreviousTab] = useState('overview');

  const handleOpenMobileMenu = () => {
    window.history.pushState({ varietyOwnerModal: 'drawer' }, '');
    setIsMobileMenuOpen(true);
  };

  const handleSetMobileOpen = (openState) => {
    if (!openState) {
      if (window.history.state?.varietyOwnerModal === 'drawer') {
        window.history.back();
      } else {
        setIsMobileMenuOpen(false);
      }
    } else {
      handleOpenMobileMenu();
    }
  };

  const handleBackFromNotifications = () => {
    if (window.history.state?.varietyOwnerTab === 'notifications') {
      window.history.back();
    } else {
      setActiveTab(previousTab || 'overview');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        return;
      }
      if (activeTab === 'notifications') {
        setActiveTab(previousTab || 'overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobileMenuOpen, activeTab, previousTab]);

  const handleSelectTab = (tab, orderId = null, scope = 'TODAY') => {
    if (tab === 'notifications' && activeTab !== 'notifications') {
      setPreviousTab(activeTab);
      window.history.pushState({ varietyOwnerTab: 'notifications', prev: activeTab }, '');
    }
    setActiveTab(tab);
    if (orderId) {
      setSelectedOrderId(orderId);
    }
    if (tab === 'orders') {
      setOrdersScope(scope);
    }
  };

  // Live Stats & Realtime
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // FCM Push Notifications State
  const [fcmSupported, setFcmSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [pushEnabling, setPushEnabling] = useState(false);
  const [ownerFcmToken, setOwnerFcmToken] = useState(null);
  const [showPushDiagnostic, setShowPushDiagnostic] = useState(false);

  // In-app Realtime Toast Banner (no aggressive browser alerts)
  const [toastAlert, setToastAlert] = useState(null);

  // 1. Authenticate Owner
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const session = await getOwnerSession();
        if (!isMounted) return;

        if (!session || !session.profile || session.profile.role !== 'OWNER') {
          // Strictly redirect non-owner away
          if (onNavigate) {
            onNavigate('owner-login', true);
          } else {
            window.location.pathname = '/owner-login';
          }
          return;
        }

        setOwnerProfile(session.profile);
      } catch (err) {
        console.error('Owner auth verification error:', err);
        if (onNavigate) {
          onNavigate('owner-login', true);
        } else {
          window.location.pathname = '/owner-login';
        }
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [onNavigate]);

  // 2. Fetch Live Stats & Verification Counts
  const loadDashboardData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [s, queue, notifs] = await Promise.all([
        getOwnerDashboardStats(),
        getPaymentVerificationQueue(),
        getOwnerNotifications()
      ]);
      setStats(s);
      setPendingVerifications(queue.length);
      setUnreadNotifications(notifs.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ownerProfile) {
      loadDashboardData();
    }
  }, [ownerProfile, loadDashboardData]);

  // 3. Realtime Subscription to Orders, Payments & Notifications
  useEffect(() => {
    if (!ownerProfile) return;

    const cleanupSubscription = subscribeToOwnerEvents({
      onNewOrder: (order) => {
        loadDashboardData();
        showToast(`New Order Received! #${order.order_number} (${order.order_type})`);
      },
      onOrderUpdate: () => {
        loadDashboardData();
      },
      onPaymentSubmitted: () => {
        loadDashboardData();
        showToast('New PhonePe payment submitted! Verification required.');
      },
      onNotification: (notif) => {
        loadDashboardData();
        showToast(notif.title || 'New order alert');
      }
    });

    return () => {
      cleanupSubscription();
    };
  }, [ownerProfile, loadDashboardData]);

  // 4. FCM Push Notifications Lifecycle & Foreground Listener
  useEffect(() => {
    if (!ownerProfile) return;

    let mounted = true;
    checkFcmSupport().then((supported) => {
      if (!mounted) return;
      setFcmSupported(supported);
      if (supported && typeof window !== 'undefined' && 'Notification' in window) {
        setPushPermission(Notification.permission);
        if (Notification.permission === 'granted') {
          getFcmToken().then(async (token) => {
            if (!mounted) return;
            if (token) {
              setOwnerFcmToken(token);
              const lastStoredToken = localStorage.getItem('variety_momo_owner_fcm_token');
              const isRotated = Boolean(lastStoredToken && lastStoredToken !== token);
              await registerPushSubscriptionInDatabase({
                userType: 'OWNER',
                fcmToken: token,
                oldFcmToken: isRotated ? lastStoredToken : null
              });
              localStorage.setItem('variety_momo_owner_fcm_token', token);
            }
          });
        }
      }
    });

    const handleFcmMessage = (e) => {
      const payload = e.detail;
      const title = payload?.notification?.title || payload?.data?.title || 'Variety Momo Alert';
      const body = payload?.notification?.body || payload?.data?.body || '';
      showToast(`${title}: ${body}`);
      loadDashboardData();
    };
    window.addEventListener('variety_momo_fcm_message', handleFcmMessage);

    return () => {
      mounted = false;
      window.removeEventListener('variety_momo_fcm_message', handleFcmMessage);
    };
  }, [ownerProfile, loadDashboardData]);

  const handleEnablePush = async () => {
    setPushEnabling(true);
    try {
      const perm = await requestNotificationPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        const token = await getFcmToken();
        if (token) {
          setOwnerFcmToken(token);
          const lastStoredToken = localStorage.getItem('variety_momo_owner_fcm_token');
          const isRotated = Boolean(lastStoredToken && lastStoredToken !== token);
          await registerPushSubscriptionInDatabase({
            userType: 'OWNER',
            fcmToken: token,
            oldFcmToken: isRotated ? lastStoredToken : null
          });
          localStorage.setItem('variety_momo_owner_fcm_token', token);
          showToast('Push alerts enabled for this device!');
        } else {
          showToast('Notification permission granted.');
        }
      } else if (perm === 'denied') {
        showToast('Push notifications blocked in browser settings.');
      }
    } catch (err) {
      console.error('Error enabling push:', err);
    } finally {
      setPushEnabling(false);
    }
  };

  const showToast = (message) => {
    setToastAlert(message);
    setTimeout(() => {
      setToastAlert(null);
    }, 5000);
  };

  const handleLogout = async () => {
    try {
      if (ownerFcmToken) {
        await unregisterPushSubscription(ownerFcmToken);
      }
      await logoutOwner();
      if (onNavigate) {
        onNavigate('owner-login');
      } else {
        window.location.pathname = '/owner-login';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleNavigateHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.pathname = '/';
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-stone-400 font-medium">Verifying owner credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <OwnerSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
        onNavigateHome={handleNavigateHome}
        stats={stats}
        unreadCount={unreadNotifications}
        pendingVerifications={pendingVerifications}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={handleSetMobileOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenMobileMenu}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-brand-400" />
            </button>

            <div className="flex items-center gap-2.5">
              <img
                src="/variety-momo-logo.jpg"
                alt="Variety Momo"
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-brand-500/40"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-outfit font-extrabold text-base sm:text-lg text-white tracking-tight">
                    Variety Momo
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/15 text-brand-400 border border-brand-500/30">
                    <ShieldCheck className="w-3 h-3 text-brand-400" />
                    <span>OWNER</span>
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 hidden sm:block">
                  {ownerProfile?.email}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell (Requirement 32) */}
            <button
              onClick={() => handleSelectTab('notifications')}
              className="relative p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Quick Public Storefront Back Button */}
            <button
              onClick={handleNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-bold border border-stone-800 transition-colors shadow-xs active:scale-95"
              title="Back to Customer Storefront"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
              <span>Back to Store</span>
            </button>
          </div>
        </header>

        {/* Realtime Toast Notification Banner */}
        {toastAlert && (
          <div className="m-4 p-3.5 rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-950/40 flex items-center justify-between gap-3 animate-fade-in border border-brand-400/40">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>{toastAlert}</span>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5 rounded-md bg-black/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Content Display */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              loading={statsLoading}
              onRefresh={loadDashboardData}
              onSelectTab={handleSelectTab}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              onSelectTab={handleSelectTab}
              initialOrderId={selectedOrderId}
              initialScope={ordersScope}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab onVerificationChanged={loadDashboardData} />
          )}

          {activeTab === 'menu' && (
            <MenuTab />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab />
          )}

          {activeTab === 'delivery-zones' && (
            <DeliveryZonesTab />
          )}

          {activeTab === 'tables' && (
            <TablesTab />
          )}

          {activeTab === 'settings' && (
            <SettingsTab onOpenPushDiagnostic={() => setShowPushDiagnostic(true)} />
          )}

          {activeTab === 'offers' && (
            <OffersTab />
          )}

          {activeTab === 'gallery' && (
            <GalleryTab />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTab />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              onSelectTab={handleSelectTab}
              onNotificationsUpdated={loadDashboardData}
              onBack={handleBackFromNotifications}
            />
          )}
        </main>
      </div>

      {/* FCM Push Notification Diagnostic & Test Modal */}
      <PushDiagnosticModal
        isOpen={showPushDiagnostic}
        onClose={() => setShowPushDiagnostic(false)}
      />
    </div>
  );
}
