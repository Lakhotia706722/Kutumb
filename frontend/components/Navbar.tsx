'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { alertsApi } from '@/lib/alerts';

export default function Navbar() {
  const { user, family, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending alert count once when the user is authenticated
  useEffect(() => {
    if (!user) return;
    alertsApi.list()
      .then((res) => setPendingCount(res.data.total))
      .catch(() => {}); // silently ignore — badge is a nice-to-have
  }, [user, pathname]); // re-fetch when navigating (resolving/dismissing updates the count)

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navLink = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
        pathname === href
          ? 'bg-orange-100 text-orange-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold text-orange-600">कुटुम्ब</span>
          {family && (
            <span className="hidden sm:inline text-xs text-gray-400 font-normal truncate max-w-[100px]">
              {family.name}
            </span>
          )}
        </Link>

        {/* Nav links */}
        {user && (
          <nav className="flex items-center gap-1">
            {navLink('/feed', 'Feed', pendingCount)}
            {navLink('/vault', 'Vault')}
            {navLink('/family', 'Family')}
          </nav>
        )}

        {/* User / logout */}
        {user ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-gray-500 truncate max-w-[100px]">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
