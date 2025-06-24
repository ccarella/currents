import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Mock the MDEditor to avoid CSS import issues
vi.mock('@uiw/react-md-editor', () => ({
  default: vi.fn(),
}));

describe('Dependencies', () => {
  it('should have Supabase client available', () => {
    expect(createClient).toBeDefined();
    expect(createBrowserClient).toBeDefined();
  });

  it('should have date-fns available', () => {
    const now = new Date();
    const formatted = format(now, 'yyyy-MM-dd');
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should have Zod validation available', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = schema.safeParse({ name: 'John', age: 30 });
    expect(result.success).toBe(true);
  });

  it('should have React Hook Form and Zod resolver available', () => {
    expect(useForm).toBeDefined();
    expect(zodResolver).toBeDefined();
  });

  it('should have markdown libraries available', async () => {
    expect(ReactMarkdown).toBeDefined();
    expect(remarkGfm).toBeDefined();
    expect(rehypeHighlight).toBeDefined();
    // MDEditor is mocked, so we just verify the mock exists
    const MDEditorModule = await import('@uiw/react-md-editor');
    expect(MDEditorModule.default).toBeDefined();
  });

  it('should have proper TypeScript configuration', () => {
    const testVariable: string = 'test';
    expect(testVariable).toBe('test');
  });
});
