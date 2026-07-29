'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/search" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <span className="navbar-brand-icon">🎵</span>
          Melodify
        </Link>

        <div className="navbar-links">
          <Link href="/search" className={`navbar-link ${pathname === '/search' ? 'active' : ''}`}>
            🔍 Search
          </Link>
          <Link href="/library" className={`navbar-link ${pathname === '/library' ? 'active' : ''}`}>
            📚 Library
          </Link>
          <Link href="/analytics" className={`navbar-link ${pathname === '/analytics' ? 'active' : ''}`}>
            📊 Analytics
          </Link>
        </div>

        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
