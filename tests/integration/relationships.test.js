import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createMockServer } from '../../src/core/engine.js';

describe('Relationship Expansion Integration', () => {
  let app;

  beforeAll(() => {
    const server = createMockServer({
      schema: {
        users: {
          count: 2,
          fields: { name: 'fullName' }
        },
        posts: {
          count: 3,
          fields: { title: 'sentence' },
          relationships: {
            userId: { collection: 'users', type: 'many-to-one' }
          }
        }
      },
      prefix: '/api'
    });

    server.database.loadData({
      users: [
        { id: 1, name: 'Alice Walker' },
        { id: 2, name: 'Bob Dylan' }
      ],
      posts: [
        { id: 101, title: 'First Post', userId: 1 },
        { id: 102, title: 'Second Post', userId: 1 },
        { id: 103, title: 'Third Post', userId: 2 }
      ]
    });

    app = server.app;
  });

  it('expands many-to-one relationship on collection query', async () => {
    const res = await request(app).get('/api/posts?include=user');
    expect(res.status).toBe(200);
    expect(res.body.data[0].user).toBeDefined();
    expect(res.body.data[0].user.name).toBe('Alice Walker');
  });

  it('expands many-to-one relationship on single item lookup', async () => {
    const res = await request(app).get('/api/posts/103?include=user');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Bob Dylan');
  });

  it('expands reverse one-to-many relationship', async () => {
    const res = await request(app).get('/api/users/1?include=posts');
    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(2);
    expect(res.body.posts[0].id).toBe(101);
  });
});
