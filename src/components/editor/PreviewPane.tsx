'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

// Import Prism themes and languages
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';

interface PreviewPaneProps {
  content: string;
  onScroll?: (scrollPercentage: number) => void;
  scrollToPercentage?: number;
}

export default function PreviewPane({
  content,
  onScroll,
  scrollToPercentage,
}: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle syntax highlighting
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  // Handle scroll synchronization
  useEffect(() => {
    if (scrollToPercentage !== undefined && previewRef.current) {
      const element = previewRef.current;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      element.scrollTop = scrollHeight * scrollToPercentage;
    }
  }, [scrollToPercentage]);

  const handleScroll = () => {
    if (onScroll && previewRef.current) {
      const element = previewRef.current;
      const scrollPercentage =
        element.scrollTop / (element.scrollHeight - element.clientHeight);
      onScroll(scrollPercentage);
    }
  };

  return (
    <div
      ref={previewRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto p-8 bg-white dark:bg-gray-900"
    >
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({
              inline,
              className,
              children,
              ...props
            }: {
              inline?: boolean;
              className?: string;
              children?: React.ReactNode;
              [key: string]: unknown;
            }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              if (!inline && language) {
                return (
                  <pre className={`language-${language}`}>
                    <code className={`language-${language}`} {...props}>
                      {String(children).replace(/\n$/, '')}
                    </code>
                  </pre>
                );
              }

              return (
                <code
                  className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            pre({ children, ...props }) {
              return (
                <pre className="overflow-x-auto" {...props}>
                  {children}
                </pre>
              );
            },
            img({ src, alt, ...props }) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg shadow-md"
                  {...props}
                />
              );
            },
            table({ children, ...props }) {
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full" {...props}>
                    {children}
                  </table>
                </div>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
