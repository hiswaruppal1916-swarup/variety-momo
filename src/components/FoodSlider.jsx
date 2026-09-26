import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import FoodCard from './FoodCard';

export default function FoodSlider({ title, subtitle, items, badgeText }) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="py-5 sm:py-7">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-3.5 sm:mb-4">
          <div>
            {badgeText && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 uppercase tracking-wider mb-1">
                <Flame className="w-3.5 h-3.5 fill-brand-600" />
                <span>{badgeText}</span>
              </div>
            )}
            <h2 className="font-outfit font-extrabold text-stone-900 text-lg sm:text-2xl tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Desktop scroll arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              className="p-2 rounded-full border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors shadow-xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2 rounded-full border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors shadow-xs"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Slider Track */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0"
            >
              <FoodCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
