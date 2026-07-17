'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import SessionAlert from '@/components/SessionAlert';
import Spinner from '@/components/Spinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ErrorBoundary>
      <SessionAlert />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        {/* pb-safe adds bottom padding for iOS home indicator */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 pb-safe">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
