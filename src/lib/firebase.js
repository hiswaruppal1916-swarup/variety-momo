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

// VAPID Public Key for Web Push Registration
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

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
    // Register or retrieve service worker registration
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: effectiveVapid,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      console.log('[FCM] Registration token acquired successfully.');
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

  checkFcmSupport().then((supported) => {
    if (!supported) return;

    try {
      const messaging = getMessaging(app);
      return onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground notification received:', payload);
        if (callback) callback(payload);
      });
    } catch (err) {
      console.warn('[FCM] onMessage registration failed:', err);
    }
  });

  return () => {};
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
        p_device_id: navigator.userAgent.substring(0, 50),
        p_platform: platform
      });
      if (error) throw error;
      return data;
    } else if (userType === 'CUSTOMER' && orderNumber && trackingToken) {
      const { data, error } = await supabase.rpc('register_customer_push_subscription', {
        p_order_number: orderNumber,
        p_tracking_token: trackingToken,
        p_fcm_token: fcmToken,
        p_device_id: navigator.userAgent.substring(0, 50),
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
  orderId = null,
  orderNumber = null,
  url = '/'
}) {
  try {
    // 1. Fetch active target tokens from database RPC
    const { data: tokensData, error: tokensError } = await supabase.rpc('get_push_tokens_for_event', {
      p_recipient_type: recipientType,
      p_order_id: orderId
    });

    if (tokensError) {
      console.error('[FCM] Error fetching push tokens:', tokensError);
      return;
    }

    const tokens = (tokensData || []).map((t) => t.fcm_token).filter(Boolean);
    if (tokens.length === 0) {
      console.log(`[FCM] No active push subscriptions found for ${recipientType}`);
      return;
    }

    // 2. Call secure Edge Function to dispatch FCM v1
    const edgeFunctionUrl = 'https://uosceogqhwkjcksmyrjc.supabase.co/functions/v1/send-fcm-notification';
    const res = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        tokens,
        url,
        data: {
          order_id: orderId || '',
          order_number: orderNumber || '',
          click_action: url
        }
      })
    });

    const result = await res.json();
    console.log('[FCM] Push dispatch result:', result);
    return result;
  } catch (err) {
    console.error('[FCM] Push notification trigger failed:', err);
  }
}
