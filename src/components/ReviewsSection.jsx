import React from 'react';
import { Star, MessageCircle, Quote, CheckCircle, ArrowLeft } from 'lucide-react';
import { customerReviews } from '../data/reviews';

export default function ReviewsSection() {
  const handleBackToMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section id="reviews" className="py-8 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 fill-amberGold text-amberGold" />
              <span>Customer Voices</span>
            </div>
            <h2 className="font-outfit font-extrabold text-stone-900 text-xl sm:text-3xl tracking-tight">
              Loved by Foodies in Mecheda
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Sample community feedback and recommendations from local patrons.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleBackToMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200 active:scale-95 shadow-xs shrink-0"
              title="Back to Menu"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </button>

            <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/80 px-4 py-2 rounded-2xl shrink-0">
              <div className="font-outfit font-black text-2xl text-stone-900">4.8</div>
              <div className="text-left">
                <div className="flex text-amberGold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amberGold" />
                  ))}
                </div>
                <div className="text-[11px] text-stone-500 font-medium">1,250+ Ratings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {customerReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-stone-50/70 border border-stone-150 flex flex-col justify-between hover:shadow-sm transition-all relative"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      className="w-9 h-9 rounded-full object-cover border border-stone-200"
                    />
                    <div>
                      <div className="font-outfit font-bold text-xs text-stone-900 line-clamp-1">
                        {rev.name}
                      </div>
                      <div className="text-[10px] text-stone-400">{rev.location}</div>
                    </div>
                  </div>
                  <div className="flex text-amberGold">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amberGold" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed italic">
                  "{rev.review}"
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-400">
                <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  {rev.dish}
                </span>
                <span>{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
