import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getProfileByUsername } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import EditProfileForm from '@/components/profile/edit-profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EditProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

/**
 * Generate metadata for the edit profile page
 */
export async function generateMetadata({ params }: EditProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  
  return {
    title: `Edit Profile | ${decodeURIComponent(username)}`,
    description: 'Edit your profile information',
  };
}

/**
 * Edit profile page Server Component
 * Checks authorization and renders edit form if user owns the profile
 */
export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  // Get current authenticated user
  const currentUser = await getCurrentUser();
  
  // If not logged in, redirect to login
  if (!currentUser) {
    redirect('/login');
  }

  // Fetch the profile being edited
  const profile = await getProfileByUsername(decodedUsername);
  
  // If profile doesn't exist, show 404
  if (!profile) {
    notFound();
  }

  // Authorization check: only profile owner can edit
  if (profile.id !== currentUser.userId) {
    // Redirect to the profile page (not their own)
    redirect(`/profile/${decodedUsername}`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <EditProfileForm
              username={profile.username}
              currentBio={profile.bio}
              profilePictureUrl={profile.profilePictureUrl}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

