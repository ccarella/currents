export interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  range?: jest.Mock;
  limit?: jest.Mock;
  single?: jest.Mock;
  insert?: jest.Mock;
  update?: jest.Mock;
  delete?: jest.Mock;
}

export interface MockAuthModule {
  requireAuth: jest.Mock;
  getAuthenticatedUser: jest.Mock;
}

export interface MockPostsService {
  generateSlug: jest.Mock;
  archiveUserPosts: jest.Mock;
  createPost: jest.Mock;
  getActivePost?: jest.Mock;
  getUserPosts?: jest.Mock;
  getActivePosts?: jest.Mock;
  getPostBySlug?: jest.Mock;
  updatePost?: jest.Mock;
  deletePost?: jest.Mock;
}
