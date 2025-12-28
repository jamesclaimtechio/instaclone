import Link from 'next/link';

interface UsernameLinkProps {
  username: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable component for clickable usernames throughout the app
 * Navigates to the user's profile page
 */
export default function UsernameLink({ 
  username, 
  className = '',
  children 
}: UsernameLinkProps) {
  return (
    <Link 
      href={`/profile/${encodeURIComponent(username)}`}
      className={`font-semibold hover:underline ${className}`}
    >
      {children || username}
    </Link>
  );
}

