import { describe, it, expect } from 'vitest';
import { validateSchema, SchemaValidationError } from '../../src/core/schema.js';

describe('Schema Validator', () => {
  it('validates a standard collection schema', () => {
    const raw = {
      users: {
        count: 5,
        fields: {
          name: 'fullName',
          email: 'email',
          age: { type: 'integer', min: 20, max: 50 }
        }
      }
    };

    const normalized = validateSchema(raw);
    expect(normalized.users).toBeDefined();
    expect(normalized.users.count).toBe(5);
    expect(normalized.users.fields.name.type).toBe('fullName');
    expect(normalized.users.fields.age.min).toBe(20);
  });

  it('throws SchemaValidationError on non-object input', () => {
    expect(() => validateSchema(null)).toThrow(SchemaValidationError);
    expect(() => validateSchema([])).toThrow(SchemaValidationError);
  });

  it('throws SchemaValidationError on unknown field type', () => {
    const raw = {
      items: {
        count: 2,
        fields: {
          x: 'unsupportedType123'
        }
      }
    };
    expect(() => validateSchema(raw)).toThrow(SchemaValidationError);
  });

  it('validates relationships referencing existing collections', () => {
    const raw = {
      users: {
        count: 2,
        fields: { name: 'fullName' }
      },
      posts: {
        count: 5,
        fields: { title: 'sentence' },
        relationships: {
          userId: { collection: 'users', type: 'many-to-one' }
        }
      }
    };
    const normalized = validateSchema(raw);
    expect(normalized.posts.relationships.userId.collection).toBe('users');
  });

  it('throws when relationship references non-existent collection', () => {
    const raw = {
      posts: {
        count: 5,
        fields: { title: 'sentence' },
        relationships: {
          userId: { collection: 'ghosts', type: 'many-to-one' }
        }
      }
    };
    expect(() => validateSchema(raw)).toThrow(SchemaValidationError);
  });
});
