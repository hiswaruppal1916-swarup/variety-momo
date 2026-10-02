import React from 'react';
import { X, Smartphone, Globe, Share2, PlusSquare, MoreVertical, Download, CheckCircle2 } from 'lucide-react';
import { usePwa } from '../context/PwaContext';

export default function PwaManualInstallModal() {
  const { isManualGuideOpen, closeManualGuide, canInstallNative, installApp } = usePwa();

  if (!isManualGuideOpen) return null;

  const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeManualGuide}
      role="dialog"
      aria-modal="true"
      aria-label="How to install Variety Momo App"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/variety-momo-logo.jpg"
                alt="Variety Momo"
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
              <div>
                <h3 className="font-outfit font-extrabold text-lg leading-tight">
                  Install Variety Momo App
                </h3>
                <p className="text-white/80 text-xs font-medium mt-0.5">
                  Faster access, full-screen view & offline menu
                </p>
              </div>
            </div>
            <button
              onClick={closeManualGuide}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {canInstallNative && (
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-brand-900">Direct 1-Click Install Ready</p>
                <p className="text-[11px] text-brand-700 mt-0.5">Your browser supports instant installation.</p>
              </div>
              <button
                onClick={() => {
                  installApp();
                  closeManualGuide();
                }}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            </div>
          )}

          {/* iOS Safari Guide */}
          {isIos && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>On iPhone / iPad (Safari)</span>
              </div>
              <ol className="space-y-2 text-xs text-stone-700 font-medium pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Tap the <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-semibold"><Share2 className="w-3 h-3 text-blue-600 inline" /> Share</strong> button at the bottom of Safari.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Scroll down and tap <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-semibold"><PlusSquare className="w-3 h-3 text-stone-800 inline" /> Add to Home Screen</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Tap <strong>Add</strong> in the top right corner. The Variety Momo app icon will appear on your Home Screen!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Android Chrome Guide */}
          {isAndroid && !canInstallNative && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>On Android (Chrome / Edge)</span>
              </div>
              <ol className="space-y-2 text-xs text-stone-700 font-medium pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Tap the <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-semibold"><MoreVertical className="w-3 h-3 inline" /> Menu</strong> (three dots in top right).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Select <strong className="text-stone-900 font-bold">Install App</strong> or <strong className="text-stone-900 font-bold">Add to Home screen</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Tap <strong>Install</strong> to add the official Variety Momo app to your app drawer.
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Desktop / General Guide */}
          {!isIos && !isAndroid && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Globe className="w-4 h-4 text-brand-600" />
                <span>On Desktop (Chrome, Edge or Brave)</span>
              </div>
              <ol className="space-y-2 text-xs text-stone-700 font-medium pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Look at the right side of the address bar at the top of your browser.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Click the <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-semibold"><Download className="w-3 h-3 text-stone-800 inline" /> Install</strong> icon in the address bar (or click browser menu <strong>⋮ → Save and share → Install Variety Momo</strong>).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-800 shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Click <strong>Install</strong> to launch Variety Momo in its own standalone window!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* PWA Benefits */}
          <div className="pt-3 border-t border-stone-200 space-y-1.5 text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Instant order tracking & live notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full screen app experience with no browser clutter</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ultra-fast load times & lightweight on device memory</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={closeManualGuide}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
