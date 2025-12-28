'use server';

import { db, users } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByUsername } from '@/lib/profile';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_BIO_LENGTH = 150;

// ============================================================================
// TYPES
// ============================================================================

type UpdateBioResult = {
  success: true;
} | {
  success: false;
  error: string;
};

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Updates the current user's bio
 * Validates bio length and ensures user is authenticated
 * 
 * @param bio - New bio text (max 150 characters)
 * @param username - Username for cache revalidation and redirect
 * @returns Result object with success/error status
 */
export async function updateBio(bio: string, username: string): Promise<UpdateBioResult> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to update your profile',
      };
    }

    // Verify the user is editing their own profile
    const profile = await getProfileByUsername(username);
    
    if (!profile) {
      return {
        success: false,
        error: 'Profile not found',
      };
    }

    if (profile.id !== currentUser.userId) {
      return {
        success: false,
        error: 'You can only edit your own profile',
      };
    }

    // Validate bio length (server-side validation is critical)
    const trimmedBio = bio.trim();
    
    if (trimmedBio.length > MAX_BIO_LENGTH) {
      return {
        success: false,
        error: `Bio must be ${MAX_BIO_LENGTH} characters or less`,
      };
    }

    // Update bio in database
    // Store as null if empty, otherwise store the trimmed value
    const bioValue = trimmedBio.length === 0 ? null : trimmedBio;
    
    await db
      .update(users)
      .set({ bio: bioValue })
      .where(eq(users.id, currentUser.userId));

    // Revalidate the profile page cache
    revalidatePath(`/profile/${username}`);

    // Redirect to profile page
    redirect(`/profile/${username}`);
  } catch (error: any) {
    // Let NEXT_REDIRECT propagate
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('Error updating bio:', error);
    return {
      success: false,
      error: 'Failed to update bio. Please try again.',
    };
  }
}

