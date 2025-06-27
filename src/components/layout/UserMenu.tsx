'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SignOutButton } from '@/components/auth';

export function UserMenu() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          handleClose();
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev < 2 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 2));
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0) {
            event.preventDefault();
            const links = menuRef.current?.querySelectorAll('a, button');
            if (links && links[focusedIndex]) {
              (links[focusedIndex] as HTMLElement).click();
            }
          }
          break;
      }
    },
    [open, focusedIndex]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      setFocusedIndex(0);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      setFocusedIndex(-1);
    }
  }, [open, handleKeyDown]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 150);
  };

  const handleToggle = () => {
    if (open) {
      handleClose();
    } else {
      setOpen(true);
    }
  };

  const getItemClass = (index: number) => {
    const baseClass =
      'block px-4 py-2 text-sm transition-colors focus:outline-none';
    const focusClass =
      focusedIndex === index ? 'bg-gray-100 dark:bg-gray-800' : '';
    const hoverClass = 'hover:bg-gray-100 dark:hover:bg-gray-800';
    const textClass =
      index === 1
        ? 'text-gray-500 dark:text-gray-500'
        : 'text-gray-700 dark:text-gray-300';
    return `${baseClass} ${textClass} ${hoverClass} ${focusClass}`;
  };

  if (!user) return null;

  const username = profile?.username || user.email?.split('@')[0] || 'user';
  const profileUrl = profile?.username ? `/${profile.username}` : '/profile';

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        id="user-menu-button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>@{username}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-48 origin-top-right transition-all duration-150 ease-out ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div
            className="rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-900 dark:ring-gray-800"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
          >
            <Link
              href={profileUrl}
              className={getItemClass(0)}
              onClick={handleClose}
              role="menuitem"
              tabIndex={-1}
            >
              View Profile
            </Link>
            <Link
              href="/settings"
              className={getItemClass(1)}
              onClick={handleClose}
              role="menuitem"
              tabIndex={-1}
            >
              Settings
            </Link>
            <hr className="my-1 border-gray-200 dark:border-gray-800" />
            <div className="px-4 py-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
