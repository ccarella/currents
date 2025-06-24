import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

describe('Project Structure', () => {
  it('should have all required component directories', () => {
    const componentDirs = ['layout', 'post', 'editor', 'auth', 'ui'];
    componentDirs.forEach((dir) => {
      const dirPath = path.join(srcDir, 'components', dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  it('should have all required root directories', () => {
    const rootDirs = ['lib/supabase', 'utils', 'hooks', 'types'];
    rootDirs.forEach((dir) => {
      const dirPath = path.join(srcDir, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  it('should have all layout components', () => {
    const layoutComponents = ['Header.tsx', 'Footer.tsx', 'index.ts'];
    layoutComponents.forEach((file) => {
      const filePath = path.join(srcDir, 'components', 'layout', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have all post components', () => {
    const postComponents = [
      'PostList.tsx',
      'PostCard.tsx',
      'PostView.tsx',
      'index.ts',
    ];
    postComponents.forEach((file) => {
      const filePath = path.join(srcDir, 'components', 'post', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have all editor components', () => {
    const editorComponents = [
      'MarkdownEditor.tsx',
      'PreviewPane.tsx',
      'index.ts',
    ];
    editorComponents.forEach((file) => {
      const filePath = path.join(srcDir, 'components', 'editor', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have all auth components', () => {
    const authComponents = ['SignInForm.tsx', 'SignUpForm.tsx', 'index.ts'];
    authComponents.forEach((file) => {
      const filePath = path.join(srcDir, 'components', 'auth', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have all ui components', () => {
    const uiComponents = ['Button.tsx', 'Input.tsx', 'Card.tsx', 'index.ts'];
    uiComponents.forEach((file) => {
      const filePath = path.join(srcDir, 'components', 'ui', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have Supabase client file', () => {
    const clientPath = path.join(srcDir, 'lib', 'supabase', 'client.ts');
    expect(fs.existsSync(clientPath)).toBe(true);
  });

  it('should have main components index file', () => {
    const indexPath = path.join(srcDir, 'components', 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
  });
});
