import React from 'react';
import { MapPin, Phone, Heart, ShieldCheck, Flame, KeyRound } from 'lucide-react';
import { restaurantInfo } from '../data/restaurantInfo';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-stone-950 text-stone-400 text-xs pt-10 pb-20 md:pb-10 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-800/80">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/variety-momo-logo.jpg"
                alt="Variety Momo Logo"
                className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-stone-700"
              />
              <span className="font-outfit font-extrabold text-lg text-white tracking-tight">
                VARIETY <span className="text-brand-500">MOMO</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Mecheda's premier destination for artisanal steamed, crunchy, afghani, and signature Gondhoraj momos and fast food.
            </p>
            <div className="flex items-center gap-2 text-stone-300 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{restaurantInfo.phone}</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-2">
            <h4 className="font-outfit font-bold text-white text-sm">Menu Specialties</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li><a href="#menu" className="hover:text-white transition-colors">Steam Chicken Momos</a></li>
              <li><a href="#menu" className="hover:text-white transition-colors">Crunchy Double-Crumb Momos</a></li>
              <li><a href="#menu" className="hover:text-white transition-colors">Bengal Gondhoraj Momos</a></li>
              <li><a href="#menu" className="hover:text-white transition-colors">Chicken Afghani Momos</a></li>
              <li><a href="#menu" className="hover:text-white transition-colors">Kolkata Chicken Chowmein</a></li>
            </ul>
          </div>

          {/* Ordering & Timing */}
          <div className="space-y-2">
            <h4 className="font-outfit font-bold text-white text-sm">Order Modes</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li>Dine-In (Counter Payment)</li>
              <li>Home Delivery across Mecheda Hub</li>
              <li>Takeaway Counter Pickup</li>
              <li className="text-amber-400 pt-1">Open Today: {restaurantInfo.openingHours}</li>
            </ul>
          </div>

          {/* Address & Trust */}
          <div className="space-y-2">
            <h4 className="font-outfit font-bold text-white text-sm">Location</h4>
            <div className="flex items-start gap-2 text-stone-400">
              <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>{restaurantInfo.fullAddress}</span>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>FSSAI Compliant & 100% Hygienic</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500">
          <div>
            © {new Date().getFullYear()} Variety Momo. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              <span>for Momo lovers in Mecheda, West Bengal</span>
            </div>
            <a
              href="/owner-login"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('owner-login');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 hover:text-amber-300 border border-stone-800 transition-colors text-xs font-semibold"
              title="Access Owner Dashboard"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Owner Portal</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
