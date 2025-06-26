'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Save, FileText, Maximize2, Minimize2 } from 'lucide-react';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

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

  // Auto-save to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (content) {
        localStorage.setItem('draft-content', content);
        localStorage.setItem('draft-timestamp', new Date().toISOString());
        setLastSaved(new Date());
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [content]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('draft-content');
    const savedTimestamp = localStorage.getItem('draft-timestamp');

    if (savedContent && !initialContent) {
      setContent(savedContent);
      if (savedTimestamp) {
        setLastSaved(new Date(savedTimestamp));
      }
    }
  }, [initialContent]);

  // Calculate word count and reading time
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const count = words.length;
    setWordCount(count);

    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(count / 200);
    setReadingTime(minutes);
  }, [content]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(content);
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    }
  }, [content, onSave]);

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

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
          {lastSaved && (
            <span className="text-sm text-gray-500">{formatLastSaved()}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}

          <button
            onClick={toggleFocusMode}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {isFocusMode ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          preview="live"
          height="100%"
          data-color-mode="light"
          textareaProps={{
            placeholder,
          }}
        />
      </div>
    </div>
  );
}
