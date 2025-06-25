import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/posts', () => ({
  PostsService: vi.fn().mockImplementation(() => ({
    generateSlug: vi.fn((title) => title.toLowerCase().replace(/\s+/g, '-')),
    archiveUserPosts: vi.fn(),
    createPost: vi.fn(),
  })),
}));

interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
}

describe('GET /api/posts', () => {
  let mockSupabase: MockSupabase;
  let mockCreateClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };

    const serverModule = await import('@/lib/supabase/server');
    mockCreateClient = vi.mocked(serverModule.createClient);
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return posts with default pagination', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post 1',
        content: 'Content 1',
        author_id: 'user1',
        status: 'published',
        created_at: '2024-01-01',
        profiles: {
          id: 'user1',
          username: 'testuser1',
          full_name: 'Test User 1',
          avatar_url: null,
        },
      },
    ];

    mockSupabase.range.mockResolvedValue({
      data: mockPosts,
      error: null,
      count: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/posts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toEqual(mockPosts);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should handle custom pagination parameters', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 50,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/posts?page=2&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase.range).toHaveBeenCalledWith(10, 19); // offset=10, limit=10
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.totalPages).toBe(5);
    expect(data.pagination.hasNext).toBe(true);
    expect(data.pagination.hasPrev).toBe(true);
  });

  it('should return 400 for invalid pagination parameters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/posts?page=invalid&limit=-1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid pagination parameters');
    expect(data.details).toBeDefined();
  });

  it('should handle database errors', async () => {
    mockSupabase.range.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: null,
    });

    const request = new NextRequest('http://localhost:3000/api/posts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch posts');
  });
});

interface MockPostsService {
  generateSlug: ReturnType<typeof vi.fn>;
  archiveUserPosts: ReturnType<typeof vi.fn>;
  createPost: ReturnType<typeof vi.fn>;
}

interface MockUser {
  id: string;
  email: string;
}

describe('POST /api/posts', () => {
  let mockSupabase: MockSupabase;
  let mockPostsService: MockPostsService;
  let mockUser: MockUser;
  let mockRequireAuth: ReturnType<typeof vi.fn>;
  let mockCreateClient: ReturnType<typeof vi.fn>;
  let MockPostsService: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockUser = { id: 'user123', email: 'test@example.com' };
    mockPostsService = {
      generateSlug: vi.fn((title) => title.toLowerCase().replace(/\s+/g, '-')),
      archiveUserPosts: vi.fn(),
      createPost: vi.fn(),
    };

    const authModule = await import('@/lib/supabase/auth');
    mockRequireAuth = vi.mocked(authModule.requireAuth);
    mockRequireAuth.mockResolvedValue(mockUser);

    const serverModule = await import('@/lib/supabase/server');
    mockCreateClient = vi.mocked(serverModule.createClient);
    mockCreateClient.mockResolvedValue(mockSupabase);

    const postsModule = await import('@/lib/posts');
    MockPostsService = vi.mocked(postsModule.PostsService);
    MockPostsService.mockImplementation(() => mockPostsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new post successfully', async () => {
    const newPost = {
      id: 'post123',
      title: 'New Post',
      content: 'Post content',
      excerpt: 'Post excerpt',
      slug: 'new-post',
      author_id: 'user123',
      status: 'published',
      published_at: '2024-01-01T00:00:00Z',
    };

    mockPostsService.createPost.mockResolvedValue(newPost);

    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Post',
        content: 'Post content',
        excerpt: 'Post excerpt',
        status: 'published',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.post).toEqual(newPost);
    expect(mockPostsService.archiveUserPosts).toHaveBeenCalledWith('user123');
    expect(mockPostsService.createPost).toHaveBeenCalledWith({
      author_id: 'user123',
      title: 'New Post',
      content: 'Post content',
      excerpt: 'Post excerpt',
      slug: 'new-post',
      status: 'published',
      published_at: expect.any(String),
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    const mockResponse = NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
    mockRequireAuth.mockResolvedValue(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 400 for invalid request data', async () => {
    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required title
        content: 'Content without title',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
    expect(data.details).toBeDefined();
  });

  it('should handle draft posts without published_at', async () => {
    mockPostsService.createPost.mockResolvedValue({
      id: 'post123',
      status: 'draft',
      published_at: null,
    });

    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Draft Post',
        status: 'draft',
      }),
    });

    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(201);
    expect(mockPostsService.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
        published_at: null,
      })
    );
  });
});
