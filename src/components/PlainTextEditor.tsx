'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Maximize2, Minimize2 } from 'lucide-react';

const AUTO_SAVE_DELAY = 1000;
export const DRAFT_CONTENT_KEY = 'draft-content';
export const DRAFT_TIMESTAMP_KEY = 'draft-timestamp';

interface PlainTextEditorProps {
  initialContent?: string;
  placeholder?: string;
}

export default function PlainTextEditor({
  initialContent = '',
  placeholder = 'Start writing your content here...',
}: PlainTextEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save to localStorage with cleanup
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (content && !isUnmountingRef.current) {
      setHasUnsavedChanges(true);
      saveTimeoutRef.current = setTimeout(() => {
        if (!isUnmountingRef.current) {
          try {
            localStorage.setItem(DRAFT_CONTENT_KEY, content);
            localStorage.setItem(DRAFT_TIMESTAMP_KEY, new Date().toISOString());
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
          } catch (error) {
            console.error('Failed to save draft:', error);
          }
        }
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isUnmountingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!initialContent) {
      const savedContent = localStorage.getItem(DRAFT_CONTENT_KEY);
      const savedTimestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

      if (savedContent) {
        setContent(savedContent);
        if (savedTimestamp) {
          setLastSaved(new Date(savedTimestamp));
        }
      }
    }
  }, [initialContent]);

  // Update content when initialContent changes (for reset functionality)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Calculate word count and reading time
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const count = words.length;
    setWordCount(count);

    // Average reading speed (200 words per minute)
    const minutes = Math.ceil(count / 200);
    setReadingTime(minutes);
  }, [content]);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(!isFocusMode);
  }, [isFocusMode]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;

    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Saved just now';
    if (minutes < 60) {
      return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (hours < 24) return `Saved ${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `Saved on ${lastSaved.toLocaleDateString()}`;
  };

  return (
    <div
      className={`flex flex-col h-full ${isFocusMode ? 'fixed inset-0 z-50 bg-white' : ''}`}
    >
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between p-4 border-b ${isFocusMode ? 'bg-white' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{wordCount} words</span>
            <span className="text-gray-400">•</span>
            <span>{readingTime} min read</span>
          </div>
          {formatLastSaved() && (
            <span className="text-sm text-gray-500">{formatLastSaved()}</span>
          )}
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-500">• Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFocusMode}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
            aria-label={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {isFocusMode ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Plain text editor */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full resize-none border-none outline-none text-lg leading-relaxed"
            aria-label="Plain text editor"
          />
        </div>
      </div>
    </div>
  );
}
