import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PwaContext = createContext(null);

const DISMISS_KEY = 'variety_momo_pwa_dismissed';
const INSTALLED_KEY = 'variety_momo_pwa_installed';
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown for banner

export function checkIsStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function PwaProvider({ children }) {
  const [isStandalone, setIsStandalone] = useState(() => checkIsStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState(() => {
    if (typeof window !== 'undefined' && window.deferredPwaPrompt) {
      return window.deferredPwaPrompt;
    }
    return null;
  });
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (checkIsStandalone()) return true;
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  });
  const [showBanner, setShowBanner] = useState(false);
  const [isManualGuideOpen, setIsManualGuideOpen] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Monitor standalone display mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStandalone = () => {
      const standalone = checkIsStandalone();
      setIsStandalone(standalone);
      if (standalone) {
        setIsAppInstalled(true);
        setShowBanner(false);
      }
    };

    updateStandalone();

    const mql = window.matchMedia?.('(display-mode: standalone)');
    if (mql?.addEventListener) {
      mql.addEventListener('change', updateStandalone);
      return () => mql.removeEventListener('change', updateStandalone);
    } else if (mql?.addListener) {
      mql.addListener(updateStandalone);
      return () => mql.removeListener(updateStandalone);
    }
  }, []);

  // Listen for beforeinstallprompt & appinstalled
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (checkIsStandalone()) {
      return;
    }

    // Check if early capture in index.html already caught it
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
    }

    const handlePromptReady = () => {
      if (window.deferredPwaPrompt) {
        setDeferredPrompt(window.deferredPwaPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
      setIsAppInstalled(true);
      setShowBanner(false);
      setIsManualGuideOpen(false);
      try {
        localStorage.setItem(INSTALLED_KEY, 'true');
      } catch (_) {}
    };

    window.addEventListener('variety-momo-pwa-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('variety-momo-pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('variety-momo-pwa-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('variety-momo-pwa-installed', handleAppInstalled);
    };
  }, []);

  // Detect user interaction before displaying non-intrusive banner
  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone || isAppInstalled) return;

    // Check dismissal cooldown
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const timeSince = Date.now() - parseInt(dismissedAt, 10);
        if (timeSince < DISMISS_COOLDOWN_MS) {
          return;
        }
      }
    } catch (_) {}

    const onInteract = () => {
      setUserInteracted(true);
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('keydown', onInteract);
    };

    window.addEventListener('scroll', onInteract, { passive: true, once: true });
    window.addEventListener('click', onInteract, { passive: true, once: true });
    window.addEventListener('touchstart', onInteract, { passive: true, once: true });
    window.addEventListener('keydown', onInteract, { passive: true, once: true });

    // Fallback timer: Show banner after 4 seconds of reading/browsing if not dismissed
    const timer = setTimeout(() => {
      setUserInteracted(true);
    }, 4000);

    return () => {
      clearTimeout(timer);
      cleanupListeners();
    };
  }, [isStandalone, isAppInstalled]);

  // Once user interacted and prompt is available (or iOS Safari detected), show banner
  useEffect(() => {
    if (!userInteracted || isStandalone || isAppInstalled) {
      return;
    }

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const timeSince = Date.now() - parseInt(dismissedAt, 10);
        if (timeSince < DISMISS_COOLDOWN_MS) {
          setShowBanner(false);
          return;
        }
      }
    } catch (_) {}

    // Show on Android Chrome / Chromium when prompt is ready
    if (deferredPrompt) {
      setShowBanner(true);
      return;
    }

    // Also show for iOS Safari as friendly add-to-home hint
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|chrome|android/.test(ua);
    if (isIos && isSafari) {
      setShowBanner(true);
    }
  }, [userInteracted, deferredPrompt, isStandalone, isAppInstalled]);

  // Handle Android Back button when Manual Guide modal is open
  useEffect(() => {
    if (!isManualGuideOpen) return;

    // Push state for back button navigation
    window.history.pushState({ modal: 'pwa-install-guide' }, '');

    const handlePopState = (e) => {
      setIsManualGuideOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isManualGuideOpen]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (_) {}
  }, []);

  const openManualGuide = useCallback(() => {
    setIsManualGuideOpen(true);
  }, []);

  const closeManualGuide = useCallback(() => {
    if (window.history.state?.modal === 'pwa-install-guide') {
      window.history.back();
    } else {
      setIsManualGuideOpen(false);
    }
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setShowBanner(false);
          setDeferredPrompt(null);
          setIsAppInstalled(true);
          try {
            localStorage.setItem(INSTALLED_KEY, 'true');
          } catch (_) {}
        } else {
          dismissBanner();
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        openManualGuide();
      }
    } else {
      // Native prompt not directly available: show guidance modal
      openManualGuide();
    }
  }, [deferredPrompt, dismissBanner, openManualGuide]);

  const canInstallNative = Boolean(deferredPrompt);

  return (
    <PwaContext.Provider
      value={{
        isStandalone,
        canInstallNative,
        isAppInstalled,
        showBanner,
        setShowBanner,
        dismissBanner,
        installApp,
        isManualGuideOpen,
        openManualGuide,
        closeManualGuide
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    return {
      isStandalone: false,
      canInstallNative: false,
      isAppInstalled: false,
      showBanner: false,
      setShowBanner: () => {},
      dismissBanner: () => {},
      installApp: () => {},
      isManualGuideOpen: false,
      openManualGuide: () => {},
      closeManualGuide: () => {}
    };
  }
  return context;
}
