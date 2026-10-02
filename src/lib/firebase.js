import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { supabase } from './supabase';

// Firebase Web Public Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDdTxJAq77F3At4WkSVsMQ2q67RcHKjKCM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "variety-momo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "variety-momo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "variety-momo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1017043259551",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1017043259551:web:9c59d7ae4c5630442e52aa",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-F1NW7HZMGF"
};

// VAPID Public Key for Web Push Registration (with reliable default)
export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  "BMjrgSc-1MpImjqYXRvfole6-B1RfcJVMVhtZvj8nkqwRbZYA7QFSds3GmHG_T2-i_ldyoFne1cCIXG6hEBOSwk";

// Initialize Firebase App safely (singleton pattern)
let app = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (err) {
  console.warn('[Firebase] Initialization error:', err);
}

// Check FCM browser compatibility
export async function checkFcmSupport() {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    return await isSupported();
  } catch (err) {
    console.warn('[FCM] isSupported check failed:', err);
    return false;
  }
}

// Request Notification Permission gracefully
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[FCM] Permission request failed:', err);
    return 'denied';
  }
}

// Register service worker and obtain FCM Token
export async function getFcmToken(customVapidKey = null) {
  const supported = await checkFcmSupport();
  if (!supported || !app) {
    console.warn('[FCM] Web Push messaging not supported in this browser environment.');
    return null;
  }

  const effectiveVapid = customVapidKey || VAPID_KEY;
  if (!effectiveVapid) {
    console.warn('[FCM] VAPID Key is not configured yet. Set VITE_FIREBASE_VAPID_KEY in .env');
    return null;
  }

  try {
    // 1. Ensure service worker registration is active
    let swRegistration = await navigator.serviceWorker.getRegistration('/');
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
    }

    if (!swRegistration.active) {
      swRegistration = await navigator.serviceWorker.ready;
    }

    // 2. Fetch FCM Token using active SW registration
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: effectiveVapid,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      console.log('[FCM] Registration token acquired successfully:', token.substring(0, 12) + '...');
      return token;
    } else {
      console.warn('[FCM] No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.warn('[FCM] Error retrieving registration token:', err.message);
    return null;
  }
}

// Listen to foreground FCM messages
export function onForegroundMessage(callback) {
  if (!app) return () => {};

  let unsubscribe = null;
  checkFcmSupport().then((supported) => {
    if (!supported) return;

    try {
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground notification received:', payload);
        if (callback) callback(payload);
      });
    } catch (err) {
      console.warn('[FCM] onMessage registration failed:', err);
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}

// Display a system-level device notification via Service Worker registration
export async function showDeviceNotification({ title, body, icon, badge, tag, data, url }) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const swReg = await navigator.serviceWorker.ready;
    if (swReg && swReg.showNotification) {
      const origin = window.location.origin;
      const notifTag = tag || (data?.order_number ? `order-${data.order_number}` : `momo-${Date.now()}`);

      await swReg.showNotification(title || 'Variety Momo', {
        body: body || '',
        icon: icon || `${origin}/pwa-192x192.png`,
        badge: badge || `${origin}/favicon-96x96.png`,
        tag: notifTag,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
          url: url || data?.click_action || data?.url || '/',
          click_action: url || data?.click_action || data?.url || '/',
          order_id: data?.order_id || '',
          order_number: data?.order_number || '',
          tracking_token: data?.tracking_token || ''
        }
      });
      return true;
    }
  } catch (err) {
    console.warn('[FCM] Failed to show foreground device notification via SW:', err);
  }
  return false;
}

