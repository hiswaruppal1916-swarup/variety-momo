import React from 'react';
import { MapPin, Phone, Clock, MessageSquare, Navigation, CheckCircle, Heart, Star } from 'lucide-react';
import { restaurantInfo } from '../data/restaurantInfo';

export default function RestaurantInfo() {
  return (
    <section id="about" className="py-8 sm:py-12 bg-white border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Story & Identity */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-brand-600 text-brand-600" />
              <span>About Variety Momo</span>
            </div>

            <h2 className="font-outfit font-extrabold text-stone-900 text-2xl sm:text-3xl tracking-tight leading-tight">
              Crafting Mecheda's Most Beloved Artisanal Momos
            </h2>

            <p className="text-sm text-stone-600 leading-relaxed">
              At <strong>Variety Momo</strong>, we believe momos are more than fast food — they are an art form. Founded right here in <strong>Mecheda, West Bengal</strong>, every single dumpling is hand-pleated daily using farm-fresh fillings, aromatic Himalayan spices, and our celebrated secret garlic-chilli chutney.
            </p>

            <p className="text-sm text-stone-600 leading-relaxed">
              From our signature <em>Gondhoraj Momos</em> infused with fragrant Bengal lime to ultra-crisp <em>Double-Crumb Crunchy Momos</em>, royal <em>Kabul Malai</em>, and piping hot <em>Kolkata-style Chowmein</em>, we take pride in delivering clean, hygienic, and unforgettable culinary experiences.
            </p>

            {/* Quality Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {restaurantInfo.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Contact, Location & Hours Card */}
          <div className="lg:col-span-6 bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Background glowing gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="border-b border-stone-800 pb-4">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Direct Contact & Location
                </span>
                <h3 className="font-outfit font-extrabold text-2xl text-white mt-1">
                  Variety Momo, Mecheda
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Purba Medinipur, West Bengal
                </p>
              </div>

              {/* Info Items */}
              <div className="space-y-4 text-sm">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shrink-0 text-brand-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-semibold">Location Address</div>
                    <div className="text-white font-medium text-xs sm:text-sm mt-0.5">
                      {restaurantInfo.fullAddress}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shrink-0 text-emerald-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-semibold">Phone & WhatsApp Orders</div>
                    <a
                      href={restaurantInfo.socials.phone}
                      className="text-white hover:text-emerald-400 font-outfit font-extrabold text-lg mt-0.5 block transition-colors"
                    >
                      {restaurantInfo.phone}
                    </a>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shrink-0 text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400 font-semibold">Kitchen Timing</div>
                    <div className="text-white font-medium text-xs sm:text-sm mt-0.5">
                      {restaurantInfo.openingHours}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={restaurantInfo.socials.phone}
                  className="py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-outfit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </a>

                <a
                  href={restaurantInfo.socials.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-outfit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
