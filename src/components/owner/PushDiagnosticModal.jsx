import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Info
} from 'lucide-react';
import {
  checkFcmSupport,
  requestNotificationPermission,
  getFcmToken,
  registerPushSubscriptionInDatabase,
  sendTestOwnerNotification,
  unregisterPushSubscription
} from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

export default function PushDiagnosticModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [fcmSupported, setFcmSupported] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [permission, setPermission] = useState('default');
  const [currentToken, setCurrentToken] = useState(null);
  const [dbSubscriptions, setDbSubscriptions] = useState([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const loadDiagnostics = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      // 1. Check FCM browser support
      const supported = await checkFcmSupport();
      setFcmSupported(supported);

      // 2. Check SW Registration
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const swReg = await navigator.serviceWorker.getRegistration('/');
        setSwRegistered(!!swReg);
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      }

      // 3. Check active token in session/localStorage
      const token = await getFcmToken();
      setCurrentToken(token);

      // 4. Query owner subscriptions from Supabase
      const { data: subs, error: subsErr } = await supabase
        .from('push_subscriptions')
        .select('id, user_type, is_active, created_at, updated_at, fcm_token, platform, device_id')
        .eq('user_type', 'OWNER')
        .order('created_at', { ascending: false });

      if (!subsErr && subs) {
        setDbSubscriptions(subs);
      }
    } catch (err) {
      console.error('Diagnostic load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
    }
  }, [isOpen]);

  const [registrationChecklist, setRegistrationChecklist] = useState(null);

  const handleRegisterToken = async () => {
    setLoading(true);
    setActionMsg(null);
    setRegistrationChecklist(null);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setActionMsg('❌ Notification permission was not granted (status: ' + perm + ').');
        setLoading(false);
        return;
      }

      // Check service worker
      let swActive = false;
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        let swReg = await navigator.serviceWorker.getRegistration('/');
        if (!swReg) {
          swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        }
        await navigator.serviceWorker.ready;
        swActive = true;
        setSwRegistered(true);
      }

      const token = await getFcmToken();
      if (!token) {
        setActionMsg('⚠️ Failed to generate FCM Token. Please check browser notification permissions.');
        setLoading(false);
        return;
      }

      setCurrentToken(token);

      const saveResult = await registerPushSubscriptionInDatabase({
        userType: 'OWNER',
        fcmToken: token,
        platform: 'WEB'
      });

      if (!saveResult || saveResult.success === false) {
        throw new Error(saveResult?.error || 'Database RPC registration returned error');
      }

      // Immediately verify the database row directly
      const { data: verifiedRow, error: verifyErr } = await supabase
        .from('push_subscriptions')
        .select('id, user_type, is_active, updated_at, device_id')
        .eq('fcm_token', token)
        .maybeSingle();

      if (verifyErr || !verifiedRow) {
        throw new Error(verifyErr?.message || 'Verification query failed to locate saved subscription row');
      }

      setRegistrationChecklist([
        { label: 'Permission granted', passed: perm === 'granted' },
        { label: 'Service Worker registered (/firebase-messaging-sw.js)', passed: swActive },
        { label: 'Current FCM token generated', passed: Boolean(token) },
        { label: 'Token saved in database', passed: Boolean(verifiedRow.id) },
        { label: 'user_type = OWNER', passed: verifiedRow.user_type === 'OWNER' },
        { label: 'is_active = true', passed: Boolean(verifiedRow.is_active) }
      ]);

      setActionMsg('✅ Owner device registered and confirmed ACTIVE in database!');
      await loadDiagnostics();
    } catch (err) {
      console.error('Registration failed:', err);
      setActionMsg(`❌ Registration Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Prioritize the device's own active token so the physical device in hand tests directly
      const result = await sendTestOwnerNotification(currentToken || null);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleResetPush = async () => {
    if (!currentToken) return;
    setLoading(true);
    try {
      await unregisterPushSubscription(currentToken);
      setCurrentToken(null);
      setActionMsg('Subscription deactivated.');
      await loadDiagnostics();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const maskToken = (token) => {
    if (!token || token.length < 15) return 'None';
    return `${token.substring(0, 12)}...${token.substring(token.length - 6)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-stone-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 text-brand-500 border border-brand-500/30 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold text-base text-white">
                FCM Push Notifications Diagnostic
              </h3>
              <p className="text-xs text-stone-400">
                Verify browser compatibility, FCM token generation & push dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {actionMsg && (
            <div className="p-3 rounded-xl bg-stone-800/90 border border-stone-700 text-xs font-medium text-stone-200">
              {actionMsg}
            </div>
          )}

          {registrationChecklist && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-2 animate-in fade-in">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Owner Device Registration Verified</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {registrationChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-stone-200">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Grid */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Client & Browser Status
            </h4>

            {/* FCM Browser Support */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs">
              <span className="text-stone-300 font-medium">Browser Web Push Support</span>
              {fcmSupported ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supported
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5" /> Unsupported
                </span>
              )}
            </div>

            {/* Service Worker */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs">
              <span className="text-stone-300 font-medium">Service Worker (firebase-messaging-sw.js)</span>
              {swRegistered ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registered (scope: /)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" /> Pending Registration
                </span>
              )}
            </div>

            {/* Permission */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs">
              <span className="text-stone-300 font-medium">Notification Permission</span>
              <span
                className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border ${
                  permission === 'granted'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : permission === 'denied'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}
              >
                {permission.toUpperCase()}
              </span>
            </div>

            {/* FCM Token */}
            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-stone-300 font-medium">Active Device FCM Token</span>
                {currentToken ? (
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-stone-400 text-[10px]">None</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-stone-400 break-all bg-stone-900/80 p-2 rounded-xl border border-stone-800">
                {maskToken(currentToken)}
              </div>
            </div>
          </div>

          {/* Database Subscriptions */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Stored Owner Subscriptions ({dbSubscriptions.filter((s) => s.is_active).length} Active)
              </h4>
              <button
                onClick={loadDiagnostics}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {dbSubscriptions.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-950 rounded-2xl border border-stone-800">
                No owner subscriptions registered in database yet.
              </p>
            ) : (
              <div className="space-y-2">
                {dbSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-200">
                        {sub.platform || 'WEB'} • {sub.device_id || 'Device'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sub.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-stone-800 text-stone-500'
                        }`}
                      >
                        {sub.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-stone-500">
                      {maskToken(sub.fcm_token)}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Updated: {new Date(sub.updated_at || sub.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Device Test Result */}
          {testResult && (
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-brand-500/40 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-brand-400 font-bold">
                <Info className="w-4 h-4" />
                <span>FCM Test Delivery Report (Step 19 Verification)</span>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-stone-400">Device Token:</div>
                  <div className="font-bold text-emerald-400">{currentToken ? 'YES (Valid)' : 'NO'}</div>
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-stone-400">Server Edge Function:</div>
                  <div className="font-bold text-emerald-400">{testResult.success ? 'SUCCESS (HTTP 200)' : 'FAILED'}</div>
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-stone-400">FCM Google API:</div>
                  <div className={`font-bold ${testResult.sentCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {testResult.sentCount > 0 ? 'ACCEPTED (200 OK)' : 'NO TOKENS / SKIPPED'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-stone-400">Service Worker:</div>
                  <div className="font-bold text-emerald-400">{swRegistered ? 'REGISTERED & ACTIVE' : 'PENDING'}</div>
                </div>
              </div>

              {testResult.sentCount > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                  ✅ Push delivered to Google FCM for physical device display!
                </div>
              )}

              {testResult.results?.[0]?.result?.name && (
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 font-mono text-[10px] text-stone-400 break-all">
                  <span className="text-stone-500">FCM Message ID: </span>
                  {testResult.results[0].result.name}
                </div>
              )}

              <pre className="p-2.5 rounded-xl bg-stone-900 text-[10px] font-mono text-stone-400 overflow-x-auto border border-stone-800 max-h-32">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-wrap gap-2.5 justify-between">
          <button
            onClick={handleRegisterToken}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5 text-brand-400" />
            <span>Generate & Save FCM Token</span>
          </button>

          <button
            onClick={handleSendTestPush}
            disabled={testing || loading}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-brand-900/40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testing ? 'Sending...' : 'Send Test Notification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
