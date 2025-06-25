import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

describe('GET /api/posts/[username]', () => {
  let mockSupabase: MockSupabase;
  let mockCreateClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    const serverModule = await import('@/lib/supabase/server');
    mockCreateClient = vi.mocked(serverModule.createClient);
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the active post for a user', async () => {
    const mockProfile = { id: 'user123' };
    const mockPost = {
      id: 'post123',
      title: 'User Post',
      content: 'Post content',
      author_id: 'user123',
      status: 'published',
      created_at: '2024-01-01',
      profiles: {
        id: 'user123',
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: null,
      },
    };

    // Mock profile lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    // Reset method chain for post lookup
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockReturnThis();

    // Mock post lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: mockPost,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/posts/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.post).toEqual(mockPost);
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.eq).toHaveBeenCalledWith('username', 'testuser');
  });

  it('should return 404 if user not found', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/posts/nonexistent'
    );
    const params = Promise.resolve({ username: 'nonexistent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 404 if user has no active post', async () => {
    const mockProfile = { id: 'user123' };

    // Mock successful profile lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    // Reset method chain for post lookup
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockReturnThis();

    // Mock no post found
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const request = new NextRequest('http://localhost:3000/api/posts/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No active post found for this user');
  });

  it('should return 400 if username is not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/posts/');
    const params = Promise.resolve({ username: '' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username is required');
  });

  it('should handle database errors', async () => {
    // First mock for profile lookup - error case
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'UNEXPECTED', message: 'Database error' },
    });

    const request = new NextRequest('http://localhost:3000/api/posts/testuser');
    const params = Promise.resolve({ username: 'testuser' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });
});
