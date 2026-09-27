import React from 'react';
import { UtensilsCrossed, Bike, Clock, Sparkles } from 'lucide-react';
import { restaurantInfo } from '../data/restaurantInfo';

export default function OrderModesInfoSection() {
  return (
    <section className="py-8 sm:py-10 bg-stone-50/60 border-t border-stone-200/70">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
            Dining & Delivery Options
          </span>
          <h3 className="font-outfit font-extrabold text-stone-900 text-lg sm:text-2xl mt-0.5">
            Two Delicious Ways to Enjoy Variety Momo
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Choose whether to relax at our restaurant tables or get piping-hot food delivered to your door.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {/* Dine-In Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0 border border-orange-100">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-outfit font-bold text-stone-900 text-sm sm:text-base">
                  Dine-In Experience
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tables T-01 to T-06
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Enjoy your food hot at Variety Momo. Served straight from the steamer with infinite fiery red chutney refills and counter billing.
              </p>
            </div>
          </div>

          {/* Home Delivery Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Bike className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-outfit font-bold text-stone-900 text-sm sm:text-base">
                  Home Delivery
                </h4>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  {restaurantInfo.avgDeliveryTime}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Get your favourite food delivered across the available Mecheda delivery area. Packed in thermal food containers to keep momos sizzling hot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
