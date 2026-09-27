import React, { useState, useEffect } from 'react';
import { ChevronRight, Star, Clock, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { heroSlides } from '../data/offers';
import { useCart } from '../context/CartContext';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { openDineInModal } = useCart();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <section className="relative overflow-hidden bg-stone-950 text-white">
      {/* Background Image Carousel with Overlay */}
      <div className="relative h-[360px] sm:h-[420px] md:h-[460px] w-full">
        {heroSlides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={s.image}
              alt={s.title}
              className="w-full h-full object-cover object-center brightness-90"
              loading={idx === 0 ? "eager" : "lazy"}
            />
            {/* Cinematic Gradient Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-r ${s.bgGradient} opacity-90`}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
          </div>
        ))}

        {/* Hero Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-end pb-8 sm:pb-12">
          <div className="max-w-2xl space-y-2 sm:space-y-3">
            {/* Promo Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/90 backdrop-blur-sm border border-brand-400/40 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-white shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{slide.badge}</span>
              <span className="text-white/60">|</span>
              <span className="text-amber-200">{slide.discount}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-outfit font-extrabold text-2xl sm:text-4xl md:text-5xl tracking-tight text-white leading-tight">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-stone-300 line-clamp-2 max-w-lg font-medium">
              {slide.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-4">
              <a
                href="#menu"
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-outfit font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 shadow-lg shadow-brand-600/30 transition-all"
              >
                <span>Explore Menu</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href="#popular"
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md border border-white/20 font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Popular Momos</span>
              </a>
            </div>
          </div>

          {/* Carousel Dot Indicators */}
          <div className="flex items-center gap-1.5 mt-4 sm:mt-6">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-brand-500' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trust & Highlights Ribbon */}
      <div className="bg-stone-900/95 border-t border-stone-800 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-around text-stone-300 text-[11px] sm:text-xs font-semibold gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-3.5 h-3.5 text-amberGold fill-amberGold" />
            <span>4.8★ Rated in Mecheda</span>
          </div>
          <div className="hidden xs:block text-stone-600">•</div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>25-35 Mins Fast Delivery</span>
          </div>
          <div className="hidden sm:block text-stone-600">•</div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Flame className="w-3.5 h-3.5 text-brand-500" />
            <span>Steaming Fresh Daily</span>
          </div>
          <div className="hidden md:block text-stone-600">•</div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>100% Hygienic Kitchen</span>
          </div>
        </div>
      </div>
    </section>
  );
}
