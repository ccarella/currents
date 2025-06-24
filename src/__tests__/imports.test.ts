import { describe, it, expect } from 'vitest';
import * as components from '../components';

describe('Component Imports', () => {
  it('should export all layout components', () => {
    expect(components.Header).toBeDefined();
    expect(components.Footer).toBeDefined();
  });

  it('should export all post components', () => {
    expect(components.PostList).toBeDefined();
    expect(components.PostCard).toBeDefined();
    expect(components.PostView).toBeDefined();
  });

  it('should export all editor components', () => {
    expect(components.MarkdownEditor).toBeDefined();
    expect(components.PreviewPane).toBeDefined();
  });

  it('should export all auth components', () => {
    expect(components.SignInForm).toBeDefined();
    expect(components.SignUpForm).toBeDefined();
  });

  it('should export all ui components', () => {
    expect(components.Button).toBeDefined();
    expect(components.Input).toBeDefined();
    expect(components.Card).toBeDefined();
  });
});
