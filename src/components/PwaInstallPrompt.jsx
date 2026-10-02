import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePwa } from '../context/PwaContext';

export default function PwaInstallPrompt() {
  const {
    isStandalone,
    isAppInstalled,
    showBanner,
    dismissBanner,
    installApp,
    canInstallNative
  } = usePwa();
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed or banner not active, render nothing
  if (isStandalone || isAppInstalled || !showBanner) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await installApp();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Install Variety Momo App"
      className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-2xl rounded-3xl p-4 sm:p-5 text-stone-900 transition-all animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3.5">
        {/* App Icon */}
        <div className="relative shrink-0">
          <img
            src="/pwa-192x192.png"
            alt="Variety Momo App"
            className="w-12 h-12 rounded-2xl object-cover shadow-md border border-stone-200"
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
            ★
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-5">
          <h4 className="font-outfit font-extrabold text-stone-900 text-sm tracking-tight flex items-center gap-1.5">
            <span role="img" aria-label="mobile">📱</span> Install Variety Momo App
          </h4>
          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed font-medium">
            Install our app for a faster ordering experience.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {canInstallNative ? (
                <Download className="w-3.5 h-3.5" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
            </button>

            <button
              onClick={dismissBanner}
              className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={dismissBanner}
          className="absolute top-3 right-3 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
