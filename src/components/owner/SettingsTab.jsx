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
  Building
} from 'lucide-react';
import {
  getRestaurantSettings,
  updateRestaurantSettings,
  uploadStorageAsset
} from '../../services/restaurantService';

export default function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
      </form>
    </div>
  );
}
