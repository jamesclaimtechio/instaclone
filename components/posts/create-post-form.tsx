'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadImage } from '@/app/actions/upload';
import { createPost } from '@/app/actions/posts';
import ImageUploadArea from '@/components/posts/image-upload-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Check } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type UploadPhase = 'idle' | 'uploading' | 'creating' | 'success' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Complete post creation form with image upload and caption
 * Handles the two-phase upload flow: image upload → post creation
 */
export default function CreatePostForm() {
  const router = useRouter();

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  // Get phase-specific button text
  const getButtonText = () => {
    switch (phase) {
      case 'uploading':
        return 'Uploading image...';
      case 'creating':
        return 'Creating post...';
      case 'success':
        return 'Post created!';
      default:
        return 'Share';
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  // Handle file clear
  const handleFileClear = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image.');
      return;
    }

    setError(null);
    setPhase('uploading');

    try {
      // Phase 1: Upload image to R2
      const formData = new FormData();
      formData.append('image', selectedFile);

      const uploadResult = await uploadImage(formData);

      if (!uploadResult.success) {
        setError(uploadResult.error);
        setPhase('error');
        return;
      }

      // Phase 2: Create post in database
      setPhase('creating');

      const postResult = await createPost({
        imageUrl: uploadResult.imageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        blurHash: uploadResult.blurHash,
        caption: caption.trim() || undefined,
      });

      if (!postResult.success) {
        setError(postResult.error);
        setPhase('error');
        return;
      }

      // Success!
      setPhase('success');
      
      // Redirect to feed after brief delay to show success
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);

    } catch (err: any) {
      // Handle NEXT_REDIRECT
      if (err?.digest?.includes('NEXT_REDIRECT')) {
        throw err;
      }

      console.error('Post creation error:', err);
      setError('Something went wrong. Please try again.');
      setPhase('error');
    }
  }, [selectedFile, caption, router]);

  // Determine if form is submittable
  const isSubmitting = phase === 'uploading' || phase === 'creating';
  const isSuccess = phase === 'success';
  const canSubmit = selectedFile && !isSubmitting && !isSuccess;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div 
          className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-900" 
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && (
        <div 
          className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-900" 
          role="alert"
        >
          <Check className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">Post created! Redirecting...</p>
        </div>
      )}

      {/* Image Upload Area */}
      <div>
        <Label className="mb-2 block">Photo</Label>
        <ImageUploadArea
          onFileSelect={handleFileSelect}
          onFileClear={handleFileClear}
          disabled={isSubmitting || isSuccess}
        />
      </div>

      {/* Caption Input */}
      <div>
        <Label htmlFor="caption" className="mb-2 block">
          Caption <span className="text-gray-500 font-normal">(optional)</span>
        </Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={4}
          disabled={isSubmitting || isSuccess}
          className="resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full"
        size="lg"
      >
        {(isSubmitting || isSuccess) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {getButtonText()}
      </Button>

      {/* Helpful text */}
      {!selectedFile && !error && phase === 'idle' && (
        <p className="text-center text-sm text-gray-500">
          Select a photo to share with your followers
        </p>
      )}
    </form>
  );
}

