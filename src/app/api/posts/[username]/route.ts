import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get user's current post by username
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, get the user's profile by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the user's active post
    const { data: post, error: postError } = await supabase
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
        `
      )
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (postError) {
      // If error is "PGRST116", it means no rows found
      if (postError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No active post found for this user' },
          { status: 404 }
        );
      }

      console.error('Error fetching user post:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch user post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Unexpected error in GET /api/posts/[username]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
