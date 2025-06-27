'use client';

import { useState, useRef, useEffect } from 'react';
import { ShareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { XIcon, LinkedInIcon } from '@/components/icons/SocialIcons';

interface ShareButtonProps {
  post: {
    id: string;
    title?: string | null;
    user: {
      username: string;
    };
  };
}

export function ShareButton({ post }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${post.user.username}`
      : '';

  const shareText = post.title
    ? `"${post.title}" by @${post.user.username}`
    : `Check out this post by @${post.user.username}`;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        aria-label="Share options"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        <ShareIcon className="w-4 h-4 mr-1.5" />
        Share
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 transition-opacity duration-200"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="share-menu"
        >
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            role="menuitem"
            onClick={() => setShowMenu(false)}
          >
            <XIcon className="w-4 h-4 mr-3" />
            Share on X (Twitter)
          </a>

          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            role="menuitem"
            onClick={() => setShowMenu(false)}
          >
            <LinkedInIcon className="w-4 h-4 mr-3" />
            Share on LinkedIn
          </a>

          <hr className="my-1 border-gray-200" />

          <button
            onClick={copyLink}
            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors"
            role="menuitem"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 mr-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <ShareIcon className="w-4 h-4 mr-3" />
                Copy link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
