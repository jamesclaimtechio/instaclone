import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  MessageSquare,
  ArrowLeft,
  Shield
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AdminLayoutProps {
  children: React.ReactNode;
}

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

const adminNavItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/admin/posts',
    label: 'Posts',
    icon: ImageIcon,
  },
  {
    href: '/admin/comments',
    label: 'Comments',
    icon: MessageSquare,
  },
];

// ============================================================================
// LAYOUT
// ============================================================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-lg font-bold">Admin Dashboard</span>
            </div>
            
            {/* Back to App */}
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 bg-white border-r min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
          <div className="flex items-center justify-around h-16">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-gray-900"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

