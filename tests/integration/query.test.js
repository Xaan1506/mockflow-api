import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createMockServer } from '../../src/core/engine.js';

describe('Query Routes Integration (Filter, Sort, Search, Pagination)', () => {
  let app;

  beforeAll(() => {
    const server = createMockServer({
      schema: {
        products: {
          count: 5,
          fields: {
            name: 'productName',
            category: { type: 'string', values: ['books', 'electronics'] },
            price: { type: 'number', min: 10, max: 100 }
          }
        }
      },
      prefix: '/api',
      seed: 42
    });

    // Manually inject known data into database for exact assertions
    const db = server.database;
    db.loadData({
      products: [
        { id: 1, name: 'Smart Phone X', category: 'electronics', price: 900, rating: 4.8 },
        { id: 2, name: 'Budget Tablet', category: 'electronics', price: 150, rating: 3.5 },
        { id: 3, name: 'Sci-Fi Novel', category: 'books', price: 20, rating: 4.2 },
        { id: 4, name: 'Cooking Guide', category: 'books', price: 35, rating: 4.9 },
        { id: 5, name: 'Noise-Canceling Headphones', category: 'electronics', price: 250, rating: 4.7 }
      ]
    });

    app = server.app;
  });

  it('filters with operators: _gte, _lte, _gt, _in', async () => {
    const gteRes = await request(app).get('/api/products?price_gte=150');
    expect(gteRes.status).toBe(200);
    expect(gteRes.body.data.every(p => p.price >= 150)).toBe(true);
    expect(gteRes.body.data).toHaveLength(3);

    const inRes = await request(app).get('/api/products?category_in=books');
    expect(inRes.status).toBe(200);
    expect(inRes.body.data).toHaveLength(2);
  });

  it('sorts with order=asc and order=desc', async () => {
    const ascRes = await request(app).get('/api/products?sort=price&order=asc');
    expect(ascRes.status).toBe(200);
    expect(ascRes.body.data[0].price).toBe(20);
    expect(ascRes.body.data[4].price).toBe(900);

    const descRes = await request(app).get('/api/products?sort=price&order=desc');
    expect(descRes.status).toBe(200);
    expect(descRes.body.data[0].price).toBe(900);
    expect(descRes.body.data[4].price).toBe(20);
  });

  it('searches across fields with partial case-insensitive matching', async () => {
    const res = await request(app).get('/api/products?search=phone');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2); // Smart Phone X, Noise-Canceling Headphones
  });

  it('combines filtering, sorting, searching and pagination', async () => {
    const res = await request(app).get(
      '/api/products?category=electronics&sort=price&order=asc&page=1&limit=2'
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.data[0].name).toBe('Budget Tablet');
    expect(res.body.data[1].name).toBe('Noise-Canceling Headphones');
  });

  it('returns 400 for invalid pagination values', async () => {
    const res = await request(app).get('/api/products?page=-5');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });
});
