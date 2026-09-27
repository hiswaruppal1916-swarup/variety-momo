import React, { useState, useEffect } from 'react';
import { Download, Share2, X, PlusSquare } from 'lucide-react';

const DISMISS_KEY = 'variety_momo_pwa_dismissed';
const INSTALLED_KEY = 'variety_momo_pwa_installed';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone/installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Check dismissal cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
      if (timeSinceDismiss < DISMISS_COOLDOWN_MS) {
        return;
      }
    }

    const alreadyInstalled = localStorage.getItem(INSTALLED_KEY);
    if (alreadyInstalled === 'true') {
      return;
    }

    // 3. Android / Chromium: Listen for actual browser beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowAndroidPrompt(false);
      setShowIosPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem(INSTALLED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. iOS Safari Check: beforeinstallprompt is NOT supported by iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|chrome|android/.test(ua);

    if (isIos && isSafari && !isStandalone) {
      // Give the user a moment to browse before showing the non-intrusive instruction
      const timer = setTimeout(() => {
        setShowIosPrompt(true);
      }, 3500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowAndroidPrompt(false);
    setShowIosPrompt(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowAndroidPrompt(false);
        setDeferredPrompt(null);
      } else {
        // User clicked cancel inside native prompt
        handleDismiss();
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  // If neither prompt is active, render nothing
  if (!showAndroidPrompt && !showIosPrompt) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Install Variety Momo Application"
      className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-2xl rounded-3xl p-4 sm:p-5 text-stone-900 transition-all animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3.5">
        {/* App Icon */}
        <div className="relative shrink-0">
          <img
            src="/pwa-192x192.png"
            alt="Variety Momo App Icon"
            className="w-12 h-12 rounded-2xl object-cover shadow-md border border-stone-200"
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
            ★
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-5">
          <h4 className="font-outfit font-extrabold text-stone-900 text-sm tracking-tight flex items-center gap-1.5">
            Install Variety Momo
          </h4>
          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed font-medium">
            Install our app for faster ordering and easy access.
          </p>

          {/* iOS Safari Instruction Guidance */}
          {showIosPrompt && (
            <div className="mt-2.5 p-2 rounded-xl bg-stone-100/90 border border-stone-200 text-[11px] text-stone-700 flex items-center gap-2">
              <span className="font-semibold">Tap</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-stone-300 font-bold text-stone-900">
                <Share2 className="w-3 h-3 text-blue-600" /> Share
              </span>
              <span>→</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-stone-300 font-bold text-stone-900">
                <PlusSquare className="w-3 h-3 text-stone-800" /> Add to Home Screen
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3.5">
            {showAndroidPrompt && (
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
              </button>
            )}

            {showIosPrompt && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
              >
                Got It
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
