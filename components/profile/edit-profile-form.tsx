'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateBio } from '@/app/actions/profile';
import AvatarUpload from '@/components/profile/avatar-upload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_BIO_LENGTH = 150;
const WARNING_THRESHOLD = 135;

// ============================================================================
// TYPES
// ============================================================================

interface EditProfileFormProps {
  username: string;
  currentBio: string | null;
  profilePictureUrl: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Edit profile form with bio textarea and character counter
 * Includes real-time validation and color-coded counter
 */
export default function EditProfileForm({
  username,
  currentBio,
  profilePictureUrl,
}: EditProfileFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Form state
  const [bio, setBio] = useState(currentBio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && bio !== currentBio) {
      setError(null);
    }
  }, [bio, currentBio, error]);

  // Character count helpers
  const charCount = bio.length;
  const isOverLimit = charCount > MAX_BIO_LENGTH;
  const isWarning = charCount >= WARNING_THRESHOLD && charCount <= MAX_BIO_LENGTH;
  const remainingChars = MAX_BIO_LENGTH - charCount;

  // Get counter color class
  const getCounterColorClass = () => {
    if (isOverLimit) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-gray-500';
  };

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isOverLimit) {
      setError(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateBio(bio, username);
      
      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, the Server Action will redirect
    } catch (err: any) {
      // Let NEXT_REDIRECT propagate
      if (err?.digest?.includes('NEXT_REDIRECT')) {
        throw err;
      }
      
      setError('Failed to update bio. Please try again.');
      setIsSubmitting(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    router.push(`/profile/${username}`);
  }

  // Track current avatar URL (updates when upload succeeds)
  const [currentAvatar, setCurrentAvatar] = useState(profilePictureUrl);

  // Handle successful avatar upload
  const handleAvatarSuccess = (newUrl: string) => {
    setCurrentAvatar(newUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-900" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex flex-col items-center py-4 border-b border-gray-100">
        <AvatarUpload
          username={username}
          currentAvatarUrl={currentAvatar}
          onSuccess={handleAvatarSuccess}
        />
        <p className="mt-2 text-sm font-medium text-gray-900">{username}</p>
      </div>

      {/* Bio Textarea */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          ref={textareaRef}
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write a short bio about yourself..."
          rows={4}
          disabled={isSubmitting}
          className={`resize-none ${isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          aria-describedby="bio-counter"
        />
        
        {/* Character Counter */}
        <div 
          id="bio-counter"
          className={`text-sm text-right ${getCounterColorClass()}`}
          aria-live="polite"
        >
          {isOverLimit ? (
            <span>{Math.abs(remainingChars)} characters over limit</span>
          ) : (
            <span>{charCount}/{MAX_BIO_LENGTH}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || isOverLimit}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

