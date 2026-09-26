import React from 'react';
import { categories } from '../data/categories';
import { Flame, Sparkles, Utensils, Zap, Crown, Soup, ShieldCheck, Wheat, Sandwich, CookingPot } from 'lucide-react';

const iconMap = {
  Flame,
  Sparkles,
  Utensils,
  CookingPot,
  Zap,
  Crown,
  Soup,
  ShieldCheck,
  Wheat,
  Sandwich
};

export default function CategoryBar({ activeCategory, onSelectCategory }) {
  return (
    <div className="sticky top-[89px] sm:top-[99px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Utensils;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 select-none ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-[1.02]'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 active:scale-95'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{cat.name}</span>
                {cat.badge && (
                  <span
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-brand-600' : 'bg-brand-100 text-brand-700'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
