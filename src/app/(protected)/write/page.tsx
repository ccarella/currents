'use client';

import MarkdownEditor from '@/components/MarkdownEditor';
import { useState } from 'react';

export default function WritePage() {
  const [title, setTitle] = useState('');

  const handleSave = async (_content: string) => {
    // TODO: Implement saving to database with title and content
    // For now, just simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your title..."
            className="w-full text-3xl font-bold placeholder-gray-400 border-none outline-none"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          onSave={handleSave}
          placeholder="Start writing your story..."
        />
      </div>
    </div>
  );
}
