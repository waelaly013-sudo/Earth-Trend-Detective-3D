/**
 * NASA Earth Trend Detective - PWA & Desktop Laptop Install Hook
 * Manages beforeinstallprompt events, standalone mode detection, and installation flows.
 */

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// What this does: Checks if the user can install this website onto their laptop or phone like a real desktop app, and listens for the browser's install event.
// On the website: Powers the "Install App on Laptop" window so it knows whether one-click install is ready or if manual steps are needed.
// Used as: The reusable PWA installation helper hook.
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // What this does: Runs once when the app opens to detect if it's already installed, what device the user is on (iPhone vs laptop), and saves the install prompt.
  // On the website: Helps the Download/Install popup show the right instructions for Windows, Mac, Android, or iPhone.
  // Used as: The device and browser install-readiness listener.
  useEffect(() => {
    // Detect standalone mode (already installed on desktop or mobile)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsIOS(isIOSDevice);
    setIsDesktop(!isMobileDevice);

    // What this does: Catches the browser's built-in "Install app" popup event and holds onto it until the user clicks our Install button.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // What this does: Updates our state to "Installed" as soon as the user finishes installing the app.
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // What this does: Opens the browser's native "Install App" dialog when the user clicks Install, and tells us if they accepted or canceled.
  // On the website: Triggered by the big "Install Now" button inside the Download App popup.
  // Used as: The one-click app installer launcher.
  const install = async (): Promise<'accepted' | 'dismissed' | 'manual_required'> => {
    if (!deferredPrompt) {
      return 'manual_required';
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('Install prompt error:', err);
      return 'manual_required';
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isDesktop,
    install,
  };
}
