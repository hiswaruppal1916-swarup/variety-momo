import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PwaContext = createContext(null);

const SESSION_DISMISS_KEY = 'variety_momo_pwa_dismissed_session';
const LOCAL_DISMISS_KEY = 'variety_momo_pwa_dismissed_timestamp';
const LOCAL_DISMISS_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

export function checkIsStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    window.navigator?.standalone === true ||
    document.referrer?.includes('android-app://')
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
  const [showBanner, setShowBanner] = useState(false);
  const [isManualGuideOpen, setIsManualGuideOpen] = useState(false);

  // Monitor standalone display mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStandalone = () => {
      const standalone = checkIsStandalone();
      setIsStandalone(standalone);
      if (standalone) {
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
      setShowBanner(false);
      setIsManualGuideOpen(false);
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

  // Show installation banner on homepage when not in standalone mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Check session dismissal
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        return;
      }
      const lastDismissed = localStorage.getItem(LOCAL_DISMISS_KEY);
      if (lastDismissed) {
        const elapsed = Date.now() - parseInt(lastDismissed, 10);
        if (elapsed < LOCAL_DISMISS_COOLDOWN_MS) {
          return;
        }
      }
    } catch (_) {}

    // Gentle 1s mount delay for smooth slide-up animation
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isStandalone]);

  // Handle Android Back button when Manual Guide modal is open
  useEffect(() => {
    if (!isManualGuideOpen) return;

    window.history.pushState({ varietyModal: 'pwa-install-guide' }, '');

    const handlePopState = () => {
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
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
      localStorage.setItem(LOCAL_DISMISS_KEY, Date.now().toString());
    } catch (_) {}
  }, []);

  const openManualGuide = useCallback(() => {
    setIsManualGuideOpen(true);
  }, []);

  const closeManualGuide = useCallback(() => {
    if (window.history.state?.varietyModal === 'pwa-install-guide') {
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
        } else {
          dismissBanner();
        }
      } catch (err) {
        console.warn('Install prompt execution error:', err);
        openManualGuide();
      }
    } else {
      // Native prompt not supported in this browser (e.g. Safari / Firefox / desktop without prompt): show step-by-step guidance
      openManualGuide();
    }
  }, [deferredPrompt, dismissBanner, openManualGuide]);

  const canInstallNative = Boolean(deferredPrompt);

  return (
    <PwaContext.Provider
      value={{
        isStandalone,
        canInstallNative,
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
