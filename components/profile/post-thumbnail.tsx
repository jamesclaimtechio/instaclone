import Image from 'next/image';
import Link from 'next/link';
import { ProfilePost } from '@/lib/profile.types';
import { Heart, MessageCircle } from 'lucide-react';

interface PostThumbnailProps {
  post: ProfilePost;
}

/**
 * Individual post thumbnail for the profile grid
 * Shows the thumbnail image with hover overlay
 */
export default function PostThumbnail({ post }: PostThumbnailProps) {
  return (
    <Link 
      href={`/post/${post.id}`}
      className="relative aspect-square block group overflow-hidden bg-gray-100"
    >
      <Image
        src={post.thumbnailUrl || post.imageUrl}
        alt={post.caption || 'Post image'}
        fill
        className="object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      
      {/* Hover overlay - shows on desktop hover */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1 text-white font-semibold">
          <Heart className="w-5 h-5 fill-white" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1 text-white font-semibold">
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>0</span>
        </div>
      </div>
    </Link>
  );
}

