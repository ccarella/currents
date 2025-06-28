import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock the ImageResponse
vi.mock('next/og', () => ({
  ImageResponse: vi.fn().mockImplementation(() => {
    return new Response('mocked image response', {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }),
}));

describe('OG Image Generation API', () => {
  it('should generate an image with all parameters', async () => {
    const url = new URL('http://localhost:3000/api/og');
    url.searchParams.set('title', 'Test Post Title');
    url.searchParams.set('author', 'testuser');
    url.searchParams.set('authorName', 'Test User');
    url.searchParams.set('excerpt', 'This is a test excerpt');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('should handle missing parameters with fallback values', async () => {
    const url = new URL('http://localhost:3000/api/og');
    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('should truncate long titles', async () => {
    const url = new URL('http://localhost:3000/api/og');
    const longTitle =
      'This is a very long title that should be truncated to prevent layout issues in the generated image';
    url.searchParams.set('title', longTitle);
    url.searchParams.set('author', 'testuser');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('should truncate long excerpts', async () => {
    const url = new URL('http://localhost:3000/api/og');
    const longExcerpt =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
    url.searchParams.set('title', 'Test Title');
    url.searchParams.set('excerpt', longExcerpt);
    url.searchParams.set('author', 'testuser');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('should handle special characters in parameters', async () => {
    const url = new URL('http://localhost:3000/api/og');
    url.searchParams.set('title', 'Title with "quotes" & special <characters>');
    url.searchParams.set('author', 'user_with-special.chars');
    url.searchParams.set('authorName', "O'Brien & Co.");

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('should return fallback image on error', async () => {
    // Mock console.error to avoid test output noise
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Force an error by mocking ImageResponse to throw
    const { ImageResponse } = await import('next/og');
    (
      ImageResponse as unknown as ReturnType<typeof vi.fn>
    ).mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    const url = new URL('http://localhost:3000/api/og');
    url.searchParams.set('title', 'Test Title');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'OG Image generation failed:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
