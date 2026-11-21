import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createMockServer } from '../../src/core/engine.js';

describe('REST API Endpoints Integration', () => {
  let app;
  let server;

  beforeEach(() => {
    server = createMockServer({
      schema: {
        users: {
          count: 5,
          fields: {
            name: 'fullName',
            email: 'email',
            role: { type: 'string', values: ['admin', 'user'] }
          }
        },
        posts: {
          count: 10,
          fields: {
            title: 'sentence'
          },
          relationships: {
            userId: { collection: 'users', type: 'many-to-one' }
          }
        }
      },
      prefix: '/api',
      seed: 123
    });
    app = server.app;
  });

  it('GET /api returns collection metadata', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.collections.users.count).toBe(5);
    expect(res.body.collections.posts.count).toBe(10);
  });

  it('GET /api/users returns paginated list with correct structure', async () => {
    const res = await request(app).get('/api/users?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(5);
  });

  it('GET /api/users/:id returns record or 404', async () => {
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);

    const notFound = await request(app).get('/api/users/9999');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('POST /api/users creates record with status 201', async () => {
    const newUser = { name: 'Test User', email: 'test@example.com', role: 'admin' };
    const res = await request(app).post('/api/users').send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test User');
    expect(res.body.id).toBeDefined();

    // Verify it is in database
    const check = await request(app).get(`/api/users/${res.body.id}`);
    expect(check.status).toBe(200);
    expect(check.body.name).toBe('Test User');
  });

  it('PUT /api/users/:id replaces record', async () => {
    const res = await request(app).put('/api/users/1').send({ name: 'Replaced Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Replaced Name');
    expect(res.body.email).toBeUndefined(); // replaced
  });

  it('PATCH /api/users/:id partially updates record', async () => {
    const res = await request(app).patch('/api/users/2').send({ name: 'Patched Bob' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Patched Bob');
    expect(res.body.email).toBeDefined(); // preserved
  });

  it('DELETE /api/users/:id removes record and returns success', async () => {
    const res = await request(app).delete('/api/users/3');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await request(app).get('/api/users/3');
    expect(check.status).toBe(404);
  });

  it('Expands relationships with ?include=user on posts', async () => {
    const res = await request(app).get('/api/posts?include=user&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data[0].user).toBeDefined();
    expect(res.body.data[0].user.id).toBe(res.body.data[0].userId);
  });
});
