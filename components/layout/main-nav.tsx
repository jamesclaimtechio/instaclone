'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, User, LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/search/search-bar';

// ============================================================================
// TYPES
// ============================================================================

interface MainNavProps {
  username: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Main navigation bar for authenticated users
 * Shows home, create, profile, and logout
 */
export default function MainNav({ username }: MainNavProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutUser();
  };

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/create',
      label: 'Create',
      icon: PlusSquare,
      active: pathname === '/create',
    },
    {
      href: `/profile/${username}`,
      label: 'Profile',
      icon: User,
      active: pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo - Desktop only */}
          <Link 
            href="/" 
            className="hidden md:block text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent"
          >
            InstaClone
          </Link>

          {/* Search Bar - Desktop only */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
            <SearchBar />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                    md:flex-row md:gap-2
                    ${item.active 
                      ? 'text-gray-900' 
                      : 'text-gray-500 hover:text-gray-900'
                    }
                  `}
                  aria-label={item.label}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <Icon className={`h-6 w-6 ${item.active ? 'fill-current' : ''}`} />
                  <span className="text-xs md:text-sm font-medium hidden md:inline">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Logout - Desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </Button>

            {/* Logout - Mobile */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors md:hidden"
              aria-label="Logout"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

