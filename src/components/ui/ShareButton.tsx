'use client';

import { useState } from 'react';
import { ShareIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
}

export default function ShareButton({ url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Convert relative URL to absolute URL
    const absoluteUrl = url.startsWith('http')
      ? url
      : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;

    // Check if the Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Share',
          text: text || '',
          url: absoluteUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackCopy(absoluteUrl);
        }
      }
    } else {
      // Fallback to copying to clipboard
      fallbackCopy(absoluteUrl);
    }
  };

  const fallbackCopy = (urlToCopy: string) => {
    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error('Failed to copy:', error);
      });
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
      title="Share this post"
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4 mr-1.5 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <ShareIcon className="w-4 h-4 mr-1.5" />
          Share
        </>
      )}
    </button>
  );
}
