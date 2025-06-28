'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Send, FileText, Maximize2, Minimize2, Eye, Edit3 } from 'lucide-react';
import PreviewPane from '@/components/editor/PreviewPane';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// Constants
const WORDS_PER_MINUTE = 200;
const AUTO_SAVE_DELAY = 1000;
export const DRAFT_CONTENT_KEY = 'draft-content';
export const DRAFT_TIMESTAMP_KEY = 'draft-timestamp';

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  initialContent = '',
  onSave,
  placeholder = 'Start writing your content here...',
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  // Touch gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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
    const savedContent = localStorage.getItem(DRAFT_CONTENT_KEY);
    const savedTimestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

    if (savedContent && !initialContent) {
      setContent(savedContent);
      if (savedTimestamp) {
        setLastSaved(new Date(savedTimestamp));
      }
    }
  }, [initialContent]);

  // Update content when initialContent changes (for reset functionality)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate word count and reading time
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const count = words.length;
    setWordCount(count);

    // Average reading speed
    const minutes = Math.ceil(count / WORDS_PER_MINUTE);
    setReadingTime(minutes);
  }, [content]);

  const handleSave = useCallback(async () => {
    if (onSave && !isUnmountingRef.current) {
      setIsSaving(true);
      try {
        await onSave(content);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to save:', error);
        // TODO: Show error notification to user
      } finally {
        if (!isUnmountingRef.current) {
          setIsSaving(false);
        }
      }
    }
  }, [content, onSave]);

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  const handleViewModeChange = useCallback(
    (mode: 'edit' | 'preview') => {
      if (mode === 'preview' && viewMode !== 'preview') {
        setIsPreviewLoading(true);
        setViewMode(mode);
        // Simulate a brief loading state for large documents
        setTimeout(() => setIsPreviewLoading(false), 100);
      } else {
        setViewMode(mode);
      }
    },
    [viewMode]
  );

  const formatLastSaved = useMemo(() => {
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
  }, [lastSaved]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartX.current = e.touches[0]?.clientX ?? null;
    }
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchEndX.current = e.touches[0]?.clientX ?? null;
    }
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Only handle swipes on mobile
    if (isMobile) {
      if (isLeftSwipe && viewMode === 'edit') {
        handleViewModeChange('preview');
      }
      if (isRightSwipe && viewMode === 'preview') {
        handleViewModeChange('edit');
      }
    }

    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
  }, [viewMode, isMobile, handleViewModeChange]);

  // Sanitize content for preview - currently handled by MDEditor internally
  // Keeping DOMPurify import for future custom preview implementation

  return (
    <div
      className={`flex flex-col h-full ${isFocusMode ? 'fixed inset-0 z-50 bg-white' : ''}`}
    >
      {/* Toolbar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b gap-3 ${isFocusMode ? 'bg-white' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{wordCount} words</span>
            <span className="text-gray-400">•</span>
            <span>{readingTime} min read</span>
          </div>
          {formatLastSaved && (
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
              {formatLastSaved}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-xs sm:text-sm text-orange-500">
              • Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 touch-target"
              aria-label="Save document"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isSaving ? 'Posting...' : 'Post'}
              </span>
              <span className="sm:hidden">{isSaving ? '...' : 'Post'}</span>
            </button>
          )}

          <button
            onClick={toggleFocusMode}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md touch-target hidden sm:flex"
            title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
            aria-label={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {isFocusMode ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>

          <div className="flex items-center border rounded-md">
            <button
              onClick={() => handleViewModeChange('edit')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors touch-target ${
                viewMode === 'edit'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Edit mode"
            >
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Edit</span>
            </button>
            <button
              onClick={() => handleViewModeChange('preview')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md transition-colors touch-target ${
                viewMode === 'preview'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Preview mode"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor/Preview */}
      <div
        ref={editorRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator for mobile */}
        {isMobile && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800/75 text-white px-3 py-1 rounded-full text-xs pointer-events-none animate-pulse">
            Swipe to {viewMode === 'edit' ? 'preview' : 'edit'}
          </div>
        )}

        {viewMode === 'edit' ? (
          <div className="h-full">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              preview="edit"
              height="100%"
              data-color-mode="light"
              textareaProps={{
                placeholder,
                'aria-label': 'Markdown editor',
              }}
            />
          </div>
        ) : (
          <>
            {isPreviewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading preview...</div>
              </div>
            ) : (
              <PreviewPane content={content} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
