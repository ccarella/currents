import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PostsService } from '@/lib/posts';
import { requireAuth } from '@/lib/supabase/auth';
import { createPostSchema, paginationSchema } from '@/lib/validation/posts';
import { z } from 'zod';

function generateExcerpt(content: string): string {
  // Strip HTML tags if any
  const plainText = content.replace(/<[^>]*>/g, '');

  // Truncate to 160 characters (leaving room for ellipsis)
  if (plainText.length <= 160) {
    return plainText;
  }

  // Find a good break point (end of word)
  let cutoff = 160;
  while (cutoff > 0 && plainText[cutoff] !== ' ') {
    cutoff--;
  }

  // If we couldn't find a space, just use the full 160
  if (cutoff === 0) {
    cutoff = 160;
  }

  return plainText.substring(0, cutoff).trim() + '...';
}

// GET - List recent posts with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validationResult = paginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid pagination parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { page, limit } = validationResult.data;

    const supabase = await createClient();
    const postsService = new PostsService(supabase);

    // Get only the most recent post per user
    const result = await postsService.getLatestPostPerUserPaginated(
      page,
      limit
    );

    const totalPages = result.totalCount
      ? Math.ceil(result.totalCount / limit)
      : 0;

    return NextResponse.json({
      posts: result.posts,
      pagination: {
        page,
        limit,
        total: result.totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      // Additional fields from the service
      totalCount: result.totalCount,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create/replace user's post
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, content, excerpt, status } = validationResult.data;

    const supabase = await createClient();
    const postsService = new PostsService(supabase);

    // Generate slug from title
    const slug = await postsService.generateSlug(title);

    // Archive existing posts for this user (only one active post allowed)
    await postsService.archiveUserPosts(user.id);

    // Generate excerpt if not provided
    const finalExcerpt = excerpt || generateExcerpt(content || '');

    // Prepare post data
    const postData = {
      author_id: user.id,
      title,
      content: content || '',
      excerpt: finalExcerpt,
      slug,
      status,
      published_at: null as string | null,
    };

    // Set published_at based on status
    if (status === 'published') {
      postData.published_at = new Date().toISOString();
    } else {
      postData.published_at = null;
    }

    // Create new post
    const post = await postsService.createPost(postData);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
