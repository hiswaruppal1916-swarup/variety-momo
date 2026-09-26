import React from 'react';
import { UtensilsCrossed, Bike, Clock, ShieldCheck, Sparkles, Check, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { restaurantInfo } from '../data/restaurantInfo';

export default function DineInDeliveryChoice({ isModal = false, onClose }) {
  const { orderType, setOrderType, isDineInModalOpen, closeDineInModal } = useCart();

  const handleSelect = (type) => {
    setOrderType(type);
    if (isModal && onClose) onClose();
    if (closeDineInModal) closeDineInModal();
  };

  const content = (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center max-w-md mx-auto">
        <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
          How would you like your food today?
        </span>
        <h2 className="font-outfit font-extrabold text-stone-900 text-xl sm:text-2xl mt-0.5">
          Dine-In or Home Delivery
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Enjoy piping hot momos directly at our restaurant or get them delivered anywhere in Mecheda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
        {/* Dine-In Card */}
        <div
          onClick={() => handleSelect('dinein')}
          className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
            orderType === 'dinein'
              ? 'border-brand-600 bg-brand-50/40 shadow-md ring-2 ring-brand-600/20'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          {orderType === 'dinein' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-outfit font-bold text-stone-900 text-base sm:text-lg">
              Eat at Restaurant
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Dine-in at our Mecheda outlet. Served straight from the steamer with infinite chutney refills.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-1 text-[11px] text-stone-500 font-medium">
            <div className="flex items-center gap-1.5 text-stone-700">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>Served in 10-15 mins</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Counter payment (Cash / UPI)</span>
            </div>
          </div>
        </div>

        {/* Home Delivery Card */}
        <div
          onClick={() => handleSelect('delivery')}
          className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
            orderType === 'delivery'
              ? 'border-brand-600 bg-brand-50/40 shadow-md ring-2 ring-brand-600/20'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
          }`}
        >
          {orderType === 'delivery' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-brand-600 flex items-center justify-center mb-3">
              <Bike className="w-6 h-6" />
            </div>
            <h3 className="font-outfit font-bold text-stone-900 text-base sm:text-lg">
              Get Food Delivered
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Doorstep delivery across Mecheda. Packed in temperature-insulated food boxes.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-1 text-[11px] text-stone-500 font-medium">
            <div className="flex items-center gap-1.5 text-stone-700">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>{restaurantInfo.avgDeliveryTime} delivery</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free delivery on orders above ₹249</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render as modal popup when active
  if (isDineInModalOpen || isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div
          className="fixed inset-0"
          onClick={onClose || closeDineInModal}
          aria-hidden="true"
        />
        <div className="relative bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl z-10">
          <button
            onClick={onClose || closeDineInModal}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
          <div className="mt-5 text-center">
            <button
              onClick={onClose || closeDineInModal}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-outfit font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              Continue with {orderType === 'delivery' ? 'Home Delivery' : 'Dine-In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline Section on Homepage
  return (
    <section className="py-6 sm:py-8 bg-white border-y border-stone-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {content}
      </div>
    </section>
  );
}
