import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createMockServer } from '../../src/core/engine.js';

describe('Custom Generators & Lifecycle', () => {
  it('registers custom generators during createMockServer', async () => {
    const server = createMockServer({
      schema: {
        accounts: {
          count: 2,
          fields: {
            accountCode: 'codeGen',
            balance: 'moneyGen'
          }
        }
      },
      customGenerators: {
        codeGen: () => 'ACC-999',
        moneyGen: () => 5000
      },
      prefix: '/api'
    });

    const res = await request(server.app).get('/api/accounts/1');
    expect(res.status).toBe(200);
    expect(res.body.accountCode).toBe('ACC-999');
    expect(res.body.balance).toBe(5000);
  });

  it('supports runtime reset() of in-memory data', async () => {
    const server = createMockServer({
      schema: {
        items: {
          count: 3,
          fields: { label: 'word' }
        }
      },
      seed: 555
    });

    // Delete item 1
    server.database.delete('items', 1);
    expect(server.database.findById('items', 1)).toBeNull();

    // Trigger reset
    server.reset();
    expect(server.database.findById('items', 1)).not.toBeNull();
  });
});
