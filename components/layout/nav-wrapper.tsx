import MainNav from '@/components/layout/main-nav';

// ============================================================================
// TYPES
// ============================================================================

interface NavWrapperProps {
  username: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Wrapper that conditionally renders navigation for authenticated users
 * Server Component - receives username from parent layout
 */
export default function NavWrapper({ username }: NavWrapperProps) {
  // Don't render nav if user is not authenticated
  if (!username) {
    return null;
  }

  return <MainNav username={username} />;
}

