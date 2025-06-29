import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PostsService } from '@/lib/posts';
import { requireAuth } from '@/lib/supabase/auth';
import { createPostSchema, paginationSchema } from '@/lib/validation/posts';
import { z } from 'zod';

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
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Get posts with profile information
    const {
      data: posts,
      error,
      count,
    } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles!inner(
          id,
          username,
          full_name,
          avatar_url
        )
        `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
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

    const { title, content, status } = validationResult.data;

    const supabase = await createClient();
    const postsService = new PostsService(supabase);

    // Generate slug from title
    const slug = await postsService.generateSlug(title);

    // Archive existing posts for this user (only one active post allowed)
    await postsService.archiveUserPosts(user.id);

    // Create new post
    const post = await postsService.createPost({
      author_id: user.id,
      title,
      content: content || '',
      slug,
      status,
    });

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
