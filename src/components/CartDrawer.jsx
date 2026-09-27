import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Check,
  Tag,
  AlertCircle,
  UtensilsCrossed,
  Bike,
  QrCode,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { restaurantInfo } from '../data/restaurantInfo';
import { createCustomerOrder } from '../services/restaurantService';

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    orderType,
    setOrderType,
    subtotal,
    deliveryFee,
    grandTotal,
    advancePercentage,
    advanceAmount,
    codAmount,
    settings,
    deliveryZones,
    tablesList,
    tableContext,
    tableError,
    setTableByToken,
    activeTracking,
    openOrderTracking,
    saveActiveOrder
  } = useCart();

  // Checkout Step: 'cart' | 'checkout' | 'success'
  const [checkoutStep, setCheckoutStep] = useState('cart');

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Delivery Address Form State
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('721137');
  const [zoneError, setZoneError] = useState('');

  // PhonePe Payment Form State
  const [hasScannedQR, setHasScannedQR] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  // Set default selected zone when zones load
  useEffect(() => {
    if (deliveryZones && deliveryZones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(deliveryZones[0].id);
    }
  }, [deliveryZones, selectedZoneId]);

  // Reset checkout step when cart closes
  useEffect(() => {
    if (!isCartOpen) {
      setCheckoutStep('cart');
      setSubmitError('');
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // Handle GPS location click
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Find closest delivery zone in Mecheda
        const mechedaZone = deliveryZones.find((z) =>
          z.name.toLowerCase().includes('station')
        ) || deliveryZones[0];

        if (mechedaZone) {
          setSelectedZoneId(mechedaZone.id);
          setArea(mechedaZone.name);
          setZoneError('');
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        alert('Could not retrieve GPS coordinates. Please select your delivery zone manually.');
      }
    );
  };

  // Validate and submit order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Common Customer Info Validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setSubmitError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }

    // Format items for backend RPC
    const orderItemsPayload = cartItems.map((ci) => ({
      menu_item_id: ci.item.dbId,
      quantity: ci.quantity
    }));

    if (orderItemsPayload.some((item) => !item.menu_item_id)) {
      setSubmitError('Some dishes are missing database IDs. Please refresh your menu.');
      return;
    }

    // DINE-IN Specific Validations
    if (orderType === 'dinein') {
      if (!tableContext?.qr_token) {
        setSubmitError('Please scan or select an active table QR to place a dine-in order.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await createCustomerOrder({
          orderType: 'DINE_IN',
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          items: orderItemsPayload,
          tableToken: tableContext.qr_token,
          specialInstructions: specialInstructions.trim() || null
        });

        if (result && result.success) {
          setLastCreatedOrder(result);
          saveActiveOrder(result);
          clearCart();
          setCheckoutStep('success');
        }
      } catch (err) {
        console.error('Dine-In order creation failed:', err);
        setSubmitError(err.message || 'Failed to place dine-in order.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // HOME DELIVERY Specific Validations
    if (orderType === 'delivery') {
      if (!selectedZoneId) {
        setSubmitError('Please select a valid delivery zone in Mecheda.');
        return;
      }

      const activeZone = deliveryZones.find((z) => z.id === selectedZoneId);
      if (!activeZone || !activeZone.is_active) {
        setSubmitError('Sorry, home delivery is currently unavailable in this area.');
        return;
      }

      if (!addressLine.trim() || addressLine.trim().length < 3) {
        setSubmitError('Please provide your complete street address / house details.');
        return;
      }

      if (!area.trim() || area.trim().length < 2) {
        setSubmitError('Please enter your area or locality name.');
        return;
      }

      // Check payment reference if submitted
      if (hasScannedQR && (!paymentReference.trim() || paymentReference.trim().length < 4)) {
        setSubmitError('Please enter your PhonePe UTR / transaction reference number.');
        return;
      }

      setIsSubmitting(true);
      try {
        const deliveryAddressPayload = {
          address_line: addressLine.trim(),
          area: area.trim(),
          landmark: landmark.trim() || null,
          city: 'Mecheda',
          pincode: pincode.trim() || '721137',
          delivery_zone_id: selectedZoneId
        };

        const result = await createCustomerOrder({
          orderType: 'HOME_DELIVERY',
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          items: orderItemsPayload,
          deliveryAddress: deliveryAddressPayload,
          paymentReference: paymentReference.trim() || null,
          specialInstructions: specialInstructions.trim() || null
        });

        if (result && result.success) {
          setLastCreatedOrder(result);
          saveActiveOrder(result);
          clearCart();
          setCheckoutStep('success');
        }
      } catch (err) {
        console.error('Delivery order creation failed:', err);
        setSubmitError(err.message || 'Failed to place delivery order.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={closeCart} aria-hidden="true" />

      {/* Cart Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold text-stone-900 text-base">
                {checkoutStep === 'checkout'
                  ? orderType === 'delivery'
                    ? 'Home Delivery Checkout'
                    : 'Dine-In Table Order'
                  : checkoutStep === 'success'
                  ? 'Order Confirmation'
                  : 'Your Cart'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Variety Momo, Mecheda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTracking && (
              <button
                onClick={() => {
                  closeCart();
                  openOrderTracking();
                }}
                className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 text-[10px] font-bold transition-colors flex items-center gap-1"
              >
                <span>Track Order</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {cartItems.length > 0 && checkoutStep === 'cart' && (
              <button
                onClick={clearCart}
                className="text-[11px] text-stone-400 hover:text-red-500 transition-colors font-medium"
              >
                Clear
              </button>
            )}

            <button
              onClick={closeCart}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Type Switcher (Only in cart step) */}
        {checkoutStep === 'cart' && cartItems.length > 0 && (
          <div className="p-3 bg-stone-100/90 border-b border-stone-200/80 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType('delivery')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-white text-stone-900 shadow-sm border border-brand-500/30 ring-1 ring-brand-500/10'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Bike className={`w-4 h-4 ${orderType === 'delivery' ? 'text-brand-600' : ''}`} />
                <span>Home Delivery</span>
              </button>

              <button
                onClick={() => setOrderType('dinein')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'dinein'
                    ? 'bg-white text-stone-900 shadow-sm border border-brand-500/30 ring-1 ring-brand-500/10'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <UtensilsCrossed className={`w-4 h-4 ${orderType === 'dinein' ? 'text-brand-600' : ''}`} />
                <span>Dine-In Table</span>
              </button>
            </div>

            {/* Quick Context Explanatory Note */}
            <p className="text-[10px] text-stone-500 text-center mt-2 font-medium">
              {orderType === 'delivery'
                ? 'Delivery is available only inside the restaurant’s configured delivery zones in Mecheda.'
                : 'Order directly from your restaurant table and pay the bill at the counter.'}
            </p>
          </div>
        )}

        {/* Content Body Based on checkoutStep */}
        {checkoutStep === 'success' && lastCreatedOrder ? (
          /* ==============================================================
             STEP: SUCCESS CONFIRMATION SCREEN
             ============================================================== */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full">
                ✓ Order placed successfully
              </span>
              <h4 className="font-outfit font-extrabold text-2xl text-stone-900 mt-2">
                #{lastCreatedOrder.order_number}
              </h4>
              <p className="text-xs text-stone-600 max-w-xs mt-1">
                {lastCreatedOrder.order_type === 'DINE_IN'
                  ? `Your order has been sent to the Variety Momo kitchen for Table ${lastCreatedOrder.table_number}.`
                  : `Your home delivery order for ${lastCreatedOrder.zone_name || 'Mecheda'} is being processed.`}
              </p>
            </div>

            {/* Order Summary Details Box */}
            <div className="w-full bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2 text-left">
              <div className="flex justify-between text-stone-600">
                <span>Order Type:</span>
                <span className="font-bold text-stone-900">
                  {lastCreatedOrder.order_type === 'DINE_IN' ? 'Dine-In' : 'Home Delivery'}
                </span>
              </div>

              {lastCreatedOrder.table_number && (
                <div className="flex justify-between text-stone-600">
                  <span>Dining Table:</span>
                  <span className="font-extrabold text-brand-600">
                    Table {lastCreatedOrder.table_number}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Total Amount:</span>
                <span className="font-extrabold text-stone-900 text-sm">
                  ₹{lastCreatedOrder.grand_total}
                </span>
              </div>

              {lastCreatedOrder.order_type === 'HOME_DELIVERY' && (
                <>
                  <div className="flex justify-between text-amber-800 font-semibold pt-1 border-t border-stone-200">
                    <span>30% Advance Required:</span>
                    <span>₹{lastCreatedOrder.advance_amount}</span>
                  </div>
                  <div className="flex justify-between text-stone-700 font-semibold">
                    <span>Remaining Cash on Delivery:</span>
                    <span>₹{lastCreatedOrder.cod_amount}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Payment Status:</span>
                    <span className="font-bold text-amber-600">
                      {lastCreatedOrder.payment_status === 'VERIFIED'
                        ? 'Verified'
                        : lastCreatedOrder.payment_status === 'SUBMITTED'
                        ? 'Submitted'
                        : 'Pending'}
                    </span>
                  </div>
                </>
              )}

              {lastCreatedOrder.order_type === 'DINE_IN' && (
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-stone-200">
                  <span>Payment Instructions:</span>
                  <span>Pay Bill at Counter</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Track Order, Call, WhatsApp, Continue Browsing (Requirement 9) */}
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => {
                  closeCart();
                  openOrderTracking();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-outfit font-bold text-xs uppercase tracking-wider shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Track Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:7827423777"
                  className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/917827427377?text=${encodeURIComponent(
                    `Hello Variety Momo, I just placed order #${lastCreatedOrder.order_number}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                onClick={() => {
                  setCheckoutStep('cart');
                  closeCart();
                }}
                className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-outfit font-bold text-xs uppercase tracking-wider transition-all"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : checkoutStep === 'checkout' ? (
          /* ==============================================================
             STEP: CHECKOUT DETAILS & ADDRESS / TABLE FORM
             ============================================================== */
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {/* Customer Details Form */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                1. Customer Information
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <div className="flex">
                    <span className="px-3 py-2 rounded-l-xl bg-stone-100 border border-r-0 border-stone-200 text-xs font-bold text-stone-600 flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 rounded-r-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Cooking / Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Extra spicy red chutney, no onion"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DINE-IN TABLE SELECTION / VERIFICATION */}
            {orderType === 'dinein' && (
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  2. Table QR Verification
                </h4>

                {tableContext ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500/70 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        {tableContext.table_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Selected Table: {tableContext.table_number}</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          Food will be served directly to Table {tableContext.table_number}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTableByToken(null)}
                      className="text-[11px] font-bold text-stone-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-white transition-all underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <p className="font-bold">Please select your table for Dine-In service:</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Choose the table where you are seated (T-01 to T-06).
                      </p>
                    </div>

                    {tableError && (
                      <p className="text-[11px] text-red-600 font-bold">{tableError}</p>
                    )}

                    {/* Table Selector Pills */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {((tablesList && tablesList.length > 0) ? tablesList : [
                        { id: 't1', table_number: 'T-01', qr_token: 'tbl_momo_01_sec82' },
                        { id: 't2', table_number: 'T-02', qr_token: 'tbl_momo_02_k73ea' },
                        { id: 't3', table_number: 'T-03', qr_token: 'tbl_momo_03_9a22f' },
                        { id: 't4', table_number: 'T-04', qr_token: 'tbl_momo_04_b14dc' },
                        { id: 't5', table_number: 'T-05', qr_token: 'tbl_momo_05_c8891' },
                        { id: 't6', table_number: 'T-06', qr_token: 'tbl_momo_06_e33fa' },
                      ]).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTableByToken(t.qr_token || t.table_number)}
                          className="py-2.5 px-2 rounded-xl border border-stone-200 hover:border-brand-500 hover:bg-brand-50/50 text-center transition-all group active:scale-95 bg-white shadow-xs"
                        >
                          <span className="block font-outfit font-black text-sm text-stone-900 group-hover:text-brand-600">
                            {t.table_number}
                          </span>
                          <span className="block text-[9px] text-stone-500 font-semibold uppercase mt-0.5">
                            Select Table
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dine-In Counter Pay Notice */}
                <div className="p-3 rounded-xl bg-stone-100 text-xs text-stone-700 space-y-1">
                  <div className="font-bold text-stone-900">Payment Notice:</div>
                  <p className="text-[11px] leading-relaxed">
                    Dine-in orders do not require advance online payment. You will pay the bill of <strong>₹{grandTotal}</strong> at the counter after enjoying your food.
                  </p>
                </div>
              </div>
            )}

            {/* HOME DELIVERY LOCATION & ZONE VALIDATION */}
            {orderType === 'delivery' && (
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    2. Delivery Location in Mecheda
                  </h4>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Use GPS</span>
                  </button>
                </div>

                {/* Delivery Zone Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Select Delivery Zone *
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => {
                      setSelectedZoneId(e.target.value);
                      const z = deliveryZones.find((item) => item.id === e.target.value);
                      if (z) setArea(z.name);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-brand-500"
                  >
                    {deliveryZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.description || 'Mecheda area'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detailed Address Inputs */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Full House / Building / Flat Address *
                    </label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="e.g. Flat 3B, Anandam Apartment, Bypass Road"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Area / Locality *
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. Mecheda Station Road"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Nearby Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near SBI ATM"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value="Mecheda"
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs font-bold text-stone-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="721137"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* PHONEPE 30% ADVANCE PAYMENT SECTION (Requirements 10, 11, 12, 13) */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      3. PhonePe 30% Advance Payment
                    </h4>
                    <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      Advance: ₹{advanceAmount}
                    </span>
                  </div>

                  {/* Financial calculation recap */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Food Subtotal:</span>
                      <span className="font-bold text-stone-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Delivery Charge (Database Setting):</span>
                      <span className="font-bold text-stone-900">₹{deliveryFee}</span>
                    </div>
                    <div className="flex justify-between text-stone-900 font-bold pt-1 border-t border-stone-200">
                      <span>Grand Total:</span>
                      <span className="font-extrabold text-sm text-brand-600">₹{grandTotal}</span>
                    </div>
                    <div className="flex justify-between text-amber-800 font-extrabold pt-1">
                      <span>Advance Required (30%):</span>
                      <span className="text-amber-900">₹{advanceAmount}</span>
                    </div>
                    <div className="flex justify-between text-stone-700 font-semibold">
                      <span>Remaining Cash on Delivery (70%):</span>
                      <span>₹{codAmount}</span>
                    </div>
                  </div>

                  {/* PhonePe Demo QR Card */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-brand-500/20 shadow-md space-y-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                      <span>DEMO QR — STEP 3 PREVIEW</span>
                    </div>

                    {/* QR Image loaded from restaurant_settings.phonepe_qr_url */}
                    <div className="max-w-[220px] mx-auto rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-2 shadow-xs">
                      <img
                        src={settings.phonepe_qr_url || '/phonepe-demo-qr.svg'}
                        alt="PhonePe Demo QR"
                        className="w-full h-auto object-contain rounded-lg"
                      />
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <p className="font-bold text-stone-900">
                        Pay ₹{advanceAmount} via PhonePe / GPay / Paytm
                      </p>
                      <p className="text-[11px] text-stone-500">
                        UPI ID: <code className="font-bold text-stone-800">{settings.phonepe_upi_id}</code>
                      </p>
                    </div>

                    {/* Safety notice (Requirement 13) */}
                    <div className="p-2.5 rounded-xl bg-amber-50 text-[11px] text-amber-900 text-left space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Payment Safety Notice:</span>
                      </div>
                      <p className="leading-relaxed">
                        • Your order will be confirmed only after the restaurant verifies the advance payment.
                      </p>
                      <p className="leading-relaxed">
                        • Please make sure the payment is sent to the displayed Variety Momo PhonePe/UPI QR.
                      </p>
                    </div>

                    {/* "I have completed payment" button */}
                    {!hasScannedQR ? (
                      <button
                        type="button"
                        onClick={() => setHasScannedQR(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-outfit font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                      >
                        I have completed the payment
                      </button>
                    ) : (
                      /* Payment submission form (Requirement 12) */
                      <div className="pt-2 border-t border-stone-100 text-left space-y-2">
                        <label className="block text-[11px] font-bold text-stone-800">
                          PhonePe Transaction / UTR Reference Number *
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="e.g. 425619283746 or UPI Ref"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold uppercase text-stone-900 focus:outline-hidden focus:border-brand-500"
                        />
                        <p className="text-[10px] text-stone-500">
                          Payment Amount: <strong>₹{advanceAmount}</strong> (Advance will be verified manually by owner).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : cartItems.length === 0 ? (
          /* ==============================================================
             STEP: EMPTY CART STATE
             ============================================================== */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h4 className="font-outfit font-bold text-stone-800 text-base">Your cart is empty</h4>
            <p className="text-xs text-stone-500 max-w-xs mt-1 mb-4">
              Add some hot steaming momos or crispy crunchy snacks from our menu to begin!
            </p>
            <button
              onClick={closeCart}
              className="px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          /* ==============================================================
             STEP: CART ITEMS LIST
             ============================================================== */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-3 divide-y divide-stone-100">
              {cartItems.map((cartItem) => {
                const { cartKey, item, variant, quantity } = cartItem;
                return (
                  <div key={cartKey} className="pt-3 first:pt-0 flex items-center gap-3">
                    {/* Food Thumbnail */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-100"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={item.isVeg ? 'badge-veg shrink-0' : 'badge-non-veg shrink-0'} />
                        <h4 className="font-outfit font-bold text-stone-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {variant.name} • ₹{variant.price}
                      </div>
                      <div className="font-outfit font-black text-stone-900 text-xs mt-0.5">
                        ₹{variant.price * quantity}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center rounded-lg bg-stone-100 p-0.5">
                      <button
                        onClick={() => updateQuantity(cartKey, quantity - 1)}
                        className="p-1 rounded-md hover:bg-white text-stone-700 active:scale-90 transition-all"
                        aria-label="Decrease quantity"
                      >
                        {quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="w-7 text-center font-outfit font-black text-xs text-stone-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(cartKey, quantity + 1)}
                        className="p-1 rounded-md bg-white text-stone-900 shadow-xs active:scale-90 transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bill Summary */}
            <div className="pt-4 border-t border-stone-200/80 space-y-2">
              <h4 className="text-xs font-bold uppercase text-stone-400 tracking-wider">
                Bill Summary
              </h4>
              <div className="text-xs text-stone-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Food Subtotal</span>
                  <span className="font-semibold text-stone-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-800">
                    {orderType === 'dinein' ? (
                      <span className="text-emerald-600 font-bold">₹0 (Dine-In)</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-outfit font-black text-stone-900">
                  <span>Grand Total</span>
                  <span className="text-base text-brand-600">₹{grandTotal}</span>
                </div>

                {orderType === 'delivery' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>30% Advance Required:</span>
                      <span>₹{advanceAmount}</span>
                    </div>
                    <div className="flex justify-between font-medium text-stone-600">
                      <span>Remaining Cash on Delivery (70%):</span>
                      <span>₹{codAmount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Footer Button */}
        {cartItems.length > 0 && checkoutStep === 'cart' && (
          <div className="p-4 border-t border-stone-100 bg-white shrink-0 pb-safe">
            <button
              onClick={() => setCheckoutStep('checkout')}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-outfit font-bold text-sm tracking-wide shadow-lg shadow-brand-600/30 flex items-center justify-between transition-all"
            >
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-white/80">
                  {orderType === 'delivery' ? 'Home Delivery' : 'Dine-In Table'}
                </div>
                <div className="text-base font-black leading-none">₹{grandTotal}</div>
              </div>
              <div className="flex items-center gap-1.5 font-extrabold uppercase text-xs tracking-wider">
                <span>Proceed to Order</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {checkoutStep === 'checkout' && (
          <div className="p-4 border-t border-stone-100 bg-white shrink-0 pb-safe flex gap-2">
            <button
              type="button"
              onClick={() => setCheckoutStep('cart')}
              disabled={isSubmitting}
              className="px-4 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-outfit font-bold text-xs uppercase tracking-wider transition-all"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-outfit font-bold text-sm tracking-wide shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <span>
                    {orderType === 'dinein'
                      ? `Place Dine-In Order (₹${grandTotal})`
                      : hasScannedQR
                      ? `Submit Delivery Order & UTR`
                      : `Confirm Home Delivery (₹${grandTotal})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
