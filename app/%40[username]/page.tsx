import { redirect } from 'next/navigation';

interface AtUsernamePageProps {
  params: Promise<{
    username: string;
  }>;
}

/**
 * Redirect route for /@username pattern
 * Redirects to the canonical /profile/[username] URL
 */
export default async function AtUsernamePage({ params }: AtUsernamePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  
  // Redirect to canonical profile URL
  redirect(`/profile/${decodedUsername}`);
}

