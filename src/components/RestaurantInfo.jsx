import React from 'react';
import { MapPin, Phone, Clock, Navigation, CheckCircle, Heart, Star } from 'lucide-react';
import { restaurantInfo } from '../data/restaurantInfo';

function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
                      href="tel:7827423777"
                      className="text-white hover:text-emerald-400 font-outfit font-extrabold text-lg mt-0.5 block transition-colors"
                    >
                      7827423777
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

              {/* Quick Action Buttons: Call & WhatsApp (Requirements 20 & 21) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="tel:7827423777"
                  className="py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-outfit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call 7827423777</span>
                </a>

                <a
                  href="https://wa.me/917827423777?text=Hello%20Variety%20Momo%2C%20I%20want%20to%20know%20more%20about%20your%20menu%2Forder."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-outfit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <WhatsAppIcon className="w-4 h-4" />
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
