import React from 'react';
import { Tag, Sparkles, ArrowRight, Percent, Gift, ArrowLeft } from 'lucide-react';
import { specialOffers } from '../data/offers';
import { useCart } from '../context/CartContext';

export default function OffersSection() {
  const { openCart } = useCart();

  const handleBackToMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="offers" className="py-5 sm:py-7">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between mb-3.5 sm:mb-4">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 fill-brand-600" />
              <span>Deals & Rewards</span>
            </div>
            <h2 className="font-outfit font-extrabold text-stone-900 text-lg sm:text-2xl tracking-tight">
              Today's Special Offers
            </h2>
          </div>

          <button
            onClick={handleBackToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200 active:scale-95 shadow-xs"
            title="Back to Menu"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Menu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {specialOffers.map((offer) => (
            <div
              key={offer.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between relative overflow-hidden ${offer.color}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current">
                    {offer.badge}
                  </span>
                  <h3 className="font-outfit font-bold text-base sm:text-lg mt-1">
                    {offer.title}
                  </h3>
                  <p className="text-xs opacity-90 leading-relaxed max-w-sm">
                    {offer.description}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-white/90 px-2.5 py-1 rounded-md border border-black/5 shadow-xs">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{offer.code}</span>
                </div>
                <button
                  onClick={openCart}
                  className="text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <span>Apply at Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
