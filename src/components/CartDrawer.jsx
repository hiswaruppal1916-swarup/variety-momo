import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Check, Tag, AlertCircle, UtensilsCrossed, Bike } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { restaurantInfo } from '../data/restaurantInfo';

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
    taxes,
    grandTotal,
    advanceAmount
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [orderConfirmedDemo, setOrderConfirmedDemo] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    if (couponCode.toUpperCase() === 'FREEDEL') {
      setAppliedCoupon({ code: 'FREEDEL', discount: deliveryFee, text: 'Free Delivery Applied' });
    } else if (couponCode.toUpperCase() === 'MOMOPLATTER') {
      const discountVal = Math.round(subtotal * 0.1);
      setAppliedCoupon({ code: 'MOMOPLATTER', discount: discountVal, text: '10% Momo Platter Discount' });
    } else {
      setCouponError('Invalid coupon code. Try FREEDEL or MOMOPLATTER');
    }
  };

  const finalTotal = Math.max(0, grandTotal - (appliedCoupon?.discount || 0));

  const handleProceedToOrder = () => {
    setOrderConfirmedDemo(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Cart Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-outfit font-extrabold text-stone-900 text-base">Your Cart</h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} from Variety Momo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
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

        {/* Dine-In vs Home Delivery Selector in Cart */}
        <div className="p-3 bg-stone-100 border-b border-stone-200/80">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType('delivery')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                orderType === 'delivery'
                  ? 'bg-white text-stone-900 shadow-sm border border-brand-500/30'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Bike className={`w-3.5 h-3.5 ${orderType === 'delivery' ? 'text-brand-600' : ''}`} />
              <span>Home Delivery</span>
            </button>

            <button
              onClick={() => setOrderType('dinein')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                orderType === 'dinein'
                  ? 'bg-white text-stone-900 shadow-sm border border-brand-500/30'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <UtensilsCrossed className={`w-3.5 h-3.5 ${orderType === 'dinein' ? 'text-brand-600' : ''}`} />
              <span>Dine-In (Counter)</span>
            </button>
          </div>
        </div>

        {/* Demo Confirmation Overlay (Step 1 Preview) */}
        {orderConfirmedDemo ? (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Step 1 Frontend Validation
              </span>
              <h4 className="font-outfit font-extrabold text-xl text-stone-900 mt-2">
                Order Checkout UI Ready!
              </h4>
              <p className="text-xs text-stone-600 max-w-xs mt-1">
                {orderType === 'delivery'
                  ? `In Step 2, this will prompt the customer for their delivery address in Mecheda and verify 30% advance (₹${advanceAmount}) via PhonePe QR.`
                  : `In Step 2, this will issue an instant dine-in kitchen token for counter billing.`}
              </p>
            </div>
            <div className="w-full bg-stone-50 p-4 rounded-xl text-left border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between font-medium text-stone-500">
                <span>Mode:</span>
                <span className="font-bold text-stone-900 capitalize">{orderType}</span>
              </div>
              <div className="flex justify-between font-medium text-stone-500">
                <span>Items:</span>
                <span className="font-bold text-stone-900">{cartItems.length} Dishes</span>
              </div>
              <div className="flex justify-between font-medium text-stone-500">
                <span>Total Value:</span>
                <span className="font-bold text-stone-900">₹{finalTotal}</span>
              </div>
              <div className="flex justify-between font-medium text-stone-500">
                <span>Contact Restaurant:</span>
                <span className="font-bold text-stone-900">{restaurantInfo.phone}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setOrderConfirmedDemo(false);
                closeCart();
              }}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-outfit font-bold text-xs uppercase tracking-wider"
            >
              Back to Browsing
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty State */
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
          /* Cart Content List */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
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
                      <span className={item.isVeg ? "badge-veg shrink-0" : "badge-non-veg shrink-0"} />
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
                      aria-label="Decrease"
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
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Coupon Code Section */}
            <div className="pt-4">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code (FREEDEL)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs uppercase font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold tracking-wide transition-all active:scale-95"
                >
                  Apply
                </button>
              </form>

              {couponError && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{couponError}</p>
              )}
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{appliedCoupon.text} (-₹{appliedCoupon.discount})</span>
                </p>
              )}
            </div>

            {/* Bill Details */}
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase text-stone-400 tracking-wider">
                Bill Summary
              </h4>
              <div className="text-xs text-stone-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-stone-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  <span className="font-semibold text-stone-800">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurant GST & Packaging (5%)</span>
                  <span className="font-semibold text-stone-800">₹{taxes}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-outfit font-black text-stone-900">
                  <span>To Pay</span>
                  <span className="text-base text-brand-600">₹{finalTotal}</span>
                </div>
              </div>

              {/* Step 2 Architecture Readiness Note */}
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  {orderType === 'delivery' ? (
                    <span>
                      <strong>Delivery Notice:</strong> In Step 2, a 30% advance of <strong>₹{advanceAmount}</strong> will be confirmed via PhonePe QR prior to dispatch.
                    </span>
                  ) : (
                    <span>
                      <strong>Dine-In Notice:</strong> In Step 2, counter payment is accepted upon receiving your freshly prepared momos.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout CTA */}
        {cartItems.length > 0 && !orderConfirmedDemo && (
          <div className="p-4 border-t border-stone-100 bg-white shrink-0 pb-safe">
            <button
              onClick={handleProceedToOrder}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-outfit font-bold text-sm tracking-wide shadow-lg shadow-brand-600/30 flex items-center justify-between transition-all"
            >
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-white/80">
                  {orderType === 'delivery' ? 'Home Delivery' : 'Dine-In Counter'}
                </div>
                <div className="text-base font-black leading-none">₹{finalTotal}</div>
              </div>
              <div className="flex items-center gap-1.5 font-extrabold uppercase text-xs tracking-wider">
                <span>Proceed to Order</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
