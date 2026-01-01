'use client';

import { useEffect, useState } from 'react';

export interface AppModeInfo {
  isAppMode: boolean;
  isInstalled: boolean;
  displayMode: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' | 'window-controls-overlay';
}

/**
 * Hook to detect if the app is running in installed/app mode
 * This is useful for adjusting UI when the app is launched from home screen
 */
export function useAppMode(): AppModeInfo {
  const [appModeInfo, setAppModeInfo] = useState<AppModeInfo>({
    isAppMode: false,
    isInstalled: false,
    displayMode: 'browser',
  });

  useEffect(() => {
    // Check if app is running in standalone/app mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // Check if there's a beforeinstallprompt event (can be installed)
    let isInstalled = isStandalone;

    // Listen for app mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newIsAppMode = e.matches;
      setAppModeInfo({
        isAppMode: newIsAppMode,
        isInstalled: newIsAppMode,
        displayMode: newIsAppMode ? 'standalone' : 'browser',
      });
      
      // Apply app mode styling to document
      if (newIsAppMode) {
        document.documentElement.classList.add('app-mode');
        document.body.classList.add('app-mode');
      } else {
        document.documentElement.classList.remove('app-mode');
        document.body.classList.remove('app-mode');
      }
    };

    // Set initial state
    const initialAppModeInfo: AppModeInfo = {
      isAppMode: isStandalone,
      isInstalled: isInstalled,
      displayMode: isStandalone ? 'standalone' : 'browser',
    };
    
    // Only update if different from current state
    setAppModeInfo(current => {
      if (
        current.isAppMode !== initialAppModeInfo.isAppMode ||
        current.isInstalled !== initialAppModeInfo.isInstalled ||
        current.displayMode !== initialAppModeInfo.displayMode
      ) {
        return initialAppModeInfo;
      }
      return current;
    });

    if (isStandalone) {
      document.documentElement.classList.add('app-mode');
      document.body.classList.add('app-mode');
    }

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return appModeInfo;
}

/**
 * Hook to manage PWA install prompt
 */
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (alreadyInstalled && !isInstalled) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return false;
    }

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }
    
    return false;
  };

  return { installPrompt, isInstalled, promptInstall };
}
