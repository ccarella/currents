'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Track open dialogs to manage body overflow
let openDialogCount = 0;

export function Dialog({
  open,
  onClose,
  children,
  className = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && mounted) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the dialog
      if (dialogRef.current) {
        dialogRef.current.focus();
      }

      // Increment dialog counter and hide body overflow
      openDialogCount++;
      if (openDialogCount === 1) {
        document.body.style.overflow = 'hidden';
      }

      // Handle keyboard events
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }

        // Tab trap
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);

        // Decrement dialog counter and restore body overflow if needed
        openDialogCount--;
        if (openDialogCount === 0) {
          document.body.style.overflow = '';
        }

        // Restore focus to the previous element
        if (
          previousActiveElement.current &&
          previousActiveElement.current.focus
        ) {
          previousActiveElement.current.focus();
        }
      };
    }
    return undefined;
  }, [open, onClose, mounted]);

  // Don't render on server or when not mounted
  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-all ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({
  children,
  className = '',
}: DialogContentProps) {
  return <div className={`mb-6 text-gray-600 ${className}`}>{children}</div>;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`flex justify-end gap-3 ${className}`}>{children}</div>
  );
}
