'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================================
// TYPES
// ============================================================================

interface ImageUploadAreaProps {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Drag-and-drop image upload area with preview
 * Validates file type and size before accepting
 */
export default function ImageUploadArea({
  onFileSelect,
  onFileClear,
  disabled = false,
}: ImageUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please use JPG, PNG, WebP, or GIF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 50MB.';
    }
    return null;
  }, []);

  // Handle file selection
  const handleFile = useCallback((file: File) => {
    // Clear previous state
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Validate
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setPreviewUrl(null);
      return;
    }

    // Create preview and notify parent
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelect(file);
  }, [previewUrl, validateFile, onFileSelect]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, handleFile]);

  // Handle click to open file picker
  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  // Handle clear/remove image
  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onFileClear();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, onFileClear]);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        aria-label="Select image"
      />

      {/* Drop zone / Preview area */}
      {previewUrl ? (
        // Image preview
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={previewUrl}
            alt="Selected image preview"
            fill
            className="object-contain"
          />
          
          {/* Remove button */}
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleClear}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        // Empty drop zone
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full aspect-square rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-4
            cursor-pointer transition-colors
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label="Click or drag to select an image"
        >
          <div className="p-4 rounded-full bg-gray-200">
            <ImagePlus className="h-8 w-8 text-gray-500" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop your image here' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WebP, or GIF (max 50MB)
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

