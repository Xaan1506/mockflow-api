import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabase } from '../../src/core/database.js';

describe('InMemoryDatabase', () => {
  let db;

  beforeEach(() => {
    db = new InMemoryDatabase();
    db.loadData({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    });
  });

  it('finds all items and finds by ID', () => {
    const all = db.findAll('users');
    expect(all).toHaveLength(2);

    const user1 = db.findById('users', 1);
    expect(user1.name).toBe('Alice');

    const nonExistent = db.findById('users', 999);
    expect(nonExistent).toBeNull();
  });

  it('inserts records and auto-increments IDs', () => {
    const created = db.insert('users', { name: 'Charlie' });
    expect(created.id).toBe(3);
    expect(db.count('users')).toBe(3);
  });

  it('prevents duplicate IDs', () => {
    expect(() => db.insert('users', { id: 1, name: 'Duplicate' })).toThrow(/Duplicate ID/);
  });

  it('updates records (full and patch)', () => {
    const putUpdated = db.update('users', 1, { age: 30 }, false);
    expect(putUpdated.id).toBe(1);
    expect(putUpdated.name).toBeUndefined();
    expect(putUpdated.age).toBe(30);

    const patchUpdated = db.update('users', 2, { status: 'active' }, true);
    expect(patchUpdated.id).toBe(2);
    expect(patchUpdated.name).toBe('Bob');
    expect(patchUpdated.status).toBe('active');
  });

  it('deletes records', () => {
    const success = db.delete('users', 1);
    expect(success).toBe(true);
    expect(db.findById('users', 1)).toBeNull();
    expect(db.count('users')).toBe(1);

    const fail = db.delete('users', 999);
    expect(fail).toBe(false);
  });
});