// Global Foreground Push Listener (Ensures Android top bar notification even when app is open)
export function setupGlobalForegroundPushListener() {
  if (typeof window === 'undefined' || !app) return () => {};

  return onForegroundMessage(async (payload) => {
    console.log('[FCM-GLOBAL] Handling foreground push notification:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Variety Momo';
    const body = payload.notification?.body || payload.data?.body || 'Order status update';
    const clickUrl = payload.data?.click_action || payload.data?.url || payload.fcmOptions?.link || '/';
    const tag = payload.notification?.tag || payload.data?.tag || (payload.data?.order_number ? `order-${payload.data.order_number}` : `momo-${Date.now()}`);

    // 1. Show real system notification in Android top status bar
    await showDeviceNotification({
      title,
      body,
      tag,
      data: payload.data,
      url: clickUrl
    });

    // 2. Dispatch a CustomEvent for in-page UI components (OwnerDashboard, OrderTrackingModal)
    window.dispatchEvent(new CustomEvent('variety_momo_fcm_message', { detail: payload }));
  });
}

// Register subscription in Supabase database
export async function registerPushSubscriptionInDatabase({
  userType,
  orderNumber = null,
  trackingToken = null,
  fcmToken,
  platform = 'WEB'
}) {
  if (!fcmToken) return { success: false, error: 'No token' };

  try {
    if (userType === 'OWNER') {
      const { data, error } = await supabase.rpc('register_owner_push_subscription', {
        p_fcm_token: fcmToken,
        p_device_id: navigator.userAgent.substring(0, 80),
        p_platform: platform
      });
      if (error) throw error;
      return data;
    } else if (userType === 'CUSTOMER' && orderNumber && trackingToken) {
      const { data, error } = await supabase.rpc('register_customer_push_subscription', {
        p_order_number: orderNumber,
        p_tracking_token: trackingToken,
        p_fcm_token: fcmToken,
        p_device_id: navigator.userAgent.substring(0, 80),
        p_platform: platform
      });
      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.error('[FCM] Failed to store push subscription in database:', err);
    return { success: false, error: err.message };
  }
}

// Register all customer active orders with FCM token (Multi-Order support)
export async function registerCustomerOrdersPushInDatabase({
  trackingTokens = [],
  fcmToken,
  platform = 'WEB'
}) {
  if (!fcmToken || !trackingTokens || trackingTokens.length === 0) {
    return { success: false, error: 'Missing token or tracking tokens' };
  }

  try {
    const { data, error } = await supabase.rpc('register_customer_orders_push', {
      p_tracking_tokens: trackingTokens,
      p_fcm_token: fcmToken,
      p_device_id: navigator.userAgent.substring(0, 80),
      p_platform: platform
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[FCM] Failed to register customer orders push:', err);
    return { success: false, error: err.message };
  }
}

// Unregister / Deactivate subscription
export async function unregisterPushSubscription(fcmToken) {
  if (!fcmToken) return;
  try {
    await supabase.rpc('deactivate_push_subscription', {
      p_fcm_token: fcmToken
    });
  } catch (err) {
    console.error('[FCM] Failed to deactivate push subscription:', err);
  }
}

// Dispatch FCM Push Notification via secure Supabase Edge Function
export async function triggerPushNotification({
  title,
  body,
  recipientType, // 'OWNER' or 'CUSTOMER'
  eventType = null,
  orderId = null,
  orderNumber = null,
  specificToken = null, // Direct device targeting for diagnostics/tests
  url = '/'
}) {
  try {
    // Respect owner notification preferences if configured (unless direct test)
    if (recipientType === 'OWNER' && eventType && !specificToken && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('variety_momo_owner_notif_prefs');
        if (stored) {
          const prefs = JSON.parse(stored);
          const prefKey = eventType.toLowerCase();
          if (prefs[prefKey] === false) {
            console.log(`[FCM] Push skipped for ${eventType} due to owner preference setting.`);
            return { success: true, skipped: true, message: `Skipped by owner preference: ${eventType}` };
          }
        }
      } catch (e) {
        // fallback to normal dispatch
      }
    }

    let tokens = [];
    if (specificToken) {
      tokens = [specificToken];
    } else {
      // 1. Fetch active target tokens from database RPC
      const { data: tokensData, error: tokensError } = await supabase.rpc('get_push_tokens_for_event', {
        p_recipient_type: recipientType,
        p_order_id: orderId
      });

      if (tokensError) {
        console.error('[FCM] Error fetching push tokens:', tokensError);
        return { success: false, error: tokensError.message };
      }

      tokens = (tokensData || []).map((t) => t.fcm_token).filter(Boolean);
    }

    if (tokens.length === 0) {
      console.log(`[FCM] No active push subscriptions found for ${recipientType}`);
      return { success: true, sentCount: 0, total: 0, message: `No active subscriptions for ${recipientType}` };
    }

    // 2. Call secure Edge Function to dispatch FCM v1
    const edgeFunctionUrl = 'https://uosceogqhwkjcksmyrjc.supabase.co/functions/v1/send-fcm-notification';
    const anonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc2Nlb2dxaHdramNrc215cmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzU0MjAsImV4cCI6MjEwNDcxMTQyMH0.20vQCjfZjeHtzFacGEkaY3_F8IudfPADtzBr1fVsji8';

    const isTest = specificToken !== null || title.toLowerCase().includes('test');
    const eventKey = isTest
      ? `test_${Date.now()}`
      : (orderId ? `${orderId}:${recipientType}:${eventType || title}` : null);

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://variety-momo.firebaseapp.com';

    const res = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        title,
        body,
        tokens,
        url,
        data: {
          order_id: orderId || '',
          order_number: orderNumber || '',
          click_action: url,
          url,
          recipient_type: recipientType,
          event_key: eventKey || '',
          is_test: isTest,
          site_url: siteUrl
        }
      })
    });

    const result = await res.json();
    console.log('[FCM] Push dispatch result:', result);

    // 3. Auto-cleanup any tokens that were rejected as UNREGISTERED / 404
    if (result && Array.isArray(result.results)) {
      for (const r of result.results) {
        if (r.status === 404 || r.result?.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
          const matchPrefix = r.token.replace('...', '');
          const fullToken = tokens.find((t) => t.startsWith(matchPrefix));
          if (fullToken) {
            unregisterPushSubscription(fullToken).catch(() => {});
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.error('[FCM] Push notification trigger failed:', err);
    return { success: false, error: err.message };
  }
}

// Send Owner Test Notification (Safe test path for Owner verification)
export async function sendTestOwnerNotification(specificToken = null) {
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: true });
  return await triggerPushNotification({
    title: '🔔 Variety Momo',
    body: `FCM Test Notification: This is a test push notification delivered at ${timeStr}.`,
    recipientType: 'OWNER',
    specificToken,
    url: '/owner-dashboard'
  });
}
