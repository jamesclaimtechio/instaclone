'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { uploadProfilePicture } from '@/app/actions/upload';
import { updateProfilePicture } from '@/app/actions/profile';
import { getAvatarUrl } from '@/lib/profile.types';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, AlertCircle, Check } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================================
// TYPES
// ============================================================================

interface AvatarUploadProps {
  username: string;
  currentAvatarUrl: string | null;
  onSuccess?: (newUrl: string) => void;
}

type UploadState = 'idle' | 'previewing' | 'uploading' | 'success' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Avatar upload component with file selection, preview, and upload
 * Integrates with R2 storage via Server Actions
 */
export default function AvatarUpload({
  username,
  currentAvatarUrl,
  onSuccess,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Current display URL (uploaded > preview > current avatar)
  const displayUrl = uploadedUrl || previewUrl || getAvatarUrl(currentAvatarUrl, username);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      setUploadState('error');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 50MB');
      setUploadState('error');
      return;
    }

    // Clear any previous errors
    setError(null);
    setSelectedFile(file);

    // Generate preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setUploadState('previewing');
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setUploadState('error');
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    setUploadState('uploading');
    setError(null);

    try {
      // Create FormData for the Server Action
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload to R2
      const uploadResult = await uploadProfilePicture(formData);

      if (!uploadResult.success) {
        setError(uploadResult.error);
        setUploadState('error');
        return;
      }

      // Update database with new URL
      const updateResult = await updateProfilePicture(uploadResult.imageUrl, username);

      if (!updateResult.success) {
        setError(updateResult.error);
        setUploadState('error');
        return;
      }

      // Success!
      setUploadedUrl(uploadResult.imageUrl);
      setUploadState('success');
      setPreviewUrl(null);
      setSelectedFile(null);

      // Notify parent
      onSuccess?.(uploadResult.imageUrl);

      // Reset to idle after showing success briefly
      setTimeout(() => {
        setUploadState('idle');
      }, 2000);
    } catch (err: any) {
      // Let NEXT_REDIRECT propagate
      if (err?.digest?.includes('NEXT_REDIRECT')) {
        throw err;
      }

      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setUploadState('error');
    }
  }, [selectedFile, username, onSuccess]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    setUploadState('idle');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
          <Image
            src={displayUrl}
            alt={`${username}'s profile picture`}
            fill
            className="object-cover"
            priority
          />
          
          {/* Upload overlay on hover (when idle) */}
          {uploadState === 'idle' && (
            <button
              onClick={triggerFileInput}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Change profile picture"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Loading overlay */}
          {uploadState === 'uploading' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {/* Success overlay */}
          {uploadState === 'success' && (
            <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
              <Check className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Select profile picture"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons */}
      {uploadState === 'idle' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
        >
          <Camera className="h-4 w-4 mr-2" />
          Change photo
        </Button>
      )}

      {uploadState === 'previewing' && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
          >
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      )}

      {uploadState === 'uploading' && (
        <p className="text-sm text-gray-500">Uploading...</p>
      )}

      {uploadState === 'success' && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="h-4 w-4" />
          Photo updated!
        </p>
      )}

      {uploadState === 'error' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

