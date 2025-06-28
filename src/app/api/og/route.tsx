import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const author = searchParams.get('author');
    const authorName = searchParams.get('authorName');
    const excerpt = searchParams.get('excerpt');

    // Fallback values
    const displayTitle = title || 'Untitled Post';
    const displayAuthor = author || 'anonymous';
    const displayAuthorName = authorName || displayAuthor;
    const displayExcerpt = excerpt || '';

    // Truncate title if too long
    const truncatedTitle =
      displayTitle.length > 60
        ? displayTitle.substring(0, 57) + '...'
        : displayTitle;

    // Truncate excerpt if too long
    const truncatedExcerpt =
      displayExcerpt.length > 120
        ? displayExcerpt.substring(0, 117) + '...'
        : displayExcerpt;

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #FAFAF9, #F0F0EF)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#0A0A0A',
              marginBottom: 'auto',
              letterSpacing: '-0.02em',
            }}
          >
            Currents
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              marginBottom: 'auto',
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#0A0A0A',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {truncatedTitle}
            </h1>

            {/* Excerpt if available */}
            {truncatedExcerpt && (
              <p
                style={{
                  fontSize: 28,
                  color: '#6B6B6B',
                  lineHeight: 1.4,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {truncatedExcerpt}
              </p>
            )}
          </div>

          {/* Author Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: 32,
              color: '#404040',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '24px',
                background: '#E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 600,
                color: '#0A0A0A',
              }}
            >
              {displayAuthorName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 500 }}>{displayAuthorName}</span>
            <span style={{ color: '#9B9B9B' }}>@{displayAuthor}</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('OG Image generation failed:', e);

    // Return fallback image
    return new ImageResponse(
      (
        <div
          style={{
            background: '#FAFAF9',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: '#0A0A0A',
          }}
        >
          <div>Currents</div>
          <div
            style={{
              fontSize: 24,
              marginTop: 20,
              color: '#6B6B6B',
            }}
          >
            Share your thoughts
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
