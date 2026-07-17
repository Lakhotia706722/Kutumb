'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Monitors browser network/session state and shows alerts for:
 * - Offline status
 * - Session expiry warnings (from API)
 */
export default function SessionAlert() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 shadow-md max-w-md mx-auto md:max-w-none md:left-auto md:right-4 md:max-w-sm z-50">
      <span className="font-medium">You're offline</span>
      <span className="text-amber-600"> — some features may not work until you reconnect.</span>
    </div>
  );
}
