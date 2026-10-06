import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  IndianRupee,
  Truck,
  UtensilsCrossed,
  Phone,
  QrCode,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  Bell,
  BellRing,
  Send,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import {
  getRestaurantSettings,
  updateRestaurantSettings,
  uploadStorageAsset
} from '../../services/restaurantService';
import {
  checkFcmSupport,
  requestNotificationPermission,
  getFcmToken,
  registerPushSubscriptionInDatabase,
  sendTestOwnerNotification
} from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

export default function SettingsTab({ onOpenPushDiagnostic }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Current Device FCM Registration State (Requirements 2, 3, 6)
  const [deviceInfo, setDeviceInfo] = useState({
    supported: false,
    permission: 'default',
    swActive: false,
    currentToken: null,
    dbSub: null,
    loading: true
  });
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [regChecklist, setRegChecklist] = useState(null);
  const [regMessage, setRegMessage] = useState(null);

  // Notification Preferences (Requirement 19)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('variety_momo_owner_notif_prefs');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      new_order: true,
      payment_submitted: true,
      customer_cancellation: true,
      order_status_events: true,
      payment_verified: true
    };
  });
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const togglePref = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('variety_momo_owner_notif_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const loadCurrentDeviceStatus = useCallback(async () => {
    setDeviceInfo((prev) => ({ ...prev, loading: true }));
    try {
      const supported = await checkFcmSupport();
      let swActive = false;
      let perm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';

      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const swReg = await navigator.serviceWorker.getRegistration('/');
        swActive = Boolean(swReg);
      }

      let token = null;
      let dbSub = null;
      if (supported && perm === 'granted') {
        token = await getFcmToken();
        if (token) {
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id, user_type, is_active, updated_at')
            .eq('fcm_token', token)
            .maybeSingle();
          dbSub = data;
        }
      }

      setDeviceInfo({
        supported,
        permission: perm,
        swActive,
        currentToken: token,
        dbSub,
        loading: false
      });
    } catch (err) {
      console.warn('Error loading device push status:', err);
      setDeviceInfo((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadCurrentDeviceStatus();
  }, [loadCurrentDeviceStatus]);

  const handleRegisterCurrentDevice = async () => {
    setRegisteringDevice(true);
    setRegMessage(null);
    setRegChecklist(null);
    try {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        setRegMessage('❌ Notification permission denied in browser.');
        await loadCurrentDeviceStatus();
        return;
      }

      // Ensure SW is registered
      let swActive = false;
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        let swReg = await navigator.serviceWorker.getRegistration('/');
        if (!swReg) {
          swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        }
        await navigator.serviceWorker.ready;
        swActive = true;
      }

      const token = await getFcmToken();
      if (!token) {
        setRegMessage('⚠️ Could not generate FCM token for this device. Check browser console.');
        await loadCurrentDeviceStatus();
        return;
      }

      const lastStoredToken = localStorage.getItem('variety_momo_owner_fcm_token');
      const isRotated = Boolean(lastStoredToken && lastStoredToken !== token);
      const saveRes = await registerPushSubscriptionInDatabase({
        userType: 'OWNER',
        fcmToken: token,
        oldFcmToken: isRotated ? lastStoredToken : null,
        platform: 'WEB'
      });
      localStorage.setItem('variety_momo_owner_fcm_token', token);

      if (!saveRes || saveRes.success === false) {
        throw new Error(saveRes?.error || 'Database save failed');
      }

      // Verify row in database immediately
      const { data: verifiedRow, error: verifyErr } = await supabase
        .from('push_subscriptions')
        .select('id, user_type, is_active, updated_at')
        .eq('fcm_token', token)
        .maybeSingle();

      if (verifyErr || !verifiedRow) {
        throw new Error('Database verification query could not locate saved token.');
      }

      setRegChecklist([
        { label: 'Permission granted', passed: perm === 'granted' },
        { label: 'Service Worker registered', passed: swActive },
        { label: 'Current FCM token generated', passed: Boolean(token) },
        { label: 'Token saved in database', passed: Boolean(verifiedRow.id) },
        { label: 'user_type = OWNER', passed: verifiedRow.user_type === 'OWNER' },
        { label: 'is_active = true', passed: Boolean(verifiedRow.is_active) }
      ]);

      setRegMessage('✅ This device is now registered and ACTIVE for owner push notifications!');
      await loadCurrentDeviceStatus();
    } catch (err) {
      console.error('Owner device registration failed:', err);
      setRegMessage(`❌ Registration failed: ${err.message}`);
    } finally {
      setRegisteringDevice(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      // Send directly to current device token if available, verifying end-to-end
      const res = await sendTestOwnerNotification(deviceInfo.currentToken || null);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestSending(false);
    }
  };

  // Form Fields
  const [restaurantName, setRestaurantName] = useState('');
  const [phone, setPhone] = useState('7827423777');
  const [whatsappNumber, setWhatsappNumber] = useState('7827423777');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mecheda');
  const [deliveryCharge, setDeliveryCharge] = useState('50');
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(true);
  const [dineInEnabled, setDineInEnabled] = useState(true);
  const [advancePercentage, setAdvancePercentage] = useState('30');
  const [codPercentage, setCodPercentage] = useState('70');
  const [phonepeUpiId, setPhonepeUpiId] = useState('7827423777@ybl');
  const [phonepeQrUrl, setPhonepeQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getRestaurantSettings();
      if (data) {
        setSettings(data);
        setRestaurantName(data.restaurant_name || 'Variety Momo');
        setPhone(data.phone || '7827423777');
        setWhatsappNumber(data.whatsapp_number || '7827423777');
        setAddress(data.address || 'Near Mecheda Railway Station, Mecheda, Purba Medinipur');
        setCity(data.city || 'Mecheda');
        setDeliveryCharge(String(data.delivery_charge ?? 50));
        setHomeDeliveryEnabled(Boolean(data.home_delivery_enabled));
        setDineInEnabled(Boolean(data.dine_in_enabled));
        setAdvancePercentage(String(data.advance_payment_percentage ?? 30));
        setCodPercentage(String(data.cod_percentage ?? 70));
        setPhonepeUpiId(data.phonepe_upi_id || '7827423777@ybl');
        setPhonepeQrUrl(data.phonepe_qr_url || '/phonepe-demo-qr.svg');
        setQrPreview(data.phonepe_qr_url || '/phonepe-demo-qr.svg');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setErrorMessage(err.message || 'Failed to load restaurant settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sync percentages so advance + cod = 100%
  const handleAdvanceChange = (val) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setAdvancePercentage(String(num));
    setCodPercentage(String(100 - num));
  };

  const handleCodChange = (val) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setCodPercentage(String(num));
    setAdvancePercentage(String(100 - num));
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const adv = Number(advancePercentage);
    const cod = Number(codPercentage);

    if (adv + cod !== 100) {
      setErrorMessage('Advance % and COD % must strictly total 100%.');
      return;
    }

    setSaving(true);
    try {
      let finalQrUrl = phonepeQrUrl;

      if (qrFile) {
        // Upload new QR to restaurant-assets bucket
        finalQrUrl = await uploadStorageAsset('restaurant-assets', qrFile, `phonepe-qr-${Date.now()}.${qrFile.name.split('.').pop()}`);
        setPhonepeQrUrl(finalQrUrl);
      }

      const updates = {
        restaurant_name: restaurantName.trim(),
        phone: phone.trim() || '7827423777',
        whatsapp_number: whatsappNumber.trim() || '7827423777',
        address: address.trim(),
        city: city.trim(),
        delivery_charge: Number(deliveryCharge) || 0,
        home_delivery_enabled: homeDeliveryEnabled,
        dine_in_enabled: dineInEnabled,
        advance_payment_percentage: adv,
        cod_percentage: cod,
        phonepe_upi_id: phonepeUpiId.trim(),
        phonepe_qr_url: finalQrUrl
      };

      if (settings?.id) {
        await updateRestaurantSettings(settings.id, updates);
      }

      setSuccessMessage('Restaurant settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        <span className="text-xs text-stone-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
            Restaurant & Delivery Settings
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Configure delivery charges, payment ratios, official PhonePe QR code, and contact information.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* SECTION 1: GENERAL */}
        <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-5 space-y-4">
          <div className="flex items-center gap-2 text-brand-400 font-bold uppercase tracking-wider text-xs border-b border-stone-800 pb-2">
            <Building className="w-4 h-4" />
            <span>General Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-400 font-semibold mb-1">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-semibold mb-1">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-400 font-semibold mb-1">Full Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PAYMENT & PHONEPE QR */}
        <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs border-b border-stone-800 pb-2">
            <IndianRupee className="w-4 h-4" />
            <span>Payment & PhonePe QR Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-stone-400 font-semibold mb-1">PhonePe UPI ID</label>
                <input
                  type="text"
                  value={phonepeUpiId}
                  onChange={(e) => setPhonepeUpiId(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500 font-mono"
                />
              </div>

              {/* Advance & COD Percentages */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-300">Payment Ratio Rule</span>
                  <span className="text-[11px] text-brand-400 font-bold">Must Total 100%</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 font-medium mb-1">
                      PhonePe Advance (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={advancePercentage}
                      onChange={(e) => handleAdvanceChange(e.target.value)}
                      className="w-full p-2 bg-stone-900 text-white rounded-lg border border-stone-700 text-center font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 font-medium mb-1">
                      COD Balance (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={codPercentage}
                      onChange={(e) => handleCodChange(e.target.value)}
                      className="w-full p-2 bg-stone-900 text-white rounded-lg border border-stone-700 text-center font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* QR Upload & Preview */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-300">Active PhonePe QR Code</span>
                <span className="text-[10px] text-emerald-400 font-bold">Customer Facing</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-28 h-28 bg-white p-2 rounded-2xl flex items-center justify-center shrink-0 border border-stone-700">
                  <img
                    src={qrPreview || '/phonepe-demo-qr.svg'}
                    alt="PhonePe QR"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-stone-400">
                    Upload your official merchant PhonePe QR image. It will securely upload to Supabase storage.
                  </p>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer border border-stone-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: DELIVERY & DINE-IN */}
        <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-5 space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold uppercase tracking-wider text-xs border-b border-stone-800 pb-2">
            <Truck className="w-4 h-4" />
            <span>Fulfillment Services</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-400 font-semibold mb-1">
                Standard Delivery Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500 font-bold"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={homeDeliveryEnabled}
                  onChange={(e) => setHomeDeliveryEnabled(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <span className="font-semibold text-stone-300">Home Delivery Service Enabled</span>
              </label>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dineInEnabled}
                  onChange={(e) => setDineInEnabled(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <span className="font-semibold text-stone-300">Dine-In Service Enabled</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: CONTACT & SUPPORT */}
        <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-5 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-xs border-b border-stone-800 pb-2">
            <Phone className="w-4 h-4" />
            <span>Direct Restaurant Contact Numbers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-400 font-semibold mb-1">
                Official Calling Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500 font-semibold"
              />
              <span className="text-[11px] text-stone-500 mt-0.5 block">Used for direct tel: links (7827423777)</span>
            </div>

            <div>
              <label className="block text-stone-400 font-semibold mb-1">
                Official WhatsApp Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500 font-semibold"
              />
              <span className="text-[11px] text-stone-500 mt-0.5 block">Used for WhatsApp chat integration (+91 7827423777)</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: NOTIFICATION PREFERENCES & FCM CONTROLS (Requirements 2, 3, 6, 19) */}
        <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2 text-brand-400 font-bold uppercase tracking-wider text-xs">
              <Bell className="w-4 h-4" />
              <span>Owner Device Push Notifications & Settings</span>
            </div>
            {onOpenPushDiagnostic && (
              <button
                type="button"
                onClick={onOpenPushDiagnostic}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
              >
                <BellRing className="w-3.5 h-3.5 text-brand-400" />
                <span>All Devices Diagnostic</span>
              </button>
            )}
          </div>

          {/* Current Device Real Database Status Card */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-white">This Device Status</span>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const isRealEnabled =
                    deviceInfo.permission === 'granted' &&
                    Boolean(deviceInfo.currentToken) &&
                    Boolean(deviceInfo.dbSub?.is_active) &&
                    deviceInfo.dbSub?.user_type === 'OWNER' &&
                    Boolean(deviceInfo.swActive);

                  let statusText = 'Notifications Enabled';
                  if (!isRealEnabled) {
                    if (deviceInfo.permission !== 'granted') {
                      statusText = deviceInfo.permission === 'denied' ? 'Permission Denied' : 'Permission Required';
                    } else if (!deviceInfo.swActive) {
                      statusText = 'Service Worker Inactive';
                    } else if (!deviceInfo.currentToken) {
                      statusText = 'FCM Token Missing';
                    } else if (!deviceInfo.dbSub) {
                      statusText = 'Not Registered';
                    } else if (deviceInfo.dbSub.user_type !== 'OWNER') {
                      statusText = 'Customer Token (Re-register)';
                    } else if (!deviceInfo.dbSub.is_active) {
                      statusText = 'Token Inactive';
                    } else {
                      statusText = 'Disabled';
                    }
                  }

                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isRealEnabled
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isRealEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span>{statusText}</span>
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={loadCurrentDeviceStatus}
                  className="text-stone-400 hover:text-white text-xs flex items-center gap-1 transition-colors p-1"
                  title="Refresh device push status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${deviceInfo.loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <div className="text-stone-400 font-medium">Browser Permission</div>
                <div className={`font-bold mt-0.5 ${
                  deviceInfo.permission === 'granted'
                    ? 'text-emerald-400'
                    : deviceInfo.permission === 'denied'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}>
                  {deviceInfo.permission.toUpperCase()}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <div className="text-stone-400 font-medium">FCM Support</div>
                <div className={`font-bold mt-0.5 ${deviceInfo.supported ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deviceInfo.supported ? 'SUPPORTED' : 'UNSUPPORTED'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <div className="text-stone-400 font-medium">Service Worker</div>
                <div className={`font-bold mt-0.5 ${deviceInfo.swActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {deviceInfo.swActive ? 'REGISTERED' : 'PENDING'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <div className="text-stone-400 font-medium">Database Subscription</div>
                <div className={`font-bold mt-0.5 ${
                  deviceInfo.dbSub?.is_active
                    ? 'text-emerald-400'
                    : deviceInfo.dbSub
                    ? 'text-amber-400'
                    : 'text-stone-500'
                }`}>
                  {deviceInfo.dbSub?.is_active ? 'ACTIVE OWNER' : deviceInfo.dbSub ? 'INACTIVE' : 'NOT FOUND'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 col-span-2 sm:col-span-1">
                <div className="text-stone-400 font-medium">Last Registration</div>
                <div className="text-[10px] text-stone-300 truncate mt-0.5 font-medium">
                  {deviceInfo.dbSub?.updated_at
                    ? new Date(deviceInfo.dbSub.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Never'}
                </div>
              </div>
            </div>

            {/* Registration action buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={registeringDevice}
                onClick={handleRegisterCurrentDevice}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md"
              >
                {registeringDevice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering Device...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Enable & Register This Device</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={testSending}
                onClick={handleSendTestPush}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-xs font-bold border border-stone-700 transition-all disabled:opacity-50"
              >
                {testSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Test...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-brand-400" />
                    <span>Direct Device Test Push</span>
                  </>
                )}
              </button>
            </div>

            {regMessage && (
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-medium text-stone-200">
                {regMessage}
              </div>
            )}

            {regChecklist && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Owner Device Registration:</span>
                </div>
                {regChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-stone-200 pl-1">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex flex-col gap-1.5 ${
                testResult.success && testResult.sentCount > 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success && testResult.sentCount > 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Google FCM HTTP 200: Push accepted! Check your phone notification tray now.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Push dispatch warning: {testResult.error || testResult.message || 'No active device received push'}</span>
                    </>
                  )}
                </div>
                {testResult.results?.[0]?.result?.name && (
                  <div className="text-[10px] font-mono text-stone-400 break-all">
                    Message ID: {testResult.results[0].result.name}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-stone-400">
            Select which event push alerts are delivered to your registered owner devices. In-app notification center records all events automatically.
          </p>

          <div className="space-y-3 pt-1">
            {[
              { key: 'new_order', label: 'New Order Alerts', desc: 'Push alert immediately when a customer places a Dine-In or Home Delivery order' },
              { key: 'payment_submitted', label: 'Payment Verification Required Alerts', desc: 'Push alert when a Home Delivery customer submits PhonePe advance reference' },
              { key: 'customer_cancellation', label: 'Customer Cancellation Alerts', desc: 'Push alert if an order is cancelled or modified' },
              { key: 'order_status_events', label: 'Order Status Events', desc: 'Push alerts for kitchen milestone transitions' },
              { key: 'payment_verified', label: 'Payment Verification Confirmations', desc: 'Push alert confirmations when payment verification is recorded' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                <div>
                  <div className="text-xs font-bold text-white">{label}</div>
                  <div className="text-[11px] text-stone-400">{desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(notifPrefs[key])}
                    onChange={() => togglePref(key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
