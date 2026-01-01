'use client';

import { useEffect, useState } from 'react';
import { useAppMode, useInstallPrompt } from '@/lib/useAppMode';
import { useTranslation } from '@/lib/i18n';

/**
 * PWAInstaller Component
 * Handles PWA installation prompts and app mode styling
 * This component automatically detects when the app is launched from home screen (app mode)
 */
export default function PWAInstaller() {
  const appMode = useAppMode();
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { t } = useTranslation();

  // Detect iOS on mount
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  useEffect(() => {
    // Apply app mode styling when in app mode
    if (appMode.isAppMode) {
      document.documentElement.style.setProperty('--app-mode', '1');
    }
  }, [appMode.isAppMode]);

  useEffect(() => {
    // Only show install prompt if not installed and on a supporting platform
    const shouldShow = installPrompt && !isInstalled && !isIOS;
    if (shouldShow !== showInstallPrompt) {
      setShowInstallPrompt(shouldShow);
    }
  }, [installPrompt, isInstalled, isIOS, showInstallPrompt]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // Show banner only on non-app mode and not on iOS (which has different install flow)
  if (appMode.isAppMode || !showInstallPrompt || isInstalled || isIOS) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold">{t.pwa.installTitle}</p>
          <p className="text-xs opacity-90">{t.pwa.installSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white text-pink-500 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            {t.pwa.install}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
